# Photo Moderation Audit - 2026-03-15

## Scope

This note captures the current Photo Moderation implementation in the codebase, the main gaps and risks, and a prioritized improvement plan.

## Files Found

### Direct Moderation Files

- `types/domain/photo.ts`
- `drizzle/migrations/0009_photo_moderation_logs.sql`
- `drizzle/schema.ts`
- `lib/moderation/auto-moderate.ts`
- `lib/moderation/init.ts`
- `jobs/scan-content.ts`
- `lib/storage/quarantine.ts`
- `app/api/admin/moderation/route.ts`
- `app/api/events/[eventId]/moderation-logs/route.ts`
- `app/api/photos/[id]/approve/route.ts`
- `app/api/photos/[id]/reject/route.ts`
- `app/api/photos/[id]/route.ts`
- `app/api/events/[eventId]/photos-bulk-delete/route.ts`

### Adjacent Integration Files

- `lib/services/event-photos.ts`
- `app/organizer/events/[eventId]/photos/page.tsx`
- `app/organizer/events/[eventId]/admin/page.tsx`
- `components/gallery/PhotoGallery.tsx`
- `app/events/[eventId]/guest/_hooks/useGuestEventPageController.ts`
- `app/events/[eventId]/guest/_components/GuestEventPageView.tsx`
- `app/admin/settings/page.tsx`
- `components/settings/SettingsAdminTab.tsx`
- `components/settings/tabs/FeaturesTab.tsx`
- `components/events/event-settings-form.tsx`

## Current Implementation

- Photo moderation is controlled at two layers:
  - event-level `moderation_required`
  - system-level moderation settings and AWS credentials
- When an event requires moderation:
  - uploaded photos are stored as `pending`
  - guest pages hide them from the public feed
  - organizers can approve, reject, or delete them
- If AI moderation is enabled, the upload service queues photos into a BullMQ worker.
- The worker:
  - scans the image with AWS Rekognition
  - approves safe images
  - rejects or flags unsafe images
  - quarantines flagged assets when categories are detected
- Manual moderation endpoints log approve/reject/delete actions into `photo_moderation_logs`.
- Organizers have two moderation surfaces:
  - an admin-tab summary that shows recent moderation activity
  - a dedicated event photos page for actual review and bulk actions
- Guests track their own moderation state through guest-page polling and realtime reconciliation of pending/rejected photos.

## Gap Analysis

### Planned or Partially Scaffolded

- `lib/moderation/auto-moderate.ts` still has a TODO to load tenant-specific moderation config from the database.
- The moderation config type exposes `detectText`, and the category enum includes `text`, but I did not find OCR/text moderation implemented in the active scan path.
- Queue and quarantine helpers exist for:
  - reporting content
  - queue monitoring
  - pause/resume/clear
  - quarantine previews
  but I did not find operator-facing routes or pages using them.
- The organizer admin tab moderation section only shows recent logs, not an actionable queue or quarantine review surface.

### Concrete Missing or Broken Behavior

- The super-admin moderation settings save `confidence_threshold` and `auto_reject`, but the active scan config still falls back to hardcoded defaults instead of reading those settings into the decision path.
- The dedicated organizer photos page fetches moderation logs but never renders them.
- The super-admin "test AWS" endpoint only verifies that a client object can be created; it does not perform a real AWS call.
- Moderator APIs accept an optional `reason`, but the active gallery moderation UI does not ask moderators for one.

## Strengths

- The moderation system is split cleanly into:
  - upload-time integration
  - async queue processing
  - quarantine storage handling
  - manual moderation APIs
  - audit logging
- The upload service supports both multipart and direct-upload flows without bypassing moderation state.
- Organizer manual moderation is already usable today, even when AI moderation is disabled.
- Guest UX is thoughtful: pending and rejected photos are tracked separately, and approval/rejection notices reconcile in the background.
- Audit logs exist for approve, reject, and delete actions, which gives the feature a real compliance foundation.

## Weaknesses and Risks

### High Priority

- Async AI moderation can override a manual organizer decision.
  - A photo is uploaded as `pending`.
  - An organizer can reject it manually.
  - The queued worker later scans it and unconditionally writes `approved` if the image looks safe.
  - That creates a serious correctness and trust issue.
- The system settings are partly cosmetic right now.
  - Region and credentials are used.
  - `confidence_threshold` and `auto_reject` are exposed to admins but are not actually driving scan decisions.
- Pending assets remain in regular storage unless they are explicitly quarantined.
  - Reject/review-with-categories moves them to quarantine.
  - Queue failures, scan errors, disabled AI, and ordinary pending review leave assets where they were uploaded.
  - If storage URLs are public, moderation is only app-level hiding, not true asset isolation.
- Worker-side moderation and quarantine are not transactional.
  - Quarantine copy/delete and DB status updates happen in separate steps.
  - Partial failures can leave storage state and database state out of sync.

### Medium Priority

- The moderation pipeline has a lot of dormant operational capability with no surfaced controls:
  - no queue dashboard
  - no retry/rescan flow
  - no quarantine review page
  - no report-content path wired into product UX
- The admin summary and the real moderation workspace are split awkwardly between two pages.
- The dedicated event photos page keeps `moderationLogs` in state but does not use them.
- In-memory moderation stats in `auto-moderate.ts` are not updated by the scan flow, so they are not trustworthy telemetry.
- The queue uses photo ID as the BullMQ job ID, which can complicate intentional rescans or repeated reports for the same photo.

### Lower Priority but Important

- The moderation settings page implies a richer AI policy surface than the backend currently supports.
- There is no typed error model around moderation decisions, queue failures, or quarantine failures.
- The manual moderation UI is fast, but it does not capture reviewer reasoning unless an API caller adds it manually.
- I did not find Photo Moderation-specific automated tests in the repo.

## Improvement Report

### 1. Product Correctness

- Prevent the worker from overwriting photos that moderators have already manually approved, rejected, or deleted.
- Make the active moderation decision path honor the saved admin settings:
  - `confidence_threshold`
  - `auto_reject`
- Decide whether pending assets must be truly isolated from public storage, and enforce that consistently.

### 2. Security and Data Integrity

- Wrap quarantine operations and status updates in transactions or compensating recovery logic.
- Add explicit state transitions so queue workers only mutate photos that are still in an expected status.
- Add a real review/quarantine audit trail if flagged content handling matters for compliance.

### 3. Missing Features

- Add an operator surface for:
  - queue health
  - failed jobs
  - quarantined assets
  - retry/rescan actions
- Implement a real AWS connectivity test that exercises the permissions the worker actually needs.
- Either implement text moderation or remove the unused `text`/`detectText` promises from the exposed config model.

### 4. UX

- Let moderators enter a reason when approving, rejecting, or deleting content.
- Merge the moderation activity summary and the actionable review workspace into a more coherent flow.
- Remove unused log fetching from the organizer photos page or render it there intentionally.

### 5. Performance

- Revisit the queue and quarantine list APIs before large-scale usage; many helper functions currently scan broadly without an operator surface or pagination story.
- Add queue monitoring and backpressure visibility for busy tenants.

### 6. Code Quality

- Consolidate shared moderation action code across approve/reject/delete/bulk-delete routes.
- Replace string-matching error handling with explicit moderation-domain errors.
- Remove or wire up dormant queue/quarantine helpers so the moderation module has a clearer supported surface area.

### 7. Testing

- Add integration tests for:
  - upload with moderation required
  - queue-disabled moderation fallback
  - worker approve/reject/review behavior
  - quarantine transitions
  - manual approve/reject/delete logging
  - worker/manual race conditions
  - guest pending/rejected visibility rules
  - admin settings affecting moderation decisions

## Bottom Line

Photo Moderation has the broadest implementation of the three features and already covers upload, review, audit logging, queueing, and guest reconciliation. The biggest production risk is that the async worker can still disagree with or overwrite moderator intent, and the admin-facing AI settings are not fully wired into the actual moderation decisions yet.
