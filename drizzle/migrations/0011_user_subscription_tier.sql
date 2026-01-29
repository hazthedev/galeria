DO $$
BEGIN
  ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'tester';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier NOT NULL DEFAULT 'free';

UPDATE users
  SET subscription_tier = 'free'
  WHERE subscription_tier IS NULL;
