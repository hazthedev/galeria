import {
  buildFailedPhotoScanLog,
  buildProcessedPhotoScanLog,
  buildQueuedPhotoScanLog,
} from './scan-logs';

describe('photo scan log helpers', () => {
  const baseJob = {
    photoId: 'photo-1',
    eventId: 'event-1',
    tenantId: 'tenant-1',
    imageUrl: 'https://cdn.test/photo-1.jpg',
  };

  test('buildQueuedPhotoScanLog returns null without tenant context', () => {
    expect(buildQueuedPhotoScanLog({ ...baseJob, tenantId: undefined }, 'job-1')).toBeNull();
  });

  test('buildQueuedPhotoScanLog marks reported scans correctly', () => {
    expect(buildQueuedPhotoScanLog({ ...baseJob, isReported: true }, 'job-1')).toMatchObject({
      tenantId: 'tenant-1',
      outcome: 'queued',
      triggerType: 'report',
      isReported: true,
      jobId: 'job-1',
    });
  });

  test('buildProcessedPhotoScanLog preserves scan result details', () => {
    const scannedAt = new Date('2026-03-19T10:00:00.000Z');

    expect(buildProcessedPhotoScanLog({
      job: { ...baseJob, isReported: false, tenantId: 'tenant-1' },
      jobId: 'job-2',
      moderationResult: {
        action: 'review',
        reason: 'Flagged for review: unsafe',
        categories: ['unsafe'],
        labels: [
          { name: 'Unsafe', confidence: 0.91, category: 'unsafe' },
        ],
        confidence: 0.91,
        scannedAt,
      },
      transition: { outcome: 'skipped' },
    })).toMatchObject({
      decision: 'review',
      outcome: 'skipped',
      reason: 'Flagged for review: unsafe',
      categories: ['unsafe'],
      confidence: 0.91,
      scannedAt,
    });
  });

  test('buildFailedPhotoScanLog captures worker failures as error decisions', () => {
    expect(buildFailedPhotoScanLog({
      job: { ...baseJob, tenantId: 'tenant-1' },
      error: 'Network timeout',
      jobId: 'job-3',
    })).toMatchObject({
      decision: 'error',
      outcome: 'failed',
      error: 'Network timeout',
      jobId: 'job-3',
    });
  });
});
