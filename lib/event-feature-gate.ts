// ============================================
// Galeria - Event Feature Gate
// ============================================
// Simple feature flag checking based on event settings

import type { IEvent } from './types';

// ============================================
// TYPES
// ============================================

export class FeatureDisabledError extends Error {
  constructor(public feature: string) {
    super(`Feature "${feature}" is disabled for this event`);
    this.name = 'FeatureDisabledError';
  }
}

// ============================================
// FUNCTIONS
// ============================================

export function assertEventFeatureEnabled(event: IEvent | null | undefined, featureKey: keyof IEvent['settings']['features']): void {
  if (!event?.settings?.features?.[featureKey]) {
    throw new FeatureDisabledError(featureKey);
  }
}

export function isFeatureDisabledError(error: unknown): error is FeatureDisabledError {
  return error instanceof FeatureDisabledError;
}

export function buildFeatureDisabledPayload(feature: string) {
  return {
    error: `Feature "${feature}" is not enabled for this event`,
    code: 'FEATURE_DISABLED',
    feature,
  };
}
