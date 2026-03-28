// ============================================
// Galeria - Photo Reactions API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { PoolClient } from 'pg';
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

type LockedPhotoReactionState = {
  eventId: string;
  reactions: Partial<Record<ReactionType, number>> | null;
};

type ReactionMutationResult = {
  eventId: string;
  count: number;
  userCount: number;
  added: boolean;
  reason?: 'max_reached';
  broadcast: boolean;
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

async function lockPhotoReactionState(
  client: PoolClient,
  photoId: string
): Promise<LockedPhotoReactionState | null> {
  const result = await client.query<LockedPhotoReactionState>(
    `SELECT
      event_id AS "eventId",
      reactions
     FROM photos
     WHERE id = $1
     FOR UPDATE`,
    [photoId]
  );

  return result.rows[0] || null;
}

async function mutatePhotoReaction(input: {
  db: ReturnType<typeof getTenantDb>;
  photoId: string;
  userId: string;
  type: ReactionType;
  mode: string;
}): Promise<ReactionMutationResult | null> {
  return input.db.transact<ReactionMutationResult | null>(async (client) => {
    const photo = await lockPhotoReactionState(client, input.photoId);
    if (!photo) {
      return null;
    }

    const reactionCounts: Partial<Record<ReactionType, number>> = photo.reactions || {};
    const currentCountResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM photo_reactions
       WHERE photo_id = $1 AND user_id = $2 AND type = $3`,
      [input.photoId, input.userId, input.type]
    );
    const currentUserCount = parseInt(currentCountResult.rows[0]?.count || '0', 10);

    if (input.mode === 'increment') {
      if (currentUserCount >= MAX_REACTIONS_PER_USER) {
        return {
          eventId: photo.eventId,
          count: reactionCounts[input.type] || 0,
          userCount: currentUserCount,
          added: false,
          reason: 'max_reached',
          broadcast: false,
        };
      }

      await client.query(
        `INSERT INTO photo_reactions (id, photo_id, user_id, type, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `reaction_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
          input.photoId,
          input.userId,
          input.type,
          new Date(),
        ]
      );

      const newCount = (reactionCounts[input.type] || 0) + 1;
      await client.query(
        'UPDATE photos SET reactions = $1 WHERE id = $2',
        [{ ...reactionCounts, [input.type]: newCount }, input.photoId]
      );

      return {
        eventId: photo.eventId,
        count: newCount,
        userCount: currentUserCount + 1,
        added: true,
        broadcast: true,
      };
    }

    if (currentUserCount > 0) {
      const deleteResult = await client.query(
        `DELETE FROM photo_reactions
         WHERE photo_id = $1 AND user_id = $2 AND type = $3`,
        [input.photoId, input.userId, input.type]
      );
      const removedCount = deleteResult.rowCount || 0;
      const newCount = Math.max(0, (reactionCounts[input.type] || 0) - removedCount);

      await client.query(
        'UPDATE photos SET reactions = $1 WHERE id = $2',
        [{ ...reactionCounts, [input.type]: newCount }, input.photoId]
      );

      return {
        eventId: photo.eventId,
        count: newCount,
        userCount: Math.max(0, currentUserCount - removedCount),
        added: false,
        broadcast: removedCount > 0,
      };
    }

    await client.query(
      `INSERT INTO photo_reactions (id, photo_id, user_id, type, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `reaction_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        input.photoId,
        input.userId,
        input.type,
        new Date(),
      ]
    );

    const newCount = (reactionCounts[input.type] || 0) + 1;
    await client.query(
      'UPDATE photos SET reactions = $1 WHERE id = $2',
      [{ ...reactionCounts, [input.type]: newCount }, input.photoId]
    );

    return {
      eventId: photo.eventId,
      count: newCount,
      userCount: currentUserCount + 1,
      added: true,
      broadcast: true,
    };
  });
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

    const mutation = await mutatePhotoReaction({
      db,
      photoId,
      userId,
      type,
      mode,
    });

    if (!mutation) {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (mutation.broadcast) {
      await publishEventBroadcast(mutation.eventId, 'reaction_added', {
        photo_id: photoId,
        emoji: type,
        count: mutation.count,
        event_id: mutation.eventId,
      });
    }

    return NextResponse.json({
      data: {
        type,
        count: mutation.count,
        userCount: mutation.userCount,
        added: mutation.added,
        reason: mutation.reason,
      },
    });
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
