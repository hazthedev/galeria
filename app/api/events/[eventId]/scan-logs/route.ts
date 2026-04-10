import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import { requireAuthForApi } from '@/lib/domain/auth/auth';
import { hydrateModeratorImagePreviewUrls } from '@/lib/moderation/presentation';

const isMissingTableError = (error: unknown) =>
  (error as { code?: string })?.code === '42P01';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const headers = request.headers;
    const { userId, tenantId: authTenantId, payload } = await requireAuthForApi(headers, request.method);
    const db = getTenantDb(authTenantId);

    const event = await db.findOne<{ id: string; organizer_id: string }>('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const isOwner = event.organizer_id === userId;
    const isSuperAdmin = payload.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
    const problemOnly = url.searchParams.get('problemOnly') !== 'false';

    const tableCheck = await db.query<{ name: string | null }>(
      'SELECT to_regclass($1) AS name',
      ['public.photo_scan_logs']
    );

    if (!tableCheck.rows[0]?.name) {
      return NextResponse.json({ data: [] });
    }

    const result = await db.query<{
      id: string;
      photoId: string | null;
      jobId: string | null;
      source: string;
      triggerType: string;
      isReported: boolean;
      decision: string | null;
      outcome: string;
      reason: string | null;
      error: string | null;
      categories: string[];
      confidence: number | null;
      imageUrl: string | null;
      photoStatus: string | null;
      scannedAt: Date | null;
      createdAt: Date;
    }>(
      `
        SELECT
          l.id,
          l.photo_id AS "photoId",
          l.job_id AS "jobId",
          l.source,
          l.trigger_type AS "triggerType",
          l.is_reported AS "isReported",
          l.decision::text AS "decision",
          l.outcome::text AS "outcome",
          l.reason,
          l.error,
          l.categories,
          l.confidence,
          l.image_url AS "imageUrl",
          COALESCE(
            p.status::text,
            CASE
              WHEN l.decision::text = 'reject' THEN 'rejected'
              WHEN l.decision::text = 'approve' THEN 'approved'
              WHEN l.decision::text IN ('review', 'error') THEN 'pending'
              ELSE null
            END
          ) AS "photoStatus",
          l.scanned_at AS "scannedAt",
          l.created_at AS "createdAt"
        FROM photo_scan_logs l
        LEFT JOIN photos p ON p.id = l.photo_id
        WHERE l.event_id = $1
          AND (
            $4::boolean = false
            OR l.outcome::text <> 'applied'
            OR l.decision::text = 'review'
            OR l.error IS NOT NULL
          )
        ORDER BY COALESCE(l.scanned_at, l.created_at) DESC
        LIMIT $2 OFFSET $3
      `,
      [eventId, limit, offset, problemOnly]
    ).catch((error) => (isMissingTableError(error) ? null : Promise.reject(error)));

    if (!result) {
      return NextResponse.json({ data: [] });
    }

    const hydratedLogs = await hydrateModeratorImagePreviewUrls(result.rows);

    return NextResponse.json({ data: hydratedLogs });
  } catch (error) {
    console.error('[API] Scan logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan logs', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
