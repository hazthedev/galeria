import 'server-only';

import {
  deleteSession,
  extractSessionId,
  getSessionTTL,
  type ISessionData,
} from '@/lib/domain/auth/session';
import { getRedisClient } from '@/lib/infrastructure/cache/redis';
import { getKey } from '@/lib/redis';
import type { AdminSessionListItem, AdminSessionsData } from '@/lib/domain/admin/types';

function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) {
    return 'Unknown Device';
  }

  const ua = userAgent.toLowerCase();

  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  } else if (ua.includes('android')) {
    const match = ua.match(/android (\d+[._]\d+)/);
    os = match ? `Android ${match[1].replace('_', '.')}` : 'Android';
  } else if (ua.includes('iphone os') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}

export async function listAdminSessions(options?: {
  userId?: string | null;
  includeExpired?: boolean;
  cookie?: string | null;
  authorization?: string | null;
}): Promise<AdminSessionsData> {
  const redis = getRedisClient();
  const sessions: AdminSessionListItem[] = [];
  const includeExpired = options?.includeExpired === true;
  const currentSessionId = extractSessionId(
    options?.cookie || null,
    options?.authorization || null
  ).sessionId;

  let cursor = '0';
  do {
    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', '100');
    cursor = newCursor;

    for (const key of keys) {
      const sessionData = await getKey<ISessionData>(key);
      if (!sessionData) {
        continue;
      }

      if (options?.userId && sessionData.userId !== options.userId) {
        continue;
      }

      if (!includeExpired && Date.now() > sessionData.expiresAt) {
        continue;
      }

      const sessionId = key.replace('session:', '');
      const ttl = await getSessionTTL(sessionId);

      sessions.push({
        ...sessionData,
        sessionId,
        ttl,
        isCurrent: sessionId === currentSessionId,
        deviceInfo: parseDeviceInfo(sessionData.userAgent),
      });
    }
  } while (cursor !== '0');

  sessions.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.lastActivity - a.lastActivity;
  });

  const groupedByUser = new Map<string, AdminSessionListItem[]>();
  for (const session of sessions) {
    const key = session.userId;
    if (!groupedByUser.has(key)) {
      groupedByUser.set(key, []);
    }
    groupedByUser.get(key)!.push(session);
  }

  return {
    data: sessions,
    grouped: Object.fromEntries(groupedByUser),
    total: sessions.length,
    uniqueUsers: groupedByUser.size,
  };
}

export async function terminateAdminSessions(options: {
  sessionId?: string;
  userId?: string;
  allExceptCurrent?: boolean;
  cookie?: string | null;
  authorization?: string | null;
}): Promise<{ terminatedCount: number }> {
  const redis = getRedisClient();
  const currentSessionId = extractSessionId(
    options.cookie || null,
    options.authorization || null
  ).sessionId;

  if (!currentSessionId) {
    throw new Error('NO_SESSION');
  }

  let terminatedCount = 0;

  if (options.sessionId) {
    if (options.sessionId === currentSessionId) {
      throw new Error('CANNOT_TERMINATE_SELF');
    }

    const deleted = await deleteSession(options.sessionId);
    if (!deleted) {
      throw new Error('NOT_FOUND');
    }

    terminatedCount = 1;
    return { terminatedCount };
  }

  if (options.userId) {
    let cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', '100');
      cursor = newCursor;

      for (const key of keys) {
        const sessionData = await getKey<ISessionData>(key);
        const sessionKey = key.replace('session:', '');

        if (!sessionData || sessionData.userId !== options.userId) {
          continue;
        }

        if (options.allExceptCurrent && sessionKey === currentSessionId) {
          continue;
        }

        if (sessionKey === currentSessionId) {
          continue;
        }

        const deleted = await deleteSession(sessionKey);
        if (deleted) {
          terminatedCount++;
        }
      }
    } while (cursor !== '0');

    return { terminatedCount };
  }

  throw new Error('VALIDATION_ERROR');
}
