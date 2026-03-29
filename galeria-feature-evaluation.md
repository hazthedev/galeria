# Galeria — Feature Edge Case Evaluation & Fix Plan

> **Generated:** March 2026  
> **Repo:** github.com/hazthedev/galeria  
> **Stack:** Next.js, Supabase Auth, Redis sessions, Tailwind CSS, motion/react v12

---

## Feature-by-Feature Edge Case Evaluation

### Feature 1: Authentication (Register / Login / Admin Login)

| Edge case | Covered? | Detail |
|---|---|---|
| Email already exists | ✅ | Returns `USER_ALREADY_EXISTS` |
| Weak password | ✅ | Client + server validation |
| Rate limiting | ✅ | Per-email + per-IP limits |
| MFA login flow | ❌ **BROKEN** | API returns `MFA_REQUIRED` but **neither login form handles it** — no TOTP input UI exists. Super admins who enable MFA are permanently locked out |
| Password reset / forgot password | ❌ **MISSING** | No forgot password flow exists anywhere — no route, no UI, no API. Users who forget their password have zero recovery path |
| Session expiry while on page | ⚠️ Partial | API calls fail with 401 but the user gets generic errors, not a "session expired, please log in again" redirect |
| Admin login kills organizer session | ❌ | If organizer accidentally uses `/auth/admin/login`, the form authenticates then calls `logout` when role check fails, destroying their valid session |
| /terms and /privacy links | ❌ | Registration page links to pages that don't exist → 404 |
| Email case sensitivity | ✅ | `toLowerCase().trim()` applied |
| Double-submit prevention | ✅ | `isLoading` state disables button |

---

### Feature 2: Event Creation & Editing

| Edge case | Covered? | Detail |
|---|---|---|
| Empty event name | ✅ | Validation catches it |
| Past date for event | ⚠️ Partial | Only validates `> 2000-01-01`, doesn't warn about past dates — organizer can create events dated yesterday with no warning |
| Duplicate short code | ⚠️ Partial | Validated on server but error message is generic (`"Failed to save event"`) — doesn't tell user the code is taken |
| Short code reserved words | ❌ | No check for reserved paths like `admin`, `auth`, `api`, `events`, `organizer` — if someone sets short code to `admin`, `/e/admin` would conflict |
| Event with no features enabled | ✅ | Works fine, just a gallery |
| Editing event while guests are uploading | ⚠️ | No warning that live guests may see stale settings until they refresh |
| Deleting event with photos | ⚠️ Partial | API allows DELETE but no confirmation shows photo count — organizer might not realize they're deleting 500 photos |
| Max event name length | ❌ | No client-side max length on name input — server may reject very long names but user gets no upfront feedback |

---

### Feature 3: Photo Upload (Guest)

| Edge case | Covered? | Detail |
|---|---|---|
| File too large | ✅ | Client-side resize + server validation |
| Wrong file type | ⚠️ Partial | Allowed types set in system settings but the upload modal doesn't show which types are accepted |
| Upload limit reached (per-user) | ✅ | Shows remaining count, blocks further uploads |
| Upload limit reached (per-event/tier) | ✅ | Returns specific error codes |
| Anonymous upload without reCAPTCHA configured | ❌ **BROKEN** | `if ((isAnonymous \|\| !guestName) && !recaptchaToken)` always blocks because no CAPTCHA widget renders when site key isn't configured |
| Upload to ended event | ❌ **MISSING** | No event status check in the upload flow — guests can upload to ended/archived events. The upload button still shows and API doesn't reject based on status |
| Network failure mid-upload | ⚠️ Partial | Presigned upload catches transport errors and falls back to multipart, but no retry button for the user — just an error message |
| HEIC files on non-Apple browsers | ⚠️ | HEIC is in allowed types but most non-Apple browsers can't preview HEIC. No conversion warning |
| 5 file limit in single batch | ✅ | `Math.min(files.length, 5 - selectedFiles.length)` enforced |
| Guest with no name tries to upload | ✅ | `"Please enter your name first"` error shown |

---

### Feature 4: Photo Gallery & Reactions (Guest)

| Edge case | Covered? | Detail |
|---|---|---|
| Empty gallery (no photos yet) | ✅ | Empty state shown |
| Real-time new photos appear | ✅ | WebSocket + reconciliation |
| Gallery while offline | ❌ | No offline handling — gallery silently fails to load new photos, no "connection lost" indicator |
| Photo moderation notifications | ✅ | Guest sees "approved" / "rejected" notices |
| Max 10 loves per photo per user | ✅ | Client + server enforced |
| Love reaction rollback on error | ✅ | Optimistic update rolls back |
| Lightbox disabled by organizer | ✅ | `lightboxEnabled` flag checked |
| Gallery with 1000+ photos | ⚠️ Partial | Infinite scroll with 20-per-page, but no virtualization — DOM keeps growing, could cause performance issues on low-end phones |
| Gallery blocked behind name modal | ⚠️ | When `anonymous_allowed=false`, guest must enter name before seeing ANY photos — no "just browsing" option |

---

### Feature 5: Lucky Draw

| Edge case | Covered? | Detail |
|---|---|---|
| Guest joins draw with anonymous upload | ✅ | Draw entry blocked for anonymous |
| Draw config changes mid-event | ✅ | localStorage validated against active config ID, stale flags cleared |
| Guest wins but refreshes page | ⚠️ Partial | Win state shown for 12s then dismissed — if guest refreshes during those 12s, win notification is lost. Lucky draw numbers are persisted in localStorage though |
| No active draw config | ✅ | Draw toggle hidden |
| Multiple prize tiers | ✅ | Handled in draw admin |
| Organizer starts draw with 0 entries | ❌ | No validation preventing an empty draw — would fail silently or error |
| Draw timeout (organizer disconnects mid-draw) | ✅ | 60s safety timeout auto-dismisses overlay |
| Guest has multiple devices | ⚠️ | Lucky draw state is per-device (localStorage + fingerprint). Same guest on phone and laptop = two separate entries |

---

### Feature 6: Photo Challenges

| Edge case | Covered? | Detail |
|---|---|---|
| Challenge progress tracking | ✅ | Server-side progress + client display |
| Prize claim flow | ✅ | QR-verified claim path exists |
| Challenge created after guests already uploaded | ❌ | Existing uploads don't retroactively count toward the challenge goal. Guest who uploaded 5 photos before challenge was created shows 0 progress |
| Prize revoked after claiming | ✅ | `prize_revoked` flag checked |
| Auto-grant prize | ✅ | Modal auto-shows when goal reached |
| Challenge with 0 photo goal | ❌ | No validation preventing organizer from setting goal=0 |

---

### Feature 7: Attendance / Check-in

| Edge case | Covered? | Detail |
|---|---|---|
| QR check-in | ✅ | Functional |
| Duplicate check-in | ⚠️ Partial | Uses fingerprint — same person on different device can check in twice |
| Manual check-in by organizer | ✅ | API route exists |
| Attendance export | ✅ | CSV export available |
| Check-in on ended event | ❌ | No status check — guests can check in after event ends |

---

### Feature 8: Photo Moderation (Organizer)

| Edge case | Covered? | Detail |
|---|---|---|
| Approve/reject individual photos | ✅ | Works |
| Bulk operations on photos | ✅ | Bulk delete exists |
| Photo export with moderation filter | ✅ | Export approved only |
| Moderation logs | ✅ | Tracked in database, viewable in admin tab |
| Undo rejected photo | ⚠️ | No "undo reject" — rejected photos can only be found in rejected filter, no re-approve button visible in the standard flow |

---

### Feature 9: Organizer Dashboard & Navigation

| Edge case | Covered? | Detail |
|---|---|---|
| Role guard | ❌ **BROKEN** | Layout only checks `isAuthenticated`, not role. Guest-role users can access `/organizer` shell |
| Super admin accessing organizer features | ❌ | No navigation path from admin → organizer. Must manually type URL |
| Empty state (new organizer, no events) | ✅ | Empty state with CTA shown |
| Search events | ✅ | Works but requires Enter — no debounce |
| Pagination | ✅ | Works |

---

### Feature 10: Super Admin Panel

| Edge case | Covered? | Detail |
|---|---|---|
| Role guard | ✅ | Checks `super_admin` role |
| Bulk user actions | ✅ | Bulk delete + role change |
| Single user delete inconsistency | ⚠️ | Uses `window.confirm()` instead of `ConfirmDialog` |
| MFA enable/disable | ⚠️ | `MFASettings.tsx` exists (17KB) but NOT integrated into admin profile page |
| Tenant filter on events page | ❌ | Derived from current page results only — missing tenants on other pages |
| Audit log for destructive actions | ✅ | All admin actions logged |
| Settings deeply nested state | ⚠️ | Fragile nested `setSettings` pattern — one wrong spread and data is lost |

---

### Feature 11: Profile Management

| Edge case | Covered? | Detail |
|---|---|---|
| Update name | ✅ | Works |
| Change password | ✅ | Client validation + server |
| Password < 8 chars | ✅ | Validated |
| Password doesn't match confirm | ✅ | Validated |
| Change email | ❌ | Not possible — email field is disabled with "Email cannot be changed" note. Acceptable design decision but no alternative path offered |
| Delete account | ❌ **MISSING** | No way for a user to delete their own account. No GDPR-compliant data deletion path |

---

### Feature 12: Billing & Plans

| Edge case | Covered? | Detail |
|---|---|---|
| View current plan | ✅ | Shows tier + usage |
| Plan comparison | ✅ | Shows all tiers with features |
| Upgrade plan | ❌ **MISSING** | No payment integration — page shows plans but no "Upgrade" button that does anything. Tier changes are only possible via super admin panel |
| Downgrade plan | ❌ | Same — no self-service |
| Usage limits display | ✅ | Shows events/photos used vs limit |

---

---

## Fix Plan Checklist

### 🔴 Critical — Deploy Blockers

- [ ] **C1 — MFA login broken (locks out super admins)**
  - Add TOTP code input step to `admin-login-form.tsx` and `login-form.tsx`
  - Check for `mfaRequired` in API response before checking `success`
  - Show 6-digit input field, call `POST /api/auth/mfa/verify`
  - Files: `components/auth/admin-login-form.tsx`, `components/auth/login-form.tsx`

- [ ] **C2 — Anonymous upload blocked without reCAPTCHA config**
  - Gate the CAPTCHA requirement on whether reCAPTCHA is actually configured
  - Change: `if (recaptchaConfigured && !recaptchaToken)` instead of always requiring it
  - File: `events/[eventId]/guest/_hooks/useGuestEventPageController.ts` (line ~1280)

- [ ] **C3 — Organizer layout has no role guard**
  - Add `user.role` check for `organizer` or `super_admin` in layout redirect logic
  - Add matching null-render guard below loading state
  - File: `app/(app-shell)/organizer/layout.tsx`

---

### 🟠 High — Fix Within 1 Sprint

- [ ] **H1 — No forgot password flow**
  - Create `/auth/forgot-password` page + `POST /api/auth/reset-password` API
  - Use Supabase's built-in password reset email or implement token-based flow with Redis TTL
  - Files: new page + new API route + link from login form

- [ ] **H2 — No upload block on ended events**
  - Add event status check in `handleUpload()` — if `event.status !== 'active'`, show "This event has ended" and hide upload button
  - Also add server-side check in the photos upload API
  - Files: `useGuestEventPageController.ts`, `GuestEventPageView.tsx`, `lib/services/event-photos.ts`

- [ ] **H3 — Admin login destroys organizer session**
  - Remove the `fetch('/api/auth/logout')` call in admin-login-form when role doesn't match
  - Just show the error — the session is harmless since admin layout rejects non-admins anyway
  - File: `components/auth/admin-login-form.tsx`

- [ ] **H4 — /terms and /privacy pages are 404**
  - Create placeholder pages at `app/(app-shell)/terms/page.tsx` and `app/(app-shell)/privacy/page.tsx`
  - Or change register page links to `#` with "Coming soon" tooltip
  - Files: new pages or modify `app/(app-shell)/auth/register/page.tsx`

- [ ] **H5 — No check-in block on ended events**
  - Add status check in attendance API — reject check-ins for non-active events
  - File: `app/api/events/[eventId]/attendance/route.ts`

- [ ] **H6 — Super admin has no path to organizer features**
  - Add "Organizer View" link to admin sidebar `SIDEBAR_ITEMS` array
  - File: `app/(app-shell)/admin/layout.tsx`

---

### 🟡 Medium — Fix Within 2 Sprints

- [ ] **M1 — No account deletion (GDPR)**
  - Add "Delete Account" button to profile page with confirmation dialog
  - API should cascade-delete user data (events, photos, etc.) or anonymize
  - Files: `app/(app-shell)/profile/page.tsx`, new API route `app/api/organizer/profile/route.ts` (DELETE method)

- [ ] **M2 — Short code reserved words collision**
  - Add reserved words list (`admin`, `auth`, `api`, `events`, `organizer`, `profile`, `e`) to client + server validation
  - Files: `components/events/event-form.tsx`, `app/api/events/route.ts`

- [ ] **M3 — No session expiry handling**
  - Create an auth interceptor that catches 401 responses and redirects to `/auth/login?expired=true` with a toast message
  - Files: `lib/auth.ts` or a shared fetch wrapper

- [ ] **M4 — Past event date allowed silently**
  - Add warning (not blocker) when event date is in the past: "This date is in the past — are you sure?"
  - File: `components/events/event-form.tsx`

- [ ] **M5 — Lucky draw with 0 entries**
  - Add check in draw trigger — show warning "No entries yet" and block draw start
  - File: `components/lucky-draw/admin/tabs/DrawTab.tsx`

- [ ] **M6 — MFA not integrated into admin profile**
  - Import existing `MFASettings` component into admin profile page below the password section
  - File: `app/(app-shell)/admin/profile/page.tsx`

- [ ] **M7 — Gallery performance with 1000+ photos**
  - Add virtualization (e.g., `react-window` or CSS `content-visibility`) for galleries exceeding ~200 photos
  - File: `events/[eventId]/guest/_components/GalleryGrid.tsx`

- [ ] **M8 — Photo challenge doesn't count pre-existing uploads**
  - When creating a challenge, query existing approved photos for the event and seed initial progress for guests who already uploaded
  - Files: `app/api/events/[eventId]/photo-challenge/route.ts`

- [ ] **M9 — Gallery blocked behind name modal (no browse mode)**
  - Add "Just Browsing" skip button to `GuestNameModal` — set `browseOnly` flag, hide upload button, prompt for name only when they try to upload
  - Files: `GuestNameModal.tsx`, `GuestEventPageView.tsx`, `useGuestEventPageController.ts`

---

### 🔵 Low — Polish / Backlog

- [ ] **L1 — `window.confirm` in users page**
  - Replace with `ConfirmDialog` hook (pattern already used for bulk delete)
  - File: `app/(app-shell)/admin/users/page.tsx`

- [ ] **L2 — No offline indicator in guest gallery**
  - Add WebSocket connection status indicator — show subtle "Reconnecting..." bar when connection drops
  - File: `GuestEventPageView.tsx` or `lib/realtime/client.ts`

- [ ] **L3 — HEIC preview on non-Apple browsers**
  - Detect HEIC and show placeholder thumbnail with "Preview not available" message
  - File: `events/[eventId]/guest/_components/UploadModal.tsx`

- [ ] **L4 — No retry button on upload failure**
  - Add "Retry" button next to error message that re-triggers `handleUpload()`
  - File: `events/[eventId]/guest/_components/UploadModal.tsx`

- [ ] **L5 — Duplicate short code error message is generic**
  - Catch `DUPLICATE_SHORT_CODE` error code from API and show "This URL code is already taken"
  - File: `components/events/event-form.tsx`

- [ ] **L6 — Event delete doesn't show photo count warning**
  - Fetch photo count in confirm dialog: "This will delete the event and its X photos"
  - File: `app/(app-shell)/organizer/events/[eventId]/admin/page.tsx`

- [ ] **L7 — No billing/upgrade integration**
  - Placeholder — needs payment provider integration (Stripe, etc.)
  - File: `app/(app-shell)/organizer/billing/page.tsx`

- [ ] **L8 — Duplicate check-in across devices**
  - Accept as known limitation or implement server-side deduplication by guest name
  - File: `app/api/events/[eventId]/attendance/route.ts`

- [ ] **L9 — Photo challenge goal=0 allowed**
  - Add `min: 1` validation in settings form and API
  - Files: `components/photo-challenge/settings-form.tsx`, `app/api/events/[eventId]/photo-challenge/route.ts`

- [ ] **L10 — Settings page nested state fragile**
  - Refactor to `useReducer` or `immer` for deeply nested settings updates
  - File: `app/(app-shell)/admin/settings/page.tsx`

---

## Summary

| Priority | Count | Status |
|---|---|---|
| 🔴 Critical | 3 | Must fix before any deployment |
| 🟠 High | 6 | Fix within current sprint |
| 🟡 Medium | 9 | Fix within 2 sprints |
| 🔵 Low | 10 | Backlog / polish |
| **Total** | **28** | |
