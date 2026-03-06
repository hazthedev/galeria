import { getEffectiveEntitlementsForTier, normalizeSubscriptionTier } from './entitlements';
import { TIER_CONFIGS } from './tier-config';

describe('tenant entitlements', () => {
  test('normalizes unknown tiers to free', () => {
    expect(normalizeSubscriptionTier('starter')).toBe('free');
    expect(normalizeSubscriptionTier(null)).toBe('free');
  });

  test('returns the canonical tier config when there are no overrides', () => {
    expect(getEffectiveEntitlementsForTier('premium')).toEqual(TIER_CONFIGS.premium);
  });

  test('merges and sanitizes feature and limit overrides', () => {
    const entitlements = getEffectiveEntitlementsForTier('free', {
      featuresEnabled: {
        lucky_draw: true,
        api_access: 'yes',
      },
      limits: {
        max_events_per_month: '5',
        max_photos_per_event: 42,
        max_storage_gb: 'not-a-number',
        custom_features: ['priority-support', 123],
      },
    });

    expect(entitlements.features.lucky_draw).toBe(true);
    expect(entitlements.features.api_access).toBe(false);
    expect(entitlements.limits.max_events_per_month).toBe(5);
    expect(entitlements.limits.max_photos_per_event).toBe(42);
    expect(entitlements.limits.max_storage_gb).toBe(TIER_CONFIGS.free.limits.max_storage_gb);
    expect(entitlements.limits.custom_features).toEqual(['priority-support']);
  });
});
