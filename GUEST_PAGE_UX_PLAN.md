# Guest Page UI/UX Improvement Plan

## Current Strengths
- Solid theming system with CSS variables and 5 photo card presets (light/dark support)
- Polished animations — heart bursts, stagger entrances, floating buttons with Motion
- Deep feature set — lucky draw, photo challenges, attendance, reactions all integrated
- Mobile responsive grid (2→5 cols), sticky header, floating FABs
- Gallery filter pills (All / My Photos / Most Loved)
- Drag-and-drop upload with visual feedback

## Issues & Improvements (Priority Order)

### 1. ~~Add Photo Lightbox~~ ✅ DONE
**Impact: High — core gallery UX**
Added full-screen lightbox with zoom, swipe, counter. Configurable via `lightbox_enabled` feature toggle in event settings.

### 2. ~~Add "My Photos" Tab/Filter~~ ✅ DONE
**Impact: High — personal relevance**
Added filter pills above gallery: All | My Photos | Most Loved. Filters by `user_fingerprint` match for "mine", sorts by heart count for "most loved".

### 3. ~~Simplify Header — Move Downloads Into Dropdown~~ ✅ DONE
**Impact: Medium — mobile usability**
Collapsed 6+ buttons into Share (always visible) + overflow dropdown menu with Edit name, Lucky Draw, Download all, Download ZIP.

### 4. ~~Add Drag-and-Drop to Upload Modal~~ ✅ DONE
**Impact: Medium — modern UX expectation**
Added drag-and-drop zone wrapping Camera/Gallery buttons. Visual feedback on drag-over (scale, color change, "Drop photos here" text). Gracefully falls back to buttons on mobile.

### 5. ~~Add Tap-to-Love Button on Mobile~~ ✅ DONE
**Impact: Medium — mobile engagement**
Added always-visible heart button on touch devices (uses `@media(hover:hover)` to hide on desktop hover-capable devices). Shows love count, disabled state at max (10). Double-tap still works as bonus gesture.

### 6. ~~Stronger Empty State~~ ✅ DONE
**Impact: Medium — first impression**
Redesigned with camera + image icon composition, better copy, themed background.

### 7. ~~Extract Components (Refactor)~~ ✅ DONE
**Impact: Medium — maintainability**
Extracted into: PhotoCard, UploadModal, GalleryGrid, HeaderActions.

### 8. ~~Use CSS Variables at Container Level~~ ✅ DONE
**Impact: Low — code quality**
Set `--g-*` CSS custom properties on the root container in GuestEventPageView. Converted GalleryGrid and HeaderActions to read from CSS vars (removed 9 theme props from GalleryGrid, 4 from HeaderActions). Converted all inline styles in GuestEventPageView to use `v.*` CSS var references. Modals still receive theme props directly (complex computed styles).

### 9. ~~Flatten Visual Hierarchy~~ ✅ DONE (replaces "Add Hero/Banner")
**Impact: Medium — visual polish**
- Event details: Converted from full card to compact inline pills (date, location, guests, photos)
- Lucky draw: Compact inline banner when empty, expanded card when has numbers
- Upload CTA: Redesigned from dashed border box to gradient card with camera icon
- Pending/rejected overlays: Softened from harsh dark overlays to frosted glass + small pill badges
- Gallery title: Added photo count badge
- Mobile grid: Changed from 1-column to 2-column with tighter gap
