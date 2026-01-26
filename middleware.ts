// ============================================
// MOMENTIQUE - Next.js Middleware
// ============================================
// Tenant resolution and authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createTenantContext } from './lib/tenant';

// Configure middleware to use Node.js runtime (required for database access)
export const runtime = 'nodejs';

/**
 * Next.js middleware
 * Runs on every request (except static files)
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
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
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', '00000000-0000-0000-0000-000000000001');
    response.headers.set('x-tenant-type', 'master');
    response.headers.set('x-tenant-tier', 'enterprise');
    response.headers.set('x-tenant-name', 'Gatherly Dev');
    response.headers.set('x-tenant-branding', JSON.stringify({
      primary_color: '#8B5CF6',
      secondary_color: '#EC4899',
      accent_color: '#F59E0B',
    }));
    response.headers.set('x-tenant-features', JSON.stringify({
      lucky_draw: true,
      photo_reactions: true,
      video_uploads: true,
      custom_templates: true,
      api_access: true,
      sso: true,
      white_label: true,
      advanced_analytics: true,
    }));
    response.headers.set('x-tenant-limits', JSON.stringify({
      max_events_per_month: -1,
      max_storage_gb: -1,
      max_admins: -1,
      max_photos_per_event: -1,
      max_draw_entries_per_event: -1,
    }));
    response.headers.set('x-is-custom-domain', 'false');
    response.headers.set('x-is-master', 'true');
    return response;
  }

  // Production tenant resolution
  const tenantContext = await createTenantContext(hostname);

  if (!tenantContext) {
    if (url.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new NextResponse('Tenant not found', { status: 404 });
  }

  if (tenantContext.tenant.status === 'suspended') {
    if (url.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Tenant suspended' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.rewrite(new URL('/suspended', request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  response.headers.set('x-tenant-id', tenantContext.tenant.id);
  response.headers.set('x-tenant-type', tenantContext.tenant.tenant_type);
  response.headers.set('x-tenant-tier', tenantContext.tenant.subscription_tier);
  response.headers.set('x-tenant-branding', JSON.stringify(tenantContext.tenant.branding));
  response.headers.set('x-tenant-features', JSON.stringify(tenantContext.tenant.features_enabled));
  response.headers.set('x-tenant-limits', JSON.stringify(tenantContext.tenant.limits));
  response.headers.set('x-is-custom-domain', tenantContext.is_custom_domain.toString());
  response.headers.set('x-is-master', tenantContext.is_master.toString());

  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
