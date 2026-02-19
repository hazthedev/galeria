import { verifyAccessToken } from '@/lib/auth';
import { DEFAULT_TENANT_ID } from '@/lib/constants/tenants';
import { extractSessionId, validateSession } from '@/lib/session';
import { getTenantId } from '@/lib/tenant';

export interface OptionalAuthContext {
  userId: string;
  role: string;
  tenantId: string;
}

export async function resolveOptionalAuth(headers: Headers): Promise<OptionalAuthContext | null> {
  try {
    const authHeader = headers.get('authorization');
    const cookieHeader = headers.get('cookie');
    const sessionResult = extractSessionId(cookieHeader, authHeader);

    if (sessionResult.sessionId) {
      const session = await validateSession(sessionResult.sessionId, false);
      if (session.valid && session.user) {
        return {
          userId: session.user.id,
          role: session.user.role,
          tenantId: session.user.tenant_id,
        };
      }
    }

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        return {
          userId: payload.sub,
          role: payload.role,
          tenantId: payload.tenant_id,
        };
      } catch {
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveTenantId(headers: Headers, auth?: OptionalAuthContext | null): string {
  const resolvedTenantId = auth?.tenantId || getTenantId(headers);
  if (resolvedTenantId) {
    return resolvedTenantId;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_TENANT_ID;
  }

  throw new Error('Tenant context missing');
}

export function resolveRequiredTenantId(headers: Headers, auth?: OptionalAuthContext | null): string {
  return resolveTenantId(headers, auth);
}
