# Landing Page Review Checklist

Date: 2026-03-28
Source: code/design review of the homepage in `app/page.tsx`

## High Priority

- [x] Align homepage pricing/plan copy with actual tenant entitlements. Completed: 2026-03-28 23:55:07 +08:00
  Notes: Remove or rewrite "Unlimited events on all plans" so it matches `lib/domain/tenant/tier-config.ts`.

- [x] Replace unsupported social-proof claims with verified copy. Completed: 2026-03-28 23:55:07 +08:00
  Notes: Rework "Join thousands of event organizers..." unless we have a real metric to support it.

- [x] Add proper marketing metadata for homepage sharing and SEO. Completed: 2026-03-28 23:55:07 +08:00
  Notes: Set `metadataBase`, improve title/description, and add real Open Graph/Twitter preview images.

## Medium Priority

- [x] Keep the public landing page out of app-wide auth/realtime client providers where possible. Completed: 2026-03-28 23:55:07 +08:00
  Notes: Consider a route-group layout split so marketing pages stay lighter than authenticated app screens.

- [x] Break `app/page.tsx` into focused landing-page sections/components. Completed: 2026-03-29 00:17:53 +08:00
  Notes: Suggested split: nav, hero, feature grid, how-it-works, use-cases, CTA, footer.

- [x] Add a lightweight post-change QA pass for desktop and mobile. Completed: 2026-03-29 00:52:01 +08:00
  Notes: Verified updated desktop and mobile screenshots against a fresh local production preview after rebuilding.

## Low Priority

- [x] Remove or reconnect stale landing-page support code. Completed: 2026-03-28 23:55:07 +08:00
  Notes: `components/landing/animations.tsx` and related global CSS should either be used intentionally or deleted.

- [x] Make reusable SVG ids collision-safe. Completed: 2026-03-28 23:55:07 +08:00
  Notes: `BrandMark` currently uses a fixed gradient id and is rendered more than once on the page.

- [x] Review whether all dark-mode variants are necessary for the public marketing surface. Completed: 2026-03-29 00:52:01 +08:00
  Notes: Simplified the public landing page to a light-only marketing presentation and set the page wrapper to `color-scheme: light`.

## Nice to Have

- [x] Add stronger proof elements that are actually backed by the product. Completed: 2026-03-29 00:36:05 +08:00
  Notes: Examples: sample event screenshots, real customer quotes, plan comparison, FAQ, or security/privacy trust signals.

- [x] Add direct in-page navigation or section links if we expand the landing page further. Completed: 2026-03-29 00:23:09 +08:00
  Notes: Helpful if pricing, FAQ, or testimonials are added later.
