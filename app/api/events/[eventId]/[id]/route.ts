// ============================================
// MOMENTIQUE - Single Event API Routes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import type { IEvent } from '@/lib/types';

// ============================================
// GET /api/events/:id - Get single event
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { id } = await params;
  try {

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

    // Fetch event
    const event = await db.findOne<IEvent>('events', { id });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error('[API] Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/events/:id - Update event
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { id } = await params;
  try {

    // Get tenant from headers
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

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
    const updates = await request.json();

    // Get database connection
    const db = getTenantDb(tenantId);

    // Check if event exists
    const existingEvent = await db.findOne<IEvent>('events', { id });
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = payload.role;
    const isOwner = existingEvent.organizer_id === payload.sub;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update event
    await db.update(
      'events',
      { ...updates, updated_at: new Date() },
      { id }
    );

    return NextResponse.json({
      data: { id },
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('[API] Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/events/:id - Delete event
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { id } = await params;
  try {

    // Get tenant from headers
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

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

    // Get database connection
    const db = getTenantDb(tenantId);

    // Check if event exists
    const existingEvent = await db.findOne<IEvent>('events', { id });
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = payload.role;
    const isOwner = existingEvent.organizer_id === payload.sub;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete event (cascade will delete related records)
    const deletedCount = await db.delete('events', { id });

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete event', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
