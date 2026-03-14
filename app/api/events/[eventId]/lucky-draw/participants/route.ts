// ============================================
// Galeria - Lucky Draw Participants API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { getActiveConfig, getEventEntries } from '@/lib/lucky-draw';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
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

const isRecoverableReadError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  ['42P01', '42703'].includes((error as { code?: string }).code || '');

// ============================================
// GET /api/events/:eventId/lucky-draw/participants - List participants
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

    await requireEventModeratorAccess(request.headers, eventId);

    // Get active config
    const config = await getActiveConfig(tenantId, eventId);

    if (!config) {
      return NextResponse.json({
        data: [],
        message: 'No active draw configuration',
      });
    }

    // Get all entries for this draw
    const entries = await getEventEntries(tenantId, config.id);

    // Group by user fingerprint to count entries per user
    const userEntryMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      const existing = userEntryMap.get(entry.userFingerprint) || [];
      existing.push(entry);
      userEntryMap.set(entry.userFingerprint, existing);
    }

    // Format participants list
    const participants = Array.from(userEntryMap.entries()).map(([fingerprint, entries]) => {
      const winnerEntry = entries.find(e => e.isWinner);
      const participantName = entries.find(e => e.participantName)?.participantName || null;
      const timestamps = entries.map(entry => new Date(entry.createdAt).getTime());
      const firstEntryAt = timestamps.length ? new Date(Math.min(...timestamps)) : null;
      const lastEntryAt = timestamps.length ? new Date(Math.max(...timestamps)) : null;
      return {
        userFingerprint: fingerprint,
        participantName,
        entryCount: entries.length,
        isWinner: !!winnerEntry,
        prizeTier: winnerEntry?.prizeTier || null,
        firstEntryAt,
        lastEntryAt,
      };
    });

    // Sort by entry count (descending), then by first entry date
    participants.sort((a, b) => {
      if (b.entryCount !== a.entryCount) {
        return b.entryCount - a.entryCount;
      }
      // Handle null dates
      if (!a.firstEntryAt && !b.firstEntryAt) return 0;
      if (!a.firstEntryAt) return 1;
      if (!b.firstEntryAt) return -1;
      return new Date(a.firstEntryAt).getTime() - new Date(b.firstEntryAt).getTime();
    });

    return NextResponse.json({
      data: participants,
      pagination: {
        total: participants.length,
        uniqueParticipants: participants.length,
        totalEntries: entries.length,
      },
    });
  } catch (error) {
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

    if (isRecoverableReadError(error)) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          uniqueParticipants: 0,
          totalEntries: 0,
        },
        message: 'Lucky draw tables not initialized',
      });
    }
    console.error('[API] Participants fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
