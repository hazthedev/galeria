import type { AdminSearchEntityType } from '@/lib/domain/admin/types';

export const ADMIN_SEARCH_ENTITY_TYPES: AdminSearchEntityType[] = ['tenant', 'event', 'user'];
export const ADMIN_SEARCH_MIN_QUERY_LENGTH = 2;
export const ADMIN_SEARCH_DEFAULT_LIMIT = 12;
export const ADMIN_SEARCH_MAX_LIMIT = 30;

export function normalizeAdminSearchQuery(query: string | null | undefined): string {
  return (query || '').trim().replace(/\s+/g, ' ');
}

export function isAdminSearchQueryValid(query: string): boolean {
  return normalizeAdminSearchQuery(query).length >= ADMIN_SEARCH_MIN_QUERY_LENGTH;
}

export function parseAdminSearchLimit(limit: string | null | undefined): number {
  const parsed = Number.parseInt(limit || `${ADMIN_SEARCH_DEFAULT_LIMIT}`, 10);

  if (!Number.isFinite(parsed)) {
    return ADMIN_SEARCH_DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(parsed, ADMIN_SEARCH_MAX_LIMIT));
}

export function parseAdminSearchTypes(value: string | null | undefined): AdminSearchEntityType[] {
  if (!value) {
    return [...ADMIN_SEARCH_ENTITY_TYPES];
  }

  const requested = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is AdminSearchEntityType =>
      ADMIN_SEARCH_ENTITY_TYPES.includes(entry as AdminSearchEntityType)
    );

  return requested.length > 0 ? requested : [...ADMIN_SEARCH_ENTITY_TYPES];
}
