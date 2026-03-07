# Guest Upload Performance Plan

Date: 2026-03-07
Status: Deferred for later implementation

## Context

This note captures the current analysis for slow guest photo uploads so the work can resume later without re-tracing the whole pipeline.

## What We Confirmed

1. Guest uploads currently use the heavier multipart upload path, not the presigned direct-upload flow.
2. A real upload to production returned `201 Created` with:
   - `x-upload-mode: multipart`
   - `x-upload-files: 1`
   - request size about `1.49 MB`
3. Browser timing for that upload showed:
   - `Request sent`: about `1.94s`
   - `Waiting for server response`: about `9.64s`
   - total request time: about `11.58s`
4. This strongly suggests the main bottleneck is server-side processing, not raw network transfer.

## Most Likely Bottlenecks

1. Server image pipeline in `lib/domain/content/images.ts`
   - corruption check
   - Sharp processing
   - EXIF verification
   - upload of 3 image variants
2. Multipart request handling in `lib/services/event-photos.ts`
   - form-data parsing
   - validation
   - repeated file buffering / decoding
3. Per-request synchronous work after upload
   - DB insert and limit checks
   - usage snapshot query
   - lucky draw side effects when enabled
4. Sequential processing
   - multi-file uploads still scale roughly linearly because files are processed one by one
5. Cross-region runtime path may add some overhead
   - observed request path included `sin1::iad1` in Vercel response metadata

## Important Conclusions

1. Realtime broadcasting was unlikely to be the main cause after the latest change, because the upload still spent most of its time waiting on the server.
2. The guest upload architecture is still the main performance problem.
3. The biggest structural improvement is to move guest uploads from multipart app-server upload to presigned direct-to-storage upload.

## Proposed Improvement Plan

### Phase 1: Architecture Change

1. Convert guest uploads to the presigned upload flow already used elsewhere.
2. Upload the file directly from the browser to storage.
3. Keep the finalize API lightweight and metadata-focused.

### Phase 2: Reduce Critical Path Work

1. Remove or defer non-essential synchronous work from the upload response path.
2. Keep DB writes minimal during finalize.
3. Move expensive derivative generation to background processing if we still need multiple image sizes.

### Phase 3: Processing Optimization

1. Avoid duplicate file reads / duplicate Sharp metadata work.
2. Revisit whether every upload needs:
   - corruption detection
   - full secure processing
   - EXIF verification on all generated sizes
3. Add bounded concurrency for multi-file uploads instead of strict serial processing.

### Phase 4: Observability

1. Revisit production observability for upload timing.
2. `Server-Timing` and `[PHOTO_UPLOAD_PERF]` did not surface clearly in the production checks, so instrumentation still needs validation.
3. Add upload-stage timing that is easy to inspect from:
   - browser DevTools
   - Vercel logs
   - optional app-level telemetry

## Suggested Next Task When We Resume

1. Implement presigned upload flow for the guest page.
2. Keep current guest UX intact while switching transport architecture.
3. Re-test with the same production event and compare:
   - request transfer time
   - server wait time
   - total upload time

## Footnote

For better perceived UX, add skeleton loading states on both the organizer page and the guest page while upload-related data and gallery state are loading.
