# Landing Page Dark Mode, Copy, and Motion Checklist

Date: 2026-03-29
Source: implementation brief for landing-page dark mode, copy refresh, and motion.dev rollout

## Progress Summary

- [x] Phase 1 complete: Dark mode parity added to all landing components. Completed: 2026-03-29 01:26:13 +08:00
- [x] Phase 2 complete: Copy updates applied exactly as specified. Completed: 2026-03-29 01:26:13 +08:00
- [x] Phase 3 complete: motion.dev animations added to all required sections. Completed: 2026-03-29 01:26:13 +08:00
- [x] Phase 4 complete: Verification and QA finished. Completed: 2026-03-29 01:26:13 +08:00

## Phase 1: Dark Mode

- [x] Update [app/page.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/app/page.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Root wrapper now uses `bg-white text-slate-900 dark:bg-gray-950 dark:text-gray-100` without forcing light color scheme.

- [x] Update [LandingNav.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingNav.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for nav background, text, and CTA surfaces.

- [x] Update [HeroSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HeroSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for badge, text, hero blurs, grid pattern, CTA surfaces, trust signals, and stats bar.

- [x] Update [FeaturesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/FeaturesSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for section background, section text, feature cards, icon tiles, borders, and hover behavior.

- [x] Update [ProofSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/ProofSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for the section gradient, proof cards, chips, text, borders, and accent gradients.

- [x] Update [HowItWorksSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HowItWorksSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for section text, connector lines, and the step number badge.

- [x] Update [UseCasesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/UseCasesSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for section background, text, card borders, and dark gradients for each use-case card.

- [x] Update [LandingCtaSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingCtaSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for section text, blur decoration, checklist text, CTA card, avatar rings, and the secondary CTA button.

- [x] Update [LandingFooter.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingFooter.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Added dark variants for footer background, border, and text without adding animation.

- [x] Confirm [BrandMark.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/BrandMark.tsx) needs no color changes. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Kept the existing hardcoded brand fills; they continue to read clearly in both themes.

## Phase 2: Copy Updates

- [x] Update hero copy in [HeroSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HeroSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Updated the badge text, subtext, primary CTA label, and trust signal to the requested copy.

- [x] Update feature section copy in [FeaturesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/FeaturesSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Updated the section heading/subtitle plus all six feature descriptions exactly as specified.

- [x] Update proof section copy in [ProofSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/ProofSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Updated the section heading/subtitle plus the requested card titles and descriptions exactly as specified.

- [x] Update process/use-case/CTA copy. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Applied the requested copy swaps in [HowItWorksSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HowItWorksSection.tsx), [UseCasesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/UseCasesSection.tsx), and [LandingCtaSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingCtaSection.tsx).

## Phase 3: motion.dev Rollout

- [x] Add [motion-variants.ts](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/motion-variants.ts). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Centralized landing-specific variants, stagger containers, reveal patterns, and chip/card/step helpers using `springConfigs`.

- [x] Animate [LandingNav.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingNav.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added the requested slide-down entrance.

- [x] Animate [HeroSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HeroSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added the staggered entrance, CTA sequencing, word pulse, and stat-item reveal.

- [x] Animate [FeaturesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/FeaturesSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added scroll-triggered header/card reveals plus motion-based hover interactions.

- [x] Animate [ProofSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/ProofSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added the proof-card cascade, nested bullet stagger, and chip entrance animation.

- [x] Animate [HowItWorksSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/HowItWorksSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added step sequencing, connector line animation, and elastic number-badge pop.

- [x] Animate [UseCasesSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/UseCasesSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added card entrance plus motion-based hover lift/icon interaction.

- [x] Animate [LandingCtaSection.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingCtaSection.tsx). Completed: 2026-03-29 01:26:13 +08:00
  Notes: Converted it to a Client Component and added checklist stagger, CTA card slide-in, avatar pop sequence, and star pop sequence.

- [x] Keep [LandingFooter.tsx](C:/Users/USER/Desktop/glm/project-list/Galeria/components/landing/LandingFooter.tsx) static. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Footer remains static and only received dark-mode styling.

## Phase 4: Verification

- [x] Verify import/runtime rules. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Used `motion/react`, kept `app/page.tsx` as a Server Component, and limited its change to the root class update.

- [x] Verify motion constraints. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Motion is limited to opacity and transforms; replaced the requested CSS hover transforms and kept the `0.3` viewport threshold only on the Features header.

- [x] Run code validation. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Ran `npm run typecheck` and `npm run build` successfully after the implementation pass.

- [x] Run landing-page visual QA. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Verified the refreshed landing page on a fresh local production preview at desktop and mobile breakpoints in the current dark-system environment; local headless Chrome stayed in dark mode during capture, so light-theme output was additionally audited from the final class tokens.

- [x] Record completion timestamps. Completed: 2026-03-29 01:26:13 +08:00
  Notes: Marked each completed item with the implementation timestamp for this pass.
