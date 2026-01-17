// ============================================
// MOMENTIQUE - Lucky Draw Entries API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { createManualEntries, getActiveConfig, getEventEntries } from '@/lib/lucky-draw';

// ============================================
// GET /api/events/:eventId/lucky-draw/entries - List entries
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const db = getTenantDb(tenantId);

    // Verify event exists
    const event = await db.findOne('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get active config
    const config = await getActiveConfig(tenantId, eventId);
    if (!config) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
        },
        message: 'No active draw configuration',
      });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit'));
    const offsetParam = Number(searchParams.get('offset'));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
    const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;

    const entries = await getEventEntries(tenantId, config.id, {
      limit,
      offset,
    });

    const countResult = await db.query<{ count: bigint }>(
      `SELECT COUNT(*) as count FROM lucky_draw_entries WHERE config_id = $1`,
      [config.id]
    );
    const total = Number(countResult.rows[0]?.count || 0);

    return NextResponse.json({
      data: entries,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[API] Entries fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events/:eventId/lucky-draw/entries - Manual entry
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const authHeader = headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const isAdmin = payload.role === 'admin' || payload.role === 'super_admin' || payload.role === 'organizer';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const db = getTenantDb(tenantId);

    const event = await db.findOne('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const participantName = typeof body.participantName === 'string' ? body.participantName.trim() : '';
    const participantFingerprint = typeof body.participantFingerprint === 'string'
      ? body.participantFingerprint.trim()
      : undefined;
    const photoId = typeof body.photoId === 'string' ? body.photoId.trim() : undefined;
    const entryCountRaw = Number(body.entryCount);
    const entryCount = Number.isFinite(entryCountRaw) && entryCountRaw > 0 ? Math.floor(entryCountRaw) : 1;

    if (!participantName) {
      return NextResponse.json(
        { error: 'Participant name is required', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (participantName.length > 120) {
      return NextResponse.json(
        { error: 'Participant name is too long', code: 'NAME_TOO_LONG' },
        { status: 400 }
      );
    }

    const config = await getActiveConfig(tenantId, eventId);
    if (!config) {
      return NextResponse.json(
        { error: 'No active draw configuration found', code: 'NO_CONFIG' },
        { status: 400 }
      );
    }

    if (config.requirePhotoUpload && !photoId) {
      return NextResponse.json(
        { error: 'Photo is required for manual entries', code: 'PHOTO_REQUIRED' },
        { status: 400 }
      );
    }

    if (photoId) {
      const photo = await db.findOne('photos', { id: photoId, event_id: eventId });
      if (!photo) {
        return NextResponse.json(
          { error: 'Photo not found for this event', code: 'PHOTO_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    const result = await createManualEntries(tenantId, eventId, {
      participantName,
      userFingerprint: participantFingerprint,
      photoId: photoId || null,
      entryCount,
    });

    return NextResponse.json({
      data: {
        entries: result.entries,
        userFingerprint: result.userFingerprint,
      },
      message: 'Manual entries created successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create manual entries';
    const status = message.includes('Maximum entries per user') || message.includes('No active draw configuration')
      ? 400
      : 500;
    return NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status }
    );
  }
}
