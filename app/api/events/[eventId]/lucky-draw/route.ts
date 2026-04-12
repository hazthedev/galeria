// ============================================
// Galeria - Lucky Draw API Routes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { clearLuckyDrawConfigReadCache } from '@/lib/domain/events/lucky-draw-cache';
import {
  executeDraw,
  getActiveConfig,
} from '@/lib/lucky-draw';
import { PUT as UpsertLuckyDrawConfig } from '../lucky-draw-config/route';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';
import { withLock, LockConflictError } from '@/lib/infrastructure/lock/mutex';

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
// POST /api/events/:eventId/lucky-draw - Execute draw
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

    await requireEventModeratorAccess(headers, eventId);

    // Get active draw configuration
    const config = await getActiveConfig(tenantId, eventId);
    if (!config) {
      return NextResponse.json(
        { error: 'No active draw configuration found', code: 'NO_CONFIG' },
        { status: 400 }
      );
    }

    // Wrap the draw execution in a per-event distributed lock.
    // This prevents duplicate draws from concurrent requests (e.g. double-click on slow connection).
    // TTL of 30s: if the handler crashes, the lock auto-expires so the event is not permanently blocked.
    const lockKey = `lucky-draw:lock:${eventId}`;
    let result;
    try {
      result = await withLock(lockKey, async () => {
        const drawResult = await executeDraw(tenantId, config.id, 'admin');
        await clearLuckyDrawConfigReadCache(tenantId, eventId);
        return drawResult;
      }, 30);
    } catch (lockError) {
      if (lockError instanceof LockConflictError) {
        return NextResponse.json(
          {
            error: 'A draw is already in progress for this event. Please wait a moment and try again.',
            code: 'DRAW_IN_PROGRESS',
          },
          { status: 409 }
        );
      }
      throw lockError;
    }

    await publishEventBroadcast(eventId, 'draw_started', {
      event_id: eventId,
      config_id: config.id,
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({
      data: {
        winners: result.winners,
        statistics: result.statistics,
      },
      message: 'Draw executed successfully',
    });
  } catch (error) {
    console.error('[API] Draw execution error:', error);
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
    if (errorMessage.includes('Draw is not in scheduled status')) {
      return NextResponse.json(
        { error: 'This draw has already been processed or is no longer scheduled.', code: 'DRAW_NOT_SCHEDULED' },
        { status: 409 }
      );
    }
    if (
      errorMessage.includes('No eligible entries') ||
      errorMessage.includes('Draw configuration not found')
    ) {
      return NextResponse.json(
        { error: errorMessage, code: 'DRAW_INVALID' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage || 'Failed to execute draw', code: 'DRAW_ERROR' },
      { status: 500 }
    );
  }
}

// Legacy compatibility:
// keep PUT /api/events/:eventId/lucky-draw working, but route it through
// the canonical config mutation implementation.
export const PUT = UpsertLuckyDrawConfig;
