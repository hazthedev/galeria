// ============================================
// Photo Challenge All Progress API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

/**
 * GET /api/events/[eventId]/photo-challenge/progress/all
 * Get all guest progress for an event (admin only)
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const { db } = await requireEventModeratorAccess(req.headers, eventId);

    // Get all progress entries for this event
    const progressEntries = await db.findMany('guest_photo_progress', {
      event_id: eventId,
    });

    return NextResponse.json({
      data: progressEntries,
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE_PROGRESS_ALL] GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Invalid or expired access token')) {
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
      { error: 'Failed to fetch progress', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
