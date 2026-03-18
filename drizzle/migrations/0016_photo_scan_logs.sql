-- ============================================
-- Galeria - Migration 0016: Photo Scan Logs
-- ============================================
-- Persists AI moderation scan outcomes and failures so worker decisions
-- remain queryable after the job has finished.

DO $$ BEGIN
  CREATE TYPE photo_scan_decision AS ENUM ('approve', 'reject', 'review', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE photo_scan_outcome AS ENUM ('queued', 'applied', 'skipped', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS photo_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id TEXT,
  source TEXT NOT NULL DEFAULT 'queue',
  trigger_type TEXT NOT NULL DEFAULT 'upload',
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  decision photo_scan_decision,
  outcome photo_scan_outcome NOT NULL,
  reason TEXT,
  error TEXT,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence DOUBLE PRECISION,
  image_url TEXT,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photo_scan_log_event_idx ON photo_scan_logs(event_id);
CREATE INDEX IF NOT EXISTS photo_scan_log_photo_idx ON photo_scan_logs(photo_id);
CREATE INDEX IF NOT EXISTS photo_scan_log_tenant_idx ON photo_scan_logs(tenant_id);
CREATE INDEX IF NOT EXISTS photo_scan_log_outcome_idx ON photo_scan_logs(outcome);
CREATE INDEX IF NOT EXISTS photo_scan_log_created_at_idx ON photo_scan_logs(created_at);

ALTER TABLE photo_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS photo_scan_logs_select_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_select_policy ON photo_scan_logs
  FOR SELECT
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_scan_logs_insert_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_insert_policy ON photo_scan_logs
  FOR INSERT
  TO PUBLIC
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_scan_logs_delete_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_delete_policy ON photo_scan_logs
  FOR DELETE
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

INSERT INTO migration_version (version, description)
VALUES (16, 'Persist photo scan logs for AI moderation outcomes')
ON CONFLICT (version) DO NOTHING;
