# Security Follow-Up

This document captures the remaining security and production-hardening recommendations identified during the March 15, 2026 project audit.

## Remaining Recommendations

- Implement password reset, email verification, and optionally magic-link auth using the existing token helpers.
- Finish production custom-domain tenant resolution in `proxy.ts`.
- Add CSP and an explicit CORS policy.
- Add a queue-monitoring admin route/page backed by `getQueueStats()`.
- Add per-user session indexing/versioning so role changes and deletions invalidate all active sessions immediately without scanning `session:*`.
- Sync `drizzle/schema.ts` with runtime tables and correct `NewPhoto = typeof photos.$inferInsert`.
- Replace dev DB URL fallbacks in scripts/config with required env variables.
- Add a global app error boundary and broader structured logging/alerting.
- Consider account deletion/data export flows if privacy requirements matter for this deployment.

## Notes

- These are follow-up items. They were not included in the non-breaking security hardening changes already implemented in the codebase.
- The implemented fixes were verified with `npm run typecheck`, `npm test -- --runTestsByPath lib/api/middleware/rate-limit.test.ts`, and `npm audit --omit=dev`.
