// ============================================
// Galeria - Attendance Stats API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import type { IAttendanceStats, CheckInMethod } from '@/lib/types';

// ============================================
// GET /api/events/:eventId/attendance/stats
// ============================================

interface EventWithAttendance {
  id: string;
  settings: {
    features?: {
      attendance_enabled?: boolean;
    };
  };
}

interface AttendanceStatsRow {
  total_check_ins: string | number;
  total_guests: string | number;
  check_ins_today: string | number;
  unique_guests: string | number;
  average_companions: string | number | null;
  guest_self: string | number;
  guest_qr: string | number;
  organizer_manual: string | number;
  organizer_qr: string | number;
}

const cacheHeaders = {
  'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
  Vary: 'Cookie, Authorization',
};

const isMissingTableError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === '42P01';

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { db, event } = await requireEventModeratorAccess(request.headers, eventId);

    const attendanceDisabled =
      event.settings &&
      typeof event.settings === 'object' &&
      (event.settings as { features?: { attendance_enabled?: boolean } }).features?.attendance_enabled === false;

    if (attendanceDisabled) {
      return NextResponse.json(
        { error: 'Attendance feature is disabled', code: 'FEATURE_DISABLED' },
        { status: 400 }
      );
    }

    const statsResult = await db.query<AttendanceStatsRow>(
      `SELECT
         COUNT(*) AS total_check_ins,
         COALESCE(SUM(companions_count + 1), 0) AS total_guests,
         COUNT(*) FILTER (WHERE check_in_time >= date_trunc('day', now())) AS check_ins_today,
         COUNT(DISTINCT guest_email) FILTER (WHERE guest_email IS NOT NULL AND guest_email <> '') AS unique_guests,
         COALESCE(AVG(companions_count::numeric), 0) AS average_companions,
         COUNT(*) FILTER (WHERE check_in_method = 'guest_self') AS guest_self,
         COUNT(*) FILTER (WHERE check_in_method = 'guest_qr') AS guest_qr,
         COUNT(*) FILTER (WHERE check_in_method = 'organizer_manual') AS organizer_manual,
         COUNT(*) FILTER (WHERE check_in_method = 'organizer_qr') AS organizer_qr
       FROM attendances
       WHERE event_id = $1`,
      [eventId]
    );
    const row = statsResult.rows[0];
    const methodBreakdown: Record<CheckInMethod, number> = {
      guest_self: toNumber(row?.guest_self),
      guest_qr: toNumber(row?.guest_qr),
      organizer_manual: toNumber(row?.organizer_manual),
      organizer_qr: toNumber(row?.organizer_qr),
    };
    const averageCompanions = toNumber(row?.average_companions);

    const stats: IAttendanceStats = {
      total_check_ins: toNumber(row?.total_check_ins),
      total_guests: toNumber(row?.total_guests),
      check_ins_today: toNumber(row?.check_ins_today),
      unique_guests: toNumber(row?.unique_guests),
      average_companions: Math.round(averageCompanions * 10) / 10,
      check_in_method_breakdown: methodBreakdown,
    };

    return NextResponse.json({ data: stats }, { headers: cacheHeaders });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          data: {
            total_check_ins: 0,
            total_guests: 0,
            check_ins_today: 0,
            unique_guests: 0,
            average_companions: 0,
            check_in_method_breakdown: {
              guest_self: 0,
              guest_qr: 0,
              organizer_manual: 0,
              organizer_qr: 0,
            },
          },
        },
        { headers: cacheHeaders }
      );
    }

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
    console.error('[API] Attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', code: 'STATS_ERROR' },
      { status: 500 }
    );
  }
}
