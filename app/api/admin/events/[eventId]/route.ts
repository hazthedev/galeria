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
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const params = await context.params;
    const eventId = params['eventId'];
    const db = getTenantDb(SYSTEM_TENANT_ID);

    const eventResult = await db.query(
      `SELECT
        e.*,
        t.company_name,
        t.slug AS tenant_slug,
        t.subscription_tier AS tenant_tier,
        (SELECT COUNT(*) FROM photos WHERE event_id = e.id) as photo_count,
        (SELECT COUNT(*) FROM photos WHERE event_id = e.id AND status = 'approved') as approved_photo_count,
        (SELECT COUNT(*) FROM photos WHERE event_id = e.id AND status = 'pending') as pending_photo_count,
        (SELECT COUNT(*) FROM photos WHERE event_id = e.id AND status = 'rejected') as rejected_photo_count,
        (
          SELECT COALESCE(SUM(companions_count + 1), 0)
          FROM attendances
          WHERE event_id = e.id
        ) as total_guests,
        (
          SELECT COUNT(DISTINCT COALESCE(guest_email, guest_phone, user_fingerprint, id::text))
          FROM attendances
          WHERE event_id = e.id
        ) as unique_attendees,
        (
          SELECT COUNT(*)
          FROM attendances
          WHERE event_id = e.id
        ) as total_checkins,
        (
          SELECT COUNT(*)
          FROM lucky_draw_entries
          WHERE event_id = e.id
        ) as lucky_draw_entries,
        (
          SELECT COUNT(*)
          FROM winners
          WHERE event_id = e.id
        ) as lucky_draw_winners,
        (
          SELECT COUNT(*)
          FROM guest_photo_progress
          WHERE event_id = e.id
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

    const recentActivity = await db.query(
      `SELECT
        COUNT(*) as photos_uploaded,
        MAX(created_at) as last_upload
      FROM photos
      WHERE event_id = $1
      AND created_at > NOW() - INTERVAL '24 hours'`,
      [eventId]
    );

    const topContributors = await db.query(
      `SELECT
        MIN(id)::text as id,
        contributor_name as name,
        NULL::text as email,
        COUNT(*) as photo_count
      FROM photos
      WHERE event_id = $1
        AND contributor_name IS NOT NULL
        AND TRIM(contributor_name) <> ''
        AND COALESCE(is_anonymous, false) = false
      GROUP BY contributor_name
      ORDER BY photo_count DESC, contributor_name ASC
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
  } catch (error) {
    console.error('[Admin Event Detail API] Failed to load event:', error);
    return NextResponse.json(
      { error: 'Failed to load event', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
