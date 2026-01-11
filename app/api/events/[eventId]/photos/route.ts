// ============================================
// MOMENTIQUE - Photo Upload API Routes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { generatePhotoId } from '@/lib/utils';
import { validateImageFile, uploadImageToStorage } from '@/lib/images';
import type { IPhoto, IPhotoImage } from '@/lib/types';
import crypto from 'crypto';

// ============================================
// POST /api/events/:eventId/photos - Upload photos
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get tenant from headers
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get database connection
    const db = getTenantDb(tenantId);

    // Verify event exists and belongs to tenant
    const event = await db.findOne<{ id: string; settings: { limits: { max_photos_per_user: number } } }>(
      'events',
      { id: eventId }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const contributorName = formData.get('contributor_name') as string || undefined;
    const caption = formData.get('caption') as string || undefined;
    const isAnonymous = formData.get('is_anonymous') === 'true';

    // Validate files
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided', code: 'NO_FILES' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos per upload', code: 'TOO_MANY_FILES' },
        { status: 400 }
      );
    }

    // Get user fingerprint (from custom header)
    const fingerprint = headers.get('x-fingerprint') ||
                         generateFingerprint();

    // Check rate limit
    const uploadCount = await db.count('photos', {
      event_id: eventId,
      user_fingerprint: fingerprint,
    });

    const maxPhotos = event.settings?.limits?.max_photos_per_user || 5;

    if (uploadCount >= maxPhotos) {
      return NextResponse.json(
        {
          error: `Upload limit reached (${maxPhotos} photos per user)`,
          code: 'UPLOAD_LIMIT_REACHED',
        },
        { status: 429 }
      );
    }

    // Process files
    const uploadedPhotos: IPhoto[] = [];

    for (const file of files) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, code: 'INVALID_FILE' },
          { status: 400 }
        );
      }

      // Compress and upload to storage (R2/S3)
      const photoId = generatePhotoId();
      let photoUrls: IPhotoImage;

      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2 with compression
        photoUrls = await uploadImageToStorage(eventId, photoId, buffer, file.name);
      } catch (storageError) {
        console.error('[Upload] Storage upload failed:', storageError);
        return NextResponse.json(
          { error: 'Failed to upload image to storage', code: 'STORAGE_ERROR' },
          { status: 500 }
        );
      }

      // Create photo record
      const photo = await db.insert<IPhoto>('photos', {
        id: photoId,
        event_id: eventId,
        user_fingerprint: fingerprint,
        images: photoUrls,
        caption: caption || undefined,
        contributor_name: isAnonymous ? undefined : contributorName,
        is_anonymous: isAnonymous,
        status: 'pending', // Requires moderation if enabled
        reactions: {
          heart: 0,
          clap: 0,
          laugh: 0,
          wow: 0,
        },
        metadata: {
          ip_address: hashString(request.headers.get('x-forwarded-for') || 'unknown'),
          user_agent: request.headers.get('user-agent') || 'unknown',
          upload_timestamp: new Date(),
          device_type: getDeviceType(request.headers.get('user-agent') || 'unknown'),
        },
        created_at: new Date(),
      });

      uploadedPhotos.push(photo);
    }

    return NextResponse.json({
      data: uploadedPhotos,
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Error uploading photos:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload photos',
        code: 'UPLOAD_FAILED',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
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

    // Get tenant from headers
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'

    // Get database connection
    const db = getTenantDb(tenantId);

    // Build conditions
    const conditions: Record<string, unknown> = { event_id: eventId };
    if (status && status !== 'all') {
      conditions.status = status;
    }

    // Fetch photos
    const photos = await db.findMany<IPhoto>('photos', conditions, {
      limit,
      offset: (page - 1) * limit,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    });

    // Get total count
    const total = await db.count('photos', conditions);

    return NextResponse.json({
      data: photos,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: (page - 1) * limit + limit < total,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching photos:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch photos',
        code: 'FETCH_FAILED',
      },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate browser fingerprint for rate limiting
 */
function generateFingerprint(): string {
  const components = [
    Date.now().toString(),
    Math.random().toString(36),
    crypto.randomBytes(16).toString('hex'),
  ];
  return crypto.createHash('sha256').update(components.join('|')).digest('hex').substring(0, 32);
}

/**
 * Hash string for privacy
 */
function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

/**
 * Get device type from user agent
 */
function getDeviceType(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop';

  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }

  if (/ipad|tablet|kindle|playbook|nexus 7/i.test(ua)) {
    return 'tablet';
  }

  return 'desktop';
}
