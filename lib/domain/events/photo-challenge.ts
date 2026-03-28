// ============================================
// Photo Challenge Library
// ============================================

import type { TenantDatabase } from '@/lib/db';
import type { IPhotoChallenge, IGuestPhotoProgress, IPrizeClaim } from '@/lib/types';

export function getGuestFingerprintCandidates(fingerprint: string): string[] {
  const trimmed = fingerprint.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('guest_')) {
    const unprefixed = trimmed.slice('guest_'.length).trim();
    return unprefixed ? [trimmed, unprefixed] : [trimmed];
  }

  return [trimmed, `guest_${trimmed}`];
}

export function normalizeGuestChallengeFingerprint(fingerprint: string): string {
  const [primary, secondary] = getGuestFingerprintCandidates(fingerprint);
  return secondary || primary || fingerprint.trim();
}

export async function findGuestProgressByFingerprint(
  db: TenantDatabase,
  eventId: string,
  fingerprint: string
): Promise<IGuestPhotoProgress | null> {
  for (const candidate of getGuestFingerprintCandidates(fingerprint)) {
    const progress = await db.findOne<IGuestPhotoProgress>('guest_photo_progress', {
      event_id: eventId,
      user_fingerprint: candidate,
    });

    if (progress) {
      return progress;
    }
  }

  return null;
}

export async function findPrizeClaimByFingerprint(
  db: TenantDatabase,
  eventId: string,
  fingerprint: string
): Promise<IPrizeClaim | null> {
  for (const candidate of getGuestFingerprintCandidates(fingerprint)) {
    const claim = await db.findOne<IPrizeClaim>('prize_claims', {
      event_id: eventId,
      user_fingerprint: candidate,
    });

    if (claim) {
      return claim;
    }
  }

  return null;
}

export async function countApprovedGuestChallengePhotos(
  db: TenantDatabase,
  eventId: string,
  fingerprint: string
): Promise<number> {
  const candidates = Array.from(
    new Set(
      getGuestFingerprintCandidates(fingerprint).map((candidate) =>
        candidate.startsWith('guest_') ? candidate : `guest_${candidate}`
      )
    )
  );

  if (candidates.length === 0) {
    return 0;
  }

  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM photos
     WHERE event_id = $1
       AND status = 'approved'
       AND user_fingerprint = ANY($2::text[])`,
    [eventId, candidates]
  );

  return Number(result.rows[0]?.count || 0);
}

// Get active photo challenge config for an event
export async function getActiveChallenge(
  db: TenantDatabase,
  eventId: string
): Promise<IPhotoChallenge | null> {
  const challenge = await db.findOne<IPhotoChallenge>('photo_challenges', {
    event_id: eventId,
    enabled: true,
  });
  return challenge || null;
}

// Get or create guest progress record
export async function getOrCreateGuestProgress(
  db: TenantDatabase,
  eventId: string,
  userFingerprint: string
): Promise<IGuestPhotoProgress | null> {
  // Try to find existing progress
  let progress = await db.findOne<IGuestPhotoProgress>('guest_photo_progress', {
    event_id: eventId,
    user_fingerprint: userFingerprint,
  });

  // If not found, create new
  if (!progress) {
    const challenge = await getActiveChallenge(db, eventId);
    if (!challenge) return null;

    progress = await db.insert<IGuestPhotoProgress>('guest_photo_progress', {
      id: crypto.randomUUID(),
      event_id: eventId,
      user_fingerprint: userFingerprint,
      photos_uploaded: 0,
      photos_approved: 0,
      goal_reached: false,
      prize_claimed_at: null,
      prize_revoked: false,
      revoke_reason: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return progress;
}

// Update guest progress after photo upload
export async function updateGuestProgress(
  db: TenantDatabase,
  eventId: string,
  userFingerprint: string,
  photoApproved: boolean
): Promise<{ progress: IGuestPhotoProgress | null; goalJustReached: boolean }> {
  const challenge = await getActiveChallenge(db, eventId);
  if (!challenge) {
    return { progress: null, goalJustReached: false };
  }

  const progress = await getOrCreateGuestProgress(db, eventId, userFingerprint);
  if (!progress) {
    return { progress: null, goalJustReached: false };
  }

  // Update counters
  const nextApprovedCount = photoApproved
    ? (progress.photos_approved || 0) + 1
    : (progress.photos_approved || 0);
  const updates: Partial<IGuestPhotoProgress> = {
    photos_uploaded: (progress.photos_uploaded || 0) + 1,
    photos_approved: nextApprovedCount,
    goal_reached: progress.goal_reached || nextApprovedCount >= challenge.goal_photos,
    updated_at: new Date(),
  };

  // Update in database
  await db.update(
    'guest_photo_progress',
    updates,
    { id: progress.id }
  );

  // Fetch updated progress
  const updatedProgress = await db.findOne<IGuestPhotoProgress>('guest_photo_progress', {
    id: progress.id,
  });

  const goalJustReached = !progress.goal_reached && (updates.goal_reached ?? false);

  return {
    progress: updatedProgress || null,
    goalJustReached,
  };
}

// Check if prize should be auto-granted
export async function shouldAutoGrantPrize(
  db: TenantDatabase,
  eventId: string,
  userFingerprint: string
): Promise<boolean> {
  const challenge = await getActiveChallenge(db, eventId);
  if (!challenge?.auto_grant) return false;

  const progress = await db.findOne<IGuestPhotoProgress>('guest_photo_progress', {
    event_id: eventId,
    user_fingerprint: userFingerprint,
    goal_reached: true,
    prize_claimed_at: null,
    prize_revoked: false,
  });

  return !!progress;
}

// Create prize claim (generates QR code)
export async function createPrizeClaim(
  db: TenantDatabase,
  eventId: string,
  userFingerprint: string,
  challengeId?: string
): Promise<string | null> {
  const token = crypto.randomUUID().slice(0, 16);

  await db.insert('prize_claims', {
    id: crypto.randomUUID(),
    event_id: eventId,
    user_fingerprint: userFingerprint,
    challenge_id: challengeId || null,
    qr_code_token: token,
    claimed_at: new Date(),
    revoked_at: null,
    revoke_reason: null,
    verified_by: null,
    metadata: null,
    created_at: new Date(),
  });

  // Mark prize as claimed
  await db.update(
    'guest_photo_progress',
    {
      prize_claimed_at: new Date(),
      updated_at: new Date(),
    },
    {
      event_id: eventId,
      user_fingerprint: userFingerprint,
    }
  );

  return token;
}
