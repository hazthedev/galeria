import { getTenantDb } from '@/lib/db';
import type { ITenantFeatures, ITenantLimits, SubscriptionTier } from '@/lib/types';
import { getTierConfig, type ITierConfig } from './tier-config';

type TenantEntitlementRecord = {
  subscription_tier?: SubscriptionTier | null;
  features_enabled?: Partial<ITenantFeatures> | null;
  limits?: Partial<ITenantLimits> | null;
};

const FEATURE_KEYS: Array<keyof ITenantFeatures> = [
  'lucky_draw',
  'photo_reactions',
  'video_uploads',
  'custom_templates',
  'api_access',
  'sso',
  'white_label',
  'advanced_analytics',
];

const NUMERIC_LIMIT_KEYS: Array<Exclude<keyof ITenantLimits, 'custom_features'>> = [
  'max_events_per_month',
  'max_storage_gb',
  'max_admins',
  'max_photos_per_event',
  'max_draw_entries_per_event',
];

export interface IEffectiveTenantEntitlements extends ITierConfig {
  features: ITenantFeatures;
  limits: ITenantLimits;
}

export function normalizeSubscriptionTier(tier: unknown): SubscriptionTier {
  if (tier === 'free' || tier === 'pro' || tier === 'premium' || tier === 'enterprise' || tier === 'tester') {
    return tier;
  }

  return 'free';
}

function sanitizeFeatureOverrides(value: unknown): Partial<ITenantFeatures> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const sanitized: Partial<ITenantFeatures> = {};

  for (const key of FEATURE_KEYS) {
    if (typeof raw[key] === 'boolean') {
      sanitized[key] = raw[key];
    }
  }

  return sanitized;
}

function sanitizeLimitOverrides(value: unknown): Partial<ITenantLimits> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const sanitized: Partial<ITenantLimits> = {};

  for (const key of NUMERIC_LIMIT_KEYS) {
    const limitValue = raw[key];
    if (typeof limitValue === 'number' && Number.isFinite(limitValue)) {
      sanitized[key] = limitValue;
      continue;
    }

    if (typeof limitValue === 'string' && limitValue.trim() !== '') {
      const parsed = Number(limitValue);
      if (Number.isFinite(parsed)) {
        sanitized[key] = parsed;
      }
    }
  }

  if (Array.isArray(raw.custom_features)) {
    sanitized.custom_features = raw.custom_features.filter(
      (feature): feature is string => typeof feature === 'string'
    );
  }

  return sanitized;
}

export function getEffectiveEntitlementsForTier(
  tier: SubscriptionTier,
  overrides?: {
    featuresEnabled?: unknown;
    limits?: unknown;
  }
): IEffectiveTenantEntitlements {
  const normalizedTier = normalizeSubscriptionTier(tier);
  const baseConfig = getTierConfig(normalizedTier);

  return {
    ...baseConfig,
    features: {
      ...baseConfig.features,
      ...sanitizeFeatureOverrides(overrides?.featuresEnabled),
    },
    limits: {
      ...baseConfig.limits,
      ...sanitizeLimitOverrides(overrides?.limits),
    },
  };
}

export async function getEffectiveTenantEntitlements(
  tenantId: string,
  fallbackTier: SubscriptionTier = 'free'
): Promise<IEffectiveTenantEntitlements> {
  const db = getTenantDb(tenantId);
  const tenant = await db.findOne<TenantEntitlementRecord>('tenants', { id: tenantId });

  return getEffectiveEntitlementsForTier(
    normalizeSubscriptionTier(tenant?.subscription_tier || fallbackTier),
    {
      featuresEnabled: tenant?.features_enabled,
      limits: tenant?.limits,
    }
  );
}

export async function isTenantFeatureEnabled(
  tenantId: string,
  feature: keyof ITenantFeatures,
  fallbackTier: SubscriptionTier = 'free'
): Promise<boolean> {
  const entitlements = await getEffectiveTenantEntitlements(tenantId, fallbackTier);
  return entitlements.features[feature];
}
