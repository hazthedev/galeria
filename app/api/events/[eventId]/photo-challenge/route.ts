// ============================================
// Photo Challenge API Routes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { hasModeratorRole, requireAuthForApi } from '@/lib/domain/auth/auth';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
import { normalizeGuestChallengeFingerprint } from '@/lib/domain/events/photo-challenge';

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

type EventAccessRecord = {
  id: string;
  organizer_id: string;
};

async function requirePhotoChallengeManageAccess(
  req: NextRequest,
  eventId: string
): Promise<{ db: ReturnType<typeof getTenantDb> }> {
  const { userId, tenantId, payload } = await requireAuthForApi(req.headers);

  if (!hasModeratorRole(payload.role)) {
    throw new Error('Forbidden');
  }

  const db = getTenantDb(tenantId);
  const event = await db.findOne<EventAccessRecord>('events', { id: eventId });
  if (!event) {
    throw new Error('Event not found');
  }

  if (payload.role === 'organizer' && event.organizer_id !== userId) {
    throw new Error('Forbidden');
  }

  return { db };
}

function getMutationErrorResponse(
  error: unknown,
  fallbackError: string,
  fallbackCode: string
) {
  if (error instanceof Error) {
    if (
      error.message.includes('Authentication required') ||
      error.message.includes('Invalid or expired access token')
    ) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (error.message.includes('Event not found')) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    { error: fallbackError, code: fallbackCode },
    { status: 500 }
  );
}

function getInvalidGoalResponse() {
  return NextResponse.json(
    { error: 'goal_photos must be at least 1', code: 'INVALID_GOAL' },
    { status: 400 }
  );
}

/**
 * GET /api/events/[eventId]/photo-challenge
 * Get photo challenge configuration for an event
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const headers = req.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveTenantId(headers, auth);

    const db = getTenantDb(tenantId);

    // Check if event exists
    const event = await db.findOne('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get photo challenge configuration
    const challenge = await db.findOne('photo_challenges', { event_id: eventId });

    if (!challenge) {
      return NextResponse.json({
        data: null,
        enabled: false,
      });
    }

    return NextResponse.json({
      data: challenge,
      enabled: challenge.enabled,
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo challenge', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[eventId]/photo-challenge
 * Create photo challenge configuration
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const body = await req.json();
    const { db } = await requirePhotoChallengeManageAccess(req, eventId);

    if (
      typeof body.goal_photos !== 'number' ||
      !Number.isFinite(body.goal_photos) ||
      body.goal_photos < 1
    ) {
      return getInvalidGoalResponse();
    }

    // Check if challenge already exists
    const existing = await db.findOne('photo_challenges', { event_id: eventId });
    if (existing) {
      return NextResponse.json(
        { error: 'Photo challenge already exists for this event', code: 'ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    // Create challenge
    const challenge = await db.insert('photo_challenges', {
      event_id: eventId,
      goal_photos: body.goal_photos ?? 5,
      prize_title: body.prize_title,
      prize_description: body.prize_description || null,
      prize_tier: body.prize_tier || null,
      enabled: body.enabled ?? true,
      auto_grant: body.auto_grant ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const approvedPhotos = await db.query<{ user_fingerprint: string; approved_count: string }>(
      `
        SELECT user_fingerprint, COUNT(*)::text AS approved_count
        FROM photos
        WHERE event_id = $1
          AND status = 'approved'
          AND user_fingerprint IS NOT NULL
          AND user_fingerprint <> ''
        GROUP BY user_fingerprint
      `,
      [eventId]
    );

    const seededProgress = new Map<string, number>();
    for (const row of approvedPhotos.rows) {
      const normalizedFingerprint = normalizeGuestChallengeFingerprint(row.user_fingerprint);
      if (!normalizedFingerprint) {
        continue;
      }

      const approvedCount = Number(row.approved_count || 0);
      seededProgress.set(
        normalizedFingerprint,
        (seededProgress.get(normalizedFingerprint) || 0) + approvedCount
      );
    }

    for (const [fingerprint, approvedCount] of seededProgress.entries()) {
      await db.query(
        `
          INSERT INTO guest_photo_progress (
            id,
            event_id,
            user_fingerprint,
            photos_uploaded,
            photos_approved,
            goal_reached,
            prize_claimed_at,
            prize_revoked,
            revoke_reason,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $3,
            $4,
            NULL,
            false,
            NULL,
            NOW(),
            NOW()
          )
          ON CONFLICT (event_id, user_fingerprint)
          DO UPDATE SET
            photos_uploaded = EXCLUDED.photos_uploaded,
            photos_approved = EXCLUDED.photos_approved,
            goal_reached = EXCLUDED.goal_reached,
            updated_at = NOW()
        `,
        [eventId, fingerprint, approvedCount, approvedCount >= challenge.goal_photos]
      );
    }

    return NextResponse.json({
      data: challenge,
      message: 'Photo challenge created successfully',
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE] POST error:', error);
    return getMutationErrorResponse(error, 'Failed to create photo challenge', 'CREATE_ERROR');
  }
}

/**
 * PATCH /api/events/[eventId]/photo-challenge
 * Update photo challenge configuration
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const body = await req.json();
    const { db } = await requirePhotoChallengeManageAccess(req, eventId);

    if (
      body.goal_photos !== undefined &&
      (typeof body.goal_photos !== 'number' ||
        !Number.isFinite(body.goal_photos) ||
        body.goal_photos < 1)
    ) {
      return getInvalidGoalResponse();
    }

    // Update challenge
    await db.update(
      'photo_challenges',
      {
        ...(body.goal_photos !== undefined && { goal_photos: body.goal_photos }),
        ...(body.prize_title !== undefined && { prize_title: body.prize_title }),
        ...(body.prize_description !== undefined && { prize_description: body.prize_description }),
        ...(body.prize_tier !== undefined && { prize_tier: body.prize_tier }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.auto_grant !== undefined && { auto_grant: body.auto_grant }),
        updated_at: new Date(),
      },
      { event_id: eventId }
    );

    // Fetch and return the updated challenge
    const updated = await db.findOne('photo_challenges', { event_id: eventId });

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE] PATCH error:', error);
    return getMutationErrorResponse(error, 'Failed to update photo challenge', 'UPDATE_ERROR');
  }
}

/**
 * DELETE /api/events/[eventId]/photo-challenge
 * Delete photo challenge configuration
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const { db } = await requirePhotoChallengeManageAccess(req, eventId);

    // Delete challenge
    await db.delete('photo_challenges', { event_id: eventId });

    return NextResponse.json({
      message: 'Photo challenge deleted successfully',
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE] DELETE error:', error);
    return getMutationErrorResponse(error, 'Failed to delete photo challenge', 'DELETE_ERROR');
  }
}
