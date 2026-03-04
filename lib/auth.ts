export * from '@/lib/domain/auth/password-validator';
export * from '@/lib/domain/auth/auth-context';
export * from '@/lib/domain/auth/protected-route';
export * from '@/lib/domain/auth/auth';
// export * from '@/lib/domain/auth/session'; // Conflicts with auth.ts exports

// Manually export session functions that don't conflict
export {
  createSession,
  validateSession,
  refreshSession,
  extractSessionId,
  generateSessionId,
  getSessionKey,
  type ISessionData,
  type ISessionValidationResult,
  type ISessionOptions,
} from '@/lib/domain/auth/session';
