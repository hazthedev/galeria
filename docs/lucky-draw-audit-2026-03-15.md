# Lucky Draw Audit - 2026-03-15

## Scope

This note captures the current Lucky Draw implementation in the codebase, the main gaps and risks, and a prioritized improvement plan.

## Files Found

### Direct Lucky Draw Files

- `types/domain/lucky-draw.ts`
- `lib/lucky-draw.ts`
- `lib/domain/events/lucky-draw.ts`
- `app/api/events/[eventId]/lucky-draw/route.ts`
- `app/api/events/[eventId]/lucky-draw/config/route.ts`
- `app/api/events/[eventId]/lucky-draw-config/route.ts`
- `app/api/events/[eventId]/lucky-draw/entries/route.ts`
- `app/api/events/[eventId]/lucky-draw/participants/route.ts`
- `app/api/events/[eventId]/lucky-draw/history/route.ts`
- `app/api/events/[eventId]/lucky-draw/redraw/route.ts`
- `components/lucky-draw/admin/LuckyDrawAdminTab.tsx`
- `components/lucky-draw/admin/WinnerModal.tsx`
- `components/lucky-draw/admin/constants.ts`
- `components/lucky-draw/admin/types.ts`
- `components/lucky-draw/admin/utils.ts`
- `components/lucky-draw/admin/tabs/ConfigTab.tsx`
- `components/lucky-draw/admin/tabs/EntriesTab.tsx`
- `components/lucky-draw/admin/tabs/ParticipantsTab.tsx`
- `components/lucky-draw/admin/tabs/DrawTab.tsx`
- `components/lucky-draw/admin/tabs/HistoryTab.tsx`
- `components/lucky-draw/DrawAnimation.tsx`
- `components/lucky-draw/SlotMachineAnimation.tsx`
- `components/lucky-draw/LuckyDraw.tsx`
- `components/lucky-draw/LuckyDrawEntryForm.tsx`
- `drizzle/schema.ts`
- `drizzle/migrations/0004_lucky_draw.sql`
- `drizzle/migrations/0005_fix_lucky_draw_rls.sql`
- `drizzle/migrations/0006_fix_lucky_draw_schema.sql`

### Adjacent Integration Files

- `lib/services/event-photos.ts`
- `lib/realtime/client.tsx`
- `app/events/[eventId]/guest/_hooks/useGuestEventPageController.ts`
- `app/events/[eventId]/guest/_components/GuestEventPageView.tsx`
- `app/organizer/events/[eventId]/admin/page.tsx`
- `components/settings/SettingsAdminTab.tsx`
- `components/settings/tabs/FeaturesTab.tsx`
- `components/events/event-settings-form.tsx`
- `components/admin/AdminDashboard.tsx`

## Current Implementation

- Lucky Draw is gated at both tenant-plan and event-setting level.
- The feature stores data in three main tables:
  - `lucky_draw_configs`
  - `lucky_draw_entries`
  - `winners`
- Guests join the draw through the photo upload flow, not a dedicated public form.
- Organizer/admin users can:
  - create and update draw config
  - add manual entries
  - view entries
  - view grouped participants
  - execute a draw
  - view draw history
- Draw execution currently:
  - loads all non-winner entries for the config
  - groups them by `userFingerprint`
  - limits eligible rows according to duplicate rules
  - shuffles with Fisher-Yates using `crypto.randomInt`
  - assigns winners by configured prize tiers
  - marks winning entries
  - marks the config as completed
  - inserts winner rows
  - broadcasts realtime events
- Guest-facing realtime behavior is wired:
  - `draw_started` triggers draw mode
  - `draw_winner` pushes winner announcements
- Config reads are cached through Redis in the config route.

## Gap Analysis

### Planned or Partially Scaffolded

- `scheduledAt` exists in the schema and types, but I did not find scheduling logic or a job path that actually executes draws at that time.
- Winner claim tracking exists in schema and domain helpers, but there is no Lucky Draw route or admin UI that lets staff mark a winner as claimed.
- Redraw has a backend route and domain logic, but I did not find any current Lucky Draw admin UI wired to call it.
- Animation settings are exposed in config, but only a single slot-style animation exists in the active render path.
- `playSound`, `showSelfie`, and `showFullName` are only partially honored in the active animation path.
- Legacy Lucky Draw components still exist, but they do not appear to drive the active organizer or guest flow.

### Concrete Missing or Broken Behavior

- Post-draw admin entries and participants views depend on `getActiveConfig`, so they effectively stop working after the config becomes `completed`.
- Guest UX only allows one successful Lucky Draw opt-in even though the backend supports `maxEntriesPerUser > 1`.
- `grand` prize exists in schema and API validation, but the shared type model and admin config UI exclude it.
- The tier sort logic treats `grand` incorrectly because `0 || 999` evaluates to `999`.

## Strengths

- Core domain logic is centralized in `lib/domain/events/lucky-draw.ts`.
- The admin UI is modular and split by responsibility.
- Entitlement and moderator checks are consistently applied before privileged operations.
- The randomization primitive is good: Fisher-Yates plus `crypto.randomInt`.
- Lucky Draw entry creation is integrated into photo upload instead of duplicating a second ingestion path.
- The APIs include recoverable read fallbacks for partially initialized schemas.

## Weaknesses and Risks

### High Priority

- Redraw can reselect the same previous winner because the old winner entry is put back into the eligible pool.
  - `lib/domain/events/lucky-draw.ts:820-872`
- Draw, redraw, and entry creation flows are not transactional.
  - `lib/domain/events/lucky-draw.ts:302-340`
  - `lib/domain/events/lucky-draw.ts:381-422`
  - `lib/domain/events/lucky-draw.ts:613-679`
  - `lib/domain/events/lucky-draw.ts:891-934`
- Config cache is not invalidated after draw completion or redraw.
  - cache build/use: `app/api/events/[eventId]/lucky-draw-config/route.ts:83-99`, `196-287`
  - mutating routes without invalidation: `app/api/events/[eventId]/lucky-draw/route.ts:57-75`, `app/api/events/[eventId]/lucky-draw/redraw/route.ts:56-74`
- Entries and participants endpoints only work for `scheduled` configs, so review screens regress after the draw is completed.
  - `app/api/events/[eventId]/lucky-draw/entries/route.ts:69-80`
  - `app/api/events/[eventId]/lucky-draw/participants/route.ts:48-60`

### Medium Priority

- `grand` tier support is inconsistent across schema, types, UI, and draw logic.
  - schema: `drizzle/schema.ts:338-359`
  - types: `types/domain/lucky-draw.ts:5-7`
  - UI filter: `components/lucky-draw/admin/utils.ts:6-18`
  - UI options: `components/lucky-draw/admin/constants.ts:4-9`
  - draw sort bug: `lib/domain/events/lucky-draw.ts:572-584`
- Guest join UX conflicts with backend multi-entry support.
  - backend support: `lib/domain/events/lucky-draw.ts:290-299`
  - guest state lock: `app/events/[eventId]/guest/_hooks/useGuestEventPageController.ts:183-187`, `1257-1264`
  - disabled checkbox: `app/events/[eventId]/guest/_components/GuestEventPageView.tsx:833-856`
- Redraw logic always excludes existing winner fingerprints, even when `preventDuplicateWinners` is false, so redraw behavior does not align cleanly with the main draw behavior.
  - `lib/domain/events/lucky-draw.ts:829-864`
- Winner redraw notes are stored inside `prize_description`, which is a brittle state carrier.
  - `lib/domain/events/lucky-draw.ts:812-816`, `830-836`, `915`
- Redraw reason concatenation has an operator precedence bug, so the redraw note is dropped whenever the prize tier already has a description.
  - `lib/domain/events/lucky-draw.ts:915`

### Lower Priority but Important

- Two config APIs exist and can drift.
  - legacy mixed route: `app/api/events/[eventId]/lucky-draw/route.ts:167-299`
  - active config route: `app/api/events/[eventId]/lucky-draw-config/route.ts:316-429`
  - alias route: `app/api/events/[eventId]/lucky-draw/config/route.ts`
- Several helpers exist in the domain layer but are not surfaced by route/UI flows.
  - `markDrawCompleted`
  - `cancelDraw`
  - `getDrawWinners`
  - `markWinnerClaimed`
  - `getTenantWinners`
  - `getDrawStatistics`
  - `getUserEntryStatistics`
- `LuckyDrawEntryForm` is not production-ready.
  - it calls a no-op `submitEntry`
  - it never sets `formData.selfie_url` from the selected file
  - it appears to be legacy or dead code
- I did not find Lucky Draw-specific automated tests in the repo.

## Improvement Report

### 1. Data Integrity

- Add transactions around:
  - draw execution
  - redraw
  - manual multi-entry creation
  - photo-upload entry creation where possible
- Add locking or a uniqueness strategy so only one active scheduled config can exist per event.
- Exclude the replaced winner entry from redraw eligibility.
- Invalidate Lucky Draw config cache after any state-changing draw operation.

### 2. Product Correctness

- Let admin entries and participants views load the latest relevant config, not only `scheduled`.
- Fix `grand` tier support end to end.
- Align redraw duplicate-winner behavior with the main draw rules.
- Honor `maxEntriesPerUser` in the guest upload UX.

### 3. Missing Features

- Either implement scheduled draws using `scheduledAt` or remove that field from the exposed feature set.
- Add a winner-claim route and admin UI if `isClaimed` is part of the intended workflow.
- Wire redraw into the admin UI if redraw is meant to be supported publicly.

### 4. UX

- Make Lucky Draw settings truthful:
  - if only slot animation is available, show only that
  - if sound and alternate styles are not live, do not expose them yet
- Improve post-draw review so staff can still inspect entries and participants after completion.
- Make the guest join messaging reflect whether multiple entries are allowed.

### 5. Performance

- Move participant grouping and summary work into SQL instead of loading all entries into memory.
- Consider batching inserts for manual multi-entry creation.
- Avoid repeated full counts and full scans on larger events where possible.

### 6. Code Quality

- Consolidate to a single config mutation/read route.
- Remove or quarantine legacy Lucky Draw components that are no longer part of the active flow.
- Replace string-matching error classification with explicit domain error types or codes.
- Persist actual draw actor metadata if auditability matters.

### 7. Testing

- Add integration tests for:
  - config create/update
  - guest photo upload joining the draw
  - max entries per user
  - duplicate-winner rules
  - draw execution
  - redraw behavior
  - cache invalidation after draw completion
  - post-draw admin visibility of entries and participants

## Bottom Line

The Lucky Draw feature has a solid foundation and a reasonably complete organizer UI, but it still has several correctness gaps in the draw lifecycle. The most urgent fixes are transactional safety, redraw eligibility correctness, cache invalidation, and post-draw data access.
