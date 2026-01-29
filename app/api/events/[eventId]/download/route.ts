// ============================================
// Gatherly - Guest Event Download API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import type { IEvent, IPhoto } from '@/lib/types';
import { createPhotoExportZip } from '@/lib/export/zip-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const watermark = request.nextUrl.searchParams.get('watermark') === '1';

    const tenantId = request.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
    const db = getTenantDb(tenantId);

    const eventResult = await db.query<IEvent>(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    if (!eventResult.rows.length) {
      return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const event = eventResult.rows[0];
    const guestDownloadEnabled = event.settings?.features?.guest_download_enabled !== false;
    if (!guestDownloadEnabled) {
      return NextResponse.json({ error: 'Download not allowed', code: 'FORBIDDEN' }, { status: 403 });
    }

    const photosResult = await db.query<IPhoto>(
      `SELECT * FROM photos WHERE event_id = $1 AND status = 'approved'`,
      [eventId]
    );

    const { stream, filename } = await createPhotoExportZip({
      event,
      photos: photosResult.rows || [],
      watermark,
      includeManifest: true,
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[EVENT_DOWNLOAD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download event photos', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
