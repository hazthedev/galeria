// ============================================
// Galeria - Admin Event Detail API
// ============================================
// Super admin endpoints for viewing/managing individual events

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { SYSTEM_TENANT_ID } from '@/lib/constants/tenants';

/**
 * GET /api/admin/events/[eventId]
 * Get detailed information about a specific event
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;
  const eventId = params['eventId'];
  const db = getTenantDb(SYSTEM_TENANT_ID);

  // Get event details with full statistics
  const eventResult = await db.query(
    `SELECT
      e.*,
      t.company_name,
      t.slug AS tenant_slug,
      t.subscription_tier AS tenant_tier,
      (
        SELECT COUNT(*) FROM photos WHERE event_id = e.id
      ) as photo_count,
      (
        SELECT COUNT(*) FROM photos WHERE event_id = e.id AND moderation_status = 'approved'
      ) as approved_photo_count,
      (
        SELECT COUNT(*) FROM photos WHERE event_id = e.id AND moderation_status = 'pending'
      ) as pending_photo_count,
      (
        SELECT COUNT(*) FROM photos WHERE event_id = e.id AND moderation_status = 'rejected'
      ) as rejected_photo_count,
      (
        SELECT COUNT(*) FROM users WHERE tenant_id = e.tenant_id AND role = 'guest'
      ) as total_guests,
      (
        SELECT COUNT(DISTINCT user_id) FROM attendance WHERE event_id = e.id
      ) as unique_attendees,
      (
        SELECT COUNT(*) FROM attendance WHERE event_id = e.id
      ) as total_checkins,
      (
        SELECT COUNT(*) FROM lucky_draw_entries WHERE event_id = e.id
      ) as lucky_draw_entries,
      (
        SELECT COUNT(*) FROM lucky_draw_winners WHERE event_id = e.id
      ) as lucky_draw_winners,
      (
        SELECT COUNT(*) FROM photo_challenge_progress WHERE event_id = e.id
      ) as challenge_participants
    FROM events e
    LEFT JOIN tenants t ON t.id = e.tenant_id
    WHERE e.id = $1`,
    [eventId]
  );

  const event = eventResult.rows[0];

  if (!event) {
    return NextResponse.json(
      { error: 'Event not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Get recent activity (photos uploaded in last 24 hours)
  const recentActivity = await db.query(
    `SELECT
      COUNT(*) as photos_uploaded,
      MAX(created_at) as last_upload
    FROM photos
    WHERE event_id = $1
    AND created_at > NOW() - INTERVAL '24 hours'`,
    [eventId]
  );

  // Get top contributors (users with most photos)
  const topContributors = await db.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      COUNT(p.id) as photo_count
    FROM users u
    INNER JOIN photos p ON p.uploaded_by = u.id
    WHERE p.event_id = $1
    GROUP BY u.id
    ORDER BY photo_count DESC
    LIMIT 10`,
    [eventId]
  );

  return NextResponse.json({
    data: {
      ...event,
      recentActivity: recentActivity.rows[0] || { photos_uploaded: 0, last_upload: null },
      topContributors: topContributors.rows,
    },
  });
}
