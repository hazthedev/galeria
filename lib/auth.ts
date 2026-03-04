// Client-safe auth exports only
export * from '@/lib/domain/auth/password-validator';
export * from '@/lib/domain/auth/auth-context';
export * from '@/lib/domain/auth/protected-route';

// Note: auth.ts contains server-only functions (bcrypt, JWT verification)
// Import server functions from @/lib/domain/auth/auth directly in API routes
// Note: session.ts uses Redis and DB (server-only)
// Import session functions directly in server-side code (API routes, server components)
