// ============================================
// MOMENTIQUE - Subscription Tier Helpers
// ============================================

import { getTenantDb } from './db';
import { extractSessionId, validateSession } from './session';
import { verifyAccessToken } from './auth';
import type { SubscriptionTier, IUser } from './types';

export async function resolveUserTier(
  headers: Headers,
  tenantId: string,
  fallbackTier: SubscriptionTier = 'free'
): Promise<SubscriptionTier> {
  const authHeader = headers.get('authorization');
  const cookieHeader = headers.get('cookie');

  // Try session-based auth first
  const sessionResult = extractSessionId(cookieHeader, authHeader);
  if (sessionResult.sessionId) {
    const session = await validateSession(sessionResult.sessionId, false);
    if (session.valid && session.user) {
      return (session.user.subscription_tier as SubscriptionTier) || fallbackTier;
    }
  }

  // Fallback to JWT
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = verifyAccessToken(token);
      const db = getTenantDb(payload.tenant_id || tenantId);
      const user = await db.findOne<IUser>('users', { id: payload.sub });
      return (user?.subscription_tier as SubscriptionTier) || fallbackTier;
    } catch {
      return fallbackTier;
    }
  }

  return fallbackTier;
}
