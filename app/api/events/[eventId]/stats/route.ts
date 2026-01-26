// ============================================
// MOMENTIQUE - Event Stats API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { extractSessionId, validateSession } from '@/lib/session';

interface EventStats {
  totalPhotos: number;
  totalParticipants: number;
  photosToday: number;
  avgPhotosPerUser: number;
  topContributors: { name: string; count: number }[];
  uploadTimeline: { date: string; count: number }[];
  totalReactions: number;
  pendingModeration: number;
  topLikedPhotos: {
    id: string;
    imageUrl: string;
    heartCount: number;
    contributorName: string;
    isAnonymous: boolean;
  }[];
}

interface TopContributor {
  contributor_name: string;
  count: number;
}

// ============================================
// GET /api/events/:id/stats - Get event statistics
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId: id } = await params;
  try {
    const headers = request.headers;
    let tenantId = getTenantId(headers);

    // Fallback to default tenant for development (Turbopack middleware issue)
    if (!tenantId) {
      tenantId = '00000000-0000-0000-0000-000000000001';
    }

    // Get user from session or JWT token
    const cookieHeader = headers.get('cookie');
    const authHeader = headers.get('authorization');
    let userId: string | null = null;
    let userRole: string | null = null;

    // Try session-based auth first
    const sessionResult = extractSessionId(cookieHeader, authHeader);
    if (sessionResult.sessionId) {
      const session = await validateSession(sessionResult.sessionId, false);
      if (session.valid && session.user) {
        userId = session.user.id;
        userRole = session.user.role;
      }
    }

    // Fallback to JWT token
    if (!userId && authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        userId = payload.sub;
        userRole = payload.role;
      } catch {
        // Token invalid
      }
    }

    // Stats are optional - return empty stats if not authenticated
    if (!userId) {
      const emptyStats: EventStats = {
        totalPhotos: 0,
        totalParticipants: 0,
        photosToday: 0,
        avgPhotosPerUser: 0,
        topContributors: [],
        uploadTimeline: [],
        totalReactions: 0,
        pendingModeration: 0,
        topLikedPhotos: [],
      };
      return NextResponse.json({ data: emptyStats });
    }

    const db = getTenantDb(tenantId);

    // Check if event exists
    const event = await db.findOne('events', { id });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = event.organizer_id === userId;
    const isSuperAdmin = userRole === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const totalPhotosResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM photos WHERE event_id = $1`,
      [id]
    );
    const totalPhotos = parseInt(totalPhotosResult.rows[0]?.count || '0', 10);

    const participantsResult = await db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_fingerprint) as count FROM photos WHERE event_id = $1`,
      [id]
    );
    const totalParticipants = parseInt(participantsResult.rows[0]?.count || '0', 10);

    const photosTodayResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM photos WHERE event_id = $1 AND created_at >= DATE_TRUNC('day', NOW())`,
      [id]
    );
    const photosToday = parseInt(photosTodayResult.rows[0]?.count || '0', 10);

    const avgPhotosPerUser = totalParticipants > 0
      ? Math.round((totalPhotos / totalParticipants) * 10) / 10
      : 0;

    const topContributorsResult = await db.query<{ name: string; count: string }>(
      `
        SELECT
          CASE WHEN is_anonymous THEN 'Anonymous' ELSE COALESCE(NULLIF(contributor_name, ''), 'Guest') END as name,
          COUNT(*) as count
        FROM photos
        WHERE event_id = $1
        GROUP BY name
        ORDER BY count DESC
        LIMIT 10
      `,
      [id]
    );
    const topContributors = topContributorsResult.rows.map((row) => ({
      name: row.name,
      count: parseInt(row.count, 10),
    }));

    const uploadTimelineResult = await db.query<{ date: string; count: string }>(
      `
        SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
               COUNT(*) as count
        FROM photos
        WHERE event_id = $1
          AND created_at >= (NOW() - INTERVAL '6 days')
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `,
      [id]
    );

    const timelineMap = new Map(uploadTimelineResult.rows.map((row) => [row.date, parseInt(row.count, 10)]));
    const uploadTimeline: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      uploadTimeline.push({ date: dateStr, count: timelineMap.get(dateStr) || 0 });
    }

    const totalReactionsResult = await db.query<{ total: string }>(
      `
        SELECT
          COALESCE(SUM(
            (COALESCE((reactions->>'heart')::int, 0)) +
            (COALESCE((reactions->>'clap')::int, 0)) +
            (COALESCE((reactions->>'laugh')::int, 0)) +
            (COALESCE((reactions->>'wow')::int, 0))
          ), 0) as total
        FROM photos
        WHERE event_id = $1
      `,
      [id]
    );
    const totalReactions = parseInt(totalReactionsResult.rows[0]?.total || '0', 10);

    const topLikedResult = await db.query<{
      id: string;
      imageUrl: string | null;
      heartCount: number | null;
      contributorName: string;
      isAnonymous: boolean;
    }>(
      `
        SELECT
          id,
          (images ->> 'thumbnail_url') as "imageUrl",
          COALESCE((reactions->>'heart')::int, 0) as "heartCount",
          CASE WHEN is_anonymous THEN 'Anonymous' ELSE COALESCE(NULLIF(contributor_name, ''), 'Guest') END as "contributorName",
          is_anonymous as "isAnonymous"
        FROM photos
        WHERE event_id = $1
        ORDER BY COALESCE((reactions->>'heart')::int, 0) DESC
        LIMIT 3
      `,
      [id]
    );
    const topLikedPhotos = topLikedResult.rows.map((row) => ({
      id: row.id,
      imageUrl: row.imageUrl || '',
      heartCount: row.heartCount || 0,
      contributorName: row.contributorName,
      isAnonymous: row.isAnonymous,
    }));

    const pendingModerationResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM photos WHERE event_id = $1 AND status = 'pending'`,
      [id]
    );
    const pendingModeration = parseInt(pendingModerationResult.rows[0]?.count || '0', 10);

    const stats: EventStats = {
      totalPhotos,
      totalParticipants,
      photosToday,
      avgPhotosPerUser,
      topContributors,
      uploadTimeline,
      totalReactions,
      pendingModeration,
      topLikedPhotos,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('[API] Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
