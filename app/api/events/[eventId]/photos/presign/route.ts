// ============================================
// MOMENTIQUE - Photo Upload Presign API Route
// ============================================
// POST /api/events/:eventId/photos/presign

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId, getTenantContextFromHeaders } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { getPresignedUploadUrl } from '@/lib/images';
import { getSystemSettings } from '@/lib/system-settings';
import { generatePhotoId } from '@/lib/utils';
import { checkPhotoLimit } from '@/lib/limit-check';
import type { SubscriptionTier } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    let tenantId = getTenantId(headers);

    // Fallback to default tenant for development (Turbopack middleware issue)
    if (!tenantId) {
      tenantId = '00000000-0000-0000-0000-000000000001';
    }

    const body = await request.json();
    const {
      filename,
      contentType,
      fileSize,
    } = body || {};

    if (!filename || !contentType || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const systemSettings = await getSystemSettings();
    const allowedTypes = systemSettings.uploads.allowed_types || [];
    const maxSizeBytes = Math.max((systemSettings.uploads.max_file_mb || 10) * 1024 * 1024, 1);

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type', code: 'INVALID_FILE' },
        { status: 400 }
      );
    }

    if (fileSize > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit`, code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    const db = getTenantDb(tenantId);

    // Verify event exists and is active
    const event = await db.findOne<{
      id: string;
      status: string;
      settings: {
        features: {
          photo_upload_enabled: boolean;
        };
      };
    }>('events', { id: eventId });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!event.settings.features.photo_upload_enabled) {
      return NextResponse.json(
        { error: 'Photo uploads are disabled for this event', code: 'UPLOADS_DISABLED' },
        { status: 400 }
      );
    }

    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event is not active', code: 'EVENT_NOT_ACTIVE' },
        { status: 400 }
      );
    }

    // Tier limit check (best-effort guard before upload)
    const tenantContext = getTenantContextFromHeaders(headers);
    const subscriptionTier = (tenantContext?.tenant?.subscription_tier || 'free') as SubscriptionTier;
    const tierLimitResult = await checkPhotoLimit(eventId, tenantId, subscriptionTier);
    if (!tierLimitResult.allowed) {
      return NextResponse.json(
        {
          error: tierLimitResult.message || 'Photo limit reached',
          code: 'TIER_LIMIT_REACHED',
          upgradeRequired: true,
          currentCount: tierLimitResult.currentCount,
          limit: tierLimitResult.limit,
        },
        { status: 403 }
      );
    }

    const photoId = generatePhotoId();
    const ext = contentType === 'image/png'
      ? 'png'
      : contentType === 'image/webp'
        ? 'webp'
        : contentType === 'image/heic'
          ? 'heic'
          : 'jpg';

    const key = `${eventId}/${photoId}/original.${ext}`;
    const presigned = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      data: {
        photoId,
        key,
        uploadUrl: presigned.uploadUrl,
        publicUrl: presigned.publicUrl,
      },
    });
  } catch (error) {
    console.error('[PRESIGN] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create presigned URL', code: 'PRESIGN_ERROR' },
      { status: 500 }
    );
  }
}
