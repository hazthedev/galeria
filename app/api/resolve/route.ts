// ============================================
// MOMENTIQUE - Short Code Resolution API
// ============================================
// Resolve short codes to event IDs

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';

// ============================================
// GET /api/resolve?code=<short_code>
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing short code', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get tenant from headers (injected by middleware)
    const headers = request.headers;
    let tenantId = getTenantId(headers);

    // Fallback to default tenant for development
    if (!tenantId) {
      tenantId = '00000000-0000-0000-0000-000000000001';
    }

    // Get database connection
    const db = getTenantDb(tenantId);

    // Look up the event by short code, then fallback to slug
    let event = await db.findOne('events', { short_code: code });
    if (!event) {
      event = await db.findOne('events', { slug: code });
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: event.id,
        short_code: event.short_code,
        name: event.name,
        slug: event.slug,
      },
    });
  } catch (error) {
    console.error('[API] Error resolving short code:', error);
    return NextResponse.json(
      { error: 'Failed to resolve short code', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
