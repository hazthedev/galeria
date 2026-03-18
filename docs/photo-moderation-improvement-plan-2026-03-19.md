# Photo Moderation Improvement Plan

**Date:** 2026-03-19
**Status:** Ready for Implementation
**Based on:** `docs/photo-moderation-audit-2026-03-15.md` plus current code audit

---

## Current Flow Summary

The current moderation flow is split across five layers:

1. Event upload rules decide whether new photos start as `pending` or `approved`.
   - `lib/services/event-photos.ts`
2. AI scanning is queued only when event moderation is enabled and the system-level moderation worker is available.
   - `lib/services/event-photos.ts`
   - `jobs/scan-content.ts`
   - `instrumentation.ts`
3. The worker scans images with Rekognition and then approves, rejects, or leaves photos pending for review.
   - `lib/moderation/auto-moderate.ts`
   - `jobs/scan-content.ts`
4. Manual moderation uses three separate routes for approve, reject, and delete.
   - `app/api/photos/[id]/approve/route.ts`
   - `app/api/photos/[id]/reject/route.ts`
   - `app/api/photos/[id]/route.ts`
5. Organizer UI is split between a review page and a lighter-weight activity summary.
   - `app/organizer/events/[eventId]/photos/page.tsx`
   - `app/organizer/events/[eventId]/admin/page.tsx`

That architecture is workable, but the current implementation has correctness and audit gaps that should be fixed before adding more operator UI.

---

## Priority Findings

### P0: Worker decisions can overwrite moderator intent

- The scan worker writes `approved` or `rejected` directly without first confirming the photo is still in an expected state.
  - `jobs/scan-content.ts:357`
  - `jobs/scan-content.ts:359`
  - `jobs/scan-content.ts:374`
- Manual approve/reject routes also update state directly and do not guard against stale or already-resolved photos.
  - `app/api/photos/[id]/approve/route.ts:55`
  - `app/api/photos/[id]/reject/route.ts:54`

This is the most important production risk. Async AI moderation should never override a manual moderator action or a later state transition.

### P0: Saved moderation settings are not driving scan decisions

- Super-admin settings persist `confidence_threshold` and `auto_reject`.
  - `app/api/admin/moderation/route.ts:84`
  - `app/api/admin/moderation/route.ts:87`
- The active moderation path still uses hardcoded defaults via `DEFAULT_CONFIG`.
  - `lib/moderation/auto-moderate.ts:133`
  - `lib/moderation/auto-moderate.ts:143`
  - `lib/moderation/auto-moderate.ts:146`

This makes the admin-facing policy controls partially cosmetic.

### P0: Moderation audit logs are not durable for deleted photos

- `photo_moderation_logs.photo_id` cascades on photo delete.
  - `drizzle/schema.ts:302`
- The delete route writes a moderation log and then deletes the photo record.
  - `app/api/photos/[id]/route.ts:73`
  - `app/api/photos/[id]/route.ts:85`
- The moderation log query inner-joins `photos`, which also hides any deleted-photo history.
  - `app/api/events/[eventId]/moderation-logs/route.ts:82`

Right now, delete actions can erase the very audit trail they are supposed to preserve.

### P0: Quarantine behavior is inconsistent and not reviewable in product UX

- AI worker reject/review paths move assets to quarantine.
  - `jobs/scan-content.ts:364`
  - `jobs/scan-content.ts:380`
- Manual reject does not quarantine or remove public assets.
  - `app/api/photos/[id]/reject/route.ts:54`
- Quarantine preview helpers exist but are not wired into any organizer flow.
  - `lib/storage/quarantine.ts:241`
  - `lib/storage/quarantine.ts:277`
- Organizer review UI renders the original photo URLs from `photos.images`.
  - `app/organizer/events/[eventId]/photos/page.tsx`
  - `components/gallery/PhotoGallery.tsx`

This creates two problems:

- manually rejected photos may remain directly reachable in public storage
- AI-quarantined photos may become hard or impossible for organizers to review using the existing UI

### P1: Quarantine metadata date handling is broken

- Quarantine metadata is stored as JSON and read back with a raw `JSON.parse`.
  - `lib/storage/quarantine.ts:433`
- Later code assumes `expiresAt` is a real `Date`.
  - `lib/storage/quarantine.ts:342`
  - `lib/storage/quarantine.ts:484`

This will produce incorrect expiry checks and can throw at runtime in stats paths.

### P1: AWS connectivity and failure behavior are misleading

- The moderation test endpoint only checks whether a Rekognition client object can be constructed.
  - `app/api/admin/moderation/route.ts:154`
  - `app/api/admin/moderation/route.ts:179`
- If the moderation client cannot be created at runtime, `scanImageForModeration` returns an `approve` action.
  - `lib/moderation/auto-moderate.ts:229`
  - `lib/moderation/auto-moderate.ts:237`

That combination can produce false confidence in setup and unsafe fallback behavior.

### P1: Important operator affordances exist in code but not in the product

- Queue stats, report flow, quarantine preview, and quarantine approval/rejection helpers are present but unused.
  - `jobs/scan-content.ts:218`
  - `jobs/scan-content.ts:256`
  - `lib/storage/quarantine.ts:155`
  - `lib/storage/quarantine.ts:206`
  - `lib/storage/quarantine.ts:241`
- The event photos page fetches moderation logs but does not render them.
  - `app/organizer/events/[eventId]/photos/page.tsx:36`
  - `app/organizer/events/[eventId]/photos/page.tsx:153`
- The moderator UI does not collect a reason even though the APIs accept one.
  - `components/gallery/PhotoGallery.tsx:149`
  - `components/gallery/PhotoGallery.tsx:181`
  - `app/api/photos/[id]/approve/route.ts:52`
  - `app/api/photos/[id]/reject/route.ts:51`

---

## Delivery Strategy

### Phase 1: Correctness and Audit Durability

**Goal:** Make moderation state transitions safe and auditable before expanding features.

#### Task 1.1: Add a shared moderation decision service

Create a server-only moderation domain module that owns state transitions for:

- AI approve
- AI reject
- AI flag for review
- manual approve
- manual reject
- manual delete

Recommended file:

- `lib/moderation/service.ts`

Service responsibilities:

- re-read the photo row before mutating
- allow only explicit state transitions
- skip stale worker jobs safely
- centralize audit logging
- centralize broadcast behavior
- centralize challenge-progress side effects

#### Task 1.2: Guard worker writes with expected-status checks

Update `jobs/scan-content.ts` so the worker only mutates photos that are still eligible for AI handling.

Recommended rule set:

- AI worker may act only on `pending`
- if photo is already `approved`, `rejected`, or missing, record a skip and exit
- delete and manual moderation should win over queued jobs

#### Task 1.3: Make moderation audit logs durable

Add a migration that changes the log retention model.

Recommended changes:

- stop cascading delete from `photo_moderation_logs.photo_id`
- allow logs to survive when a photo is removed
- store a snapshot of image URL and photo status at action time
- optionally store actor type such as `manual` or `ai`

Files:

- `drizzle/schema.ts`
- new migration in `drizzle/migrations/`
- `app/api/events/[eventId]/moderation-logs/route.ts`

#### Task 1.4: Ensure delete actions remain visible in the logs API

Change the moderation logs query to tolerate deleted photos.

Recommended changes:

- replace `JOIN photos` with `LEFT JOIN photos`
- read snapshot fields from the log row when the photo row is gone

### Phase 2: Real Quarantine and Review Experience

**Goal:** Make flagged content consistently isolated and actually reviewable.

#### Task 2.1: Define one storage policy for rejected and review states

Choose and enforce one of these approaches:

1. Quarantine all rejected and review-required assets.
2. Keep assets in primary storage but switch to signed/private delivery for all non-approved states.

Recommended direction:

- keep quarantine for flagged content
- ensure manual reject uses the same quarantine flow as AI reject
- ensure manual approve restores any quarantined asset when needed

Files:

- `lib/storage/quarantine.ts`
- `app/api/photos/[id]/approve/route.ts`
- `app/api/photos/[id]/reject/route.ts`
- `jobs/scan-content.ts`

#### Task 2.2: Add a review surface for quarantined photos

Add organizer-facing review data that can render quarantined assets through signed preview URLs instead of broken public URLs.

Recommended implementation:

- new event moderation API that returns pending/rejected photos plus quarantine preview metadata
- organizer moderation page uses preview URLs when the original asset is quarantined

Files:

- `lib/storage/quarantine.ts`
- new route under `app/api/events/[eventId]/...`
- `app/organizer/events/[eventId]/photos/page.tsx`
- `components/gallery/PhotoGallery.tsx`

#### Task 2.3: Fix quarantine metadata hydration

Normalize `flaggedAt`, `expiresAt`, and `reviewedAt` after reading from JSON.

Recommended change:

- introduce a `deserializeQuarantineMetadata` helper and use it everywhere

### Phase 3: Policy Wiring and Failure Handling

**Goal:** Make AI moderation reflect saved policy and fail safely.

#### Task 3.1: Wire system moderation settings into runtime config

Update `lib/moderation/auto-moderate.ts` so scan decisions use:

- `confidence_threshold`
- `auto_reject`
- future category toggles if they are later exposed

Recommended behavior:

- load system settings once per scan call or via a cached accessor
- remove the hardcoded-only `DEFAULT_CONFIG` path as the authoritative source

#### Task 3.2: Change unsafe fallback behavior

If Rekognition cannot be initialized or the scan fails unexpectedly:

- do not auto-approve
- keep photo `pending`
- persist a machine-readable scan failure record

Recommended files:

- `lib/moderation/auto-moderate.ts`
- `jobs/scan-content.ts`

#### Task 3.3: Replace the fake AWS smoke test with a real one

The admin test route should make a real lightweight Rekognition call using the same credentials and region that production scanning depends on.

Possible options:

- call `DetectModerationLabels` with a tiny embedded test image
- or call a safe read/list operation if the SDK/API supports it

Files:

- `app/api/admin/moderation/route.ts`

### Phase 4: Operator Workflow and UX

**Goal:** Make the moderation workflow usable for organizers and support staff.

#### Task 4.1: Add reason capture for moderation actions

The moderator UI should support an optional reason for approve, reject, and delete.

Files:

- `components/gallery/PhotoGallery.tsx`
- `app/api/photos/[id]/approve/route.ts`
- `app/api/photos/[id]/reject/route.ts`
- `app/api/photos/[id]/route.ts`

#### Task 4.2: Merge activity and action into one moderation workspace

Improve the organizer moderation page so it includes:

- pending count
- rejected count
- recent activity
- quarantine/review indicator
- bulk actions
- failed scan indicator when present

Files:

- `app/organizer/events/[eventId]/photos/page.tsx`
- `app/organizer/events/[eventId]/admin/page.tsx`

#### Task 4.3: Decide what to do with dormant queue tooling

Either ship operator endpoints/pages for:

- queue health
- retry/rescan
- quarantined assets
- report-abuse flow

or remove/park the dormant helpers so the supported moderation surface is clearer.

### Phase 5: Tests and Observability

**Goal:** Make the moderation system safe to change.

#### Task 5.1: Add automated coverage for the critical path

Minimum suite:

- upload with moderation disabled
- upload with moderation enabled and queue active
- worker approves safe photo
- worker rejects flagged photo
- worker review path with quarantine
- worker skips stale job after manual action
- manual approve/reject/delete audit logging
- deleted photo logs remain queryable
- quarantine metadata date parsing
- admin settings actually change scan behavior

#### Task 5.2: Persist scan outcomes for debugging

The current in-memory stats are not trustworthy and are not updated by the scan flow.

Recommended direction:

- add a dedicated `photo_scan_logs` table or equivalent persisted telemetry
- record action, reason, categories, confidence, worker result, and error details

Files:

- `lib/moderation/auto-moderate.ts`
- `jobs/scan-content.ts`
- new migration in `drizzle/migrations/`

---

## Recommended Implementation Order

1. Phase 1 first.
2. Phase 2 immediately after.
3. Phase 3 before any admin-facing moderation polish.
4. Phase 4 once the underlying state model is safe.
5. Phase 5 continuously, with the first critical-path tests added during Phase 1.

Do not start with queue dashboards or moderation-page redesign. The main risk is incorrect state and missing audit durability, not missing chrome.

---

## First Slice To Implement

If we want the fastest high-value first milestone, ship this slice first:

1. Shared moderation service with guarded transitions.
2. Worker skip logic for stale jobs.
3. Durable moderation logs for deleted photos.
4. Manual reject routed through the same quarantine decision path as AI reject.
5. Tests for worker/manual race conditions.

That slice addresses the most dangerous correctness and compliance gaps without needing a full UI rewrite.

---

## Open Decisions

These decisions should be made before Phase 2 implementation:

1. Should moderator-rejected photos be physically isolated from public storage every time, or is application-level hiding acceptable?
2. Do we want a separate `photo_scan_logs` table for AI decisions, or should `photo_moderation_logs` be expanded to include both manual and AI actions?
3. Should organizers be allowed to re-approve previously rejected photos, or should rejected be a terminal state without an explicit restore flow?

---

## Validation Checklist

- Manual moderator actions cannot be overwritten by queued AI jobs.
- Deleted-photo moderation logs remain visible after photo deletion.
- Saved `confidence_threshold` and `auto_reject` settings change actual scan behavior.
- Quarantined review-required photos remain reviewable in organizer UI.
- Manual reject and AI reject apply the same storage isolation policy.
- Rekognition setup test fails when permissions are invalid.
- Failed scans leave photos pending instead of auto-approving them.

---

*Implementation Plan v1.0 - 2026-03-19*
