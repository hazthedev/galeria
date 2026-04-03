// ============================================
// Galeria - Lucky Draw Broadcast Utilities
// ============================================

export function mapPrizeTierToLegacy(prizeTier: unknown): number {
  if (typeof prizeTier === 'number' && Number.isFinite(prizeTier)) {
    return prizeTier;
  }

  if (typeof prizeTier !== 'string') {
    return 1;
  }

  const lookup: Record<string, number> = {
    grand: 1,
    first: 2,
    second: 3,
    third: 4,
    consolation: 5,
  };

  return lookup[prizeTier] ?? 1;
}

export function mapWinnerToBroadcastPayload(
  winner: {
    id?: string;
    eventId?: string;
    entryId?: string;
    userFingerprint?: string;
    participantName?: string;
    selfieUrl?: string;
    prizeTier?: string | number;
    prizeName?: string;
    drawnAt?: Date;
    isClaimed?: boolean;
  },
  eventId: string
) {
  const normalizedEventId = winner.eventId || eventId;
  const normalizedEntryId = winner.entryId || '';
  const normalizedParticipant = winner.participantName || 'Anonymous';
  const normalizedSelfie = winner.selfieUrl || '';
  const normalizedPrizeTier = mapPrizeTierToLegacy(winner.prizeTier);
  const normalizedDrawnAt = winner.drawnAt ?? new Date();
  const normalizedFingerprint = winner.userFingerprint || '';
  const normalizedPrizeName = winner.prizeName || '';

  return {
    // Legacy snake_case fields (guest page compatibility)
    id: winner.id || `winner_${Date.now()}`,
    event_id: normalizedEventId,
    entry_id: normalizedEntryId,
    user_fingerprint: normalizedFingerprint,
    participant_name: normalizedParticipant,
    selfie_url: normalizedSelfie,
    prize_tier: normalizedPrizeTier,
    prize_name: normalizedPrizeName,
    drawn_at: normalizedDrawnAt,
    drawn_by: 'admin',
    is_claimed: winner.isClaimed ?? false,

    // V2 camelCase mirrors (additive compatibility)
    eventId: normalizedEventId,
    entryId: normalizedEntryId,
    userFingerprint: normalizedFingerprint,
    participantName: normalizedParticipant,
    selfieUrl: normalizedSelfie,
    prizeTier: winner.prizeTier,
    prizeName: normalizedPrizeName,
    drawnAt: normalizedDrawnAt,
    isClaimed: winner.isClaimed ?? false,
  };
}
