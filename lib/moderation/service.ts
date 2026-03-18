import 'server-only';

import type { PoolClient } from 'pg';
import { getTenantDb } from '@/lib/db';
import { deletePhotoAssets } from '@/lib/images';
import { updateGuestProgress } from '@/lib/lucky-draw';
import { publishEventBroadcast } from '@/lib/realtime/server';
import type { ModerationCategory, ModerationResult } from '@/lib/moderation/auto-moderate';
import {
  approveQuarantinedPhoto,
  getQuarantineMetadata,
  purgeQuarantinedPhoto,
  quarantinePhoto,
  updateQuarantineStatus,
} from '@/lib/storage/quarantine';

type PhotoStatus = 'pending' | 'approved' | 'rejected';
type ModerationAction = 'approve' | 'reject' | 'delete' | 'review';
type ModerationSource = 'manual' | 'ai';

interface ModerationPhotoRecord {
  id: string;
  event_id: string;
  status: PhotoStatus;
  user_fingerprint: string;
  is_anonymous: boolean;
  images: {
    thumbnail_url?: string;
    full_url?: string;
  };
}

interface ModerationLogInput {
  action: ModerationAction;
  eventId: string;
  tenantId: string;
  moderatorId?: string | null;
  photoId?: string | null;
  photoStatus?: string | null;
  imageUrl?: string | null;
  reason?: string | null;
  source: ModerationSource;
}

interface ServiceResultInternal {
  outcome: 'applied' | 'skipped' | 'missing';
  photoId: string;
  eventId?: string;
  status?: PhotoStatus | 'deleted';
  previousStatus?: PhotoStatus;
  message: string;
  challengeApproved?: boolean;
  challengeFingerprint?: string | null;
}

export interface ModerationServiceResult {
  outcome: 'applied' | 'skipped' | 'missing';
  photoId: string;
  eventId?: string;
  status?: PhotoStatus | 'deleted';
  previousStatus?: PhotoStatus;
  message: string;
}

export function canApplyManualModerationAction(
  status: PhotoStatus,
  action: 'approve' | 'reject'
): boolean {
  return status === 'pending' && (action === 'approve' || action === 'reject');
}

export function shouldApplyAutomatedModeration(status: PhotoStatus): boolean {
  return status === 'pending';
}

function buildStatusConflictMessage(action: 'approve' | 'reject', status: PhotoStatus): string {
  const verb = action === 'approve' ? 'approved' : 'rejected';
  return `Photo is already ${status} and cannot be ${verb}`;
}

function getLogImageUrl(photo: ModerationPhotoRecord | null): string | null {
  return photo?.images?.thumbnail_url || photo?.images?.full_url || null;
}

async function hasModerationLogTable(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ name: string | null }>(
    'SELECT to_regclass($1) AS name',
    ['public.photo_moderation_logs']
  );
  return Boolean(result.rows[0]?.name);
}

async function insertModerationLog(client: PoolClient, input: ModerationLogInput): Promise<void> {
  if (!(await hasModerationLogTable(client))) {
    return;
  }

  await client.query(
    `
      INSERT INTO photo_moderation_logs (
        photo_id,
        event_id,
        tenant_id,
        moderator_id,
        action,
        source,
        photo_status,
        image_url,
        reason,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      input.photoId || null,
      input.eventId,
      input.tenantId,
      input.moderatorId || null,
      input.action,
      input.source,
      input.photoStatus || null,
      input.imageUrl || null,
      input.reason || null,
      new Date(),
    ]
  );
}

async function getLockedPhoto(client: PoolClient, photoId: string): Promise<ModerationPhotoRecord | null> {
  const result = await client.query<ModerationPhotoRecord>(
    `
      SELECT
        id,
        event_id,
        status,
        user_fingerprint,
        is_anonymous,
        images
      FROM photos
      WHERE id = $1
      FOR UPDATE
    `,
    [photoId]
  );

  return result.rows[0] || null;
}

function stripReason(reason?: string | null): string | null {
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  return trimmed ? trimmed : null;
}

function finalizeResult(result: ServiceResultInternal): ModerationServiceResult {
  return {
    outcome: result.outcome,
    photoId: result.photoId,
    eventId: result.eventId,
    status: result.status,
    previousStatus: result.previousStatus,
    message: result.message,
  };
}

async function applyChallengeApprovalSideEffect(input: {
  tenantId: string;
  eventId?: string;
  challengeApproved?: boolean;
  challengeFingerprint?: string | null;
}): Promise<void> {
  if (!input.challengeApproved || !input.eventId || !input.challengeFingerprint) {
    return;
  }

  const db = getTenantDb(input.tenantId);
  try {
    await updateGuestProgress(db, input.eventId, input.challengeFingerprint, true);
  } catch (error) {
    console.warn('[MODERATION] Photo challenge progress update skipped:', error);
  }
}

async function broadcastStatusChange(input: {
  eventId?: string;
  photoId: string;
  status?: PhotoStatus;
}): Promise<void> {
  if (!input.eventId || !input.status) {
    return;
  }

  await publishEventBroadcast(input.eventId, 'photo_updated', {
    photo_id: input.photoId,
    status: input.status,
    event_id: input.eventId,
  });
}

export async function approvePhotoManually(input: {
  tenantId: string;
  photoId: string;
  moderatorId: string;
  reason?: string | null;
}): Promise<ModerationServiceResult> {
  const db = getTenantDb(input.tenantId);
  const normalizedReason = stripReason(input.reason);

  const result = await db.transact<ServiceResultInternal>(async (client) => {
    const photo = await getLockedPhoto(client, input.photoId);

    if (!photo) {
      return {
        outcome: 'missing',
        photoId: input.photoId,
        message: 'Photo not found',
      };
    }

    if (!canApplyManualModerationAction(photo.status, 'approve')) {
      return {
        outcome: 'skipped',
        photoId: photo.id,
        eventId: photo.event_id,
        previousStatus: photo.status,
        status: photo.status,
        message: buildStatusConflictMessage('approve', photo.status),
      };
    }

    if (await getQuarantineMetadata(photo.id)) {
      await approveQuarantinedPhoto(photo.id, input.moderatorId);
    }

    await client.query(
      'UPDATE photos SET status = $1, approved_at = $2 WHERE id = $3',
      ['approved', new Date(), photo.id]
    );

    await insertModerationLog(client, {
      action: 'approve',
      eventId: photo.event_id,
      tenantId: input.tenantId,
      moderatorId: input.moderatorId,
      photoId: photo.id,
      photoStatus: 'approved',
      imageUrl: getLogImageUrl(photo),
      reason: normalizedReason,
      source: 'manual',
    });

    return {
      outcome: 'applied',
      photoId: photo.id,
      eventId: photo.event_id,
      previousStatus: photo.status,
      status: 'approved',
      message: 'Photo approved successfully',
      challengeApproved: !photo.is_anonymous,
      challengeFingerprint: photo.user_fingerprint,
    };
  });

  await applyChallengeApprovalSideEffect({
    tenantId: input.tenantId,
    eventId: result.outcome === 'applied' ? result.eventId : undefined,
    challengeApproved: result.outcome === 'applied' ? result.challengeApproved : false,
    challengeFingerprint: result.outcome === 'applied' ? result.challengeFingerprint : null,
  });
  await broadcastStatusChange({
    eventId: result.outcome === 'applied' ? result.eventId : undefined,
    photoId: result.photoId,
    status:
      result.outcome === 'applied' && result.status === 'approved'
        ? 'approved'
        : undefined,
  });

  return finalizeResult(result);
}

export async function rejectPhotoManually(input: {
  tenantId: string;
  photoId: string;
  moderatorId: string;
  reason?: string | null;
  categories?: ModerationCategory[];
}): Promise<ModerationServiceResult> {
  const db = getTenantDb(input.tenantId);
  const normalizedReason = stripReason(input.reason);

  const result = await db.transact<ServiceResultInternal>(async (client) => {
    const photo = await getLockedPhoto(client, input.photoId);

    if (!photo) {
      return {
        outcome: 'missing',
        photoId: input.photoId,
        message: 'Photo not found',
      };
    }

    if (!canApplyManualModerationAction(photo.status, 'reject')) {
      return {
        outcome: 'skipped',
        photoId: photo.id,
        eventId: photo.event_id,
        previousStatus: photo.status,
        status: photo.status,
        message: buildStatusConflictMessage('reject', photo.status),
      };
    }

    const quarantineMetadata = await getQuarantineMetadata(photo.id);
    if (quarantineMetadata) {
      await updateQuarantineStatus(photo.id, {
        status: 'rejected',
        reviewedBy: input.moderatorId,
        reviewedAt: new Date(),
        reason: normalizedReason || quarantineMetadata.reason,
        categories: input.categories || quarantineMetadata.categories,
      });
    } else {
      await quarantinePhoto(photo.event_id, photo.id, normalizedReason || undefined, input.categories);
      await updateQuarantineStatus(photo.id, {
        status: 'rejected',
        reviewedBy: input.moderatorId,
        reviewedAt: new Date(),
        reason: normalizedReason || undefined,
        categories: input.categories,
      });
    }

    await client.query(
      'UPDATE photos SET status = $1, approved_at = NULL WHERE id = $2',
      ['rejected', photo.id]
    );

    await insertModerationLog(client, {
      action: 'reject',
      eventId: photo.event_id,
      tenantId: input.tenantId,
      moderatorId: input.moderatorId,
      photoId: photo.id,
      photoStatus: 'rejected',
      imageUrl: getLogImageUrl(photo),
      reason: normalizedReason,
      source: 'manual',
    });

    return {
      outcome: 'applied',
      photoId: photo.id,
      eventId: photo.event_id,
      previousStatus: photo.status,
      status: 'rejected',
      message: 'Photo rejected successfully',
    };
  });

  await broadcastStatusChange({
    eventId: result.outcome === 'applied' ? result.eventId : undefined,
    photoId: result.photoId,
    status:
      result.outcome === 'applied' && result.status === 'rejected'
        ? 'rejected'
        : undefined,
  });

  return finalizeResult(result);
}

export async function deletePhotoManually(input: {
  tenantId: string;
  photoId: string;
  moderatorId: string;
  reason?: string | null;
}): Promise<ModerationServiceResult> {
  const db = getTenantDb(input.tenantId);
  const normalizedReason = stripReason(input.reason);

  const result = await db.transact<ServiceResultInternal>(async (client) => {
    const photo = await getLockedPhoto(client, input.photoId);

    if (!photo) {
      return {
        outcome: 'missing',
        photoId: input.photoId,
        message: 'Photo not found',
      };
    }

    try {
      await deletePhotoAssets(photo.event_id, photo.id);
    } catch (error) {
      console.warn('[MODERATION] Failed to delete public photo assets:', error);
    }

    try {
      await purgeQuarantinedPhoto(photo.id);
    } catch (error) {
      console.warn('[MODERATION] Failed to purge quarantined assets:', error);
    }

    await insertModerationLog(client, {
      action: 'delete',
      eventId: photo.event_id,
      tenantId: input.tenantId,
      moderatorId: input.moderatorId,
      photoId: photo.id,
      photoStatus: photo.status,
      imageUrl: getLogImageUrl(photo),
      reason: normalizedReason,
      source: 'manual',
    });

    await client.query('DELETE FROM photos WHERE id = $1', [photo.id]);

    return {
      outcome: 'applied',
      photoId: photo.id,
      eventId: photo.event_id,
      previousStatus: photo.status,
      status: 'deleted',
      message: 'Photo deleted successfully',
    };
  });

  return finalizeResult(result);
}

export async function applyAutomatedModerationResult(input: {
  tenantId: string;
  photoId: string;
  moderationResult: Pick<ModerationResult, 'action' | 'reason' | 'categories'>;
}): Promise<ModerationServiceResult> {
  const db = getTenantDb(input.tenantId);

  const result = await db.transact<ServiceResultInternal>(async (client) => {
    const photo = await getLockedPhoto(client, input.photoId);

    if (!photo) {
      return {
        outcome: 'missing',
        photoId: input.photoId,
        message: 'Photo not found',
      };
    }

    if (!shouldApplyAutomatedModeration(photo.status)) {
      return {
        outcome: 'skipped',
        photoId: photo.id,
        eventId: photo.event_id,
        previousStatus: photo.status,
        status: photo.status,
        message: `Photo is already ${photo.status}; skipping queued moderation result`,
      };
    }

    const normalizedReason = stripReason(input.moderationResult.reason);

    if (input.moderationResult.action === 'approve') {
      await client.query(
        'UPDATE photos SET status = $1, approved_at = $2 WHERE id = $3',
        ['approved', new Date(), photo.id]
      );

      await insertModerationLog(client, {
        action: 'approve',
        eventId: photo.event_id,
        tenantId: input.tenantId,
        photoId: photo.id,
        photoStatus: 'approved',
        imageUrl: getLogImageUrl(photo),
        reason: normalizedReason,
        source: 'ai',
      });

      return {
        outcome: 'applied',
        photoId: photo.id,
        eventId: photo.event_id,
        previousStatus: photo.status,
        status: 'approved',
        message: 'Photo auto-approved',
        challengeApproved: !photo.is_anonymous,
        challengeFingerprint: photo.user_fingerprint,
      };
    }

    if (input.moderationResult.action === 'reject') {
      const quarantineMetadata = await getQuarantineMetadata(photo.id);
      if (quarantineMetadata) {
        await updateQuarantineStatus(photo.id, {
          status: 'rejected',
          reviewedAt: new Date(),
          reason: normalizedReason || quarantineMetadata.reason,
          categories: input.moderationResult.categories || quarantineMetadata.categories,
        });
      } else {
        await quarantinePhoto(
          photo.event_id,
          photo.id,
          normalizedReason || undefined,
          input.moderationResult.categories
        );
        await updateQuarantineStatus(photo.id, {
          status: 'rejected',
          reviewedAt: new Date(),
          reason: normalizedReason || undefined,
          categories: input.moderationResult.categories,
        });
      }

      await client.query(
        'UPDATE photos SET status = $1, approved_at = NULL WHERE id = $2',
        ['rejected', photo.id]
      );

      await insertModerationLog(client, {
        action: 'reject',
        eventId: photo.event_id,
        tenantId: input.tenantId,
        photoId: photo.id,
        photoStatus: 'rejected',
        imageUrl: getLogImageUrl(photo),
        reason: normalizedReason,
        source: 'ai',
      });

      return {
        outcome: 'applied',
        photoId: photo.id,
        eventId: photo.event_id,
        previousStatus: photo.status,
        status: 'rejected',
        message: 'Photo auto-rejected',
      };
    }

    if (input.moderationResult.categories.length > 0) {
      const quarantineMetadata = await getQuarantineMetadata(photo.id);
      if (quarantineMetadata) {
        await updateQuarantineStatus(photo.id, {
          status: 'pending',
          reason: normalizedReason || quarantineMetadata.reason,
          categories: input.moderationResult.categories || quarantineMetadata.categories,
        });
      } else {
        await quarantinePhoto(
          photo.event_id,
          photo.id,
          normalizedReason || undefined,
          input.moderationResult.categories
        );
      }
    }

    await insertModerationLog(client, {
      action: 'review',
      eventId: photo.event_id,
      tenantId: input.tenantId,
      photoId: photo.id,
      photoStatus: 'pending',
      imageUrl: getLogImageUrl(photo),
      reason: normalizedReason,
      source: 'ai',
    });

    return {
      outcome: 'applied',
      photoId: photo.id,
      eventId: photo.event_id,
      previousStatus: photo.status,
      status: 'pending',
      message: 'Photo kept pending for review',
    };
  });

  await applyChallengeApprovalSideEffect({
    tenantId: input.tenantId,
    eventId: result.outcome === 'applied' ? result.eventId : undefined,
    challengeApproved: result.outcome === 'applied' ? result.challengeApproved : false,
    challengeFingerprint: result.outcome === 'applied' ? result.challengeFingerprint : null,
  });
  await broadcastStatusChange({
    eventId: result.outcome === 'applied' ? result.eventId : undefined,
    photoId: result.photoId,
    status:
      result.outcome === 'applied' &&
      (result.status === 'approved' || result.status === 'rejected')
        ? result.status
        : undefined,
  });

  return finalizeResult(result);
}
