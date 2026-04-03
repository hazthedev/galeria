// ============================================
// Galeria - Lucky Draw Eligibility Preview
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { previewDrawEligibility } from '@/lib/lucky-draw';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';

export const runtime = 'nodejs';

// ============================================
// GET /api/events/:eventId/lucky-draw/eligibility
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    const authContext = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, authContext);

    if (!(await isTenantFeatureEnabled(tenantId, 'lucky_draw'))) {
      return NextResponse.json(
        { error: 'Lucky Draw is not available on your current plan', code: 'FEATURE_NOT_AVAILABLE' },
        { status: 403 }
      );
    }

    await requireEventModeratorAccess(headers, eventId);

    const eligibility = await previewDrawEligibility(tenantId, eventId);

    return NextResponse.json({ data: eligibility });
  } catch (error) {
    console.error('[API] Eligibility preview error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid or expired access token')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    if (errorMessage.includes('Event not found')) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to preview eligibility', code: 'ELIGIBILITY_ERROR' },
      { status: 500 }
    );
  }
}
