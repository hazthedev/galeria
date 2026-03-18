-- ============================================
-- Migration: Add Multi-Factor Authentication for Users
-- ============================================
-- This migration adds MFA support for user accounts
-- Essential for securing super admin accounts

-- Add MFA columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS recovery_codes TEXT[];

-- Create index for MFA-enabled users (useful for queries)
CREATE INDEX idx_users_mfa_enabled ON users(totp_enabled) WHERE totp_enabled = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.totp_secret IS 'TOTP secret key for time-based one-time passwords (stored as base32)';
COMMENT ON COLUMN users.totp_enabled IS 'Whether TOTP two-factor authentication is enabled for this user';
COMMENT ON COLUMN users.totp_verified_at IS 'Timestamp when TOTP was first set up and verified';
COMMENT ON COLUMN users.recovery_codes IS 'Array of hashed recovery codes for account recovery (one-time use)';
