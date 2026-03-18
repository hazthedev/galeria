import { deserializeQuarantineMetadata } from './quarantine';

describe('deserializeQuarantineMetadata', () => {
  test('hydrates stored date strings into Date instances', () => {
    const metadata = deserializeQuarantineMetadata({
      photoId: 'photo-1',
      eventId: 'event-1',
      originalPath: 'event-1/photo-1',
      status: 'pending',
      flaggedAt: '2026-03-19T00:00:00.000Z',
      expiresAt: '2026-03-26T00:00:00.000Z',
      reviewedAt: '2026-03-20T00:00:00.000Z',
      reviewedBy: 'moderator-1',
      reason: 'Flagged',
      categories: ['unsafe'],
    });

    expect(metadata.flaggedAt).toBeInstanceOf(Date);
    expect(metadata.expiresAt).toBeInstanceOf(Date);
    expect(metadata.reviewedAt).toBeInstanceOf(Date);
    expect(metadata.expiresAt.getTime()).toBeGreaterThan(metadata.flaggedAt.getTime());
  });
});
