// ============================================
// Galeria - Lucky Draw Config & Statistics API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { deleteKeys, getRawKey, setRawKey } from '@/lib/redis';
import { hasModeratorRole, requireAuthForApi } from '@/lib/domain/auth/auth';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';
import {
  createLuckyDrawConfig,
  getActiveConfig,
  getLatestConfig,
} from '@/lib/lucky-draw';
import type { LuckyDrawConfig } from '@/lib/types';

export const runtime = 'nodejs';

const readCacheHeaders = {
  'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
  Vary: 'Cookie, Authorization',
};

function createLuckyDrawFeatureUnavailableResponse() {
  return NextResponse.json(
    {
      error: 'Lucky Draw is not available on your current plan',
      code: 'FEATURE_NOT_AVAILABLE',
    },
    { status: 403 }
  );
}

const LUCKY_DRAW_CONFIG_CACHE_TTL_SECONDS = Math.max(
  5,
  parseInt(process.env.LUCKY_DRAW_CONFIG_CACHE_TTL_SECONDS || '30', 10)
);

const isRecoverableReadError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  ['42P01', '42703'].includes((error as { code?: string }).code || '');

const luckyDrawConfigSelectColumns = `
  id,
  event_id AS "eventId",
  prize_tiers AS "prizeTiers",
  max_entries_per_user AS "maxEntriesPerUser",
  require_photo_upload AS "requirePhotoUpload",
  prevent_duplicate_winners AS "preventDuplicateWinners",
  scheduled_at AS "scheduledAt",
  status,
  completed_at AS "completedAt",
  animation_style AS "animationStyle",
  animation_duration AS "animationDuration",
  show_selfie AS "showSelfie",
  show_full_name AS "showFullName",
  play_sound AS "playSound",
  confetti_animation AS "confettiAnimation",
  total_entries AS "totalEntries",
  created_by AS "createdBy",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

interface LuckyDrawConfigWithEntryCountRow extends LuckyDrawConfig {
  entryCount: string | number;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildConfigCacheKey(
  tenantId: string,
  eventId: string,
  activeOnly: boolean
): string {
  return `cache:lucky-draw:config:${tenantId}:${eventId}:${activeOnly ? 'active' : 'latest'}`;
}

async function clearConfigReadCache(
  tenantId: string,
  eventId: string
): Promise<void> {
  try {
    await deleteKeys([
      buildConfigCacheKey(tenantId, eventId, true),
      buildConfigCacheKey(tenantId, eventId, false),
    ]);
  } catch (error) {
    console.warn('[API] Failed to clear lucky draw config cache:', error);
  }
}

type EventAccessRecord = {
  id: string;
  organizer_id: string;
};

async function requireConfigWriteAccess(
  request: NextRequest,
  eventId: string
): Promise<{
  db: ReturnType<typeof getTenantDb>;
  tenantId: string;
  userId: string;
}> {
  const { userId, tenantId, payload } = await requireAuthForApi(request.headers);
  if (!hasModeratorRole(payload.role)) {
    throw new Error('Forbidden');
  }

  if (!(await isTenantFeatureEnabled(tenantId, 'lucky_draw'))) {
    throw new Error('Lucky Draw is not available on your current plan');
  }

  const db = getTenantDb(tenantId);
  const event = await db.findOne<EventAccessRecord>('events', { id: eventId });
  if (!event) {
    throw new Error('Event not found');
  }

  if (payload.role === 'organizer' && event.organizer_id !== userId) {
    throw new Error('Forbidden');
  }

  return { db, tenantId, userId };
}

function getConfigMutationError(error: unknown) {
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

    if (error.message.includes('Lucky Draw is not available on your current plan')) {
      return createLuckyDrawFeatureUnavailableResponse();
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

// ============================================
// GET /api/events/:eventId/lucky-draw/config - Get active config
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const auth = await resolveOptionalAuth(request.headers);
    const tenantId = resolveTenantId(request.headers, auth);

    if (!(await isTenantFeatureEnabled(tenantId, 'lucky_draw'))) {
      return createLuckyDrawFeatureUnavailableResponse();
    }

    const db = getTenantDb(tenantId);

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const cacheKey = buildConfigCacheKey(tenantId, eventId, activeOnly);

    try {
      const cachedRaw = await getRawKey(cacheKey);
      if (cachedRaw) {
        const cachedPayload = JSON.parse(cachedRaw) as {
          data: Record<string, unknown> | null;
          message?: string;
        };

        return NextResponse.json(cachedPayload, {
          headers: { ...readCacheHeaders, 'x-cache-status': 'HIT' },
        });
      }
    } catch (error) {
      console.warn('[API] Lucky draw config cache read failed:', error);
    }

    const orderBy = activeOnly
      ? 'created_at DESC'
      : `CASE WHEN status = 'scheduled' THEN 0 ELSE 1 END, created_at DESC`;
    const configQuery = `
      WITH selected_config AS (
        SELECT ${luckyDrawConfigSelectColumns}
        FROM lucky_draw_configs
        WHERE event_id = $1
        ${activeOnly ? `AND status = 'scheduled'` : ''}
        ORDER BY ${orderBy}
        LIMIT 1
      )
      SELECT
        sc.*,
        COALESCE(ec.entry_count, 0) AS "entryCount"
      FROM selected_config sc
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS entry_count
        FROM lucky_draw_entries
        WHERE config_id = sc.id
      ) ec ON true
    `;
    const configResult = await db.query<LuckyDrawConfigWithEntryCountRow>(configQuery, [eventId]);
    const config = configResult.rows[0];

    if (!config) {
      // Preserve existing 404 behavior while avoiding an extra query for hot-path reads.
      const event = await db.findOne('events', { id: eventId });
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const payload = {
        data: null,
        message: 'No draw configuration found',
      };
      try {
        await setRawKey(
          cacheKey,
          JSON.stringify(payload),
          LUCKY_DRAW_CONFIG_CACHE_TTL_SECONDS
        );
      } catch (error) {
        console.warn('[API] Lucky draw config cache write failed:', error);
      }

      return NextResponse.json(
        payload,
        { headers: { ...readCacheHeaders, 'x-cache-status': 'MISS' } }
      );
    }

    const { entryCount: entryCountRaw, ...configData } = config;
    const entryCount = toNumber(entryCountRaw);
    const payload = {
      data: {
        ...configData,
        entryCount,
      },
    };

    try {
      await setRawKey(
        cacheKey,
        JSON.stringify(payload),
        LUCKY_DRAW_CONFIG_CACHE_TTL_SECONDS
      );
    } catch (error) {
      console.warn('[API] Lucky draw config cache write failed:', error);
    }

    return NextResponse.json(
      payload,
      { headers: { ...readCacheHeaders, 'x-cache-status': 'MISS' } }
    );
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return NextResponse.json(
        {
          data: null,
          message: 'Lucky draw configuration unavailable right now.',
        },
        { headers: readCacheHeaders }
      );
    }
    console.error('[API] Config fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events/:eventId/lucky-draw/config - Create/Update config
// ============================================

async function upsertConfig(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { db, tenantId, userId } = await requireConfigWriteAccess(request, eventId);

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
      await db.update(
        'lucky_draw_configs',
        {
          prize_tiers: JSON.stringify(prizeTiers),
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

      await clearConfigReadCache(tenantId, eventId);

      const updatedConfig = await getLatestConfig(tenantId, eventId);
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
      createdBy: userId,
    });

    await clearConfigReadCache(tenantId, eventId);

    return NextResponse.json({
      data: newConfig,
      message: 'Draw configuration created successfully',
    });
  } catch (error) {
    console.error('[API] Config error:', error);
    return getConfigMutationError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  return upsertConfig(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  return upsertConfig(request, { params });
}
