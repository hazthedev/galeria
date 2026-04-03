-- ============================================
-- Galeria - Supabase RLS Fix
-- ============================================
-- Run this in your Supabase SQL Editor to resolve the
-- "Table publicly accessible" critical warning.
--
-- What this does:
--   1. Creates tenant context functions (set_tenant_id, current_tenant_id)
--   2. Enables RLS on ALL tables
--   3. Creates tenant-isolation policies for all tables
--   4. Adds missing RLS for tables that never had it
--
-- IMPORTANT: Your app uses service_role key for server-side fallback
-- queries, which bypasses RLS. The anon key (client-side, used for
-- realtime) will be blocked from direct table access — which is
-- exactly what we want.
-- ============================================


-- ============================================
-- STEP 1: TENANT CONTEXT FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION set_tenant_id(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;


-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_photo_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;


-- ============================================
-- STEP 3: TENANTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS tenants_select_policy ON tenants;
CREATE POLICY tenants_select_policy ON tenants
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR id = current_tenant_id()
  );

DROP POLICY IF EXISTS tenants_insert_policy ON tenants;
CREATE POLICY tenants_insert_policy ON tenants
  FOR INSERT TO PUBLIC
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS tenants_update_policy ON tenants;
CREATE POLICY tenants_update_policy ON tenants
  FOR UPDATE TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS tenants_delete_policy ON tenants;
CREATE POLICY tenants_delete_policy ON tenants
  FOR DELETE TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);


-- ============================================
-- STEP 4: USERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT TO PUBLIC
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS users_insert_policy ON users;
CREATE POLICY users_insert_policy ON users
  FOR INSERT TO PUBLIC
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
  FOR UPDATE TO PUBLIC
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS users_delete_policy ON users;
CREATE POLICY users_delete_policy ON users
  FOR DELETE TO PUBLIC
  USING (tenant_id = current_tenant_id());


-- ============================================
-- STEP 5: EVENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS events_select_policy ON events;
CREATE POLICY events_select_policy ON events
  FOR SELECT TO PUBLIC
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS events_insert_policy ON events;
CREATE POLICY events_insert_policy ON events
  FOR INSERT TO PUBLIC
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS events_update_policy ON events;
CREATE POLICY events_update_policy ON events
  FOR UPDATE TO PUBLIC
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS events_delete_policy ON events;
CREATE POLICY events_delete_policy ON events
  FOR DELETE TO PUBLIC
  USING (tenant_id = current_tenant_id());


-- ============================================
-- STEP 6: PHOTOS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS photos_select_policy ON photos;
CREATE POLICY photos_select_policy ON photos
  FOR SELECT TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photos_insert_policy ON photos;
CREATE POLICY photos_insert_policy ON photos
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photos_update_policy ON photos;
CREATE POLICY photos_update_policy ON photos
  FOR UPDATE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photos_delete_policy ON photos;
CREATE POLICY photos_delete_policy ON photos
  FOR DELETE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 7: LUCKY DRAW POLICIES
-- ============================================

DROP POLICY IF EXISTS lucky_draw_configs_select_policy ON lucky_draw_configs;
CREATE POLICY lucky_draw_configs_select_policy ON lucky_draw_configs
  FOR SELECT TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS lucky_draw_configs_insert_policy ON lucky_draw_configs;
CREATE POLICY lucky_draw_configs_insert_policy ON lucky_draw_configs
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS lucky_draw_configs_update_policy ON lucky_draw_configs;
CREATE POLICY lucky_draw_configs_update_policy ON lucky_draw_configs
  FOR UPDATE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS lucky_draw_configs_delete_policy ON lucky_draw_configs;
CREATE POLICY lucky_draw_configs_delete_policy ON lucky_draw_configs
  FOR DELETE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS lucky_draw_entries_select_policy ON lucky_draw_entries;
CREATE POLICY lucky_draw_entries_select_policy ON lucky_draw_entries
  FOR SELECT TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS lucky_draw_entries_insert_policy ON lucky_draw_entries;
CREATE POLICY lucky_draw_entries_insert_policy ON lucky_draw_entries
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS winners_select_policy ON winners;
CREATE POLICY winners_select_policy ON winners
  FOR SELECT TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS winners_insert_policy ON winners;
CREATE POLICY winners_insert_policy ON winners
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS winners_update_policy ON winners;
CREATE POLICY winners_update_policy ON winners
  FOR UPDATE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 8: PHOTO MODERATION LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS photo_moderation_logs_select_policy ON photo_moderation_logs;
CREATE POLICY photo_moderation_logs_select_policy ON photo_moderation_logs
  FOR SELECT TO PUBLIC
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_moderation_logs_insert_policy ON photo_moderation_logs;
CREATE POLICY photo_moderation_logs_insert_policy ON photo_moderation_logs
  FOR INSERT TO PUBLIC
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_moderation_logs_delete_policy ON photo_moderation_logs;
CREATE POLICY photo_moderation_logs_delete_policy ON photo_moderation_logs
  FOR DELETE TO PUBLIC
  USING (tenant_id = current_tenant_id());


-- ============================================
-- STEP 9: SYSTEM SETTINGS POLICIES (system tenant only)
-- ============================================

DROP POLICY IF EXISTS system_settings_select_policy ON system_settings;
CREATE POLICY system_settings_select_policy ON system_settings
  FOR SELECT TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS system_settings_insert_policy ON system_settings;
CREATE POLICY system_settings_insert_policy ON system_settings
  FOR INSERT TO PUBLIC
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS system_settings_update_policy ON system_settings;
CREATE POLICY system_settings_update_policy ON system_settings
  FOR UPDATE TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS system_settings_delete_policy ON system_settings;
CREATE POLICY system_settings_delete_policy ON system_settings
  FOR DELETE TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);


-- ============================================
-- STEP 10: ATTENDANCE POLICIES
-- ============================================

DROP POLICY IF EXISTS attendances_tenant_policy ON attendances;
DROP POLICY IF EXISTS attendances_insert_policy ON attendances;

CREATE POLICY attendances_select_policy ON attendances
  FOR SELECT TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

CREATE POLICY attendances_insert_policy ON attendances
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

CREATE POLICY attendances_update_policy ON attendances
  FOR UPDATE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

CREATE POLICY attendances_delete_policy ON attendances
  FOR DELETE TO PUBLIC
  USING (event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 11: PHOTO SCAN LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS photo_scan_logs_select_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_select_policy ON photo_scan_logs
  FOR SELECT TO PUBLIC
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_scan_logs_insert_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_insert_policy ON photo_scan_logs
  FOR INSERT TO PUBLIC
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS photo_scan_logs_delete_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_delete_policy ON photo_scan_logs
  FOR DELETE TO PUBLIC
  USING (tenant_id = current_tenant_id());


-- ============================================
-- STEP 12: PHOTO REACTIONS (previously missing RLS)
-- ============================================
-- photo_reactions has no tenant_id column — isolate via photo -> event -> tenant chain

DROP POLICY IF EXISTS photo_reactions_select_policy ON photo_reactions;
CREATE POLICY photo_reactions_select_policy ON photo_reactions
  FOR SELECT TO PUBLIC
  USING (
    photo_id IN (
      SELECT p.id FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

DROP POLICY IF EXISTS photo_reactions_insert_policy ON photo_reactions;
CREATE POLICY photo_reactions_insert_policy ON photo_reactions
  FOR INSERT TO PUBLIC
  WITH CHECK (
    photo_id IN (
      SELECT p.id FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

DROP POLICY IF EXISTS photo_reactions_delete_policy ON photo_reactions;
CREATE POLICY photo_reactions_delete_policy ON photo_reactions
  FOR DELETE TO PUBLIC
  USING (
    photo_id IN (
      SELECT p.id FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );


-- ============================================
-- STEP 13: PHOTO CHALLENGES (previously missing RLS)
-- ============================================
-- photo_challenges uses event_id as TEXT, not UUID FK
-- Isolate via event_id matching events in the current tenant

DROP POLICY IF EXISTS photo_challenges_select_policy ON photo_challenges;
CREATE POLICY photo_challenges_select_policy ON photo_challenges
  FOR SELECT TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photo_challenges_insert_policy ON photo_challenges;
CREATE POLICY photo_challenges_insert_policy ON photo_challenges
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photo_challenges_update_policy ON photo_challenges;
CREATE POLICY photo_challenges_update_policy ON photo_challenges
  FOR UPDATE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS photo_challenges_delete_policy ON photo_challenges;
CREATE POLICY photo_challenges_delete_policy ON photo_challenges
  FOR DELETE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 14: GUEST PHOTO PROGRESS (previously missing RLS)
-- ============================================

DROP POLICY IF EXISTS guest_photo_progress_select_policy ON guest_photo_progress;
CREATE POLICY guest_photo_progress_select_policy ON guest_photo_progress
  FOR SELECT TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS guest_photo_progress_insert_policy ON guest_photo_progress;
CREATE POLICY guest_photo_progress_insert_policy ON guest_photo_progress
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS guest_photo_progress_update_policy ON guest_photo_progress;
CREATE POLICY guest_photo_progress_update_policy ON guest_photo_progress
  FOR UPDATE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS guest_photo_progress_delete_policy ON guest_photo_progress;
CREATE POLICY guest_photo_progress_delete_policy ON guest_photo_progress
  FOR DELETE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 15: PRIZE CLAIMS (previously missing RLS)
-- ============================================

DROP POLICY IF EXISTS prize_claims_select_policy ON prize_claims;
CREATE POLICY prize_claims_select_policy ON prize_claims
  FOR SELECT TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS prize_claims_insert_policy ON prize_claims;
CREATE POLICY prize_claims_insert_policy ON prize_claims
  FOR INSERT TO PUBLIC
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS prize_claims_update_policy ON prize_claims;
CREATE POLICY prize_claims_update_policy ON prize_claims
  FOR UPDATE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()))
  WITH CHECK (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS prize_claims_delete_policy ON prize_claims;
CREATE POLICY prize_claims_delete_policy ON prize_claims
  FOR DELETE TO PUBLIC
  USING (event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id()));


-- ============================================
-- STEP 16: ADMIN AUDIT LOGS (previously missing RLS)
-- ============================================
-- Only system tenant should access audit logs

DROP POLICY IF EXISTS admin_audit_logs_select_policy ON admin_audit_logs;
CREATE POLICY admin_audit_logs_select_policy ON admin_audit_logs
  FOR SELECT TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS admin_audit_logs_insert_policy ON admin_audit_logs;
CREATE POLICY admin_audit_logs_insert_policy ON admin_audit_logs
  FOR INSERT TO PUBLIC
  WITH CHECK (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);

DROP POLICY IF EXISTS admin_audit_logs_delete_policy ON admin_audit_logs;
CREATE POLICY admin_audit_logs_delete_policy ON admin_audit_logs
  FOR DELETE TO PUBLIC
  USING (current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid);


-- ============================================
-- DONE
-- ============================================
-- After running this, the Supabase dashboard warning should resolve.
--
-- How it works:
--   - service_role key (server-side): BYPASSES RLS — your fallback queries still work
--   - anon key (client-side): BLOCKED from direct table access since current_tenant_id() returns NULL
--   - Realtime broadcasts: unaffected (they use channels, not direct table access)
