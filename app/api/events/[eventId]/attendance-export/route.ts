// ============================================
// Galeria - Attendance CSV Export API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import type { IAttendance } from '@/lib/types';

// ============================================
// GET /api/events/:eventId/attendance/export
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { db, event } = await requireEventModeratorAccess(request.headers, eventId);

    if (
      event.settings &&
      typeof event.settings === 'object' &&
      (event.settings as { features?: { attendance_enabled?: boolean } }).features?.attendance_enabled === false
    ) {
      return NextResponse.json(
        { error: 'Attendance feature is disabled', code: 'FEATURE_DISABLED' },
        { status: 400 }
      );
    }

    // Fetch all attendance records sorted by check-in time
    const result = await db.query<IAttendance>(
      `SELECT * FROM attendances
       WHERE event_id = $1
       ORDER BY check_in_time ASC`,
      [eventId]
    );

    const attendances = result.rows;

    // Generate CSV
    const headers_row = 'Name,Email,Phone,Companions,Check-in Time,Method,Notes\n';
    const rows = attendances.map(a =>
      [
        `"${(a.guest_name || '').replace(/"/g, '""')}"`,
        `"${(a.guest_email || '').replace(/"/g, '""')}"`,
        `"${(a.guest_phone || '').replace(/"/g, '""')}"`,
        a.companions_count,
        new Date(a.check_in_time).toLocaleString(),
        a.check_in_method,
        `"${(a.notes || '').replace(/"/g, '""')}"`
      ].join(',')
    ).join('\n');

    const csv = headers_row + rows;

    // Return CSV file with appropriate headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-${eventId}-${Date.now()}.csv"`,
      },
    });
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
          { error: 'Forbidden', code: 'FORBIDDEN' },
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

    if (error instanceof Error && error.message.includes('Tenant context missing')) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[API] Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export', code: 'EXPORT_ERROR' },
      { status: 500 }
    );
  }
}
