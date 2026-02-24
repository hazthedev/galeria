// ============================================
// Galeria - Next.js Proxy (Middleware)
// ============================================
// Tenant resolution for all incoming requests
// Handles multi-tenant routing via custom domains and subdomains
//
// Uses Node.js runtime because tenant resolution requires database access

export { proxy } from './lib/tenant';

// Specify which paths the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
