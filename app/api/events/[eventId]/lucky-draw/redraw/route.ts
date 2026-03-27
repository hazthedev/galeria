// ============================================
// GALERIA - Lucky Draw Redraw API Route
// ============================================
// Endpoint to redraw a single prize tier when winner is unavailable

import { NextRequest, NextResponse } from 'next/server';
import { clearLuckyDrawConfigReadCache } from '@/lib/domain/events/lucky-draw-cache';
import { redrawPrizeTier } from '@/lib/lucky-draw';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';
import { mapWinnerToBroadcastPayload } from '@/lib/lucky-draw/broadcast-utils';

export const runtime = 'nodejs';

function createLuckyDrawFeatureUnavailableResponse() {
    return NextResponse.json(
        {
            error: 'Lucky Draw is not available on your current plan',
            code: 'FEATURE_NOT_AVAILABLE',
        },
        { status: 403 }
    );
}

// ============================================
// POST /api/events/:eventId/lucky-draw/redraw
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
            return createLuckyDrawFeatureUnavailableResponse();
        }

    // Parse request body
    const body = await request.json();
    const { prizeTier, previousWinnerId, configId, reason } = body;

        if (!prizeTier || !configId || !previousWinnerId) {
            return NextResponse.json(
                { error: 'prizeTier, configId, and previousWinnerId are required', code: 'MISSING_PARAMS' },
                { status: 400 }
            );
        }

    const { userId } = await requireEventModeratorAccess(headers, eventId);

        // Execute redraw
        const result = await redrawPrizeTier(tenantId, {
            eventId,
            configId,
            prizeTier,
            previousWinnerId,
            reason: reason || 'Winner unavailable',
            redrawBy: userId,
        });

        await clearLuckyDrawConfigReadCache(tenantId, eventId);

        await publishEventBroadcast(eventId, 'draw_winner', mapWinnerToBroadcastPayload(result.newWinner, eventId));

        return NextResponse.json({
            data: {
                newWinner: result.newWinner,
                previousWinner: result.previousWinner,
            },
            message: `Redraw successful. New winner: ${result.newWinner.participantName}`,
        });
  } catch (error) {
    console.error('[API] Redraw error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid or expired access token')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    if (errorMessage.includes('Event not found')) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    if (errorMessage.includes('Lucky Draw is not available on your current plan')) {
      return createLuckyDrawFeatureUnavailableResponse();
    }
    if (
      errorMessage.includes('required') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('does not belong') ||
      errorMessage.includes('only allowed') ||
      errorMessage.includes('No eligible entries')
    ) {
      return NextResponse.json(
        { error: errorMessage, code: 'REDRAW_INVALID' },
        { status: 400 }
      );
    }
        return NextResponse.json(
            { error: errorMessage || 'Failed to redraw', code: 'REDRAW_ERROR' },
            { status: 500 }
        );
    }
}
