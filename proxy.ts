// ============================================
// Galeria - Next.js Middleware
// ============================================
// Tenant resolution and authentication

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

/**
 * Next.js proxy
 * Runs on every request (except static files)
 */
export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const url = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
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

  // For production, the tenant resolution would happen here
  // For now, just pass through
  return NextResponse.next();
}
