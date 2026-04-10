import 'server-only';

import { getTenantDb } from '@/lib/infrastructure/database/db';
import { verifyTOTP } from '@/lib/mfa/totp';

type RequireAdminStepUpOptions = {
  adminUserId: string;
  tenantId: string;
  token?: string;
};

type AdminStepUpUser = {
  id: string;
  totp_enabled: boolean;
  totp_secret: string | null;
  totp_verified_at: Date | null;
};

export async function requireAdminStepUpIfEnabled({
  adminUserId,
  tenantId,
  token,
}: RequireAdminStepUpOptions) {
  const db = getTenantDb(tenantId);
  const user = await db.findOne<AdminStepUpUser>('users', { id: adminUserId });

  if (!user) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  if (!user.totp_enabled) {
    return;
  }

  const cleanToken = token?.replace(/\s/g, '') || '';
  if (!cleanToken || !user.totp_secret || !user.totp_verified_at) {
    throw new Error('STEP_UP_REQUIRED');
  }

  if (!verifyTOTP(cleanToken, user.totp_secret)) {
    throw new Error('STEP_UP_INVALID');
  }
}
