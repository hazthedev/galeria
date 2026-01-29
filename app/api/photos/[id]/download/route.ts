// ============================================
// Gatherly - Photo Download API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { requireAuthForApi } from '@/lib/auth';
import type { IEvent, IPhoto } from '@/lib/types';
import { buildPhotoFilename } from '@/lib/export/zip-generator';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const applyWatermark = async (buffer: Buffer | Uint8Array, label: string) => {
  const watermark = Buffer.from(
    `<svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      <text x="98%" y="70%" font-size="48" font-family="Arial, Helvetica, sans-serif"
        fill="rgba(255,255,255,0.75)" text-anchor="end">${label}</text>
    </svg>`
  );

  return sharp(buffer)
    .composite([{ input: watermark, gravity: 'southeast' }])
    .toBuffer();
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watermark = request.nextUrl.searchParams.get('watermark') === '1';

    let authUser: { userId: string; tenantId: string; role: string } | null = null;
    try {
      const auth = await requireAuthForApi(request.headers);
      authUser = { userId: auth.userId, tenantId: auth.tenantId, role: auth.payload.role };
    } catch {
      authUser = null;
    }

    const tenantId = authUser?.tenantId || request.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
    const db = getTenantDb(tenantId);

    const result = await db.query<IPhoto & { event_name: string; event_date: Date; organizer_id: string; settings: IEvent['settings'] }>(
      `SELECT p.*,
              e.name AS event_name,
              e.event_date AS event_date,
              e.organizer_id AS organizer_id,
              e.settings AS settings
       FROM photos p
       JOIN events e ON p.event_id = e.id
       WHERE p.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Photo not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const photo = result.rows[0];
    const eventSettings = photo.settings as IEvent['settings'];
    const guestDownloadEnabled = eventSettings?.features?.guest_download_enabled !== false;

    if (authUser) {
      if (authUser.role === 'organizer' && photo.organizer_id !== authUser.userId) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
      }
    } else {
      if (!guestDownloadEnabled || photo.status !== 'approved') {
        return NextResponse.json({ error: 'Download not allowed', code: 'FORBIDDEN' }, { status: 403 });
      }
    }

    const sourceUrl = photo.images?.original_url || photo.images?.full_url;
    if (!sourceUrl) {
      return NextResponse.json({ error: 'Image not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image', code: 'FETCH_FAILED' }, { status: 502 });
    }

    const arrayBuffer = await response.arrayBuffer();
    let buffer: Uint8Array = new Uint8Array(arrayBuffer);
    if (!authUser && watermark) {
      buffer = await applyWatermark(buffer, 'Gatherly');
    }

    const filename = buildPhotoFilename(photo.event_name || 'event', photo);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PHOTO_DOWNLOAD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download photo', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
