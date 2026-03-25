-- =========================================================
-- SCHEMA SOCIAL — tattoosfineline.com
-- Bloques 1-7: Feed, Onboarding, Follows, Notificaciones
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- ── NUEVAS COLUMNAS EN users ──────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS followers_count  integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count  integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_upload_at   timestamptz,
  ADD COLUMN IF NOT EXISTS profile_views    integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_done  boolean      DEFAULT false;

-- ── NUEVAS COLUMNAS EN photos ─────────────────────────────

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS views_count              integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count              integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tatuador_etiquetado_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS etiqueta_aprobada        boolean DEFAULT false;

-- ── TABLA: notifications ──────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo         text NOT NULL CHECK (tipo IN (
    'nuevo_seguidor','like_foto','foto_guardada',
    'etiqueta_tatuador','milestone_seguidores'
  )),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_id     uuid REFERENCES photos(id)     ON DELETE SET NULL,
  mensaje      text NOT NULL,
  leida        boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ── TRIGGER: actualizar followers/following count ─────────

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET followers_count = COALESCE(followers_count, 0) + 1
      WHERE id = NEW.following_id;
    UPDATE users SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
    -- Notificar al usuario seguido
    INSERT INTO notifications (user_id, tipo, from_user_id, mensaje)
    SELECT
      NEW.following_id,
      'nuevo_seguidor',
      NEW.follower_id,
      COALESCE(u.nombre, 'Alguien') || ' empezó a seguirte'
    FROM users u WHERE u.id = NEW.follower_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1)
      WHERE id = OLD.following_id;
    UPDATE users SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1)
      WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON user_follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- ── TRIGGER: milestone 10 seguidores ─────────────────────

CREATE OR REPLACE FUNCTION check_follower_milestone()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE cnt integer;
BEGIN
  SELECT COALESCE(followers_count, 0) INTO cnt FROM users WHERE id = NEW.following_id;
  IF cnt = 10 THEN
    INSERT INTO notifications (user_id, tipo, mensaje)
    VALUES (
      NEW.following_id,
      'milestone_seguidores',
      'Ya tienes 10 seguidores — cada foto que subas llega a ellos'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_milestone ON user_follows;
CREATE TRIGGER on_follow_milestone
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION check_follower_milestone();

-- ── TRIGGER: notificación al dar like ────────────────────

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE photo_owner uuid;
BEGIN
  SELECT tatuador_id INTO photo_owner FROM photos WHERE id = NEW.photo_id;
  IF photo_owner IS NOT NULL AND photo_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, tipo, from_user_id, photo_id, mensaje)
    SELECT
      photo_owner,
      'like_foto',
      NEW.user_id,
      NEW.photo_id,
      COALESCE(u.nombre, 'Alguien') || ' le dio like a tu foto'
    FROM users u WHERE u.id = NEW.user_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_notify ON likes;
CREATE TRIGGER on_like_notify
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ── TRIGGER: notificación + saves_count al guardar ───────

CREATE OR REPLACE FUNCTION notify_on_save()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE photo_owner uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT tatuador_id INTO photo_owner FROM photos WHERE id = NEW.photo_id;
    UPDATE photos SET saves_count = COALESCE(saves_count, 0) + 1 WHERE id = NEW.photo_id;
    IF photo_owner IS NOT NULL AND photo_owner <> NEW.user_id THEN
      INSERT INTO notifications (user_id, tipo, from_user_id, photo_id, mensaje)
      SELECT
        photo_owner,
        'foto_guardada',
        NEW.user_id,
        NEW.photo_id,
        COALESCE(u.nombre, 'Alguien') || ' guardó tu foto'
      FROM users u WHERE u.id = NEW.user_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos SET saves_count = GREATEST(0, COALESCE(saves_count, 0) - 1) WHERE id = OLD.photo_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_save_change ON saves;
CREATE TRIGGER on_save_change
  AFTER INSERT OR DELETE ON saves
  FOR EACH ROW EXECUTE FUNCTION notify_on_save();

-- ── TRIGGER: notificación al ser etiquetado ──────────────

CREATE OR REPLACE FUNCTION notify_on_etiqueta()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.tatuador_etiquetado_id IS NOT NULL
     AND (OLD.tatuador_etiquetado_id IS NULL OR OLD.tatuador_etiquetado_id <> NEW.tatuador_etiquetado_id)
  THEN
    INSERT INTO notifications (user_id, tipo, from_user_id, photo_id, mensaje)
    SELECT
      NEW.tatuador_etiquetado_id,
      'etiqueta_tatuador',
      NEW.tatuador_id,
      NEW.id,
      COALESCE(u.nombre, 'Alguien') || ' te etiquetó en una foto'
    FROM users u WHERE u.id = NEW.tatuador_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_photo_etiqueta ON photos;
CREATE TRIGGER on_photo_etiqueta
  AFTER UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION notify_on_etiqueta();

-- ── TRIGGER: actualizar last_upload_at ───────────────────

CREATE OR REPLACE FUNCTION update_last_upload_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET last_upload_at = now() WHERE id = NEW.tatuador_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_photo_insert ON photos;
CREATE TRIGGER on_photo_insert
  AFTER INSERT ON photos
  FOR EACH ROW EXECUTE FUNCTION update_last_upload_at();

-- ── FUNCIONES RPC ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_photo_views(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE photos SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_profile_views(u_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = u_id;
END;
$$;

-- ── ÍNDICES ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id) WHERE leida = false;
CREATE INDEX IF NOT EXISTS idx_photos_etiquetado
  ON photos(tatuador_etiquetado_id) WHERE tatuador_etiquetado_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_followers
  ON users(followers_count DESC);
