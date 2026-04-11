-- ============================================
-- Galeria - Normalize System Tenant Branding
-- ============================================
-- Migration: 0020_rename_system_tenant_to_galeria
--
-- Align the master/system tenant naming with the Galeria product
-- brand for existing environments.

UPDATE tenants
SET
  brand_name = 'Galeria System',
  company_name = 'Galeria',
  contact_email = 'system@galeria.local',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
   OR tenant_type = 'master';
