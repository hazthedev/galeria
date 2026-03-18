-- ============================================
-- Galeria - Migration 0015: Photo Moderation Log Retention
-- ============================================
-- Keeps moderation logs after photo deletion and adds snapshot fields so
-- moderation history remains visible even when related records are gone.

DO $$ BEGIN
  ALTER TYPE moderation_action ADD VALUE IF NOT EXISTS 'review';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE photo_moderation_logs
  ALTER COLUMN photo_id DROP NOT NULL,
  ALTER COLUMN moderator_id DROP NOT NULL;

ALTER TABLE photo_moderation_logs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS photo_status TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE photo_moderation_logs
  DROP CONSTRAINT IF EXISTS photo_moderation_logs_photo_id_fkey;

ALTER TABLE photo_moderation_logs
  ADD CONSTRAINT photo_moderation_logs_photo_id_fkey
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE SET NULL;

ALTER TABLE photo_moderation_logs
  DROP CONSTRAINT IF EXISTS photo_moderation_logs_moderator_id_fkey;

ALTER TABLE photo_moderation_logs
  ADD CONSTRAINT photo_moderation_logs_moderator_id_fkey
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL;

UPDATE photo_moderation_logs l
SET
  source = COALESCE(l.source, 'manual'),
  photo_status = COALESCE(l.photo_status, p.status::text),
  image_url = COALESCE(l.image_url, p.images ->> 'thumbnail_url')
FROM photos p
WHERE l.photo_id = p.id;

INSERT INTO migration_version (version, description)
VALUES (15, 'Keep photo moderation logs after photo deletion and add snapshots')
ON CONFLICT (version) DO NOTHING;
