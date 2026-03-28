// ============================================
// Photo Challenge Prize Claim API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/db';
import crypto from 'crypto';
import {
  countApprovedGuestChallengePhotos,
  findGuestProgressByFingerprint,
  findPrizeClaimByFingerprint,
  normalizeGuestChallengeFingerprint,
} from '@/lib/photo-challenge';
import { resolveOptionalAuth, resolveRequiredTenantId } from '@/lib/api-request-context';

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

function buildPrizeClaimUrl(eventId: string, token: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const path = `/organizer/events/${eventId}/photo-challenge/verify?token=${encodeURIComponent(token)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

/**
 * POST /api/events/[eventId]/photo-challenge/claim
 * Generate QR code for prize claim when goal is reached
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const headers = req.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveRequiredTenantId(headers, auth);

    // Get fingerprint from request header sent by client
    const fingerprint = headers.get('x-fingerprint');

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Unable to identify user', code: 'NO_FINGERPRINT' },
        { status: 400 }
      );
    }

    const db = getTenantDb(tenantId);

    // Check if event exists
    const event = await db.findOne('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if photo challenge is enabled
    const challenge = await db.findOne('photo_challenges', {
      event_id: eventId,
      enabled: true,
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Photo challenge not available', code: 'NOT_AVAILABLE' },
        { status: 400 }
      );
    }

    // Get user's approved photos count
    const photosApproved = await countApprovedGuestChallengePhotos(db, eventId, fingerprint);
    const goalPhotos = challenge.goal_photos;
    const goalReached = photosApproved >= goalPhotos;

    if (!goalReached) {
      return NextResponse.json(
        { error: 'Goal not reached yet', code: 'GOAL_NOT_REACHED' },
        { status: 400 }
      );
    }

    // Get user's progress record
    const progress = await findGuestProgressByFingerprint(db, eventId, fingerprint);

    if (progress?.prize_revoked) {
      return NextResponse.json(
        { error: 'Prize has been revoked', code: 'PRIZE_REVOKED' },
        { status: 403 }
      );
    }

    // Check if already claimed
    const existingClaim = await findPrizeClaimByFingerprint(db, eventId, fingerprint);

    if (existingClaim && !existingClaim.revoked_at) {
      const existingClaimUrl = typeof existingClaim.metadata?.qr_code_url === 'string'
        ? existingClaim.metadata.qr_code_url
        : buildPrizeClaimUrl(eventId, existingClaim.qr_code_token);
      return NextResponse.json({
        already_claimed: true,
        data: {
          qr_code_url: existingClaimUrl,
          claim_token: existingClaim.qr_code_token,
          qr_data: null,
        },
        prize_title: challenge.prize_title,
      });
    }

    // Generate QR code token
    const token = crypto.randomBytes(16).toString('hex');
    const qrCodeData = {
      event_id: eventId,
      user_fingerprint: fingerprint,
      challenge_id: challenge.id,
      token,
      timestamp: Date.now(),
    };
    const qrCodeUrl = buildPrizeClaimUrl(eventId, token);

    const claimPayload = {
      challenge_id: challenge.id,
      qr_code_token: token,
      metadata: {
        ...qrCodeData,
        qr_code_url: qrCodeUrl,
      },
      claimed_at: new Date(),
      revoked_at: null,
      revoke_reason: null,
      verified_by: null,
    };

    // Store claim record
    if (existingClaim) {
      await db.update(
        'prize_claims',
        claimPayload,
        { id: existingClaim.id }
      );
    } else {
      await db.insert('prize_claims', {
        event_id: eventId,
        user_fingerprint: fingerprint,
        created_at: new Date(),
        ...claimPayload,
      });
    }

    // Update or create progress record
    if (progress) {
      await db.update(
        'guest_photo_progress',
        { prize_claimed_at: new Date() },
        { id: progress.id }
      );
    } else {
      const normalizedProgressFingerprint = normalizeGuestChallengeFingerprint(fingerprint);
      await db.insert('guest_photo_progress', {
        event_id: eventId,
        user_fingerprint: normalizedProgressFingerprint,
        photos_uploaded: photosApproved,
        goal_reached: true,
        prize_claimed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Generate QR code URL (client will generate actual QR)
    // For now, return the token that the client can use
    const qrCodeDataString = JSON.stringify({
      ...qrCodeData,
      qr_code_url: qrCodeUrl,
    });

    return NextResponse.json({
      data: {
        qr_code_url: qrCodeUrl,
        claim_token: token,
        qr_data: qrCodeDataString,
      },
      prize_title: challenge.prize_title,
      prize_description: challenge.prize_description,
    });
  } catch (error) {
    console.error('[PHOTO_CHALLENGE_CLAIM] POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prize claim',
        code: 'CLAIM_ERROR',
      },
      { status: 500 }
    );
  }
}
