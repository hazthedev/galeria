# Cleanup Roadmap

Last updated: 2026-03-28 22:09:48 +08:00

## Critical

- [x] Fix super-admin MFA verification lookup in `/api/auth/mfa/verify` (completed 2026-03-28 22:03:36 +08:00)
- [x] Keep photo-challenge progress counters updating after the goal is reached (completed 2026-03-28 22:09:48 +08:00)
- [x] Use a valid QR destination for photo-challenge claims and auto-handle tokens on the organizer verify page (completed 2026-03-28 22:09:48 +08:00)
- [x] Persist photo-challenge verification state and stop repeat claim prompts after a prize is already claimed (completed 2026-03-28 22:09:48 +08:00)
- [x] Send a stable fingerprint from the guest check-in modal and require/store it consistently for self check-in (completed 2026-03-28 22:09:48 +08:00)
- [x] Block duplicate guest self check-ins by fingerprint (completed 2026-03-28 22:09:48 +08:00)

## Important

- [x] Make photo reaction writes atomic so denormalized counts do not drift under concurrency (completed 2026-03-28 22:55:00 +08:00)
- [x] Consolidate lucky-draw config writes onto one API path and remove duplicate route drift (completed 2026-03-28 22:55:53 +08:00)
- [x] Consolidate tenant resolution so runtime traffic does not split between `proxy.ts` and legacy middleware code (completed 2026-03-28 23:05:26 +08:00)

## Maintenance

- [x] Remove or archive stale admin dashboard code paths that no longer match the active API surface (completed 2026-03-28 22:58:02 +08:00)
- [x] Reduce legacy auth helper drift in `lib/domain/auth/auth.ts` (completed 2026-03-28 22:59:06 +08:00)
