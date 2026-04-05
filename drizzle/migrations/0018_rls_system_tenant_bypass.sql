-- ============================================
-- Galeria - RLS System Tenant Bypass for Admin
-- ============================================
-- Migration: 0018_rls_system_tenant_bypass
--
-- Problem: Admin dashboard queries run under SYSTEM_TENANT_ID but RLS
-- policies on events, users, photos, and related tables only allow
-- access to rows matching the current tenant. This causes the admin
-- dashboard to show all zeros and cross-tenant admin queries to fail.
--
-- Fix: Add system tenant bypass to SELECT policies so the super admin
-- can read all data across tenants. Write policies remain unchanged
-- (admin writes should target specific tenants).

-- ============================================
-- EVENTS: Allow system tenant to read all events
-- ============================================

DROP POLICY IF EXISTS events_select_policy ON events;
CREATE POLICY events_select_policy ON events
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

-- ============================================
-- USERS: Allow system tenant to read all users
-- ============================================

DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

-- Also allow system tenant to update/delete users (admin user management)
DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
  FOR UPDATE TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

DROP POLICY IF EXISTS users_delete_policy ON users;
CREATE POLICY users_delete_policy ON users
  FOR DELETE TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

-- ============================================
-- PHOTOS: Allow system tenant to read all photos
-- ============================================

DROP POLICY IF EXISTS photos_select_policy ON photos;
CREATE POLICY photos_select_policy ON photos
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- ATTENDANCES: Allow system tenant to read all
-- ============================================

DROP POLICY IF EXISTS attendances_select_policy ON attendances;
CREATE POLICY attendances_select_policy ON attendances
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- LUCKY DRAW: Allow system tenant to read all
-- ============================================

DROP POLICY IF EXISTS lucky_draw_configs_select_policy ON lucky_draw_configs;
CREATE POLICY lucky_draw_configs_select_policy ON lucky_draw_configs
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS lucky_draw_entries_select_policy ON lucky_draw_entries;
CREATE POLICY lucky_draw_entries_select_policy ON lucky_draw_entries
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS winners_select_policy ON winners;
CREATE POLICY winners_select_policy ON winners
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- PHOTO MODERATION LOGS: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS photo_moderation_logs_select_policy ON photo_moderation_logs;
CREATE POLICY photo_moderation_logs_select_policy ON photo_moderation_logs
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

-- ============================================
-- PHOTO SCAN LOGS: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS photo_scan_logs_select_policy ON photo_scan_logs;
CREATE POLICY photo_scan_logs_select_policy ON photo_scan_logs
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR tenant_id = current_tenant_id()
  );

-- ============================================
-- PHOTO REACTIONS: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS photo_reactions_select_policy ON photo_reactions;
CREATE POLICY photo_reactions_select_policy ON photo_reactions
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR photo_id IN (
      SELECT p.id FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

-- ============================================
-- PHOTO CHALLENGES: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS photo_challenges_select_policy ON photo_challenges;
CREATE POLICY photo_challenges_select_policy ON photo_challenges
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- GUEST PHOTO PROGRESS: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS guest_photo_progress_select_policy ON guest_photo_progress;
CREATE POLICY guest_photo_progress_select_policy ON guest_photo_progress
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- PRIZE CLAIMS: Allow system tenant
-- ============================================

DROP POLICY IF EXISTS prize_claims_select_policy ON prize_claims;
CREATE POLICY prize_claims_select_policy ON prize_claims
  FOR SELECT TO PUBLIC
  USING (
    current_tenant_id() = '00000000-0000-0000-0000-000000000000'::uuid
    OR event_id::uuid IN (SELECT id FROM events WHERE tenant_id = current_tenant_id())
  );

-- ============================================
-- DONE
-- ============================================
-- After this migration:
--   - Super admin (SYSTEM_TENANT_ID) can SELECT all data across tenants
--   - Super admin can UPDATE/DELETE users across tenants
--   - Regular tenants remain isolated (no change)
--   - Write policies for non-user tables unchanged
