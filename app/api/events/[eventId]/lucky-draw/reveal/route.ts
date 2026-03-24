// ============================================
// Galeria - Lucky Draw Reveal Broadcast API
// ============================================
// Called by the organizer's WinnerModal to broadcast
// draw_started / draw_winner events to guests in real-time.

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';
import { mapWinnerToBroadcastPayload } from '@/lib/lucky-draw/broadcast-utils';

export const runtime = 'nodejs';

// ============================================
// POST /api/events/:eventId/lucky-draw/reveal
// body: { type: 'draw_started' } or { type: 'draw_winner', winner: {...} }
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    if (!(await isTenantFeatureEnabled(tenantId, 'lucky_draw'))) {
      return NextResponse.json(
        { error: 'Lucky Draw is not available on your current plan', code: 'FEATURE_NOT_AVAILABLE' },
        { status: 403 }
      );
    }

    await requireEventModeratorAccess(headers, eventId);

    const body = await request.json();
    const { type } = body;

    if (type === 'draw_started') {
      await publishEventBroadcast(eventId, 'draw_started', {
        event_id: eventId,
        config_id: body.configId || null,
        started_at: new Date().toISOString(),
      });

      return NextResponse.json({ message: 'draw_started broadcast sent' });
    }

    if (type === 'draw_winner') {
      const { winner } = body;
      if (!winner) {
        return NextResponse.json(
          { error: 'winner payload is required for draw_winner', code: 'MISSING_WINNER' },
          { status: 400 }
        );
      }

      await publishEventBroadcast(
        eventId,
        'draw_winner',
        mapWinnerToBroadcastPayload(winner, eventId)
      );

      return NextResponse.json({ message: 'draw_winner broadcast sent' });
    }

    if (type === 'draw_cancelled') {
      await publishEventBroadcast(eventId, 'draw_cancelled', {
        event_id: eventId,
        cancelled_at: new Date().toISOString(),
      });

      return NextResponse.json({ message: 'draw_cancelled broadcast sent' });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "draw_started", "draw_winner", or "draw_cancelled"', code: 'INVALID_TYPE' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Lucky draw reveal broadcast error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid or expired access token')) {
      return NextResponse.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
    if (errorMessage.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json(
      { error: errorMessage || 'Failed to broadcast', code: 'BROADCAST_ERROR' },
      { status: 500 }
    );
  }
}
