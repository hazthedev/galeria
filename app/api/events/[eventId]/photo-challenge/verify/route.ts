// ============================================
// Photo Challenge Prize Verification API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { findGuestProgressByFingerprint } from '@/lib/photo-challenge';
import { requireEventModeratorAccess } from '@/lib/domain/auth/auth';

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

/**
 * POST /api/events/[eventId]/photo-challenge/verify
 * Verify a prize claim token
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const { db, userId } = await requireEventModeratorAccess(req.headers, eventId);

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required', code: 'NO_TOKEN' },
        { status: 400 }
      );
    }
    // Find the prize claim
    const claim = await db.findOne<{
      id: string;
      event_id: string;
      user_fingerprint: string;
      challenge_id: string | null;
      qr_code_token: string;
      claimed_at: Date;
      revoked_at: Date | null;
      verified_by: string | null;
      metadata?: Record<string, unknown> | null;
    }>('prize_claims', {
      event_id: eventId,
      qr_code_token: token,
      revoked_at: null,
    });

    if (!claim) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token', code: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }

    const alreadyVerified = Boolean(claim.verified_by);
    if (!alreadyVerified) {
      await db.update(
        'prize_claims',
        {
          verified_by: userId,
          metadata: {
            ...(claim.metadata || {}),
            verified_at: new Date().toISOString(),
            verified_by: userId,
          },
        },
        { id: claim.id }
      );
    }

    // Get challenge details
    const challenge = await db.findOne('photo_challenges', {
      id: claim.challenge_id,
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found', code: 'CHALLENGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get progress details
    const progress = await findGuestProgressByFingerprint(db, eventId, claim.user_fingerprint);

    return NextResponse.json({
      data: {
        claim_id: claim.id,
        user_fingerprint: claim.user_fingerprint,
        prize_title: challenge.prize_title,
        prize_description: challenge.prize_description,
        photos_approved: progress?.photos_approved || 0,
        goal_photos: challenge.goal_photos,
        claimed_at: claim.claimed_at,
        verified: true,
        verified_by: claim.verified_by || userId,
        already_verified: alreadyVerified,
      },
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE_VERIFY] POST error:', error);

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

    return NextResponse.json(
      { error: 'Verification failed', code: 'VERIFY_ERROR' },
      { status: 500 }
    );
  }
}
