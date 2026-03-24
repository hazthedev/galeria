// ============================================
// Galeria - Lucky Draw API Routes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import {
  executeDraw,
  getActiveConfig,
  createLuckyDrawConfig,
} from '@/lib/lucky-draw';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';

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
// POST /api/events/:eventId/lucky-draw/draw - Execute draw
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

    const { db } = await requireEventModeratorAccess(headers, eventId);

    // Get active draw configuration
    const config = await getActiveConfig(tenantId, eventId);
    if (!config) {
      return NextResponse.json(
        { error: 'No active draw configuration found', code: 'NO_CONFIG' },
        { status: 400 }
      );
    }

    // Execute draw and broadcast draw_started so guests see "starting..."
    const result = await executeDraw(tenantId, config.id, 'admin');

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
    return NextResponse.json(
      { error: errorMessage || 'Failed to execute draw', code: 'DRAW_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events/:eventId/lucky-draw/config - Create/Update config
// ============================================

export async function PUT(
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

    const { db } = await requireEventModeratorAccess(headers, eventId);

    // Parse request body
    const body = await request.json();
    const {
      prizeTiers,
      maxEntriesPerUser,
      requirePhotoUpload,
      preventDuplicateWinners,
      ...settings
    } = body;

    // Validate prize tiers
    if (!prizeTiers || prizeTiers.length === 0) {
      return NextResponse.json(
        { error: 'At least one prize tier is required', code: 'INVALID_PRIZES' },
        { status: 400 }
      );
    }

    const validTiers = ['grand', 'first', 'second', 'third', 'consolation'];
    for (const tier of prizeTiers) {
      if (!validTiers.includes(tier.tier)) {
        return NextResponse.json(
          { error: `Invalid prize tier: ${tier.tier}`, code: 'INVALID_TIER' },
          { status: 400 }
        );
      }
      if (tier.count <= 0) {
        return NextResponse.json(
          { error: `Prize count must be positive for tier: ${tier.tier}`, code: 'INVALID_COUNT' },
          { status: 400 }
        );
      }
    }

    // Get existing config or create new one
    const existingConfig = await getActiveConfig(tenantId, eventId);

    if (existingConfig) {
      // Update existing config
      await db.update(
        'lucky_draw_configs',
        {
          prize_tiers: prizeTiers,
          max_entries_per_user: maxEntriesPerUser || 1,
          require_photo_upload: requirePhotoUpload !== false,
          prevent_duplicate_winners: preventDuplicateWinners !== false,
          animation_style: settings.animationStyle || 'spinning_wheel',
          animation_duration: settings.animationDuration || 8,
          show_selfie: settings.showSelfie !== false,
          show_full_name: settings.showFullName !== false,
          play_sound: settings.playSound !== false,
          confetti_animation: settings.confettiAnimation !== false,
          updated_at: new Date(),
        },
        { id: existingConfig.id }
      );

      const updatedConfig = await getActiveConfig(tenantId, eventId);

      return NextResponse.json({
        data: updatedConfig,
        message: 'Draw configuration updated successfully',
      });
    }

    // Create new config
    const newConfig = await createLuckyDrawConfig(tenantId, eventId, {
      eventId,
      prizeTiers,
      maxEntriesPerUser: maxEntriesPerUser || 1,
      requirePhotoUpload: requirePhotoUpload !== false,
      preventDuplicateWinners: preventDuplicateWinners !== false,
      animationStyle: settings.animationStyle || 'spinning_wheel',
      animationDuration: settings.animationDuration || 8,
      showSelfie: settings.showSelfie !== false,
      showFullName: settings.showFullName !== false,
      playSound: settings.playSound !== false,
      confettiAnimation: settings.confettiAnimation !== false,
      createdBy: 'admin',
    });

    return NextResponse.json({
      data: newConfig,
      message: 'Draw configuration created successfully',
    });
  } catch (error) {
    console.error('[API] Config error:', error);
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
      { error: 'Failed to save configuration', code: 'CONFIG_ERROR' },
      { status: 500 }
    );
  }
}
