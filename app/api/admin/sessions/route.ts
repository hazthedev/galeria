// ============================================
// Galeria - Admin Sessions API
// ============================================
// Super admin endpoints for managing user sessions

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { extractSessionId, validateSession, deleteSession, getSessionKey, getSessionTTL, type ISessionData } from '@/lib/domain/auth/session';
import { getRedisClient } from '@/lib/infrastructure/cache/redis';
import { getKey } from '@/lib/redis';

/**
 * Extended session info for admin display
 */
interface AdminSessionInfo extends ISessionData {
  sessionId: string;
  ttl: number; // Time to live in seconds
  isCurrent: boolean; // Whether this is the current user's session
  deviceInfo: string; // Human-readable device/browser info
}

/**
 * GET /api/admin/sessions
 * List all sessions or filter by user
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Filter by specific user
  const includeExpired = searchParams.get('includeExpired') === 'true';

  const redis = getRedisClient();
  const sessions: AdminSessionInfo[] = [];

  // Get current session ID for marking
  const { sessionId: currentSessionId } = extractSessionId(
    request.headers.get('cookie'),
    request.headers.get('authorization')
  );

  // Scan for all sessions
  let cursor = '0';
  const pattern = 'session:*';
  const scanCount = 100;

  do {
    const [newCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      scanCount
    );
    cursor = newCursor;

    for (const key of keys) {
      const sessionData = await getKey<ISessionData>(key);

      if (!sessionData) {
        continue;
      }

      // Filter by userId if specified
      if (userId && sessionData.userId !== userId) {
        continue;
      }

      // Skip expired sessions unless explicitly requested
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

  // Sort: current session first, then by last activity (newest first)
  sessions.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.lastActivity - a.lastActivity;
  });

  // Group by user for easier display
  const groupedByUser = new Map<string, AdminSessionInfo[]>();
  for (const session of sessions) {
    const key = session.userId;
    if (!groupedByUser.has(key)) {
      groupedByUser.set(key, []);
    }
    groupedByUser.get(key)!.push(session);
  }

  return NextResponse.json({
    data: sessions,
    grouped: Object.fromEntries(groupedByUser),
    total: sessions.length,
    uniqueUsers: groupedByUser.size,
  });
}

/**
 * DELETE /api/admin/sessions
 * Terminate specific session(s) or all sessions for a user
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { sessionId, userId, allExceptCurrent = false } = body;

  const redis = getRedisClient();

  // Get current session ID
  const { sessionId: currentSessionId } = extractSessionId(
    request.headers.get('cookie'),
    request.headers.get('authorization')
  );

  if (!currentSessionId) {
    return NextResponse.json(
      { error: 'No active session found', code: 'NO_SESSION' },
      { status: 400 }
    );
  }

  let terminatedCount = 0;

  if (sessionId) {
    // Terminate specific session
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: 'Cannot terminate your own session via this endpoint', code: 'CANNOT_TERMINATE_SELF' },
        { status: 400 }
      );
    }

    const result = await deleteSession(sessionId);
    terminatedCount = result ? 1 : 0;

    if (terminatedCount === 0) {
      return NextResponse.json(
        { error: 'Session not found or already expired', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
  } else if (userId) {
    // Terminate all sessions for a user
    let cursor = '0';
    const pattern = 'session:*';

    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '100'
      );
      cursor = newCursor;

      for (const key of keys) {
        const sessionData = await getKey<ISessionData>(key);
        const sessionKey = key.replace('session:', '');

        if (!sessionData || sessionData.userId !== userId) {
          continue;
        }

        // Skip current session if allExceptCurrent is true
        if (allExceptCurrent && sessionKey === currentSessionId) {
          continue;
        }

        // Prevent admin from terminating their own session
        if (sessionKey === currentSessionId) {
          continue;
        }

        const deleted = await deleteSession(sessionKey);
        if (deleted) terminatedCount++;
      }
    } while (cursor !== '0');
  } else {
    return NextResponse.json(
      { error: 'Must specify sessionId or userId', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    terminatedCount,
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Parse user agent into human-readable device info
 */
function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) {
    return 'Unknown Device';
  }

  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  else if (ua.includes('android')) {
    const match = ua.match(/android (\d+[._]\d+)/);
    os = match ? `Android ${match[1].replace('_', '.')}` : 'Android';
  }
  else if (ua.includes('iphone os') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect mobile
  const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);

  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}
