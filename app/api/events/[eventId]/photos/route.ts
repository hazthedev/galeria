// ============================================
// MOMENTIQUE - Photo Upload API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { uploadImageToStorage, validateImageFile } from '@/lib/images';
import { generatePhotoId } from '@/lib/utils';
import { createEntryFromPhoto } from '@/lib/lucky-draw';
import type { DeviceType } from '@/lib/types';
import { verifyAccessToken } from '@/lib/auth';

// ============================================
// POST /api/events/:eventId/photos - Upload photo
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

    const db = getTenantDb(tenantId);

    // Verify event exists and is active
    const event = await db.findOne<{
      id: string;
      status: string;
      settings: {
        features: {
          photo_upload_enabled: boolean;
          moderation_required: boolean;
          anonymous_allowed: boolean;
        };
        limits: {
          max_photos_per_user: number;
          max_total_photos: number;
        };
      };
    }>('events', { id: eventId });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if photo uploads are enabled
    if (!event.settings.features.photo_upload_enabled) {
      return NextResponse.json(
        { error: 'Photo uploads are disabled for this event', code: 'UPLOADS_DISABLED' },
        { status: 400 }
      );
    }

    // Check if event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event is not active', code: 'EVENT_NOT_ACTIVE' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files');
    const singleFile = formData.get('file');
    const caption = formData.get('caption') as string | null;
    const contributorName = formData.get('contributor_name') as string | null;
    const isAnonymous = formData.get('is_anonymous') === 'true';

    const uploadFiles: File[] = [];
    for (const file of files) {
      if (file instanceof File) {
        uploadFiles.push(file);
      }
    }
    if (uploadFiles.length === 0 && singleFile instanceof File) {
      uploadFiles.push(singleFile);
    }

    // Validate files
    if (uploadFiles.length === 0) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    for (const file of uploadFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, code: 'INVALID_FILE' },
          { status: 400 }
        );
      }
    }

    // Check if anonymous uploads are allowed
    if (isAnonymous && !event.settings.features.anonymous_allowed) {
      return NextResponse.json(
        { error: 'Anonymous uploads are not allowed for this event', code: 'ANONYMOUS_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    // Get user info (authenticated or guest)
    const authHeader = headers.get('authorization');
    let userId: string;
    let userRole: string = 'guest';

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        userRole = payload.role;
      } catch {
        // Invalid token - treat as guest
        userId = `guest_${headers.get('x-fingerprint') || 'anonymous'}`;
      }
    } else {
      // Guest user - use fingerprint
      userId = `guest_${headers.get('x-fingerprint') || 'anonymous'}`;
    }

    // Check photo limits (skip for admins)
    if (userRole !== 'admin') {
      const maxPerUser = event.settings.limits.max_photos_per_user || 100;
      const maxTotal = event.settings.limits.max_total_photos || 1000;

      // Check per-user limit
      const userPhotoCount = await db.count('photos', {
        event_id: eventId,
        user_fingerprint: userId,
      });

      if (userPhotoCount + uploadFiles.length > maxPerUser) {
        return NextResponse.json(
          { error: 'You have reached the maximum number of photos for this event', code: 'USER_LIMIT_REACHED' },
          { status: 400 }
        );
      }

      // Check total photos limit
      const totalPhotoCount = await db.count('photos', { event_id: eventId });
      if (totalPhotoCount + uploadFiles.length > maxTotal) {
        return NextResponse.json(
          { error: 'This event has reached the maximum number of photos', code: 'EVENT_LIMIT_REACHED' },
          { status: 400 }
        );
      }
    }

    const userAgent = headers.get('user-agent') || '';
    let deviceType: DeviceType = 'desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    const createdPhotos = [];

    for (const file of uploadFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const photoId = generatePhotoId();
      const images = await uploadImageToStorage(
        eventId,
        photoId,
        buffer,
        file.name
      );

      const photo = await db.insert('photos', {
        id: photoId,
        event_id: eventId,
        user_fingerprint: userId,
        images,
        caption: caption || undefined,
        contributor_name: contributorName || undefined,
        is_anonymous: isAnonymous || false,
        status: event.settings.features.moderation_required ? 'pending' : 'approved',
        metadata: {
          ip_address: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
          user_agent: userAgent,
          upload_timestamp: new Date(),
          device_type: deviceType,
        },
        created_at: new Date(),
        approved_at: event.settings.features.moderation_required ? undefined : new Date(),
      });

      if (event.settings.features.lucky_draw_enabled) {
        try {
          const entryName = isAnonymous ? undefined : contributorName || undefined;
          await createEntryFromPhoto(tenantId, eventId, photo.id, userId, entryName);
        } catch (entryError) {
          console.warn('[API] Lucky draw entry skipped:', entryError);
        }
      }

      createdPhotos.push({
        id: photo.id,
        event_id: photo.event_id,
        images: photo.images,
        caption: photo.caption,
        contributor_name: photo.contributor_name,
        is_anonymous: photo.is_anonymous,
        status: photo.status,
        created_at: photo.created_at,
      });
    }

    return NextResponse.json({
      data: createdPhotos,
      message: createdPhotos.length === 1 ? 'Photo uploaded successfully' : 'Photos uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', code: 'UPLOAD_ERROR', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/events/:eventId/photos - List photos
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Determine if requester can access non-approved content
    const authHeader = headers.get('authorization');
    let isModerator = false;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        isModerator = payload.role === 'admin' || payload.role === 'super_admin' || payload.role === 'organizer';
      } catch {
        isModerator = false;
      }
    }

    // Build query filter
    const filter: Record<string, unknown> = { event_id: eventId };
    if (isModerator) {
      if (status) {
        filter.status = status;
      }
    } else {
      filter.status = 'approved';
    }

    const total = await db.count('photos', filter);

    // Get photos
    const photos = await db.findMany('photos', filter, {
      limit,
      offset,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    });

    return NextResponse.json({
      data: photos,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('[API] Photo list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
