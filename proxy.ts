// ============================================
// Galeria - Next.js Proxy
// ============================================
// Active request-time tenant resolution for App Router requests.
//
// This file is intentionally named `proxy.ts` because Next.js 16 renamed
// the old `middleware.ts` interception point to `proxy.ts`. It is still live
// in production and is responsible for attaching tenant headers before the
// request reaches route handlers, layouts, or pages.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_TENANT_ID } from '@/lib/constants/tenants';

const MASTER_DOMAIN = (process.env.NEXT_PUBLIC_MASTER_DOMAIN || 'app.galeria.com').toLowerCase();
const APP_URL_HOST = (process.env.NEXT_PUBLIC_APP_URL || '')
  .replace(/^https?:\/\//, '')
  .split('/')[0]
  .toLowerCase();

function withDefaultTenantHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-tenant-id', DEFAULT_TENANT_ID);
  headers.set('x-tenant-type', 'master');
  headers.set('x-tenant-tier', 'enterprise');
  headers.set('x-tenant-name', 'Galeria');
  headers.set('x-tenant-branding', JSON.stringify({
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    accent_color: '#F59E0B',
  }));
  headers.set('x-tenant-features', JSON.stringify({
    lucky_draw: true,
    photo_reactions: true,
    video_uploads: true,
    custom_templates: true,
    api_access: true,
    sso: true,
    white_label: true,
    advanced_analytics: true,
  }));
  headers.set('x-tenant-limits', JSON.stringify({
    max_events_per_month: -1,
    max_storage_gb: -1,
    max_admins: -1,
    max_photos_per_event: -1,
    max_draw_entries_per_event: -1,
  }));
  headers.set('x-is-custom-domain', 'false');
  headers.set('x-is-master', 'true');
  return NextResponse.next({ request: { headers } });
}

type ResolvedTenantPayload = {
  id: string;
  tenantType: string;
  tenantTier: string;
  tenantName?: string;
  branding: Record<string, unknown>;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  status: string;
  isCustomDomain: boolean;
  isMaster: boolean;
};

function withResolvedTenantHeaders(
  request: NextRequest,
  tenant: ResolvedTenantPayload
) {
  const headers = new Headers(request.headers);
  headers.set('x-tenant-id', tenant.id);
  headers.set('x-tenant-type', tenant.tenantType);
  headers.set('x-tenant-tier', tenant.tenantTier);
  if (tenant.tenantName) {
    headers.set('x-tenant-name', tenant.tenantName);
  }
  headers.set('x-tenant-branding', JSON.stringify(tenant.branding || {}));
  headers.set('x-tenant-features', JSON.stringify(tenant.features || {}));
  headers.set('x-tenant-limits', JSON.stringify(tenant.limits || {}));
  headers.set('x-is-custom-domain', String(tenant.isCustomDomain));
  headers.set('x-is-master', String(tenant.isMaster));
  return NextResponse.next({ request: { headers } });
}

function createTenantNotFoundResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
      { status: 404 }
    );
  }

  return new NextResponse('Tenant not found', { status: 404 });
}

function createTenantUnavailableResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Tenant resolution unavailable', code: 'TENANT_RESOLUTION_UNAVAILABLE' },
      { status: 503 }
    );
  }

  return new NextResponse('Tenant resolution unavailable', { status: 503 });
}

/**
 * Resolve the current tenant context and inject it into request headers.
 *
 * Request flow:
 * 1. Local dev and master-host requests get the built-in Galeria tenant.
 * 2. Custom domains call `/api/internal/tenant-context` once per request.
 * 3. The resolved tenant metadata is written to `x-tenant-*` headers so the
 *    rest of the app can stay header-driven and tenant-aware.
 */
export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const url = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.startsWith('/api/internal/tenant-context') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For local development, inject default tenant headers
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168.')) {
    return withDefaultTenantHeaders(request);
  }

  const isAppHost =
    hostname.endsWith('.vercel.app') ||
    hostname === MASTER_DOMAIN ||
    (APP_URL_HOST !== '' && hostname === APP_URL_HOST);

  if (isAppHost) {
    return withDefaultTenantHeaders(request);
  }

  try {
    const resolveUrl = new URL('/api/internal/tenant-context', request.url);
    resolveUrl.searchParams.set('host', hostname);

    const response = await fetch(resolveUrl, {
      cache: 'no-store',
      headers: {
        'x-tenant-resolution-request': '1',
      },
    });

    if (response.status === 404) {
      return createTenantNotFoundResponse(request);
    }

    if (!response.ok) {
      return createTenantUnavailableResponse(request);
    }

    const payload = await response.json() as { data?: ResolvedTenantPayload };
    const tenant = payload.data;

    if (!tenant) {
      return createTenantUnavailableResponse(request);
    }

    if (tenant.status === 'suspended') {
      if (url.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Tenant suspended', code: 'TENANT_SUSPENDED' },
          { status: 503 }
        );
      }

      return NextResponse.rewrite(new URL('/suspended', request.url));
    }

    return withResolvedTenantHeaders(request, tenant);
  } catch (error) {
    console.error('[PROXY] Tenant resolution failed:', error);
    return createTenantUnavailableResponse(request);
  }
}
