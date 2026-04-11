-- ============================================
-- Galeria - Remove Shared Default Tenant
-- ============================================
-- Migration: 0019_remove_default_tenant
--
-- Public signup now creates a dedicated tenant per customer workspace.
-- The legacy shared default tenant is removed so fresh environments do
-- not recreate a shared customer workspace.

DELETE FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
