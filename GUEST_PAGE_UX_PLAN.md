# Guest Page UI/UX Improvement Plan

## Current Strengths
- Solid theming system with CSS variables and 5 photo card presets (light/dark support)
- Polished animations — heart bursts, stagger entrances, floating buttons with Motion
- Deep feature set — lucky draw, photo challenges, attendance, reactions all integrated
- Mobile responsive grid (1→5 cols), sticky header, floating FABs

## Issues & Improvements (Priority Order)

### 1. Add Photo Lightbox (Critical)
**Impact: High — core gallery UX**
Photos are only viewable as grid thumbnails. No full-screen view, no swipe navigation, no zoom. Double-click is consumed by the heart reaction, so users can't open a photo. This is the single biggest UX gap for a photo gallery app.

### 2. Add "My Photos" Tab/Filter
**Impact: High — personal relevance**
No way to filter by "my photos", "most loved", or "newest". For events with hundreds of photos, finding your own uploads is tedious.

### 3. Simplify Header — Move Downloads Into Dropdown
**Impact: Medium — mobile usability**
The header crams up to 6+ buttons on mobile (Lucky Draw, Download Selected, Download ZIP, Download All, Add Name, Share). On small screens this wraps awkwardly.

### 4. Add Drag-and-Drop to Upload Modal
**Impact: Medium — modern UX expectation**
No drag-and-drop support. Camera/Gallery buttons look identical — just different icons in dashed boxes. No file size/type validation feedback before upload. CAPTCHA block inside the modal is jarring.

### 5. Add Tap-to-Love Button on Mobile
**Impact: Medium — mobile engagement**
Double-tap to love works on desktop but is unreliable on mobile touch. No visual affordance tells users this is possible. The hover hint (white heart overlay) is invisible on touch devices.

### 6. Stronger Empty State
**Impact: Medium — first impression**
Currently just a gray icon + "No photos yet" — no personality, no strong CTA to upload.

### 7. ~~Extract Components (Refactor)~~ ✅ DONE
**Impact: Medium — maintainability**
Extracted into: PhotoCard (178 lines), UploadModal (419 lines), GalleryGrid (105 lines), HeaderActions (105 lines). Parent GuestEventPageView reduced from 1,046 to 525 lines.

### 8. Use CSS Variables at Container Level
**Impact: Low — code quality**
Nearly every element uses `style={{ color: surfaceText }}` instead of CSS variables at the container level. Bloats the DOM and makes the component harder to read.

### 9. Add Hero/Banner Section
**Impact: Low — visual polish**
Add a cover image/banner section if available to improve visual hierarchy. Currently lucky draw, event details, upload CTA, and gallery all have the same card styling — the page reads as a flat list.
