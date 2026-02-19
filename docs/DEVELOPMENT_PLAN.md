# Momentique Development Plan

Source of Truth: This is the single authoritative development progress tracker for this repository.
Last Verified: 2026-02-14
Verification Basis: Current codebase state, route/component/module presence, and latest local Jest run.

## Current Snapshot (2026-02-14)

The codebase has strong platform foundations and broad feature coverage, with specific implementation gaps still open in configuration completeness, realtime consistency, and test depth.

## Verified Completed

### Architecture and Refactor Work
- [x] Split guest event page into smaller units (`app/e/[eventId]/_components`, `app/e/[eventId]/_hooks`, `app/e/[eventId]/_lib`)
- [x] Extracted photo/event service layer (`lib/services/event-photos.ts`, `lib/services/events.ts`)
- [x] Added validation schemas (`lib/validation/auth.ts`, `lib/validation/events.ts`)
- [x] Centralized tenant constants (`lib/constants/tenants.ts`)
- [x] Added route-level loading/error pages for key event routes (`app/e/[eventId]/loading.tsx`, `app/e/[eventId]/error.tsx`, `app/organizer/events/[eventId]/loading.tsx`, `app/organizer/events/[eventId]/error.tsx`)

### Admin UI Modularization
- [x] Lucky draw admin modularized into tabs/modules (`components/lucky-draw/admin/*`)
- [x] Settings admin modularized into tabs/hooks/types (`components/settings/*`)

### API Surface and Feature Coverage
- [x] Event APIs for photos, lucky draw, photo challenge, attendance, stats, download/export are present (`app/api/events/[eventId]/*`)
- [x] Admin APIs for users, tenants, moderation, settings, stats, activity are present (`app/api/admin/*`)
- [x] Organizer auth + ownership checks enforced for photo-challenge mutation routes (`app/api/events/[eventId]/photo-challenge/route.ts`)
- [x] Multi-tenant login lookup implemented across active tenants with tenant hinting (`app/api/auth/login/route.ts`)
- [x] Lucky draw config creation now enforces authenticated organizer/super-admin access and persists `createdBy` from authenticated user (`app/api/events/[eventId]/lucky-draw/config/route.ts`, `lib/lucky-draw.ts`)

### Baseline Automated Tests (Local)
- [x] `lib/rate-limit.test.ts` passes
- [x] `lib/upload/validator.test.ts` passes
- [x] `lib/upload/image-processor.test.ts` passes
- [x] `lib/recaptcha.test.ts` passes

## Verified In Progress

These areas are present and partially implemented, but not yet complete based on current code/TODO markers.

- [ ] Photo pipeline hardening (legacy helper TODOs still open in `lib/images.ts`)
- [ ] Realtime consistency improvements (current implementation is Supabase client-based; historical WebSocket plan items are not aligned)
- [ ] Architecture-quality backlog from previous tracker remains open:
  - stable list keys
  - component tests for admin/organizer surfaces
  - API integration tests
  - API error/logging standardization

## Verified Open Gaps

### reCAPTCHA / Moderation Config Completeness
- [ ] Tenant-specific reCAPTCHA settings fetch TODO (`lib/recaptcha.ts`)
- [ ] reCAPTCHA stats collection TODO (`lib/recaptcha.ts`)
- [ ] Tenant-specific moderation config load TODO (`lib/moderation/auto-moderate.ts`)

### Image Utility Legacy Stubs
- [ ] Signed URL helper TODO (`lib/images.ts`)
- [ ] Legacy NSFW/suspicious analysis TODO helpers (`lib/images.ts`)
- [ ] Legacy ZIP export helper TODO (`lib/images.ts`)
- [ ] Legacy storage usage helper TODO (`lib/images.ts`)

### Attendance UX
- [ ] Organizer QR scanner still runs demo/mock scan flow (`components/attendance/OrganizerQRScanner.tsx`)

## Test Coverage Status

Last run: 2026-02-14

### Passing Suites
- `lib/rate-limit.test.ts`
- `lib/upload/validator.test.ts`
- `lib/upload/image-processor.test.ts`
- `lib/recaptcha.test.ts`

### Coverage Gaps (Verified by file inventory + trackers)
- [ ] Component tests for admin/organizer dashboard surfaces
- [ ] API integration tests for critical endpoints
- [ ] E2E coverage for core user flows

## Documentation Drift Notes

### Confirmed Drift
- `docs/README.md` references `npm run dev:all`, but `package.json` does not define `dev:all`.
- Historical progress docs reference `lib/websocket/server.ts`, but that file does not exist.
- Current realtime implementation is Supabase client-based (`lib/realtime/client.tsx`), while older docs center a Socket.io/WebSocket server path.

### Rule
When progress docs conflict with code/runtime behavior, code and `package.json` are authoritative.

## Prioritized Next Steps (P0/P1/P2)

### P0 (Security and Correctness)
1. Implement tenant-backed reCAPTCHA and moderation configuration loading (`lib/recaptcha.ts`, `lib/moderation/auto-moderate.ts`).

### P1 (Reliability and Consistency)
1. Resolve legacy TODO stubs in `lib/images.ts` or migrate all call sites to maintained modules.
2. Standardize API error response and logging patterns across critical routes.

### P2 (Quality and Maintainability)
1. Replace index-based React keys with stable IDs in identified list renders.
2. Add component tests for admin/organizer core surfaces.
3. Add API integration tests for auth, events, photos, lucky draw, and photo challenge critical paths.

## Change Log

- 2026-02-14: Completed multi-tenant login lookup and lucky-draw `createdBy` attribution/auth hardening; removed both from open gaps and P0.
- 2026-02-14: Marked photo-challenge organizer auth hardening as completed and removed it from open gaps/P0.
- 2026-02-14: Consolidated all active progress tracking into this file.
- 2026-02-14: Deprecated `TODO.md` and `docs/fix-plan.md` as non-authoritative trackers with pointers to this file.
- 2026-02-14: Normalized progress to code-verified status only; removed speculative timeline ownership from canonical tracking.
