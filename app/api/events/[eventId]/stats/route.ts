// ============================================
// MOMENTIQUE - Event Stats API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import type { IPhoto } from '@/lib/types';

interface EventStats {
  totalPhotos: number;
  totalParticipants: number;
  photosToday: number;
  avgPhotosPerUser: number;
  topContributors: { name: string; count: number }[];
  uploadTimeline: { date: string; count: number }[];
  totalReactions: number;
  pendingModeration: number;
}

interface TopContributor {
  contributor_name: string;
  count: number;
}

// ============================================
// GET /api/events/:id/stats - Get event statistics
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const authHeader = headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const db = getTenantDb(tenantId);

    // Check if event exists
    const event = await db.findOne('events', { id });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = payload.role;
    const isOwner = event.organizer_id === payload.sub;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get all photos for this event
    const photos = await db.findMany<IPhoto>('photos', { event_id: id });

    // Calculate stats
    const totalPhotos = photos.length;

    // Count unique participants (by user_fingerprint)
    const uniqueFingerprints = new Set(photos.map(p => p.user_fingerprint));
    const totalParticipants = uniqueFingerprints.size;

    // Count photos today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const photosToday = photos.filter(p => {
      const photoDate = new Date(p.created_at);
      return photoDate >= today;
    }).length;

    // Calculate average photos per user
    const avgPhotosPerUser = totalParticipants > 0
      ? Math.round((totalPhotos / totalParticipants) * 10) / 10
      : 0;

    // Get top contributors
    const contributorMap = new Map<string, number>();
    for (const photo of photos) {
      const name = photo.is_anonymous ? 'Anonymous' : (photo.contributor_name || 'Guest');
      contributorMap.set(name, (contributorMap.get(name) || 0) + 1);
    }

    const topContributors = Array.from(contributorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate upload timeline (last 7 days)
    const uploadTimeline: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const count = photos.filter(p => {
        const photoDate = new Date(p.created_at);
        const photoDateStr = photoDate.toISOString().split('T')[0];
        return photoDateStr === dateStr;
      }).length;

      uploadTimeline.push({ date: dateStr, count });
    }

    // Calculate total reactions
    let totalReactions = 0;
    for (const photo of photos) {
      totalReactions += photo.reactions.heart || 0;
      totalReactions += photo.reactions.clap || 0;
      totalReactions += photo.reactions.laugh || 0;
      totalReactions += photo.reactions.wow || 0;
    }

    // Count pending moderation
    const pendingModeration = photos.filter(p => p.status === 'pending').length;

    const stats: EventStats = {
      totalPhotos,
      totalParticipants,
      photosToday,
      avgPhotosPerUser,
      topContributors,
      uploadTimeline,
      totalReactions,
      pendingModeration,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('[API] Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
