// ============================================
// MOMENTIQUE - Lucky Draw Entries API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { getActiveConfig, getEventEntries } from '@/lib/lucky-draw';

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
