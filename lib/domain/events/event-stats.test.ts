import {
  buildEventPhotoLimitSummary,
  normalizeConfiguredEventPhotoLimit,
} from './event-stats';

describe('event photo limit summary helpers', () => {
  it('caps remaining photos using the effective tenant entitlement instead of the base tier default', () => {
    const summary = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: 100,
      tenantMaxPhotosPerEvent: 250,
      configuredMaxPhotosPerEvent: 200,
      totalPhotos: 40,
    });

    expect(summary.tierMaxPhotosPerEvent).toBe(100);
    expect(summary.tenantMaxPhotosPerEvent).toBe(250);
    expect(summary.effectiveMaxPhotosPerEvent).toBe(200);
    expect(summary.remainingPhotosInEvent).toBe(160);
  });

  it('respects lower tenant overrides even when the event config is higher', () => {
    const summary = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: 100,
      tenantMaxPhotosPerEvent: 40,
      configuredMaxPhotosPerEvent: 80,
      totalPhotos: 12,
    });

    expect(summary.effectiveMaxPhotosPerEvent).toBe(40);
    expect(summary.remainingPhotosInEvent).toBe(28);
  });

  it('uses the configured event cap for unlimited tenants', () => {
    const summary = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: -1,
      tenantMaxPhotosPerEvent: -1,
      configuredMaxPhotosPerEvent: 75,
      totalPhotos: 10,
    });

    expect(summary.effectiveMaxPhotosPerEvent).toBe(75);
    expect(summary.remainingPhotosInEvent).toBe(65);
  });

  it('keeps remaining photos unlimited when both tenant and event allow unlimited uploads', () => {
    const summary = buildEventPhotoLimitSummary({
      tierMaxPhotosPerEvent: -1,
      tenantMaxPhotosPerEvent: -1,
      configuredMaxPhotosPerEvent: -1,
      totalPhotos: 500,
    });

    expect(summary.effectiveMaxPhotosPerEvent).toBe(-1);
    expect(summary.remainingPhotosInEvent).toBe(-1);
  });

  it('normalizes invalid configured limits to the repository default', () => {
    expect(normalizeConfiguredEventPhotoLimit(undefined)).toBe(50);
    expect(normalizeConfiguredEventPhotoLimit({ limits: { max_total_photos: 0 } })).toBe(50);
    expect(normalizeConfiguredEventPhotoLimit({ limits: { max_total_photos: '120' } })).toBe(120);
  });
});
