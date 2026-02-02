# Gatherly IMPROVEMENT PLAN
## Prioritized Roadmap from Critical to Nice-to-Have

---

## PRIORITY LEGEND

| Priority | Description |
|----------|-------------|
| **P0** | CRITICAL - Security vulnerabilities, data loss risk, legal exposure |
| **P1** | HIGH - Core functionality gaps, major UX issues |
| **P2** | MEDIUM - Feature gaps, polish, performance |
| **P3** | LOW - Nice-to-have, enhancements |

---

## P0 - CRITICAL (Must Fix Before Public Launch)

### 1. FILE UPLOAD SECURITY HARDENING

**RISK:** Malicious file uploads, image bombs, EXIF leaks, storage abuse

- [x] **1.1** Implement file validation BEFORE upload
  - Magic byte verification (not just extension)
  - MIME type whitelist: image/jpeg, image/png, image/webp, image/heic
  - Max file size: 50MB (configurable per tier)
  - Dimension limits: max 10000x10000px (prevent pixel flood)
  - File: `lib/upload/validator.ts` ✅ **COMPLETED**

- [x] **1.2** Process images through Sharp with security
  - Strip ALL EXIF data (GPS, device info, timestamps)
  - Normalize format to JPEG/WebP
  - Enforce max dimensions during resize
  - Detect and reject malformed/corrupted images
  - File: `lib/upload/image-processor.ts` ✅ **COMPLETED**

- [x] **1.3** Add rate limiting to upload endpoint
  - 10 uploads per hour per IP/fingerprint
  - 100 uploads per day per event
  - Burst protection: max 5 in 1 minute
  - Use Redis for distributed limiting
  - File: `lib/rate-limit.ts` ✅ **COMPLETED**

- [x] **1.4** Add reCAPTCHA v3 for anonymous uploads
  - Score threshold: 0.5
  - Fallback to challenge for suspicious activity
  - Site key configurable per tenant
  - File: `components/auth/Recaptcha.tsx` ✅ **COMPLETED**

**Dependencies:** None
**Effort:** 3-4 days
**Files to Create/Modify:**
- `lib/upload/validator.ts` (new)
- `lib/upload/image-processor.ts` (new)
- `middleware/rate-limit.ts` (modify)
- `app/api/events/[eventId]/photos/route.ts` (modify)

---

### 2. CONTENT MODERATION ENFORCEMENT

**RISK:** Illegal content, brand damage, legal liability

- [x] **2.1** Implement auto-moderation with AI
  - AWS Rekognition for: nudity, violence, drugs
  - Text detection for inappropriate content
  - Confidence threshold: 80%
  - Auto-reject + flag for review
  - File: `lib/moderation/auto-moderate.ts` ✅ **COMPLETED**

- [x] **2.2** Add quarantine system for flagged content
  - Separate storage prefix for unreviewed content
  - Prevent public access until approved
  - Auto-delete after 7 days if unreviewed
  - File: `lib/storage/quarantine.ts` ✅ **COMPLETED**

- [x] **2.3** Implement content scanning queue
  - Background job processing via Bull/Agenda
  - Priority queue for reported content
  - Retry logic for failed scans
  - File: `jobs/scan-content.ts` ✅ **COMPLETED**

**Dependencies:** AWS Rekognition, job queue
**Effort:** 4-5 days
**Files to Create/Modify:**
- `lib/moderation/auto-moderate.ts` (new) ✅
- `lib/storage/quarantine.ts` (new) ✅
- `jobs/scan-content.ts` (new) ✅
- `lib/moderation/init.ts` (new) ✅
- `app/api/events/[eventId]/photos/route.ts` (modified) ✅

---

### 3. CSRF PROTECTION

**RISK:** Cross-site request forgery attacks on state-changing operations

- [ ] **3.1** Implement CSRF token generation
  - Generate per-session tokens
  - Store in Redis with session
  - Rotate on sensitive actions
  - File: `lib/csrf/tokens.ts`

- [ ] **3.2** Add CSRF middleware
  - Validate token on all POST/PUT/DELETE
  - Double-submit cookie pattern
  - Exempt GET requests and public endpoints
  - File: `middleware/csrf.ts`

- [ ] **3.3** Update all forms to include CSRF token
  - Hidden input field with token
  - Auto-attach via useForm hook
  - File: `hooks/useForm.ts`

**Dependencies:** None
**Effort:** 2 days
**Files to Create/Modify:**
- `lib/csrf/tokens.ts` (new)
- `middleware/csrf.ts` (new)
- `hooks/useForm.ts` (new)
- All form components (modify)

---

### 4. AUTHENTICATION SECURITY ENHANCEMENTS

**RISK:** Session hijacking, brute force, unauthorized access

- [ ] **4.1** Implement proper password requirements
  - Min 12 characters
  - Require: uppercase, lowercase, number, special char
  - Check against common passwords list
  - File: `lib/auth/password-policy.ts`

- [ ] **4.2** Add account lockout mechanism
  - 5 failed attempts = 15 minute lockout
  - Exponential backoff for repeated failures
  - Email notification on lockout
  - File: `lib/auth/lockout.ts`

- [ ] **4.3** Implement session management improvements
  - Show active sessions to user
  - Allow remote logout of all devices
  - Detect and alert on suspicious activity
  - File: `app/api/auth/sessions/route.ts`

- [ ] **4.4** Add 2FA/TOTP support for admins
  - Authenticator app based (not SMS)
  - Backup codes
  - Required for super_admin role
  - File: `lib/auth/two-factor.ts`

**Dependencies:** None
**Effort:** 5 days
**Files to Create/Modify:**
- `lib/auth/password-policy.ts` (new)
- `lib/auth/lockout.ts` (new)
- `lib/auth/two-factor.ts` (new)
- `app/api/auth/sessions/route.ts` (new)
- `components/auth/TwoFactorSetup.tsx` (new)

---

### 5. DATA PRIVACY & COMPLIANCE

**RISK:** GDPR violations, privacy breaches, regulatory fines

- [ ] **5.1** Implement consent management
  - Cookie consent banner
  - Photo upload consent (for guest photos)
  - Data processing consent
  - File: `components/consent/ConsentBanner.tsx`

- [ ] **5.2** Add GDPR data export endpoint
  - Export all user data in machine-readable format
  - Include photos uploaded by user
  - Generate within 30 days requirement
  - File: `app/api/auth/me/export/route.ts`

- [ ] **5.3** Implement right to deletion
  - Cascade delete user data
  - Anonymize photos instead of hard delete
  - Keep moderation logs
  - File: `app/api/auth/me/route.ts` (DELETE)

- [ ] **5.4** Add data retention policies
  - Auto-delete anonymous uploads after 90 days
  - Auto-delete rejected photos after 30 days
  - Configurable per tenant
  - File: `jobs/data-retention.ts`

**Dependencies:** None
**Effort:** 3 days
**Files to Create/Modify:**
- `components/consent/ConsentBanner.tsx` (new)
- `app/api/auth/me/export/route.ts` (new)
- `app/api/auth/me/route.ts` (modify - add DELETE)
- `jobs/data-retention.ts` (new)

---

## P1 - HIGH (Core Functionality Gaps)

### 6. REAL-TIME UPDATES

**IMPACT:** Users must refresh to see new content - poor experience

- [ ] **6.1** Set up WebSocket infrastructure
  - Use Pusher or Ably (managed) or Socket.io
  - Event-driven architecture
  - Authentication via JWT
  - File: `lib/websocket/server.ts`

- [ ] **6.2** Implement photo upload broadcasts
  - Notify connected clients of new photos
  - Include preview thumbnail
  - Per-event channels
  - File: `lib/websocket/handlers/photos.ts`

- [ ] **6.3** Add reaction updates in real-time
  - Broadcast reaction changes
  - Update counters without refresh
  - File: `lib/websocket/handlers/reactions.ts`

- [ ] **6.4** Implement lucky draw progress updates
  - Broadcast wheel spin progress
  - Show winner to all clients
  - File: `lib/websocket/handlers/lucky-draw.ts`

**Dependencies:** Pusher/Ably account or Socket.io server
**Effort:** 5 days
**Files to Create/Modify:**
- `lib/websocket/server.ts` (new)
- `lib/websocket/handlers/photos.ts` (new)
- `lib/websocket/handlers/reactions.ts` (new)
- `hooks/useRealtimePhotos.ts` (new)
- `hooks/useRealtimeReactions.ts` (new)
- `components/gallery/PhotoGallery.tsx` (modify)

---

### 7. NOTIFICATION SYSTEM

**IMPACT:** Users miss updates, organizers can't moderate promptly

- [ ] **7.1** Design notification data model
  - Table: notifications
  - Types: new_photo, photo_approved, lucky_draw, event_update
  - Read/unread status
  - File: `drizzle/schema.ts`

- [ ] **7.2** Implement email notifications
  - Use Resend or SendGrid
  - Templates for each notification type
  - User notification preferences
  - File: `lib/notifications/email.ts`

- [ ] **7.3** Add in-app notification center
  - Bell icon with unread count
  - Notification list with timestamps
  - Mark as read / dismiss all
  - File: `components/notifications/NotificationCenter.tsx`

- [ ] **7.4** Implement notification preferences
  - Per-user settings
  - Email vs in-app toggles
  - File: `app/api/user/notifications/preferences/route.ts`

**Dependencies:** Email provider (Resend/SendGrid)
**Effort:** 4 days
**Files to Create/Modify:**
- `drizzle/schema.ts` (modify - add notifications)
- `lib/notifications/email.ts` (new)
- `components/notifications/NotificationCenter.tsx` (new)
- `app/api/notifications/route.ts` (new)

---

### 8. PHOTO DOWNLOAD & EXPORT

**IMPACT:** Users can't save photos, key feature missing

- [x] **8.1** Implement individual photo download
  - Download original quality button
  - Proper filename: `{event}_{id}_{date}.{ext}`
  - File: `app/api/photos/[id]/download/route.ts`

- [x] **8.2** Add bulk download for organizers
  - Select multiple photos
  - Generate ZIP on the fly
  - Include event manifest
  - File: `app/api/events/[eventId]/photos/export/route.ts`

- [x] **8.3** Implement guest download (with approval)
  - Organizer can enable/disable
  - Watermark option for guest downloads
  - File: `app/api/events/[eventId]/download/route.ts`

- [ ] **8.4** Add export queue for large exports
  - Background processing for 1000+ photos
  - Email when ready
  - Download link expires after 24 hours

**Dependencies:** Archiver (ZIP), background jobs
**Effort:** 3 days
**Files to Create/Modify:**
- `app/api/photos/[id]/download/route.ts` (new)
- `app/api/events/[eventId]/photos/export/route.ts` (new)
- `app/api/events/[eventId]/download/route.ts` (new)
- `lib/export/zip-generator.ts` (new)
- `components/gallery/PhotoGallery.tsx` (modify)

---

### 9. PERFORMANCE OPTIMIZATION

**IMPACT:** Slow loading, poor UX, high hosting costs

- [x] **9.1** Implement Next.js Image optimization
  - Use next/image for all photos
  - Configure loader for S3/R2
  - Responsive sizes with srcset
  - File: `next.config.js`, `lib/images/loader.ts`

- [x] **9.2** Add virtual scrolling to photo gallery
  - Render only visible + buffer photos
  - Use react-window or react-virtuoso
  - ~10x performance improvement for large galleries
  - File: `components/gallery/VirtualPhotoGallery.tsx`

- [x] **9.3** Implement proper caching strategy
  - CDN for static assets
  - Cache headers for photos (1 year with hash)
  - API response caching where appropriate
  - File: `lib/cache/strategy.ts`

- [x] **9.4** Add database query optimization
  - Add composite indexes for common queries
  - Use connection pooling
  - Implement prepared statements
  - File: `drizzle/migrations/0011_performance_indexes.sql`

**Dependencies:** None
**Effort:** 4 days
**Files to Create/Modify:**
- `next.config.js` (modify)
- `lib/images/loader.ts` (new)
- `components/gallery/VirtualPhotoGallery.tsx` (new)
- `lib/cache/strategy.ts` (new)
- `drizzle/migrations/...` (new)

---

### 10. ERROR BOUNDARIES & GRACEFUL DEGRADATION

**IMPACT:** Crashes, lost data, poor user experience

- [ ] **10.1** Add React Error Boundaries
  - Wrap each route segment
  - Graceful error UI
  - Error logging to service (Sentry)
  - File: `app/error.tsx`, `components/ErrorBoundary.tsx`

- [ ] **10.2** Implement API error handling
  - Standardized error responses
  - Proper HTTP status codes
  - User-friendly error messages
  - File: `lib/api/errors.ts`

- [ ] **10.3** Add retry logic for failed requests
  - Exponential backoff
  - Toast notifications for retries
  - File: `lib/api/retry.ts`

- [ ] **10.4** Implement optimistic UI updates
  - Show changes immediately, rollback on error
  - Especially for reactions, uploads
  - File: `hooks/useOptimisticMutation.ts`

**Dependencies:** Sentry (optional)
**Effort:** 3 days
**Files to Create/Modify:**
- `app/error.tsx` (new)
- `components/ErrorBoundary.tsx` (new)
- `lib/api/errors.ts` (new)
- `lib/api/retry.ts` (new)
- `hooks/useOptimisticMutation.ts` (new)

---

## P2 - MEDIUM (Feature Gaps & Polish)

### 11. VIDEO SUPPORT

**IMPACT:** Incomplete event coverage

- [ ] **11.1** Add videos table to schema
  - Similar to photos table
  - Additional: duration, format, thumbnail
  - File: `drizzle/schema.ts`

- [ ] **11.2** Implement video upload processing
  - FFmpeg for thumbnail generation
  - Transcode to standard format (MP4/H264)
  - Generate multiple qualities
  - File: `lib/upload/video-processor.ts`

- [ ] **11.3** Create video player component
  - Support for HLS/DASH streaming
  - Mobile-optimized controls
  - File: `components/video/VideoPlayer.tsx`

- [ ] **11.4** Update gallery for mixed content
  - Visual distinction for videos
  - Filter by type
  - File: `components/gallery/PhotoGallery.tsx`

**Dependencies:** FFmpeg, video transcoding service
**Effort:** 5 days
**Files to Create/Modify:**
- `drizzle/schema.ts` (modify)
- `lib/upload/video-processor.ts` (new)
- `components/video/VideoPlayer.tsx` (new)
- `app/api/events/[eventId]/videos/route.ts` (new)

---

### 12. DESIGN SYSTEM

**IMPACT:** Inconsistent UI, slower development, poor accessibility

- [ ] **12.1** Define design tokens
  - Colors (semantic, not just names)
  - Typography scale
  - Spacing scale (4px base)
  - Border radius, shadows
  - File: `tailwind.config.ts`, `lib/design/tokens.ts`

- [ ] **12.2** Create base component library
  - Button, Input, Select, Checkbox, Radio
  - Modal, Dropdown, Tooltip
  - All with variants and accessibility
  - File: `components/ui/*`

- [ ] **12.3** Implement Storybook for components
  - Document all components
  - Interactive playground
  - Accessibility testing
  - File: `.storybook/*`

- [ ] **12.4** Add accessibility improvements
  - ARIA labels throughout
  - Keyboard navigation support
  - Focus indicators
  - Screen reader testing
  - File: All interactive components

**Dependencies:** Storybook
**Effort:** 5 days
**Files to Create/Modify:**
- `tailwind.config.ts` (modify)
- `lib/design/tokens.ts` (new)
- `components/ui/*` (refactor)
- `.storybook/*` (new)

---

### 13. SEARCH & FILTER

**IMPACT:** Can't find photos in large events

- [ ] **13.1** Add photo metadata indexing
  - Full-text search on descriptions (when added)
  - Filter by: date, uploader, reactions, moderation status
  - File: `drizzle/migrations/0012_search_indexes.sql`

- [ ] **13.2** Implement search API endpoint
  - Flexible query builder
  - Pagination, sorting
  - File: `app/api/events/[eventId]/photos/search/route.ts`

- [ ] **13.3** Create search/filter UI component
  - Search input with debouncing
  - Filter chips
  - Sort options
  - File: `components/gallery/PhotoFilters.tsx`

- [ ] **13.4** Add advanced filters (optional)
  - Date range picker
  - Multi-select for uploader
  - Reaction count threshold
  - File: `components/gallery/AdvancedFilters.tsx`

**Dependencies:** None
**Effort:** 3 days
**Files to Create/Modify:**
- `drizzle/migrations/0012_search_indexes.sql` (new)
- `app/api/events/[eventId]/photos/search/route.ts` (new)
- `components/gallery/PhotoFilters.tsx` (new)
- `components/gallery/PhotoGallery.tsx` (modify)

---

### 14. ALBUMS & COLLECTIONS

**IMPACT:** No organization for large events

- [ ] **14.1** Add albums table
  - name, description, cover_photo, order
  - Many-to-many with photos
  - File: `drizzle/schema.ts`

- [ ] **14.2** Create album management API
  - CRUD operations
  - Add/remove photos
  - Reorder
  - File: `app/api/events/[eventId]/albums/route.ts`

- [ ] **14.3** Build album UI components
  - Album grid view
  - Album detail page
  - Drag-drop to organize
  - File: `components/albums/*`

- [ ] **14.4** Add smart albums (auto-generated)
  - "All photos"
  - "My uploads"
  - "Most reacted"
  - File: `lib/albums/smart-albums.ts`

**Dependencies:** None
**Effort:** 4 days
**Files to Create/Modify:**
- `drizzle/schema.ts` (modify)
- `app/api/events/[eventId]/albums/route.ts` (new)
- `components/albums/AlbumGrid.tsx` (new)
- `components/albums/AlbumDetail.tsx` (new)

---

### 15. MOBILE OPTIMIZATION

**IMPACT:** Poor mobile experience

- [ ] **15.1** Add PWA configuration
  - manifest.json with icons, theme
  - Service worker for offline support
  - Install prompt
  - File: `public/manifest.json`, `app/sw.ts`

- [ ] **15.2** Optimize mobile upload experience
  - Direct camera access
  - Photo selection before upload
  - Batch upload with progress
  - File: `components/upload/MobileUploader.tsx`

- [ ] **15.3** Add mobile-specific gestures
  - Swipe to navigate photos
  - Pinch to zoom in lightbox
  - Pull to refresh
  - File: `components/gallery/MobilePhotoGallery.tsx`

- [ ] **15.4** Test and optimize for various screen sizes
  - iPhone SE, iPhone 14 Pro Max
  - Android small, medium, large
  - Touch target sizing (44px min)
  - File: All components

**Dependencies:** None
**Effort:** 4 days
**Files to Create/Modify:**
- `public/manifest.json` (new)
- `app/sw.ts` (new)
- `components/upload/MobileUploader.tsx` (new)
- `components/gallery/MobilePhotoGallery.tsx` (new)

---

## P3 - LOW (Nice-to-Have Enhancements)

### 16. COMMENTS & CAPTIONS

**IMPACT:** Minimal - users can currently just react

- [ ] Add comments table, API, UI components, moderation

**Effort:** 3 days

---

### 17. SOCIAL SHARING

**IMPACT:** Low - can share via URL

- [ ] Open Graph tags, social media metadata, share buttons

**Effort:** 2 days

---

### 18. THEMES & PERSONALIZATION

**IMPACT:** Low - already have tenant-level branding

- [ ] Dark mode, user theme preferences, custom accent colors

**Effort:** 3 days

---

### 19. ADVANCED ANALYTICS

**IMPACT:** Low - have basic stats

- [ ] Engagement tracking, heat maps, export to CSV, charts/graphs

**Effort:** 4 days

---

### 20. INTEGRATIONS

**IMPACT:** Low - nice-to-have for power users

- [ ] Google Photos import, Dropbox sync, Zapier/webhooks

**Effort:** 5+ days

---

## EXECUTION TIMELINE

### PHASE 1 - SECURITY FOUNDATION (Week 1-2)
**MUST COMPLETE BEFORE ANY PUBLIC ACCESS**

**Week 1:**
- [ ] File Upload Security (P0.1)
- [ ] CSRF Protection (P0.3)
- [ ] Password Policy (P0.4.1)

**Week 2:**
- [ ] Content Moderation (P0.2)
- [ ] Auth Lockout + 2FA (P0.4.2-4)
- [ ] Data Privacy (P0.5)

**DELIVERABLE:** System is secure enough for beta testing

---

### PHASE 2 - CORE FEATURES (Week 3-5)
**REQUIRED FOR VIABLE PRODUCT**

**Week 3:**
- [ ] Real-time Updates (P1.6)
- [ ] Performance Optimization (P1.9)

**Week 4:**
- [ ] Notification System (P1.7)
- [ ] Photo Download/Export (P1.8)

**Week 5:**
- [ ] Error Boundaries (P1.10)
- [ ] Mobile Optimization (P2.15)

**DELIVERABLE:** Feature-complete product ready for public launch

---

### PHASE 3 - POLISH & SCALE (Week 6-8)
**COMPETITIVE PRODUCT**

**Week 6:**
- [ ] Design System (P2.12)
- [ ] Video Support (P2.11)

**Week 7:**
- [ ] Search & Filter (P2.13)
- [ ] Albums & Collections (P2.14)

**Week 8:**
- [ ] Comments (P3.16)
- [ ] Social Sharing (P3.17)
- [ ] Polish & bug fixes

**DELIVERABLE:** Polished, market-ready SaaS product

---

### PHASE 4 - ENHANCEMENTS (Ongoing)
**COMPETITIVE ADVANTAGE**

- [ ] Advanced Analytics (P3.19)
- [ ] Themes (P3.18)
- [ ] Integrations (P3.20)

**DELIVERABLE:** Market-leading feature set

---

## SUMMARY BY PRIORITY

| Priority | Tasks | Total Effort | Blocker |
|----------|-------|--------------|----------|
| P0 | Security Hardening | 17-20 days | Public Launch |
| P1 | Core Functionality | 19-23 days | User Retention |
| P2 | Feature Completeness | 21-25 days | Competitiveness |
| P3 | Enhancements | 17+ days | Nice-to-Have |
| **MVP (P0)** | Minimum Viable Product | **3-4 weeks** | |
| **Production (P0+P1)** | Production Ready | **7-9 weeks** | |
| **Market Ready (P0+P1+P2)** | Competitive | **11-14 weeks** | |

---

## FILES TO CREATE

### SECURITY (P0)
- `lib/upload/validator.ts`
- `lib/upload/image-processor.ts`
- `lib/moderation/auto-moderate.ts`
- `lib/csrf/tokens.ts`
- `middleware/csrf.ts`
- `lib/auth/password-policy.ts`
- `lib/auth/lockout.ts`
- `lib/auth/two-factor.ts`

### CORE FEATURES (P1)
- `lib/websocket/server.ts`
- `hooks/useRealtimePhotos.ts`
- `lib/notifications/email.ts`
- `components/notifications/NotificationCenter.tsx`
- `lib/export/zip-generator.ts`
- `components/gallery/VirtualPhotoGallery.tsx`
- `lib/api/errors.ts`

### POLISH (P2)
- `lib/design/tokens.ts`
- `lib/upload/video-processor.ts`
- `components/video/VideoPlayer.tsx`
- `components/albums/`

---

This plan prioritizes **security first** (P0), then **core functionality** (P1), followed by **feature completeness** (P2), and finally **enhancements** (P3).

- **Critical path for launch:** P0 only (3-4 weeks) gets you a secure beta
- **Production-ready:** P0 + P1 (7-9 weeks)
- **Competitive product:** All P0-P2 (11-14 weeks)
