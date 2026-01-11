// ============================================
// MOMENTIQUE - Photo Reactions API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import type { ReactionType } from '@/lib/types';

// ============================================
// POST /api/photos/:id/reactions - Toggle reaction
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const db = getTenantDb(tenantId);

    // Get photo
    const photo = await db.findOne<{
      id: string;
      event_id: string;
      reactions: Record<ReactionType, number>;
    }>('photos', { id: photoId });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type }: { type: ReactionType } = body;

    // Validate reaction type
    const validTypes: ReactionType[] = ['heart', 'clap', 'laugh', 'wow'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Get user ID (from JWT or fingerprint for guests)
    let userId: string;
    const authHeader = headers.get('authorization');

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        userId = `user_${payload.sub}`;
      } catch {
        // Invalid token - treat as guest
        userId = `guest_${headers.get('x-fingerprint') || 'anonymous'}`;
      }
    } else {
      // Guest user - use fingerprint
      userId = `guest_${headers.get('x-fingerprint') || 'anonymous'}`;
    }

    // Check if user already reacted with this type
    const existingReaction = await db.findOne('photo_reactions', {
      photo_id: photoId,
      user_id: userId,
      type,
    });

    if (existingReaction) {
      // Toggle off - remove reaction
      await db.delete('photo_reactions', {
        photo_id: photoId,
        user_id: userId,
        type,
      });

      // Decrement count
      await db.update(
        'photos',
        { reactions: { ...photo.reactions, [type]: Math.max(0, (photo.reactions[type] || 0) - 1) } },
        { id: photoId }
      );

      // Get updated photo
      const updatedPhoto = await db.findOne<{
        reactions: Record<ReactionType, number>;
      }>('photos', { id: photoId });

      return NextResponse.json({
        data: {
          type,
          count: (updatedPhoto?.reactions[type] || 0),
          added: false,
        },
      });
    }

    // Add new reaction
    const reactionId = `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert('photo_reactions', {
      id: reactionId,
      photo_id: photoId,
      user_id: userId,
      type,
      created_at: new Date(),
    });

    // Increment count
    await db.update(
      'photos',
      { reactions: { ...photo.reactions, [type]: (photo.reactions[type] || 0) + 1 } },
      { id: photoId }
    );

    // Get updated photo
    const updatedPhoto = await db.findOne<{
      reactions: Record<ReactionType, number>;
    }>('photos', { id: photoId });

    return NextResponse.json({
      data: {
        type,
        count: (updatedPhoto?.reactions[type] || 0),
        added: true,
      },
    });
  } catch (error) {
    console.error('[API] Reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction', code: 'REACTION_ERROR' },
      { status: 500 }
    );
  }
}
