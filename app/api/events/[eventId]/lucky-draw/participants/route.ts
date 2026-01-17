// ============================================
// MOMENTIQUE - Lucky Draw Participants API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { getTenantDb } from '@/lib/db';
import { getActiveConfig, getEventEntries } from '@/lib/lucky-draw';

// ============================================
// GET /api/events/:eventId/lucky-draw/participants - List participants
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const headers = request.headers;
    const tenantId = getTenantId(headers);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const db = getTenantDb(tenantId);

    // Verify event exists
    const event = await db.findOne('events', { id: eventId });
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get active config
    const config = await getActiveConfig(tenantId, eventId);

    if (!config) {
      return NextResponse.json({
        data: [],
        message: 'No active draw configuration',
      });
    }

    // Get all entries for this draw
    const entries = await getEventEntries(tenantId, config.id);

    // Group by user fingerprint to count entries per user
    const userEntryMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      const existing = userEntryMap.get(entry.userFingerprint) || [];
      existing.push(entry);
      userEntryMap.set(entry.userFingerprint, existing);
    }

    // Format participants list
    const participants = Array.from(userEntryMap.entries()).map(([fingerprint, entries]) => {
      const winnerEntry = entries.find(e => e.isWinner);
      return {
        userFingerprint: fingerprint,
        entryCount: entries.length,
        isWinner: !!winnerEntry,
        prizeTier: winnerEntry?.prizeTier || null,
        firstEntryAt: entries[0]?.createdAt,
        lastEntryAt: entries[entries.length - 1]?.createdAt,
      };
    });

    // Sort by entry count (descending), then by first entry date
    participants.sort((a, b) => {
      if (b.entryCount !== a.entryCount) {
        return b.entryCount - a.entryCount;
      }
      return new Date(a.firstEntryAt).getTime() - new Date(b.firstEntryAt).getTime();
    });

    return NextResponse.json({
      data: participants,
      pagination: {
        total: participants.length,
        uniqueParticipants: participants.length,
        totalEntries: entries.length,
      },
    });
  } catch (error) {
    console.error('[API] Participants fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
