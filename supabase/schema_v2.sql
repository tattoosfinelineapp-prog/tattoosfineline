-- =========================================================
-- SCHEMA V2 — tattoosfineline.com
-- Ejecutar en Supabase SQL Editor (en orden)
-- =========================================================

-- ── BLOQUE 1: Tipos de cuenta ──────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tipo_cuenta  text DEFAULT 'inspiracion'
    CHECK (tipo_cuenta IN ('tatuador', 'estudio', 'inspiracion')),
  ADD COLUMN IF NOT EXISTS username     text UNIQUE,
  ADD COLUMN IF NOT EXISTS ciudad       text,
  ADD COLUMN IF NOT EXISTS nombre_estudio text,
  ADD COLUMN IF NOT EXISTS direccion    text,
  ADD COLUMN IF NOT EXISTS web          text;

-- Generar username por defecto a los existentes (email prefix)
UPDATE users
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '', 'g'))
WHERE username IS NULL;

-- RLS: usuario puede leer y actualizar su propio row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_select_all"  ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own"  ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON users FOR UPDATE USING (auth.uid() = id);

-- ── BLOQUE 2: Carpetas con tags por defecto ────────────

ALTER TABLE carpetas
  ADD COLUMN IF NOT EXISTS tags_default  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS descripcion   text,
  ADD COLUMN IF NOT EXISTS cover_url     text;

-- ── BLOQUE 8: Sistema de reportes ─────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id    uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  motivo      text NOT NULL CHECK (motivo IN (
    'no_fineline', 'inapropiado', 'cara_sin_permiso', 'copyright', 'spam'
  )),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(reporter_id, photo_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Trigger: 3 reportes distintos → ocultar foto automáticamente
CREATE OR REPLACE FUNCTION check_reports_threshold()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE report_count integer;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO report_count
  FROM reports WHERE photo_id = NEW.photo_id;
  IF report_count >= 3 THEN
    UPDATE photos SET status = 'review' WHERE id = NEW.photo_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_hide_reported_photos ON reports;
CREATE TRIGGER auto_hide_reported_photos
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION check_reports_threshold();

-- ── ÍNDICES ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_username     ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_tipo_cuenta  ON users(tipo_cuenta);
CREATE INDEX IF NOT EXISTS idx_reports_photo      ON reports(photo_id);
CREATE INDEX IF NOT EXISTS idx_carpetas_user      ON carpetas(user_id);

-- ── FUNCIÓN: trigger para crear row en users tras registro ──

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, tipo_cuenta, username, ciudad, instagram)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'tipo_cuenta', 'inspiracion'),
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-z0-9_]', '', 'g'
    )),
    NEW.raw_user_meta_data->>'ciudad',
    NEW.raw_user_meta_data->>'instagram'
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre       = EXCLUDED.nombre,
    tipo_cuenta  = EXCLUDED.tipo_cuenta,
    ciudad       = EXCLUDED.ciudad,
    instagram    = EXCLUDED.instagram;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
