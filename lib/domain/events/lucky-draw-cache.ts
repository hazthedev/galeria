import 'server-only';

import { deleteKeys } from '@/lib/redis';

export function buildLuckyDrawConfigCacheKey(
  tenantId: string,
  eventId: string,
  activeOnly: boolean
): string {
  return `cache:lucky-draw:config:${tenantId}:${eventId}:${activeOnly ? 'active' : 'latest'}`;
}

export async function clearLuckyDrawConfigReadCache(
  tenantId: string,
  eventId: string
): Promise<void> {
  try {
    await deleteKeys([
      buildLuckyDrawConfigCacheKey(tenantId, eventId, true),
      buildLuckyDrawConfigCacheKey(tenantId, eventId, false),
    ]);
  } catch (error) {
    console.warn('[API] Failed to clear lucky draw config cache:', error);
  }
}
