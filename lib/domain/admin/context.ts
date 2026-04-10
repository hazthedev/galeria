import 'server-only';

import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';
import { getTenantDb } from '@/lib/infrastructure/database/db';

export function getAdminDb() {
  return getTenantDb(SYSTEM_TENANT_ID);
}

export function isMissingTableError(error: unknown): boolean {
  return (error as { code?: string })?.code === '42P01';
}

export function isMissingColumnError(error: unknown): boolean {
  return (error as { code?: string })?.code === '42703';
}

export function isMissingSchemaResourceError(error: unknown): boolean {
  return isMissingTableError(error) || isMissingColumnError(error);
}

export function isAdminDatabaseError(error: unknown): boolean {
  return (
    Boolean((error as { code?: string })?.code) ||
    (error instanceof Error && /ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENOTFOUND/i.test(error.message))
  );
}
