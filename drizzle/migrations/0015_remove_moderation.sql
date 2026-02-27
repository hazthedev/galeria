-- ============================================
-- Remove Moderation System
-- ============================================
-- Migration: 0015_remove_moderation
-- Date: 2025-02-27
-- Description: Remove all moderation-related database objects
--              (enums, tables, columns, indexes)

-- Drop photo moderation logs table
DROP TABLE IF EXISTS photo_moderation_logs CASCADE;

-- Drop moderation action enum
DROP TYPE IF EXISTS moderation_action CASCADE;

-- Drop photo status enum
DROP TYPE IF EXISTS photo_status CASCADE;

-- Remove status column from photos table
ALTER TABLE photos DROP COLUMN IF EXISTS status CASCADE;

-- Remove moderation_required from default event settings (JSONB)
-- This is stored in settings.features, no explicit column to drop

-- ============================================
-- Rollback (if needed)
-- ============================================
-- CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected');
-- CREATE TYPE moderation_action AS ENUM ('approve', 'reject', 'delete');
-- ALTER TABLE photos ADD COLUMN status photo_status NOT NULL DEFAULT 'approved';
-- (recreate photo_moderation_logs table would go here)
