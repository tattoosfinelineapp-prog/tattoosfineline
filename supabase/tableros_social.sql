-- =========================================================
-- TABLEROS SOCIALES — ejecutar en Supabase SQL Editor
-- =========================================================

-- 1. Añadir columnas a carpetas
ALTER TABLE carpetas
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Todos los tableros existentes son públicos por defecto
UPDATE carpetas SET is_public = true WHERE is_public IS NULL;

-- 2. Tabla de likes de tablero
CREATE TABLE IF NOT EXISTS tablero_likes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tablero_id  uuid REFERENCES carpetas(id)  ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tablero_id)
);

-- 3. Tabla de seguidores de tablero
CREATE TABLE IF NOT EXISTS tablero_followers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tablero_id  uuid REFERENCES carpetas(id)  ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tablero_id)
);

-- 4. Tabla de seguidores de usuario
CREATE TABLE IF NOT EXISTS user_follows (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- 5. RLS Policies

ALTER TABLE tablero_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablero_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows      ENABLE ROW LEVEL SECURITY;

-- tablero_likes: anyone can read, authenticated users can insert/delete their own
CREATE POLICY "tablero_likes_read"   ON tablero_likes FOR SELECT USING (true);
CREATE POLICY "tablero_likes_insert" ON tablero_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tablero_likes_delete" ON tablero_likes FOR DELETE USING (auth.uid() = user_id);

-- tablero_followers
CREATE POLICY "tablero_followers_read"   ON tablero_followers FOR SELECT USING (true);
CREATE POLICY "tablero_followers_insert" ON tablero_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tablero_followers_delete" ON tablero_followers FOR DELETE USING (auth.uid() = user_id);

-- user_follows
CREATE POLICY "user_follows_read"   ON user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_insert" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "user_follows_delete" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- 6. Función para incrementar vistas (fire and forget)
CREATE OR REPLACE FUNCTION increment_tablero_views(tablero_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE carpetas
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = tablero_id;
END;
$$;

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_tablero_likes_tablero   ON tablero_likes(tablero_id);
CREATE INDEX IF NOT EXISTS idx_tablero_likes_user      ON tablero_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_tablero_followers_tablero ON tablero_followers(tablero_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower   ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following  ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_carpetas_public         ON carpetas(is_public) WHERE is_public = true;

-- =========================================================
-- ÍNDICES DE PERFORMANCE PARA FOTOS (si no están creados)
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_photos_status     ON photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_motivo     ON photos(motivo);
CREATE INDEX IF NOT EXISTS idx_photos_created    ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_likes      ON photos(likes DESC);
