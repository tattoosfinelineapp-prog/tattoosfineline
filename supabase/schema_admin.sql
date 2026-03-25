-- Admin schema additions
-- Run this in the Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

ALTER TABLE photos
ADD COLUMN IF NOT EXISTS reported_count integer DEFAULT 0;
