# Attendance Audit - 2026-03-15

## Scope

This note captures the current Attendance implementation in the codebase, the main gaps and risks, and a prioritized improvement plan.

## Files Found

### Direct Attendance Files

- `types/domain/attendance.ts`
- `drizzle/migrations/0013_attendance.sql`
- `components/attendance/AttendanceAdminTab.tsx`
- `components/attendance/CheckInModal.tsx`
- `components/attendance/OrganizerQRScanner.tsx`
- `app/attendance/[eventId]/checkin/page.tsx`
- `app/organizer/events/[eventId]/attendance/page.tsx`
- `app/organizer/events/[eventId]/attendance/qr/page.tsx`
- `app/organizer/events/[eventId]/attendance/guests/page.tsx`
- `app/api/events/[eventId]/attendance/route.ts`
- `app/api/events/[eventId]/attendance/manual/route.ts`
- `app/api/events/[eventId]/attendance/my/route.ts`
- `app/api/events/[eventId]/attendance/export/route.ts`
- `app/api/events/[eventId]/attendance/stats/route.ts`
- `app/api/events/[eventId]/attendance-export/route.ts`
- `app/api/events/[eventId]/attendance-stats/route.ts`

### Adjacent Integration Files

- `app/events/[eventId]/guest/_hooks/useGuestEventPageController.ts`
- `app/events/[eventId]/guest/_components/GuestEventPageView.tsx`
- `app/organizer/events/[eventId]/admin/page.tsx`
- `components/settings/SettingsAdminTab.tsx`
- `components/settings/tabs/FeaturesTab.tsx`
- `components/events/event-settings-form.tsx`
- `drizzle/schema.ts`
- `lib/shared/utils/qrcode.ts`

## Current Implementation

- Attendance is event-gated through `attendance_enabled` in event settings.
- The feature stores attendance rows in the `attendances` table with four method types:
  - `guest_self`
  - `guest_qr`
  - `organizer_manual`
  - `organizer_qr`
- Guests can check in from:
  - the guest event page modal
  - the dedicated `/attendance/[eventId]/checkin` page
- Organizers can manage attendance from the shared `AttendanceAdminTab`, which is mounted in both the dedicated attendance route and the admin dashboard tab.
- Organizer/admin behavior currently includes:
  - attendance stats
  - paginated attendance list
  - local search over fetched rows
  - manual guest check-in
  - CSV export
  - QR code display and shareable check-in link
  - a scanner surface for organizer-side QR intake
- Guest-side state lookup exists through `/api/events/[eventId]/attendance/my`, which tries to resolve attendance by fingerprint.
- The read endpoints generally fail soft when the attendance table is missing, so older tenants do not hard-crash the UI.

## Gap Analysis

### Planned or Partially Scaffolded

- `OrganizerQRScanner.tsx` is still a demo scaffold. It simulates scan results instead of decoding real QR camera input.
- `AttendanceAdminTab.tsx` exposes a "CSV Import (Coming Soon)" block, but there is no import handler or route behind it.
- `guest_qr` and `organizer_qr` exist in the type model and stats breakdown, but I did not find a real end-to-end path that produces those methods today.
- The dedicated organizer subroutes for `attendance/qr` and `attendance/guests` are only redirects back to the main attendance page.

### Concrete Missing or Broken Behavior

- Duplicate prevention only checks `guest_email` and `guest_phone`. A guest without either value can check in repeatedly with the same device.
- `/attendance/my` depends on fingerprint matching, but the write path can generate a random fingerprint when none is supplied. That creates identity drift between "create check-in" and "read my status."
- The standalone `/attendance/[eventId]/checkin` page tracks success only in local component state, so it does not restore already-checked-in status after a refresh.
- The stats endpoint counts `unique_guests` by distinct email only, which undercounts walk-in or phone-only guests.

## Strengths

- The feature has a clean shared admin surface instead of duplicating organizer-only UI.
- Role checks are centralized through `requireEventModeratorAccess`, which keeps privileged reads and writes consistent.
- The guest event page already integrates attendance status lookup, so the feature feels connected to the main guest experience.
- Stats, list, manual entry, export, and QR sharing are already present, which makes the feature operational even before scanner/import polish.
- Missing-table fallbacks are thoughtful and reduce rollout risk for partially migrated environments.

## Weaknesses and Risks

### High Priority

- Duplicate prevention is not aligned with the actual identity model.
  - The table and guest lookup both rely on fingerprint-like identity.
  - The create routes only guard on email and phone.
  - Result: duplicate anonymous or lightly identified check-ins are easy to create.
- The create flows are not transactional.
  - Duplicate checks and inserts happen as separate steps.
  - Concurrent requests can race each other.
  - The routes do not appear to normalize database unique-violation handling into stable API responses.
- `/attendance/my` can fail to recognize a legitimate prior check-in if the original write stored a generated fingerprint value instead of the guest's later header fingerprint.

### Medium Priority

- Organizer QR scanning is not production-ready because it does not use camera decoding.
- The stats model is misleading for real-world events because `unique_guests` excludes guests without email.
- CSV export renders timestamps with `toLocaleString()`, which is unstable for downstream processing and varies by server locale.
- Export loads the full event attendance set into memory, which is fine for small events but will get expensive on large ones.
- Search in the admin tab is client-side over the current fetched page, not server-side over the full dataset.

### Lower Priority but Important

- There are duplicate route surfaces for export and stats:
  - `attendance/export` and `attendance-export`
  - `attendance/stats` and `attendance-stats`
- The scanner and import surfaces increase perceived completeness, but both still lead to dead-end or demo behavior.
- The attendance feature stores IP/user-agent metadata, so privacy expectations should be reviewed and documented if this becomes a customer-facing selling point.
- I did not find Attendance-specific automated tests in the repo.

## Improvement Report

### 1. Product Correctness

- Make fingerprint a first-class duplicate check path for both guest and organizer check-ins.
- Align `/attendance/my` with the exact identity format used during check-in creation.
- Revisit the definition of `unique_guests` so the metric matches how the product talks about attendance.

### 2. Missing Features

- Replace the simulated organizer scanner with a real QR camera flow.
- Either implement CSV import end to end or remove the import teaser until it is ready.
- Decide whether `guest_qr` and `organizer_qr` are real product modes; if yes, wire them through the actual flow and reporting.

### 3. Security and Data Integrity

- Wrap duplicate detection plus insert in a transaction or move more of the uniqueness enforcement to the database.
- Add clearer handling for uniqueness violations so duplicate attempts return stable errors instead of generic 500s.
- Review whether metadata retention for check-ins is necessary and documented.

### 4. UX

- Make the dedicated check-in page restore prior attendance state by calling `/attendance/my` on load.
- Add server-side search and filtering for larger attendance lists.
- Clarify the organizer UI so demo-only scanner behavior is not mistaken for a live camera tool.

### 5. Performance

- Stream or chunk CSV export for larger events.
- Support server-side pagination and search in the attendance list.
- Consider moving some stats work to materialized summaries if attendance becomes high-volume.

### 6. Code Quality

- Consolidate the alias routes once compatibility is no longer needed.
- Share duplicate-detection logic between guest and organizer create routes instead of maintaining two similar implementations.
- Add typed/domain errors instead of relying on string-matching thrown messages.

### 7. Testing

- Add integration tests for:
  - guest self check-in
  - organizer manual check-in
  - duplicate prevention
  - `/attendance/my` fingerprint lookup
  - stats accuracy
  - CSV export output
  - feature-disabled behavior

## Bottom Line

Attendance is usable today for basic event operations, but two highly visible pieces are still unfinished: real organizer QR scanning and CSV import. The most important correctness work is around identity consistency and duplicate prevention, because those affect trust in the attendance count itself.
