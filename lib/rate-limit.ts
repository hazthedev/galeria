// Client-safe exports only
export * from '@/lib/api/middleware/fingerprint';

// Note: rate-limit.ts and limit-check.ts use Redis (server-only)
// Import them directly in server-side code only
