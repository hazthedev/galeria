import 'server-only';

import {
  ADMIN_SEARCH_DEFAULT_LIMIT,
  ADMIN_SEARCH_ENTITY_TYPES,
  isAdminSearchQueryValid,
  normalizeAdminSearchQuery,
} from '@/lib/domain/admin/search';
import { getAdminDb } from '@/lib/domain/admin/context';
import {
  EMPTY_ADMIN_SEARCH_COUNTS,
  type AdminSearchData,
  type AdminSearchEntityType,
  type AdminSearchResult,
} from '@/lib/domain/admin/types';

interface SearchAdminEntitiesOptions {
  limit?: number;
  types?: AdminSearchEntityType[];
}

export async function searchAdminEntities(
  query: string,
  options: SearchAdminEntitiesOptions = {}
): Promise<AdminSearchData> {
  const normalizedQuery = normalizeAdminSearchQuery(query);
  const limit = options.limit || ADMIN_SEARCH_DEFAULT_LIMIT;
  const types = options.types?.length ? options.types : ADMIN_SEARCH_ENTITY_TYPES;
  const counts = { ...EMPTY_ADMIN_SEARCH_COUNTS };

  if (!isAdminSearchQueryValid(normalizedQuery)) {
    return {
      query: normalizedQuery,
      results: [],
      counts,
      limit,
    };
  }

  const db = getAdminDb();
  const likeQuery = `%${normalizedQuery}%`;
  const prefixQuery = `${normalizedQuery}%`;
  const perTypeLimit = Math.max(1, Math.ceil(limit / types.length));
  const results: AdminSearchResult[] = [];

  if (types.includes('user')) {
    const userResult = await db.query<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      createdAt: Date;
      tenantId: string | null;
      tenantName: string | null;
    }>(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.created_at AS "createdAt",
          u.tenant_id AS "tenantId",
          t.company_name AS "tenantName"
        FROM users u
        LEFT JOIN tenants t ON t.id = u.tenant_id
        WHERE u.name ILIKE $2 OR u.email ILIKE $2
        ORDER BY
          CASE
            WHEN LOWER(u.email) = LOWER($1) THEN 0
            WHEN LOWER(COALESCE(u.name, '')) = LOWER($1) THEN 1
            WHEN u.email ILIKE $3 THEN 2
            WHEN COALESCE(u.name, '') ILIKE $3 THEN 3
            ELSE 4
          END,
          u.created_at DESC
        LIMIT $4
      `,
      [normalizedQuery, likeQuery, prefixQuery, perTypeLimit]
    );

    counts.user = userResult.rows.length;
    results.push(
      ...userResult.rows.map((row) => ({
        id: row.id,
        type: 'user' as const,
        title: row.name || row.email,
        subtitle: row.email,
        description: row.role ? `Role: ${row.role}` : null,
        status: row.role,
        href: `/admin/users/${row.id}`,
        createdAt: row.createdAt.toISOString(),
        tenantId: row.tenantId,
        tenantName: row.tenantName,
      }))
    );
  }

  if (types.includes('event')) {
    const eventResult = await db.query<{
      id: string;
      name: string;
      shortCode: string;
      status: string;
      createdAt: Date;
      tenantId: string;
      tenantName: string | null;
    }>(
      `
        SELECT
          e.id,
          e.name,
          e.short_code AS "shortCode",
          e.status,
          e.created_at AS "createdAt",
          e.tenant_id AS "tenantId",
          t.company_name AS "tenantName"
        FROM events e
        LEFT JOIN tenants t ON t.id = e.tenant_id
        WHERE e.name ILIKE $2 OR e.short_code ILIKE $2
        ORDER BY
          CASE
            WHEN LOWER(e.short_code) = LOWER($1) THEN 0
            WHEN LOWER(e.name) = LOWER($1) THEN 1
            WHEN e.short_code ILIKE $3 THEN 2
            WHEN e.name ILIKE $3 THEN 3
            ELSE 4
          END,
          e.created_at DESC
        LIMIT $4
      `,
      [normalizedQuery, likeQuery, prefixQuery, perTypeLimit]
    );

    counts.event = eventResult.rows.length;
    results.push(
      ...eventResult.rows.map((row) => ({
        id: row.id,
        type: 'event' as const,
        title: row.name,
        subtitle: row.shortCode,
        description: row.shortCode ? `Short code: ${row.shortCode}` : null,
        status: row.status,
        href: `/admin/events/${row.id}`,
        createdAt: row.createdAt.toISOString(),
        tenantId: row.tenantId,
        tenantName: row.tenantName,
      }))
    );
  }

  if (types.includes('tenant')) {
    const tenantResult = await db.query<{
      id: string;
      companyName: string;
      subdomain: string | null;
      status: string;
      subscriptionTier: string;
      createdAt: Date;
    }>(
      `
        SELECT
          t.id,
          t.company_name AS "companyName",
          t.subdomain,
          t.status,
          t.subscription_tier AS "subscriptionTier",
          t.created_at AS "createdAt"
        FROM tenants t
        WHERE t.company_name ILIKE $2 OR t.subdomain ILIKE $2
        ORDER BY
          CASE
            WHEN LOWER(t.subdomain) = LOWER($1) THEN 0
            WHEN LOWER(t.company_name) = LOWER($1) THEN 1
            WHEN t.subdomain ILIKE $3 THEN 2
            WHEN t.company_name ILIKE $3 THEN 3
            ELSE 4
          END,
          t.created_at DESC
        LIMIT $4
      `,
      [normalizedQuery, likeQuery, prefixQuery, perTypeLimit]
    );

    counts.tenant = tenantResult.rows.length;
    results.push(
      ...tenantResult.rows.map((row) => ({
        id: row.id,
        type: 'tenant' as const,
        title: row.companyName,
        subtitle: row.subdomain,
        description: row.subscriptionTier ? `Plan: ${row.subscriptionTier}` : null,
        status: row.status,
        href: `/admin/tenants/${row.id}`,
        createdAt: row.createdAt.toISOString(),
        tenantId: row.id,
        tenantName: row.companyName,
      }))
    );
  }

  return {
    query: normalizedQuery,
    results: results.slice(0, limit),
    counts,
    limit,
  };
}
