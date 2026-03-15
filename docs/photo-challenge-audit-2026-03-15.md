# Photo Challenge Audit - 2026-03-15

## Scope

This note captures the current Photo Challenge implementation in the codebase, the main gaps and risks, and a prioritized improvement plan.

## Files Found

### Direct Photo Challenge Files

- `types/domain/photo-challenge.ts`
- `lib/photo-challenge.ts`
- `lib/domain/events/photo-challenge.ts`
- `components/photo-challenge/admin-tab.tsx`
- `components/photo-challenge/settings-form.tsx`
- `components/photo-challenge/progress-bar.tsx`
- `components/photo-challenge/PhotoChallengeProgress.tsx`
- `components/photo-challenge/prize-modal.tsx`
- `components/photo-challenge/PrizeClaimModal.tsx`
- `app/api/events/[eventId]/photo-challenge/route.ts`
- `app/api/events/[eventId]/photo-challenge/progress/route.ts`
- `app/api/events/[eventId]/photo-challenge/progress/all/route.ts`
- `app/api/events/[eventId]/challenge-progress-all/route.ts`
- `app/api/events/[eventId]/photo-challenge/claim/route.ts`
- `app/api/events/[eventId]/photo-challenge/verify/route.ts`
- `app/api/events/[eventId]/photo-challenge/revoke/route.ts`
- `app/organizer/events/[eventId]/photo-challenge/verify/page.tsx`
- `drizzle/migrations/0014_photo_challenge.sql`
- `drizzle/schema.ts`

### Adjacent Integration Files

- `lib/services/event-photos.ts`
- `app/api/photos/[id]/approve/route.ts`
- `app/events/[eventId]/guest/_hooks/useGuestEventPageController.ts`
- `app/events/[eventId]/guest/_components/GuestEventPageView.tsx`
- `app/organizer/events/[eventId]/admin/page.tsx`
- `components/settings/SettingsAdminTab.tsx`
- `components/settings/tabs/FeaturesTab.tsx`
- `components/events/event-settings-form.tsx`

## Current Implementation

- Photo Challenge is event-gated through `photo_challenge_enabled` in event settings.
- The feature stores data in three main tables:
  - `photo_challenges`
  - `guest_photo_progress`
  - `prize_claims`
- Organizers can:
  - create, update, enable, disable, and delete a challenge config
  - view aggregate progress from the admin tab
  - verify or revoke prize claims from a separate organizer page
- Guests can:
  - see challenge progress on the guest event page
  - have progress updated during upload and again on moderation approval
  - open a prize modal when the goal is reached
  - generate a QR/token-based prize claim
- The upload pipeline increments:
  - `photos_uploaded` when a photo is accepted into the system
  - `photos_approved` when moderation later approves a photo
- Fingerprint helper functions try to support both prefixed and unprefixed guest IDs.

## Gap Analysis

### Planned or Partially Scaffolded

- `PrizeClaimModal.tsx` is legacy scaffold code with placeholder QR rendering and does not appear to drive the active flow.
- The organizer verify page says "Scan QR code or enter token," but I only found manual token entry, not a live scanner.
- The schema includes `verified_by` on prize claims, but the verify route does not persist verification state.
- There are two progress-all routes:
  - `photo-challenge/progress/all`
  - `challenge-progress-all`
  which suggests compatibility drift rather than a settled API surface.

### Concrete Missing or Broken Behavior

- The claim flow returns URLs like `/claim/{token}`, but I did not find a matching `app/claim/[token]` page.
- `updateGuestProgress` stops changing counts after `goal_reached` is true, so progress becomes stale once a guest crosses the finish line.
- The progress route recomputes approved photos directly from the `photos` table while still reading uploaded counts from `guest_photo_progress`, which creates split-source state.
- `can_claim` in the guest progress route does not check whether the prize was already claimed.
- The verify route reads claim data but does not mark the claim as verified or consumed.

## Strengths

- The core domain helpers are centralized in `lib/domain/events/photo-challenge.ts`.
- Photo Challenge is wired into the actual photo pipeline instead of relying on manual counter updates.
- The active guest prize modal uses a real QR library and gives a coherent claim UX.
- The feature has both organizer config UI and guest-facing progress UI, so it already spans the full event experience.
- The fingerprint helper strategy is a good attempt to smooth over historical identity format drift.

## Weaknesses and Risks

### High Priority

- Fingerprint handling is inconsistent across the claim, progress, revoke, and upload paths.
  - Some routes query `guest_${fingerprint}` only.
  - Some use the raw fingerprint.
  - Some normalize to either form.
  - Result: duplicate rows, missed lookups, and claim/progress drift are all possible.
- Claim verification is not a real lifecycle step yet.
  - Claims can be "verified" repeatedly because the verify route is read-only.
  - `verified_by` exists in schema but is unused.
- The QR code route points to a page that does not exist, so the shareable claim URL is broken outside the in-app modal.
- `updateGuestProgress` freezing counters after goal completion means the product can no longer answer "how many photos did this winner actually upload" accurately.

### Medium Priority

- The migration and the Drizzle schema appear to disagree on key column types in `0014_photo_challenge.sql` versus `drizzle/schema.ts`, which is a schema-drift risk for fresh or repaired environments.
- Progress is sourced from both the table and live photo queries, so different endpoints can disagree about the same guest.
- The revoke route updates `prize_claims` only by the exact provided fingerprint, while progress revocation iterates candidate fingerprints. That can split claim state from progress state.
- The public GET route for config does not enforce tenant-plan entitlement or event feature gating as tightly as Lucky Draw does.
- The admin progress list has no pagination, filtering, or participant identity enrichment.

### Lower Priority but Important

- `components/photo-challenge/progress-bar.tsx` uses a gradient in `backgroundColor`, which is not valid CSS and will not render as intended.
- The product exposes prize verification as a dedicated organizer page, but the main admin tab does not link the full lifecycle together well.
- There is dead or legacy UI that increases maintenance cost.
- I did not find Photo Challenge-specific automated tests in the repo.

## Improvement Report

### 1. Product Correctness

- Standardize fingerprint normalization in one shared helper and use it everywhere:
  - upload integration
  - guest progress
  - claim creation
  - claim verification
  - revoke
- Keep `photos_uploaded` and `photos_approved` updating even after goal completion.
- Make `can_claim` depend on both goal status and actual claim status.

### 2. Missing Features

- Add the missing `/claim/[token]` route or stop emitting public URLs that depend on it.
- Persist verification state and reviewer identity when organizers verify claims.
- Add a real QR scanner if the organizer verification page is supposed to support scanning.

### 3. Security and Data Integrity

- Wrap claim creation and progress updates in a transaction.
- Wrap revoke in a transaction and apply the same fingerprint resolution rules to both claim and progress rows.
- Review delete behavior for challenges that already have prize claims or progress rows.

### 4. UX

- Merge verification more clearly into the organizer admin flow instead of hiding it on a separate route.
- Add pagination/search/filtering for large participant lists.
- Remove or hide legacy placeholder UI so only the live claim path is visible to maintainers.

### 5. Performance

- Stop returning the full `guest_photo_progress` table for large events without pagination.
- Prefer SQL aggregation or joined reads for admin summaries instead of pushing raw rows to the client.

### 6. Code Quality

- Consolidate the progress-all route surface to one endpoint.
- Remove the placeholder `PrizeClaimModal.tsx` once the active modal is confirmed as the only supported path.
- Align `0014_photo_challenge.sql` with `drizzle/schema.ts` so the migration story is reliable.

### 7. Testing

- Add integration tests for:
  - challenge create/update/delete
  - upload progress increment
  - moderation approval increment
  - goal reached behavior
  - claim generation
  - repeat claim attempts
  - verification persistence
  - revoke behavior
  - fingerprint normalization across routes

## Bottom Line

Photo Challenge has a good product skeleton and strong upload integration, but its identity model and claim lifecycle are still too inconsistent to call it fully production-safe. The highest-value fixes are fingerprint normalization, persistent verification, and removing the broken `/claim/{token}` assumption.
