// ============================================
// MOMENTIQUE - Photo Processing API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { requireAuthForApi } from '@/lib/auth';
import { downloadObjectToBuffer, uploadImageVariantsFromBuffer } from '@/lib/images';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;
    const headers = request.headers;
    const secret = process.env.PHOTO_PROCESS_SECRET;
    const provided = headers.get('x-photo-process-secret');

    if (secret) {
      if (provided !== secret) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    } else {
      await requireAuthForApi(headers);
    }

    let tenantId = getTenantId(headers);
    if (!tenantId && process.env.NODE_ENV !== 'production') {
      tenantId = '00000000-0000-0000-0000-000000000001';
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const db = getTenantDb(tenantId);
    const photo = await db.findOne<{
      id: string;
      event_id: string;
      images: {
        original_url: string;
        original_key?: string;
        thumbnail_url?: string;
        medium_url?: string;
        full_url?: string;
        width?: number;
        height?: number;
        file_size?: number;
        format?: string;
      };
    }>('photos', { id: photoId });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    const publicBase = process.env.R2_PUBLIC_URL || 'https://pub-xxxxxxxxx.r2.dev';
    const originalKey = photo.images?.original_key
      || (photo.images?.original_url?.startsWith(publicBase)
        ? photo.images.original_url.replace(`${publicBase}/`, '')
        : null);

    if (!originalKey) {
      return NextResponse.json(
        { error: 'Original key not found', code: 'MISSING_ORIGINAL_KEY' },
        { status: 400 }
      );
    }

    const buffer = await downloadObjectToBuffer(originalKey);
    const variants = await uploadImageVariantsFromBuffer(photo.event_id, photo.id, buffer);

    await db.update(
      'photos',
      {
        images: {
          ...photo.images,
          thumbnail_url: variants.thumbnail_url,
          medium_url: variants.medium_url,
          full_url: variants.full_url,
          width: variants.width,
          height: variants.height,
          file_size: variants.file_size,
          format: variants.format,
        },
      },
      { id: photo.id }
    );

    return NextResponse.json({
      data: { id: photo.id, processed: true },
    });
  } catch (error) {
    console.error('[PHOTO_PROCESS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process photo', code: 'PROCESS_ERROR' },
      { status: 500 }
    );
  }
}
