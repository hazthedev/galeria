// ============================================
// Galeria - Manual Check-in API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import type { IAttendance, IAttendanceCreate } from '@/lib/types';

// ============================================
// POST /api/events/:eventId/attendance/manual
// Manual check-in by organizer
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { db, userId, event } = await requireEventModeratorAccess(request.headers, eventId);

    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event is not active', code: 'EVENT_NOT_ACTIVE' },
        { status: 400 }
      );
    }

    if (
      event.settings &&
      typeof event.settings === 'object' &&
      (event.settings as { features?: { attendance_enabled?: boolean } }).features?.attendance_enabled === false
    ) {
      return NextResponse.json(
        { error: 'Attendance check-in is disabled', code: 'FEATURE_DISABLED' },
        { status: 400 }
      );
    }

    const body = await request.json() as IAttendanceCreate;

    // Validate required fields
    if (!body.guest_name || body.guest_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Guest name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate companions count
    if (body.companions_count !== undefined && (body.companions_count < 0 || body.companions_count > 100)) {
      return NextResponse.json(
        { error: 'Companions count must be between 0 and 100', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check for duplicate by email
    if (body.guest_email && body.guest_email.trim()) {
      const existingByEmail = await db.query<IAttendance>(
        'SELECT id FROM attendances WHERE event_id = $1 AND guest_email = $2',
        [eventId, body.guest_email.toLowerCase().trim()]
      );

      if (existingByEmail.rows.length > 0) {
        return NextResponse.json(
          { error: 'Guest already checked in', code: 'ALREADY_CHECKED_IN', email: body.guest_email },
          { status: 409 }
        );
      }
    }

    // Check for duplicate by phone
    if (body.guest_phone && body.guest_phone.trim()) {
      const existingByPhone = await db.query<IAttendance>(
        'SELECT id FROM attendances WHERE event_id = $1 AND guest_phone = $2',
        [eventId, body.guest_phone.trim()]
      );

      if (existingByPhone.rows.length > 0) {
        return NextResponse.json(
          { error: 'Guest already checked in', code: 'ALREADY_CHECKED_IN', phone: body.guest_phone },
          { status: 409 }
        );
      }
    }

    // Create attendance record with organizer_manual method
    const result = await db.query<IAttendance>(
      `INSERT INTO attendances
       (event_id, guest_name, guest_email, guest_phone, user_fingerprint,
        companions_count, check_in_method, checked_in_by, notes, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        eventId,
        body.guest_name.trim(),
        body.guest_email?.toLowerCase().trim() || null,
        body.guest_phone?.trim() || null,
        body.user_fingerprint || crypto.randomUUID(),
        body.companions_count || 0,
        'organizer_manual',
        userId,
        body.notes || null,
        JSON.stringify({
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          manual_entry: true,
        })
      ]
    );

    const attendance = result.rows[0];

    return NextResponse.json({
      data: attendance,
      message: 'Manual check-in successful'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Invalid or expired access token')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Forbidden - organizer access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      if (error.message.includes('Event not found')) {
        return NextResponse.json(
          { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    console.error('[API] Manual check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in', code: 'CHECKIN_ERROR' },
      { status: 500 }
    );
  }
}
