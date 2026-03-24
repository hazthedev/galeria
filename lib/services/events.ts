// ============================================
// Galeria - Events Service
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/domain/auth/auth';
import { generateSlug, generateUUID, generateEventUrl } from '@/lib/utils';
import { extractSessionId, validateSession } from '@/lib/domain/auth/session';
import { generateShortCode } from '@/lib/shared/utils/short-code';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/infrastructure/auth/supabase-server';
import { resolveOrProvisionAppUser } from '@/lib/domain/auth/provision-app-user';
import type { IEvent } from '@/lib/types';
import { eventBulkUpdateSchema, eventCreateSchema } from '@/lib/validation/events';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { checkEventLimit } from '@/lib/limit-check';
import { getEffectiveTenantEntitlements } from '@/lib/tenant';

type IEventWithPhotoCount = IEvent & { photo_count?: number };

function isDbSessionPoolExhausted(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code || '') : '';
  const message = error instanceof Error ? error.message : String(error || '');

  return code === 'XX000' && message.includes('MaxClientsInSessionMode');
}

function normalizeSupabaseEventRow(data: Record<string, unknown>): IEvent {
  return {
    ...(data as unknown as IEvent),
    event_date: data.event_date ? new Date(String(data.event_date)) : new Date(),
    created_at: data.created_at ? new Date(String(data.created_at)) : new Date(),
    updated_at: data.updated_at ? new Date(String(data.updated_at)) : new Date(),
    expires_at: data.expires_at ? new Date(String(data.expires_at)) : undefined,
  };
}

async function insertEventViaSupabase(payload: Record<string, unknown>): Promise<IEvent> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Supabase insert returned no event row');
  }

  return normalizeSupabaseEventRow(data as Record<string, unknown>);
}

async function ensureOrganizerUserProvisioned(userId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error(error?.message || 'Unable to fetch Supabase auth user for organizer provisioning');
  }

  await resolveOrProvisionAppUser(data.user);
}

async function listEventsViaSupabaseFallback(
  status: string | null,
  userRole: string,
  userId: string,
  limit: number,
  offset: number
): Promise<{ events: IEventWithPhotoCount[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (userRole === 'organizer') {
    query = query.eq('organizer_id', userId);
  }

  const { data, error, count } = await query;
  if (error) {
    throw error;
  }

  const events: IEventWithPhotoCount[] = (data || []).map((row) => ({
    ...normalizeSupabaseEventRow(row as Record<string, unknown>),
    photo_count: 0,
  }));

  return {
    events,
    total: count || 0,
  };
}

// ============================================
// GET /api/events - List events (service)
// ============================================

export async function handleEventsList(request: NextRequest) {
  try {
    // Get tenant from headers (injected by middleware)
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim() || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Get user from session or JWT token
    const cookieHeader = headers.get('cookie');
    const authHeader = headers.get('authorization');
    let userId: string | null = null;
    let userRole: string | null = null;

    // Try session-based auth first
    const sessionResult = extractSessionId(cookieHeader, authHeader);
    if (sessionResult.sessionId) {
      const session = await validateSession(sessionResult.sessionId, false);
      if (session.valid && session.user) {
        userId = session.user.id;
        userRole = session.user.role;
      }
    }

    // Fallback to JWT token
    if (!userId && authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        userId = payload.sub;
        userRole = payload.role;
      } catch {
        // Token invalid
      }
    }

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (!['organizer', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get database connection
    const db = getTenantDb(tenantId);
    let events: IEventWithPhotoCount[] = [];
    let total = 0;

    try {
      const whereClauses: string[] = [];
      const values: unknown[] = [];

      if (status) {
        values.push(status);
        whereClauses.push(`e.status = $${values.length}`);
      }

      if (search) {
        values.push(`%${search}%`);
        const searchParam = `$${values.length}`;
        whereClauses.push(
          `(e.name ILIKE ${searchParam} OR e.description ILIKE ${searchParam} OR e.location ILIKE ${searchParam} OR e.custom_hashtag ILIKE ${searchParam})`
        );
      }

      if (userRole === 'organizer') {
        values.push(userId);
        whereClauses.push(`e.organizer_id = $${values.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const limitParam = values.length + 1;
      const offsetParam = values.length + 2;

      const result = await db.query<IEvent & { photo_count: string | number; total_count: string | number }>(
        `
          WITH paged_events AS (
            SELECT e.*, COUNT(*) OVER() AS total_count
            FROM events e
            ${whereSql}
            ORDER BY e.created_at DESC
            LIMIT $${limitParam}
            OFFSET $${offsetParam}
          )
          SELECT
            pe.*,
            COALESCE(pc.photo_count, 0) AS photo_count
          FROM paged_events pe
          LEFT JOIN (
            SELECT p.event_id, COUNT(*) AS photo_count
            FROM photos p
            WHERE p.event_id IN (SELECT id FROM paged_events)
            GROUP BY p.event_id
          ) pc ON pc.event_id = pe.id
          ORDER BY pe.created_at DESC
        `,
        [...values, limit, offset]
      );

      events = result.rows.map((row) => {
        const { photo_count, total_count, ...event } = row as unknown as IEvent & {
          photo_count: string | number;
          total_count: string | number;
        };

        return {
          ...event,
          photo_count: Number(photo_count || 0),
        };
      });

      if (result.rows.length > 0) {
        total = Number(result.rows[0].total_count || 0);
      } else if (offset > 0) {
        // Preserve pagination accuracy when requesting beyond the available range.
        const countResult = await db.query<{ count: bigint }>(
          `
            SELECT COUNT(*) AS count
            FROM events e
            ${whereSql}
          `,
          values
        );
        total = Number(countResult.rows[0]?.count || 0);
      }
    } catch (dbError) {
      if (isDbSessionPoolExhausted(dbError) && isSupabaseAdminConfigured()) {
        const fallback = await listEventsViaSupabaseFallback(status, userRole, userId, limit, offset);
        events = fallback.events;
        total = fallback.total;
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      data: events,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('[API] Error listing events:', error);
    return NextResponse.json(
      { error: 'Failed to list events', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events - Create event (service)
// ============================================

export async function handleEventCreate(request: NextRequest) {
  try {
    // Get tenant from headers
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    // Reuse already-resolved auth context first to avoid duplicate auth work.
    const cookieHeader = headers.get('cookie');
    const authHeader = headers.get('authorization');
    let userId: string | null = authContext?.userId || null;
    let userRole: string | null = authContext?.role || null;

    if (!userId) {
      const sessionResult = extractSessionId(cookieHeader, authHeader);
      if (sessionResult.sessionId) {
        const session = await validateSession(sessionResult.sessionId, false);
        if (session.valid && session.session) {
          userId = session.session.userId;
          userRole = session.session.role;
        }
      }
    }

    if (!userId && authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        userId = payload.sub;
        userRole = payload.role;
      } catch {
        // Token invalid
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (userRole && !['organizer', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const parsed = eventCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event payload', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Get database connection
    const db = getTenantDb(tenantId);
    const [eventLimitResult, tenantEntitlements] = await Promise.all([
      checkEventLimit(tenantId, 'free'),
      getEffectiveTenantEntitlements(tenantId),
    ]);

    if (!eventLimitResult.allowed) {
      return NextResponse.json(
        {
          error: eventLimitResult.message || 'Monthly event limit reached',
          code: 'TIER_LIMIT_REACHED',
          upgradeRequired: true,
          currentCount: eventLimitResult.currentCount,
          limit: eventLimitResult.limit,
        },
        { status: 403 }
      );
    }

    // Generate event ID (use UUID for database compatibility)
    const eventId = generateUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseSlug = generateSlug(body.name) || 'event';

    // Default settings
    let defaultSettings: IEvent['settings'] = {
      theme: {
        primary_color: '#8B5CF6',
        secondary_color: '#EC4899',
        background: '#F9FAFB',
        surface_color: '#1F2937',
        logo_url: undefined,
        frame_template: 'polaroid',
        photo_card_style: 'vacation',
      },
      features: {
        photo_upload_enabled: true,
        lucky_draw_enabled: tenantEntitlements.features.lucky_draw,
        reactions_enabled: tenantEntitlements.features.photo_reactions,
        moderation_required: false,
        anonymous_allowed: true,
        guest_download_enabled: true,
        photo_challenge_enabled: false,
        attendance_enabled: false,
        lightbox_enabled: true,
      },
      limits: {
        max_photos_per_user: 5,
        max_total_photos: 50,
        max_draw_entries: 30,
      },
      security: {
        upload_rate_limits: {
          per_ip_hourly: 10,
          per_fingerprint_hourly: 10,
          burst_per_ip_minute: 5,
          per_event_daily: 100,
        },
      },
    };
    // Use insert-and-retry on uniqueness collisions to avoid extra pre-insert DB lookups.
    const maxCreateAttempts = 5;
    for (let attempt = 1; attempt <= maxCreateAttempts; attempt++) {
      const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
      const shortCode = generateShortCode(6);
      const eventUrl = generateEventUrl(baseUrl, eventId, slug);
      const now = new Date();
      const eventDate = new Date(body.event_date);
      const eventPayload: Record<string, unknown> = {
        id: eventId,
        tenant_id: tenantId,
        organizer_id: userId,
        name: body.name,
        slug,
        short_code: shortCode,
        description: body.description,
        event_type: body.event_type,
        event_date: eventDate,
        timezone: 'UTC',
        location: body.location,
        expected_guests: body.expected_guests,
        custom_hashtag: body.custom_hashtag,
        settings: { ...defaultSettings, ...body.settings },
        status: 'active',
        qr_code_url: eventUrl,
        created_at: now,
        updated_at: now,
      };

      try {
        const event = await db.insert<IEvent>('events', eventPayload);

        return NextResponse.json(
          {
            data: event,
            message: 'Event created successfully',
          },
          { status: 201 }
        );
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === '23505' && attempt < maxCreateAttempts) {
          continue;
        }

        if (code === '23503' && attempt < maxCreateAttempts && isSupabaseAdminConfigured()) {
          await ensureOrganizerUserProvisioned(userId);
          continue;
        }

        if (isDbSessionPoolExhausted(error) && isSupabaseAdminConfigured()) {
          try {
            const fallbackPayload: Record<string, unknown> = {
              ...eventPayload,
              event_date: eventDate.toISOString(),
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            };
            const fallbackEvent = await insertEventViaSupabase(fallbackPayload);
            return NextResponse.json(
              {
                data: fallbackEvent,
                message: 'Event created successfully',
              },
              { status: 201 }
            );
          } catch (fallbackError) {
            const fallbackCode = (fallbackError as { code?: string }).code;
            if (fallbackCode === '23505' && attempt < maxCreateAttempts) {
              continue;
            }
            if (fallbackCode === '23503' && attempt < maxCreateAttempts) {
              await ensureOrganizerUserProvisioned(userId);
              continue;
            }
            throw fallbackError;
          }
        }

        throw error;
      }
    }

    return NextResponse.json(
      { error: 'Could not create a unique event slug/code', code: 'EVENT_CREATE_RETRY_EXHAUSTED' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[API] Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/events - Bulk update events (service)
// ============================================

export async function handleEventsBulkUpdate(request: NextRequest) {
  try {
    // Get tenant from headers
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    // Get user from JWT token
    const authHeader = headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const parsed = eventBulkUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event update payload', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Get database connection
    const db = getTenantDb(tenantId);

    // Check permissions (only organizer or admin can update)
    const userRole = payload.role;
    if (!['organizer', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update events (only events belonging to this user if organizer)
    const events: IEvent[] = [];

    if (userRole === 'organizer') {
      // Only update own events
      for (const eventId of body.ids) {
        await db.update(
          'events',
          body.updates,
          { id: eventId, organizer_id: payload.sub }
        );
      }
    } else {
      // Admin can update any event in tenant
      for (const eventId of body.ids) {
        await db.update(
          'events',
          body.updates,
          { id: eventId }
        );
      }
    }

    // Fetch updated events to return
    let finalEvents: IEvent[] = [];

    if (body.ids.length === 1) {
      const event = await db.findOne<IEvent>('events', { id: body.ids[0] });
      if (event) {
        finalEvents.push(event);
      }
    } else {
      // Use SQL IN clause for multiple IDs
      const placeholders = body.ids.map((_, index) => `$${index + 1}`).join(', ');
      const result = await db.query<IEvent>(
        `SELECT * FROM events WHERE id IN (${placeholders})`,
        body.ids
      );
      finalEvents = result.rows;
    }

    return NextResponse.json({
      events: finalEvents,
      message: `Updated ${finalEvents.length} event(s)`,
    });
  } catch (error) {
    console.error('[API] Error updating events:', error);
    return NextResponse.json(
      { error: 'Failed to update events', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/events - Bulk delete events (service)
// ============================================

export async function handleEventsBulkDelete(request: NextRequest) {
  try {
    // Get tenant from headers
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    // Get user from JWT token
    const authHeader = headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    const { ids } = requestBody;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No event IDs provided', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get database connection
    const db = getTenantDb(tenantId);

    // Check permissions
    const userRole = payload.role;
    if (!['organizer', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete events
    let deletedCount = 0;

    if (userRole === 'organizer') {
      // Only delete own events
      for (const eventId of ids) {
        deletedCount += await db.delete('events', {
          id: eventId,
          organizer_id: payload.sub,
        });
      }
    } else {
      // Admin can delete any event in tenant
      for (const eventId of ids) {
        deletedCount += await db.delete('events', { id: eventId });
      }
    }

    return NextResponse.json({
      message: `Deleted ${deletedCount} event(s)`,
    });
  } catch (error) {
    console.error('[API] Error deleting events:', error);
    return NextResponse.json(
      { error: 'Failed to delete events', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
