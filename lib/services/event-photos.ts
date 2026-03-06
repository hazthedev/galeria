// ============================================
// Galeria - Event Photo Service
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { deleteKeys } from '@/lib/redis';
import { deletePhotoAssets, uploadImageToStorage, validateUploadedImage, getTierValidationOptions } from '@/lib/images';
import { generatePhotoId } from '@/lib/utils';
import { createEntryFromPhoto } from '@/lib/lucky-draw';
import { updateGuestProgress } from '@/lib/lucky-draw';
import { verifyAccessToken } from '@/lib/domain/auth/auth';
import { extractSessionId, validateSession } from '@/lib/domain/auth/session';
import { checkUploadRateLimit } from '@/lib/api/middleware/rate-limit';
import { validateRecaptchaForUpload, isRecaptchaRequiredForUploads } from '@/lib/api/middleware/recaptcha';
import { isModerationEnabled } from '@/lib/moderation/auto-moderate';
import { queuePhotoScan } from '@/jobs/scan-content';
import type { DeviceType, IPhoto, SubscriptionTier } from '@/lib/types';
import { getTierConfig, resolveUserTier } from '@/lib/tenant';
import { applyCacheHeaders, CACHE_PROFILES } from '@/lib/cache/strategy';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveRequiredTenantId, resolveTenantId } from '@/lib/api-request-context';

function isDbSessionPoolExhausted(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code || '') : '';
  const message = error instanceof Error ? error.message : String(error || '');

  return code === 'XX000' && message.includes('MaxClientsInSessionMode');
}

function buildLuckyDrawConfigCacheKey(
  tenantId: string,
  eventId: string,
  activeOnly: boolean
): string {
  return `cache:lucky-draw:config:${tenantId}:${eventId}:${activeOnly ? 'active' : 'latest'}`;
}

async function clearLuckyDrawConfigCache(tenantId: string, eventId: string): Promise<void> {
  try {
    await deleteKeys([
      buildLuckyDrawConfigCacheKey(tenantId, eventId, true),
      buildLuckyDrawConfigCacheKey(tenantId, eventId, false),
    ]);
  } catch (error) {
    console.warn('[API] Failed to clear lucky draw config cache after photo upload:', error);
  }
}

interface PhotoInsertPayload {
  id: string;
  eventId: string;
  userId: string;
  images: IPhoto['images'];
  caption?: string;
  contributorName?: string;
  isAnonymous: boolean;
  moderationRequired: boolean;
  metadata: IPhoto['metadata'];
}

interface PhotoLimitContext {
  tenantId: string;
  eventId: string;
  userId: string;
  enforceLimits: boolean;
  tierPhotoLimit: number;
  eventTotalPhotoLimit: number;
  userPhotoLimit: number;
}

interface BlockedPhotoInsert {
  allowed: false;
  code: 'TIER_LIMIT_REACHED' | 'EVENT_LIMIT_REACHED' | 'USER_LIMIT_REACHED';
  message: string;
  currentCount: number;
  limit: number;
  upgradeRequired: boolean;
}

interface AllowedPhotoInsert {
  allowed: true;
  photo: IPhoto;
}

type PhotoInsertResult = AllowedPhotoInsert | BlockedPhotoInsert;

interface UploadUsageSnapshot {
  user: {
    used: number;
    limit: number;
    remaining: number;
  };
  event: {
    used: number;
    limit: number;
    remaining: number;
    tier_limit: number;
    configured_limit: number;
  };
}

function normalizePerUserPhotoLimit(limit: unknown): number {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 100;
  }
  if (parsed === -1) {
    return -1;
  }
  if (parsed <= 0) {
    return 100;
  }
  return parsed;
}

function normalizeEventTotalPhotoLimit(limit: unknown): number {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  if (parsed === -1) {
    return -1;
  }
  if (parsed <= 0) {
    return 50;
  }
  return parsed;
}

function calculateRemaining(limit: number, used: number): number {
  if (limit === -1) {
    return -1;
  }
  return Math.max(0, limit - used);
}

function getEffectiveEventLimit(tierLimit: number, configuredLimit: number): number {
  if (tierLimit === -1) {
    return configuredLimit;
  }
  if (configuredLimit === -1) {
    return tierLimit;
  }
  return Math.min(tierLimit, configuredLimit);
}

async function getUploadUsageSnapshot(
  db: ReturnType<typeof getTenantDb>,
  eventId: string,
  userId: string,
  tierLimit: number,
  configuredEventLimit: number,
  userLimit: number
): Promise<UploadUsageSnapshot> {
  const countResult = await db.query<{
    event_count: string;
    user_count: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS event_count,
        COUNT(*) FILTER (WHERE user_fingerprint = $2)::text AS user_count
      FROM photos
      WHERE event_id = $1
    `,
    [eventId, userId]
  );

  const eventUsed = Number(countResult.rows[0]?.event_count || '0');
  const userUsed = Number(countResult.rows[0]?.user_count || '0');
  const effectiveEventLimit = getEffectiveEventLimit(tierLimit, configuredEventLimit);

  return {
    user: {
      used: userUsed,
      limit: userLimit,
      remaining: calculateRemaining(userLimit, userUsed),
    },
    event: {
      used: eventUsed,
      limit: effectiveEventLimit,
      remaining: calculateRemaining(effectiveEventLimit, eventUsed),
      tier_limit: tierLimit,
      configured_limit: configuredEventLimit,
    },
  };
}

function buildPhotoLimitResponse(
  result: BlockedPhotoInsert,
  usage?: UploadUsageSnapshot
): NextResponse {
  return NextResponse.json({
    error: result.message,
    code: result.code,
    upgradeRequired: result.upgradeRequired,
    currentCount: result.currentCount,
    limit: result.limit,
    usage,
  }, { status: 403 });
}

async function insertPhotoWithAtomicLimits(
  db: ReturnType<typeof getTenantDb>,
  payload: PhotoInsertPayload,
  limitContext: PhotoLimitContext
): Promise<PhotoInsertResult> {
  if (!limitContext.enforceLimits) {
    const photo = await db.insert<IPhoto>('photos', {
      id: payload.id,
      event_id: payload.eventId,
      user_fingerprint: payload.userId,
      images: payload.images,
      caption: payload.caption || undefined,
      contributor_name: payload.contributorName || undefined,
      is_anonymous: payload.isAnonymous,
      status: payload.moderationRequired ? 'pending' : 'approved',
      metadata: payload.metadata,
      created_at: new Date(),
      approved_at: payload.moderationRequired ? undefined : new Date(),
    });

    return { allowed: true, photo };
  }

  return db.transact<PhotoInsertResult>(async (client) => {
    // Serialize limit checks per tenant+event to avoid race conditions across concurrent uploads.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
      limitContext.tenantId,
      limitContext.eventId,
    ]);

    if (limitContext.tierPhotoLimit !== -1 || limitContext.eventTotalPhotoLimit !== -1) {
      const tierCountResult = await client.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM photos WHERE event_id = $1',
        [limitContext.eventId]
      );
      const currentCount = Number(tierCountResult.rows[0]?.count || '0');
      if (limitContext.tierPhotoLimit !== -1 && currentCount >= limitContext.tierPhotoLimit) {
        return {
          allowed: false,
          code: 'TIER_LIMIT_REACHED',
          message: `This event has reached its photo limit (${limitContext.tierPhotoLimit}). Upgrade to allow more photos.`,
          currentCount,
          limit: limitContext.tierPhotoLimit,
          upgradeRequired: true,
        };
      }

      if (limitContext.eventTotalPhotoLimit !== -1 && currentCount >= limitContext.eventTotalPhotoLimit) {
        return {
          allowed: false,
          code: 'EVENT_LIMIT_REACHED',
          message: `This event has reached its configured photo limit (${limitContext.eventTotalPhotoLimit}).`,
          currentCount,
          limit: limitContext.eventTotalPhotoLimit,
          upgradeRequired: false,
        };
      }
    }

    if (limitContext.userPhotoLimit !== -1) {
      const userCountResult = await client.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM photos WHERE event_id = $1 AND user_fingerprint = $2',
        [limitContext.eventId, limitContext.userId]
      );
      const currentUserCount = Number(userCountResult.rows[0]?.count || '0');
      if (currentUserCount >= limitContext.userPhotoLimit) {
        return {
          allowed: false,
          code: 'USER_LIMIT_REACHED',
          message: `You have reached your photo upload limit (${limitContext.userPhotoLimit}) for this event.`,
          currentCount: currentUserCount,
          limit: limitContext.userPhotoLimit,
          upgradeRequired: false,
        };
      }
    }

    const insertResult = await client.query<IPhoto>(
      `
        INSERT INTO photos (
          id,
          event_id,
          user_fingerprint,
          images,
          caption,
          contributor_name,
          is_anonymous,
          status,
          metadata,
          created_at,
          approved_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *
      `,
      [
        payload.id,
        payload.eventId,
        payload.userId,
        payload.images,
        payload.caption || null,
        payload.contributorName || null,
        payload.isAnonymous,
        payload.moderationRequired ? 'pending' : 'approved',
        payload.metadata,
        new Date(),
        payload.moderationRequired ? null : new Date(),
      ]
    );

    return {
      allowed: true,
      photo: insertResult.rows[0],
    };
  });
}

// ============================================
// POST /api/events/:eventId/photos - Upload photo (service)
// ============================================

export async function handleEventPhotoUpload(request: NextRequest, eventId: string) {
  try {
    const headers = request.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, auth);

    const db = getTenantDb(tenantId);
    const subscriptionTier = await resolveUserTier(headers, tenantId, 'free');
    const tenantTierHeader = headers.get('x-tenant-tier');
    const allowedTiers = new Set(['free', 'pro', 'premium', 'enterprise', 'tester']);
    const effectiveTenantTier = tenantTierHeader && allowedTiers.has(tenantTierHeader)
      ? (tenantTierHeader as SubscriptionTier)
      : null;
    let effectiveTenantTierFallback: SubscriptionTier | null = null;
    if (!effectiveTenantTier) {
      const tenant = await db.findOne<{ subscription_tier: SubscriptionTier }>('tenants', { id: tenantId });
      effectiveTenantTierFallback = tenant?.subscription_tier || null;
    }

    // Verify event exists and is active
    const event = await db.findOne<{
      id: string;
      status: string;
      settings: {
        features: {
          photo_upload_enabled: boolean;
          lucky_draw_enabled: boolean;
          moderation_required: boolean;
          anonymous_allowed: boolean;
          reactions_enabled: boolean;
          guest_download_enabled: boolean;
          photo_challenge_enabled: boolean;
          attendance_enabled: boolean;
        };
        limits: {
          max_photos_per_user: number;
          max_total_photos: number;
        };
        security?: {
          upload_rate_limits?: {
            per_ip_hourly?: number;
            per_fingerprint_hourly?: number;
            burst_per_ip_minute?: number;
            per_event_daily?: number;
          };
        };
      };
    }>('events', { id: eventId });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Ensure settings exists (for backwards compatibility with old events)
    if (!event.settings) {
      event.settings = {
        features: {
          photo_upload_enabled: true,
          lucky_draw_enabled: false,
          moderation_required: false,
          anonymous_allowed: true,
          reactions_enabled: true,
          guest_download_enabled: true,
          photo_challenge_enabled: false,
          attendance_enabled: false,
        },
        limits: {
          max_photos_per_user: 100,
          max_total_photos: 1000,
        },
      };
    }
    if (!event.settings.features) {
      event.settings.features = {
        photo_upload_enabled: true,
        lucky_draw_enabled: false,
        moderation_required: false,
        anonymous_allowed: true,
        reactions_enabled: true,
        guest_download_enabled: true,
        photo_challenge_enabled: false,
        attendance_enabled: false,
      };
    }
    if (!event.settings.limits) {
      event.settings.limits = {
        max_photos_per_user: 100,
        max_total_photos: 1000,
      };
    }

    // Ensure individual feature properties have defaults (for partial feature objects)
    event.settings.features.photo_upload_enabled ??= true;
    event.settings.features.lucky_draw_enabled ??= false;
    event.settings.features.moderation_required ??= false;
    event.settings.features.anonymous_allowed ??= true;

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

    // ============================================
    // RATE LIMITING CHECK
    // ============================================
    // Get identifiers for rate limiting (will be reused below for auth)
    const uploadIpAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const uploadFingerprint = headers.get('x-fingerprint');

    // Determine user ID for rate limiting
    const uploadUserId = auth?.userId;
    const uploadUserRole = auth?.role || 'guest';

    const isAdminUploadHeader = headers.get('x-admin-upload') === 'true';
    let tenantTierFromDb: SubscriptionTier | null = null;
    if (!uploadUserId) {
      const tenant = await db.findOne<{ subscription_tier: SubscriptionTier }>('tenants', { id: tenantId });
      tenantTierFromDb = tenant?.subscription_tier || null;
    }

    const effectiveSubscriptionTier: SubscriptionTier = uploadUserId
      ? subscriptionTier
      : (tenantTierFromDb || effectiveTenantTier || effectiveTenantTierFallback || subscriptionTier);
    if (isAdminUploadHeader) {
      console.log('[RATE_LIMIT] Skipping for admin upload');
    } else {

    // Check rate limits (IP, fingerprint, event, burst protection)
    const uploadRateLimitOverrides = event.settings?.security?.upload_rate_limits;
    const rateLimitResult = await checkUploadRateLimit(
      uploadIpAddress,
      uploadFingerprint || null,
      eventId,
      uploadUserId,
      uploadRateLimitOverrides
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: rateLimitResult.reason || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
          limitType: rateLimitResult.limitType,
        },
        { status: 429 }
      );

      // Add rate limit headers
      if (rateLimitResult.resetAt) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter || 60));
        response.headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString());
      }

      return response;
    }
    }

    // ============================================
    // RECAPTCHA VERIFICATION (Anonymous Uploads)
    // ============================================
    // Check if user is authenticated
    const isAuthenticated = !!uploadUserId;
    const requiresRecaptcha = isRecaptchaRequiredForUploads(undefined, isAuthenticated);
    const contentType = headers.get('content-type') || '';

    let jsonBody: Record<string, unknown> | null = null;
    let formData: FormData | null = null;

    // Parse body once (request body can only be consumed once)
    if (contentType.includes('application/json')) {
      jsonBody = (await request.json()) as Record<string, unknown>;
    } else {
      try {
        formData = await request.formData();
      } catch (parseError) {
        console.error('[PHOTO_UPLOAD] Failed to parse FormData:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse form data', code: 'PARSE_ERROR', details: parseError instanceof Error ? parseError.message : 'Unknown' },
          { status: 400 }
        );
      }
    }

    if (!isAuthenticated && requiresRecaptcha) {
      const isAdminUpload = headers.get('x-admin-upload') === 'true';
      const contributorName =
        getStringValue(jsonBody?.['contributor_name']) ??
        getStringValue(jsonBody?.['contributorName']) ??
        getStringValue(formData?.get('contributor_name')) ??
        getStringValue(formData?.get('contributorName'));
      const isAnonymousRaw =
        jsonBody?.['is_anonymous'] ??
        jsonBody?.['isAnonymous'] ??
        formData?.get('is_anonymous') ??
        formData?.get('isAnonymous');
      const isAnonymous =
        isAnonymousRaw === true || isAnonymousRaw === 'true';
      const hasName =
        typeof contributorName === 'string' && contributorName.trim().length > 0;
      const isNamedGuest = !isAnonymous && hasName;

      if (isAdminUpload) {
        console.log('[RECAPTCHA] Skipping for admin upload');
      } else if (isNamedGuest) {
        console.log('[RECAPTCHA] Skipping for named guest upload');
      } else {
      // Check for reCAPTCHA token in request body
      let recaptchaToken: string | undefined;

      // Extract token from either JSON or form data
      if (jsonBody) {
        recaptchaToken = getStringValue(jsonBody?.['recaptchaToken']);
      } else if (formData) {
        recaptchaToken = formData.get('recaptchaToken') as string | undefined;
      }

      if (!recaptchaToken) {
        return NextResponse.json(
          {
            error: 'CAPTCHA token is required for anonymous uploads',
            code: 'MISSING_CAPTCHA',
            requiresCaptcha: true,
          },
          { status: 400 }
        );
      }

      // Verify the token
      const recaptchaResult = await validateRecaptchaForUpload(recaptchaToken);

      if (!recaptchaResult.valid) {
        return NextResponse.json(
          {
            error: recaptchaResult.error || 'CAPTCHA verification failed',
            code: recaptchaResult.code || 'CAPTCHA_FAILED',
            score: recaptchaResult.score,
          },
          { status: 400 }
        );
      }

      // Log the score for monitoring
      console.log('[RECAPTCHA] Anonymous upload verification:', {
        score: recaptchaResult.score,
        eventId,
        ip: uploadIpAddress,
        fingerprint: uploadFingerprint,
      });
      }
    }

    const tierPhotoLimit = getTierConfig(effectiveSubscriptionTier).limits.max_photos_per_event;
    const eventTotalPhotoLimit = normalizeEventTotalPhotoLimit(event.settings.limits.max_total_photos);
    const userPhotoLimit = normalizePerUserPhotoLimit(event.settings.limits.max_photos_per_user);

    // ============================================
    // DIRECT UPLOAD METADATA (JSON)
    // ============================================
    if (contentType.includes('application/json')) {
      const body = jsonBody || {};
      const photoId = getStringValue(body['photoId']);
      const key = getStringValue(body['key']);
      const width = getNumberValue(body['width']);
      const height = getNumberValue(body['height']);
      const fileSize = getNumberValue(body['fileSize']);
      const caption = getStringValue(body['caption']);
      const contributorName =
        getStringValue(body['contributorName']) ??
        getStringValue(body['contributor_name']);
      const isAnonymous =
        getBooleanValue(body['isAnonymous']) ??
        getBooleanValue(body['is_anonymous']) ??
        false;
      const joinLuckyDraw =
        getBooleanValue(body['joinLuckyDraw']) ??
        getBooleanValue(body['join_lucky_draw']) ??
        false;

      if (!photoId || !key || width === undefined || height === undefined || fileSize === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const expectedPrefix = `${eventId}/${photoId}/`;
      if (typeof key !== 'string' || !key.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: 'Invalid storage key', code: 'INVALID_KEY' },
          { status: 400 }
        );
      }

      // Get user info (authenticated or guest)
      const fingerprint = headers.get('x-fingerprint');
      const userId = uploadUserId || `guest_${fingerprint || 'anonymous'}`;
      const userRole = uploadUserRole;
      const enforceLimits = userRole !== 'super_admin' && !isAdminUploadHeader;

      // Check if anonymous uploads are allowed
      if (isAnonymous && !event.settings.features.anonymous_allowed) {
        return NextResponse.json(
          { error: 'Anonymous uploads are not allowed for this event', code: 'ANONYMOUS_NOT_ALLOWED' },
          { status: 400 }
        );
      }

      const publicBase = process.env.R2_PUBLIC_URL || 'https://pub-xxxxxxxxx.r2.dev';
      const publicUrl = `${publicBase}/${key}`;
      const ext = key.split('.').pop() || 'jpg';

      const userAgent = headers.get('user-agent') || '';
      let deviceType: DeviceType = 'desktop';
      if (/Mobile|Android|iPhone/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = 'tablet';
      }

      const insertResult = await insertPhotoWithAtomicLimits(
        db,
        {
          id: photoId,
          eventId,
          userId,
          images: {
            original_url: publicUrl,
            thumbnail_url: publicUrl,
            medium_url: publicUrl,
            full_url: publicUrl,
            width,
            height,
            file_size: fileSize,
            format: ext,
          },
          caption: caption || undefined,
          contributorName: contributorName || undefined,
          isAnonymous: isAnonymous || false,
          moderationRequired: event.settings.features.moderation_required,
          metadata: {
            ip_address: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
            user_agent: userAgent,
            upload_timestamp: new Date(),
            device_type: deviceType,
          },
        },
        {
          tenantId,
          eventId,
          userId,
          enforceLimits,
          tierPhotoLimit,
          eventTotalPhotoLimit,
          userPhotoLimit,
        }
      );

      if (!insertResult.allowed) {
        try {
          await deletePhotoAssets(eventId, photoId);
        } catch (cleanupError) {
          console.warn('[API] Failed to cleanup direct upload assets after limit check:', cleanupError);
        }
        const usage = await getUploadUsageSnapshot(
          db,
          eventId,
          userId,
          tierPhotoLimit,
          eventTotalPhotoLimit,
          userPhotoLimit
        );
        return buildPhotoLimitResponse(insertResult, usage);
      }

      const photo = insertResult.photo;
      let luckyDrawEntryId: string | null = null;
      if (event.settings.features.lucky_draw_enabled && joinLuckyDraw) {
        try {
          const entryName = isAnonymous ? undefined : contributorName || undefined;
          const entry = await createEntryFromPhoto(tenantId, eventId, photo.id, userId, entryName);
          luckyDrawEntryId = entry?.id || null;
          if (luckyDrawEntryId) {
            await clearLuckyDrawConfigCache(tenantId, eventId);
          }
        } catch (entryError) {
          console.warn('[API] Lucky draw entry skipped:', entryError);
        }
      }

      // ============================================
      // PHOTO CHALLENGE PROGRESS TRACKING
      // ============================================
      if (event.settings.features.photo_challenge_enabled && !isAnonymous && userId) {
        try {
          const { goalJustReached } = await updateGuestProgress(
            db,
            eventId,
            userId,
            !event.settings.features.moderation_required // Photo is approved if moderation is not required
          );
          console.log('[PHOTO_CHALLENGE] Progress updated:', userId, goalJustReached ? 'Goal reached!' : '');
        } catch (challengeError) {
          console.warn('[API] Photo challenge progress update skipped:', challengeError);
        }
      }

      // ============================================
      // AI CONTENT MODERATION
      // ============================================
      // Queue photo for AI scanning if moderation is enabled
      if (event.settings.features.moderation_required && await isModerationEnabled()) {
        try {
          await queuePhotoScan({
            photoId: photo.id,
            eventId: eventId,
            tenantId,
            imageUrl: photo.images.full_url,
            userId: userRole === 'guest' ? undefined : userId,
            priority: 'normal',
          });
          console.log('[MODERATION] Photo queued for AI scanning:', photo.id);
        } catch (scanError) {
          console.error('[MODERATION] Failed to queue photo for scanning:', scanError);
          // Don't fail the upload if scanning fails
        }
      }

      const createdPhoto = {
        id: photo.id,
        event_id: photo.event_id,
        images: photo.images,
        caption: photo.caption,
        contributor_name: photo.contributor_name,
        is_anonymous: photo.is_anonymous,
        status: photo.status,
        created_at: photo.created_at,
        lucky_draw_entry_id: luckyDrawEntryId,
      };

      await publishEventBroadcast(eventId, 'new_photo', createdPhoto);

      const usage = await getUploadUsageSnapshot(
        db,
        eventId,
        userId,
        tierPhotoLimit,
        eventTotalPhotoLimit,
        userPhotoLimit
      );

      return NextResponse.json({
        data: [createdPhoto],
        message: 'Photo uploaded successfully',
        usage,
      }, { status: 201 });
    }

    // Parse multipart form data (already parsed above)
    if (!formData) {
      return NextResponse.json(
        { error: 'Failed to parse form data', code: 'PARSE_ERROR' },
        { status: 400 }
      );
    }
    const files = formData.getAll('files');
    const singleFile = formData.get('file');
    const caption = formData.get('caption') as string | null;
    const contributorName = formData.get('contributor_name') as string | null;
    const isAnonymous = formData.get('is_anonymous') === 'true';
    const joinLuckyDraw = formData.get('join_lucky_draw') === 'true';

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
      // Get tier-based validation options
      const validationOptions = {
        ...getTierValidationOptions(effectiveSubscriptionTier),
        allowOversize: !uploadUserId,
      };

      // Use comprehensive validation with magic byte check
      const validation = await validateUploadedImage(file, validationOptions);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: validation.error,
            code: validation.code || 'INVALID_FILE',
            details: validation.metadata ? {
              allowedTypes: validationOptions.allowedMimeTypes,
              maxSizeMB: Math.round((validationOptions.maxSizeBytes || 0) / (1024 * 1024)),
              maxDimensions: `${validationOptions.maxWidth}x${validationOptions.maxHeight}`,
            } : undefined,
          },
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
    const fingerprint = headers.get('x-fingerprint');
    const userId = uploadUserId || `guest_${fingerprint || 'anonymous'}`;
    const userRole = uploadUserRole;
    const enforceLimits = userRole !== 'super_admin' && !isAdminUploadHeader;

    const userAgent = headers.get('user-agent') || '';
    let deviceType: DeviceType = 'desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    const createdPhotos = [];
    let limitReached: BlockedPhotoInsert | null = null;

    for (const file of uploadFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const photoId = generatePhotoId();

      // Get tier for processing options
      const images = await uploadImageToStorage(
        eventId,
        photoId,
        buffer,
        file.name,
        effectiveSubscriptionTier
      );

      let insertResult: PhotoInsertResult;
      try {
        insertResult = await insertPhotoWithAtomicLimits(
          db,
          {
            id: photoId,
            eventId,
            userId,
            images,
            caption: caption || undefined,
            contributorName: contributorName || undefined,
            isAnonymous: isAnonymous || false,
            moderationRequired: event.settings.features.moderation_required,
            metadata: {
              ip_address: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
              user_agent: userAgent,
              upload_timestamp: new Date(),
              device_type: deviceType,
            },
          },
          {
            tenantId,
            eventId,
            userId,
            enforceLimits,
            tierPhotoLimit,
            eventTotalPhotoLimit,
            userPhotoLimit,
          }
        );
      } catch (insertError) {
        try {
          await deletePhotoAssets(eventId, photoId);
        } catch (cleanupError) {
          console.warn('[API] Failed to cleanup uploaded assets after insert failure:', cleanupError);
        }
        throw insertError;
      }

      if (!insertResult.allowed) {
        try {
          await deletePhotoAssets(eventId, photoId);
        } catch (cleanupError) {
          console.warn('[API] Failed to cleanup uploaded assets after limit check:', cleanupError);
        }
        limitReached = insertResult;
        break;
      }

      const photo = insertResult.photo;

      // Create lucky draw entry only if user opted in
      let luckyDrawEntryId: string | null = null;
      if (event.settings.features.lucky_draw_enabled && joinLuckyDraw) {
        try {
          const entryName = isAnonymous ? undefined : contributorName || undefined;
          const entry = await createEntryFromPhoto(tenantId, eventId, photo.id, userId, entryName);
          luckyDrawEntryId = entry?.id || null;
          if (luckyDrawEntryId) {
            await clearLuckyDrawConfigCache(tenantId, eventId);
          }
        } catch (entryError) {
          console.warn('[API] Lucky draw entry skipped:', entryError);
        }
      }

      // ============================================
      // AI CONTENT MODERATION
      // ============================================
      // Queue photo for AI scanning if moderation is enabled
      if (event.settings.features.moderation_required && await isModerationEnabled()) {
        try {
          await queuePhotoScan({
            photoId: photo.id,
            eventId: eventId,
            tenantId,
            imageUrl: photo.images.full_url,
            userId: userRole === 'guest' ? undefined : userId,
            priority: 'normal',
          });
          console.log('[MODERATION] Photo queued for AI scanning:', photo.id);
        } catch (scanError) {
          console.error('[MODERATION] Failed to queue photo for scanning:', scanError);
          // Don't fail the upload if scanning fails
        }
      }

      const createdPhoto = {
        id: photo.id,
        event_id: photo.event_id,
        images: photo.images,
        caption: photo.caption,
        contributor_name: photo.contributor_name,
        is_anonymous: photo.is_anonymous,
        status: photo.status,
        created_at: photo.created_at,
        lucky_draw_entry_id: luckyDrawEntryId,
      };

      createdPhotos.push(createdPhoto);
      await publishEventBroadcast(eventId, 'new_photo', createdPhoto);
    }

    if (limitReached && createdPhotos.length === 0) {
      const usage = await getUploadUsageSnapshot(
        db,
        eventId,
        userId,
        tierPhotoLimit,
        eventTotalPhotoLimit,
        userPhotoLimit
      );
      return buildPhotoLimitResponse(limitReached, usage);
    }

    if (limitReached && createdPhotos.length > 0) {
      const usage = await getUploadUsageSnapshot(
        db,
        eventId,
        userId,
        tierPhotoLimit,
        eventTotalPhotoLimit,
        userPhotoLimit
      );

      return NextResponse.json({
        data: createdPhotos,
        message: `Uploaded ${createdPhotos.length} photo${createdPhotos.length === 1 ? '' : 's'} before reaching upload limit`,
        limitReached: {
          code: limitReached.code,
          currentCount: limitReached.currentCount,
          limit: limitReached.limit,
          upgradeRequired: limitReached.upgradeRequired,
        },
        usage,
      }, { status: 201 });
    }

    const usage = await getUploadUsageSnapshot(
      db,
      eventId,
      userId,
      tierPhotoLimit,
      eventTotalPhotoLimit,
      userPhotoLimit
    );

    return NextResponse.json({
      data: createdPhotos,
      message: createdPhotos.length === 1 ? 'Photo uploaded successfully' : 'Photos uploaded successfully',
      usage,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', code: 'UPLOAD_ERROR' },
      { status: 500 }
    );
  }
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
}

// ============================================
// GET /api/events/:eventId/photos - List photos
// ============================================

export async function handleEventPhotoList(request: NextRequest, eventId: string) {
  try {
    const headers = request.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveTenantId(headers, auth);

    const db = getTenantDb(tenantId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Determine if requester can access non-approved content
    const authHeader = headers.get('authorization');
    const cookieHeader = headers.get('cookie');
    let isModerator = false;
    let verifiedRole: string | null = null;

    console.log('[PHOTOS_API] Auth check:', {
      hasAuth: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20),
    });

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        verifiedRole = payload.role;
        isModerator = payload.role === 'super_admin' || payload.role === 'organizer';
      } catch (verifyError) {
        console.error('[PHOTOS_API] Token verification failed:', verifyError);
        isModerator = false;
      }
    }

    if (!isModerator) {
      const sessionResult = extractSessionId(cookieHeader, authHeader);
      if (sessionResult.sessionId) {
        const session = await validateSession(sessionResult.sessionId, false);
        if (session.valid && session.user) {
          verifiedRole = session.user.role;
          isModerator = session.user.role === 'super_admin' || session.user.role === 'organizer';
        }
      }
    }

    console.log('[PHOTOS_API] Moderator check:', {
      isModerator,
      verifiedRole,
      status,
    });

    const guestFingerprint = headers.get('x-fingerprint');
    const guestUserId = guestFingerprint ? `guest_${guestFingerprint}` : null;

    if (status && status !== 'approved' && !isModerator) {
      if (!guestUserId) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Build query filter
    // IMPORTANT: If status is provided, always filter by it (for debugging)
    const filter: Record<string, unknown> = { event_id: eventId };
    if (status) {
      filter.status = status;
      if (!isModerator && status !== 'approved') {
        filter.user_fingerprint = guestUserId;
      }
    } else if (!isModerator) {
      // Non-moderators only see approved photos when no status filter
      filter.status = 'approved';
    }

    console.log('[PHOTOS_API] Query filter:', filter);

    const filterEntries = Object.entries(filter);
    const whereClause = filterEntries
      .map(([column], index) => `${column} = $${index + 1}`)
      .join(' AND ');
    const filterValues = filterEntries.map(([, value]) => value);
    const limitParam = filterValues.length + 1;
    const offsetParam = filterValues.length + 2;

    const listResult = await db.query<IPhoto & { total_count: string | number }>(
      `
        SELECT p.*, COUNT(*) OVER() AS total_count
        FROM photos p
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${limitParam}
        OFFSET $${offsetParam}
      `,
      [...filterValues, limit, offset]
    );

    const photos = listResult.rows.map((row) => {
      const { total_count, ...photo } = row as unknown as IPhoto & { total_count: string | number };
      return photo;
    });
    let total = listResult.rows.length > 0 ? Number(listResult.rows[0].total_count || 0) : 0;

    if (total === 0 && offset > 0) {
      const countResult = await db.query<{ count: bigint }>(
        `SELECT COUNT(*) AS count FROM photos p WHERE ${whereClause}`,
        filterValues
      );
      total = Number(countResult.rows[0]?.count || 0);
    }

    console.log('[PHOTOS_API] Query result:', {
      photoCount: photos.length,
      photoStatuses: photos.map((p) => ({ id: p.id, status: p.status })),
    });

    const response = NextResponse.json({
      data: photos,
      pagination: {
        limit,
        offset,
        total,
      },
    });

    if (!isModerator && filter.status === 'approved') {
      applyCacheHeaders(response, CACHE_PROFILES.photosPublic);
    } else {
      applyCacheHeaders(response, CACHE_PROFILES.apiPrivate);
    }

    return response;
  } catch (error) {
    console.error('[API] Photo list error:', error);
    if (isDbSessionPoolExhausted(error)) {
      return NextResponse.json(
        {
          error: 'Database is temporarily busy. Please retry in a moment.',
          code: 'DB_POOL_EXHAUSTED',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch photos', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
