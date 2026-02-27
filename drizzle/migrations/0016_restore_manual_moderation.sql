-- ============================================
-- Restore Manual Moderation System
-- ============================================
-- Migration: 0016_restore_manual_moderation
-- Date: 2025-02-27
-- Description: Restore manual moderation (organizer review workflow)

-- Create photo status enum
CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected');

-- Create moderation action enum
CREATE TYPE moderation_action AS ENUM ('approve', 'reject', 'delete');

-- Add status column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS status photo_status NOT NULL DEFAULT 'pending';

-- Add approved_at column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS approved_at timestamp;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS photo_status_idx ON photos(status);

-- Create photo moderation logs table
CREATE TABLE IF NOT EXISTS photo_moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action moderation_action NOT NULL,
  reason text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create indexes for moderation logs
CREATE INDEX IF NOT EXISTS moderation_log_event_idx ON photo_moderation_logs(event_id);
CREATE INDEX IF NOT EXISTS moderation_log_photo_idx ON photo_moderation_logs(photo_id);
CREATE INDEX IF NOT EXISTS moderation_log_tenant_idx ON photo_moderation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS moderation_log_action_idx ON photo_moderation_logs(action);

-- ============================================
-- Rollback (if needed)
-- ============================================
-- DROP TABLE IF EXISTS photo_moderation_logs CASCADE;
-- DROP TYPE IF EXISTS moderation_action CASCADE;
-- ALTER TABLE photos DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE photos DROP COLUMN IF EXISTS status CASCADE;
-- DROP TYPE IF EXISTS photo_status CASCADE;
