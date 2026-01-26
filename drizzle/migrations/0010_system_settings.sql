-- ============================================
-- MOMENTIQUE - System Settings
-- ============================================
-- Migration: 0010_system_settings

CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_by" uuid,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "system_settings"
  ADD CONSTRAINT "system_settings_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "system_settings_updated_idx" ON "system_settings" USING btree ("updated_at");

ALTER TABLE "system_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_select_policy ON system_settings
  FOR SELECT
  TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY system_settings_insert_policy ON system_settings
  FOR INSERT
  TO PUBLIC
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY system_settings_update_policy ON system_settings
  FOR UPDATE
  TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY system_settings_delete_policy ON system_settings
  FOR DELETE
  TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);
