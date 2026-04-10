// ============================================
// Galeria - Organizer Bulk Photo Delete API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { requireAuthForApi } from '@/lib/domain/auth/auth';
import { deletePhotoManually } from '@/lib/moderation/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { userId, tenantId, payload } = await requireAuthForApi(request.headers, request.method);

    if (!['organizer', 'super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { photoIds, reason } = body || {};

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'No photo IDs provided', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const db = getTenantDb(tenantId);
    const eventResult = await db.query<{ id: string; organizer_id: string }>(
      'SELECT id, organizer_id FROM events WHERE id = $1',
      [eventId]
    );
    if (!eventResult.rows.length) {
      return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const event = eventResult.rows[0];
    if (payload.role === 'organizer' && event.organizer_id !== userId) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const allowedPhotosResult = await db.query<{ id: string }>(
      'SELECT id FROM photos WHERE event_id = $1 AND id = ANY($2)',
      [eventId, photoIds]
    );
    const allowedPhotoIds = new Set((allowedPhotosResult.rows || []).map((photo) => photo.id));

    const normalizedReason = typeof reason === 'string' ? reason.trim() : null;
    const deletedIds: string[] = [];
    const skippedIds: string[] = photoIds.filter((photoId: string) => !allowedPhotoIds.has(photoId));

    for (const photoId of allowedPhotoIds) {
      const result = await deletePhotoManually({
        tenantId,
        photoId,
        moderatorId: userId,
        reason: normalizedReason,
      });

      if (result.outcome === 'applied') {
        deletedIds.push(photoId);
      } else {
        skippedIds.push(photoId);
      }
    }

    return NextResponse.json({
      data: {
        deletedIds,
        skippedIds,
      },
      message: `Deleted ${deletedIds.length} photo${deletedIds.length === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('[PHOTO_BULK_DELETE] Error:', error);
    if (error instanceof Error && error.message.includes('READ_ONLY_IMPERSONATION')) {
      return NextResponse.json(
        { error: 'Support mode is read-only', code: 'READ_ONLY_IMPERSONATION' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete photos', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
