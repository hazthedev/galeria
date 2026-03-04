// Client-safe auth exports only
export * from '@/lib/domain/auth/password-validator';
export * from '@/lib/domain/auth/auth-context';
export * from '@/lib/domain/auth/protected-route';
export * from '@/lib/domain/auth/auth';

// Note: session.ts uses Redis and DB (server-only)
// Import session functions directly in server-side code (API routes, server components)
