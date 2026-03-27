export interface EventPhotoLimitSummary {
  tierMaxPhotosPerEvent: number;
  tenantMaxPhotosPerEvent: number;
  configuredMaxPhotosPerEvent: number;
  effectiveMaxPhotosPerEvent: number;
  remainingPhotosInEvent: number;
}

export function normalizeConfiguredEventPhotoLimit(settings: unknown): number {
  if (!settings || typeof settings !== 'object') {
    return 50;
  }

  const limitsRaw = (settings as Record<string, unknown>).limits;
  if (!limitsRaw || typeof limitsRaw !== 'object') {
    return 50;
  }

  const value = (limitsRaw as Record<string, unknown>).max_total_photos;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  if (parsed === -1) {
    return -1;
  }

  if (parsed <= 0) {
    return 50;
  }

  return parsed;
}

export function getEffectiveEventPhotoLimit(tenantLimit: number, configuredLimit: number): number {
  if (tenantLimit === -1) {
    return configuredLimit;
  }

  if (configuredLimit === -1) {
    return tenantLimit;
  }

  return Math.min(tenantLimit, configuredLimit);
}

export function getRemaining(limit: number, used: number): number {
  if (limit === -1) {
    return -1;
  }

  return Math.max(0, limit - used);
}

export function buildEventPhotoLimitSummary(input: {
  tierMaxPhotosPerEvent: number;
  tenantMaxPhotosPerEvent: number;
  configuredMaxPhotosPerEvent: number;
  totalPhotos: number;
}): EventPhotoLimitSummary {
  const effectiveMaxPhotosPerEvent = getEffectiveEventPhotoLimit(
    input.tenantMaxPhotosPerEvent,
    input.configuredMaxPhotosPerEvent
  );

  return {
    tierMaxPhotosPerEvent: input.tierMaxPhotosPerEvent,
    tenantMaxPhotosPerEvent: input.tenantMaxPhotosPerEvent,
    configuredMaxPhotosPerEvent: input.configuredMaxPhotosPerEvent,
    effectiveMaxPhotosPerEvent,
    remainingPhotosInEvent: getRemaining(effectiveMaxPhotosPerEvent, input.totalPhotos),
  };
}
