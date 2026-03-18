import 'server-only';

import { getTenantDb } from '@/lib/db';
import type { DetectedLabel, ModerationResult } from '@/lib/moderation/auto-moderate';
import type { ModerationServiceResult } from '@/lib/moderation/service';

export type PhotoScanDecision = 'approve' | 'reject' | 'review' | 'error';
export type PhotoScanOutcome = 'queued' | 'applied' | 'skipped' | 'failed';
export type PhotoScanTrigger = 'upload' | 'report';

interface PhotoScanJobContext {
  photoId: string;
  eventId: string;
  tenantId?: string;
  imageUrl: string;
  isReported?: boolean;
}

export interface PhotoScanLogRecordInput {
  photoId: string;
  eventId: string;
  tenantId: string;
  jobId?: string | null;
  source?: string;
  triggerType?: PhotoScanTrigger;
  isReported?: boolean;
  decision?: PhotoScanDecision | null;
  outcome: PhotoScanOutcome;
  reason?: string | null;
  error?: string | null;
  categories?: string[];
  labels?: DetectedLabel[];
  confidence?: number | null;
  imageUrl?: string | null;
  scannedAt?: Date | null;
}

function normalizeText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeConfidence(value?: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildQueuedPhotoScanLog(
  job: PhotoScanJobContext,
  jobId?: string | null
): PhotoScanLogRecordInput | null {
  if (!job.tenantId) {
    return null;
  }

  return {
    photoId: job.photoId,
    eventId: job.eventId,
    tenantId: job.tenantId,
    jobId: jobId ?? null,
    source: 'queue',
    triggerType: job.isReported ? 'report' : 'upload',
    isReported: Boolean(job.isReported),
    outcome: 'queued',
    imageUrl: normalizeText(job.imageUrl),
  };
}

export function buildProcessedPhotoScanLog(input: {
  job: PhotoScanJobContext & { tenantId: string };
  moderationResult: Pick<ModerationResult, 'action' | 'reason' | 'categories' | 'labels' | 'confidence' | 'scannedAt'>;
  transition: Pick<ModerationServiceResult, 'outcome'>;
  jobId?: string | null;
}): PhotoScanLogRecordInput {
  return {
    photoId: input.job.photoId,
    eventId: input.job.eventId,
    tenantId: input.job.tenantId,
    jobId: input.jobId ?? null,
    source: 'queue',
    triggerType: input.job.isReported ? 'report' : 'upload',
    isReported: Boolean(input.job.isReported),
    decision: input.moderationResult.action,
    outcome: input.transition.outcome === 'skipped' ? 'skipped' : 'applied',
    reason: normalizeText(input.moderationResult.reason),
    categories: input.moderationResult.categories,
    labels: input.moderationResult.labels,
    confidence: normalizeConfidence(input.moderationResult.confidence),
    imageUrl: normalizeText(input.job.imageUrl),
    scannedAt: input.moderationResult.scannedAt,
  };
}

export function buildFailedPhotoScanLog(input: {
  job: PhotoScanJobContext & { tenantId: string };
  error: string;
  jobId?: string | null;
  scannedAt?: Date;
}): PhotoScanLogRecordInput {
  return {
    photoId: input.job.photoId,
    eventId: input.job.eventId,
    tenantId: input.job.tenantId,
    jobId: input.jobId ?? null,
    source: 'queue',
    triggerType: input.job.isReported ? 'report' : 'upload',
    isReported: Boolean(input.job.isReported),
    decision: 'error',
    outcome: 'failed',
    error: normalizeText(input.error),
    imageUrl: normalizeText(input.job.imageUrl),
    scannedAt: input.scannedAt || new Date(),
  };
}

export async function recordPhotoScanLog(input: PhotoScanLogRecordInput): Promise<void> {
  const db = getTenantDb(input.tenantId);

  await db.query(
    `
      INSERT INTO photo_scan_logs (
        photo_id,
        event_id,
        tenant_id,
        job_id,
        source,
        trigger_type,
        is_reported,
        decision,
        outcome,
        reason,
        error,
        categories,
        labels,
        confidence,
        image_url,
        scanned_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14, $15, $16
      )
    `,
    [
      input.photoId,
      input.eventId,
      input.tenantId,
      normalizeText(input.jobId),
      normalizeText(input.source) || 'queue',
      normalizeText(input.triggerType) || 'upload',
      Boolean(input.isReported),
      input.decision || null,
      input.outcome,
      normalizeText(input.reason),
      normalizeText(input.error),
      JSON.stringify(input.categories || []),
      JSON.stringify(input.labels || []),
      normalizeConfidence(input.confidence),
      normalizeText(input.imageUrl),
      input.scannedAt || null,
    ]
  );
}

export async function recordPhotoScanLogSafe(input: PhotoScanLogRecordInput | null): Promise<void> {
  if (!input) {
    return;
  }

  try {
    await recordPhotoScanLog(input);
  } catch (error) {
    console.warn('[PHOTO_SCAN_LOG] Failed to persist scan log:', error);
  }
}
