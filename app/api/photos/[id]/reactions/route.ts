// ============================================
// Galeria - Photo Reactions API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/domain/auth/auth';
import type { ReactionType } from '@/lib/types';
import { publishEventBroadcast } from '@/lib/realtime/server';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
import { isTenantFeatureEnabled } from '@/lib/tenant';

// Maximum reactions per user per photo
const MAX_REACTIONS_PER_USER = 10;

type PhotoReactionContext = {
  id: string;
  eventId: string;
  reactions: Record<ReactionType, number> | null;
  eventSettings: {
    features?: {
      reactions_enabled?: boolean;
    };
  } | null;
};

function createReactionFeatureUnavailableResponse(message: string) {
  return NextResponse.json(
    { error: message, code: 'FEATURE_NOT_AVAILABLE' },
    { status: 403 }
  );
}

function areReactionsEnabledForEvent(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') {
    return true;
  }

  const features = (settings as { features?: { reactions_enabled?: boolean } }).features;
  return features?.reactions_enabled !== false;
}

async function getPhotoReactionContext(
  db: ReturnType<typeof getTenantDb>,
  photoId: string
): Promise<PhotoReactionContext | null> {
  const result = await db.query<PhotoReactionContext>(
    `SELECT
      p.id,
      p.event_id AS "eventId",
      p.reactions,
      e.settings AS "eventSettings"
    FROM photos p
    JOIN events e ON e.id = p.event_id
    WHERE p.id = $1
    LIMIT 1`,
    [photoId]
  );

  return result.rows[0] || null;
}

// ============================================
// GET /api/photos/:id/reactions - Get reaction counts
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;
    const headers = request.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveTenantId(headers, auth);

    if (!(await isTenantFeatureEnabled(tenantId, 'photo_reactions'))) {
      return createReactionFeatureUnavailableResponse(
        'Photo reactions are not available on your current plan'
      );
    }

    const db = getTenantDb(tenantId);

    const photo = await getPhotoReactionContext(db, photoId);

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!areReactionsEnabledForEvent(photo.eventSettings)) {
      return createReactionFeatureUnavailableResponse(
        'Photo reactions are disabled for this event'
      );
    }

    const reactionCounts: Partial<Record<ReactionType, number>> = photo.reactions || {};

    // Get user's reaction count for this photo
    const userId = getUserId(headers);
    
    const userReactionsResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM photo_reactions WHERE photo_id = $1 AND user_id = $2`,
      [photoId, userId]
    );
    
    const userReactionCount = parseInt(userReactionsResult.rows[0]?.count || '0', 10);

    return NextResponse.json({
      data: {
        reactions: reactionCounts,
        userReactionCount,
        maxReactions: MAX_REACTIONS_PER_USER,
        remainingReactions: Math.max(0, MAX_REACTIONS_PER_USER - userReactionCount),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context missing')) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[API] Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get reactions', code: 'GET_REACTIONS_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/photos/:id/reactions - Add reaction
// ============================================
// Query params:
//   - mode=increment: Always adds (up to max), never toggles
//   - mode=toggle (default): Toggles reaction on/off

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;
    const headers = request.headers;
    const auth = await resolveOptionalAuth(headers);
    const tenantId = resolveTenantId(headers, auth);

    if (!(await isTenantFeatureEnabled(tenantId, 'photo_reactions'))) {
      return createReactionFeatureUnavailableResponse(
        'Photo reactions are not available on your current plan'
      );
    }

    const db = getTenantDb(tenantId);

    const photo = await getPhotoReactionContext(db, photoId);

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!areReactionsEnabledForEvent(photo.eventSettings)) {
      return createReactionFeatureUnavailableResponse(
        'Photo reactions are disabled for this event'
      );
    }

    const reactionCounts: Partial<Record<ReactionType, number>> = photo.reactions || {};

    // Parse request body
    const body = await request.json();
    const { type }: { type: ReactionType } = body;

    // Only allow 'heart' reactions (love only feature)
    if (type !== 'heart') {
      return NextResponse.json(
        { error: 'Only heart reactions are supported', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = getUserId(headers);

    // Get mode from query params (default: toggle)
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'toggle';

    // Get user's current reaction count for this photo
    const userReactionsResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM photo_reactions WHERE photo_id = $1 AND user_id = $2`,
      [photoId, userId]
    );
    const currentUserCount = parseInt(userReactionsResult.rows[0]?.count || '0', 10);

    if (mode === 'increment') {
      // INCREMENT MODE: Always add (up to max), never remove
      if (currentUserCount >= MAX_REACTIONS_PER_USER) {
        return NextResponse.json({
          data: {
            type,
            count: reactionCounts[type] || 0,
            userCount: currentUserCount,
            added: false,
            reason: 'max_reached',
          },
        });
      }

      // Add new reaction
      const reactionId = `reaction_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      await db.insert('photo_reactions', {
        id: reactionId,
        photo_id: photoId,
        user_id: userId,
        type,
        created_at: new Date(),
      });

      // Increment count on photo
      const newCount = (reactionCounts[type] || 0) + 1;
      await db.update(
        'photos',
        { reactions: { ...reactionCounts, [type]: newCount } },
        { id: photoId }
      );

      await publishEventBroadcast(photo.eventId, 'reaction_added', {
        photo_id: photoId,
        emoji: type,
        count: newCount,
        event_id: photo.eventId,
      });

      return NextResponse.json({
        data: {
          type,
          count: newCount,
          userCount: currentUserCount + 1,
          added: true,
        },
      });
    } else {
      // TOGGLE MODE: Add if not reacted, remove if already reacted
      const existingReaction = await db.findOne('photo_reactions', {
        photo_id: photoId,
        user_id: userId,
        type,
      });

      if (existingReaction) {
        // Remove reaction (toggle off)
        await db.delete('photo_reactions', {
          photo_id: photoId,
          user_id: userId,
          type,
        });

        // Decrement count
        const newCount = Math.max(0, (reactionCounts[type] || 0) - 1);
        await db.update(
          'photos',
          { reactions: { ...reactionCounts, [type]: newCount } },
          { id: photoId }
        );

        await publishEventBroadcast(photo.eventId, 'reaction_added', {
          photo_id: photoId,
          emoji: type,
          count: newCount,
          event_id: photo.eventId,
        });

        return NextResponse.json({
          data: {
            type,
            count: newCount,
            userCount: Math.max(0, currentUserCount - 1),
            added: false,
          },
        });
      }

      // Add new reaction
      const reactionId = `reaction_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      await db.insert('photo_reactions', {
        id: reactionId,
        photo_id: photoId,
        user_id: userId,
        type,
        created_at: new Date(),
      });

      // Increment count
      const newCount = (reactionCounts[type] || 0) + 1;
      await db.update(
        'photos',
        { reactions: { ...reactionCounts, [type]: newCount } },
        { id: photoId }
      );

      await publishEventBroadcast(photo.eventId, 'reaction_added', {
        photo_id: photoId,
        emoji: type,
        count: newCount,
        event_id: photo.eventId,
      });

      return NextResponse.json({
        data: {
          type,
          count: newCount,
          userCount: currentUserCount + 1,
          added: true,
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context missing')) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[API] Reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction', code: 'REACTION_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getUserId(headers: Headers): string {
  const authHeader = headers.get('authorization');

  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = verifyAccessToken(token);
      return `user_${payload.sub}`;
    } catch {
      // Invalid token - treat as guest
    }
  }

  // Guest user - use fingerprint
  const fingerprint = headers.get('x-fingerprint') || 'anonymous';
  return `guest_${fingerprint}`;
}
