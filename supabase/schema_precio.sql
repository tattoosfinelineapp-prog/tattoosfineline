-- Add precio_desde column to users
-- Run this in the Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS precio_desde integer;
