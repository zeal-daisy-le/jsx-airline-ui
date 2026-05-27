# PRD homepage-video-animations — Task 2: Scroll-reveal Experience section
**Date:** 2026-05-27
**Status:** done
**Type:** AFK

## Summary
Created a reusable `ScrollReveal` component using Framer Motion's `whileInView` with `viewport={{ once: true, amount: 0.3 }}`, stagger delay prop, and `prefers-reduced-motion` support. Created `ExperienceVideoCard` component with poster-first rendering, lazy `<video>` with WebM + MP4 sources, pause/play button, and `aria-hidden` on video. Updated `ExperienceSection` from 3 static image cards to 4 video cards wrapped in `ScrollReveal` with staggered entrance animations (0ms, 150ms, 300ms, 450ms). Scope expanded from original PRD (Ken Burns on static images) to video cards since source videos were provided. Added `IntersectionObserver` mock to `vitest.setup.ts` and excluded `vitest.setup.ts` from `tsconfig.json` to fix build.

## Files changed
- `src/components/ScrollReveal.tsx` (new — reusable scroll-reveal wrapper)
- `src/components/ScrollReveal.test.tsx` (new — 3 unit tests)
- `src/features/home/components/ExperienceVideoCard.tsx` (new — video card with poster fallback)
- `src/features/home/components/ExperienceVideoCard.test.tsx` (new — 6 unit tests)
- `src/features/home/components/ExperienceSection.tsx` (updated — videos + ScrollReveal)
- `vitest.setup.ts` (updated — IntersectionObserver mock)
- `tsconfig.json` (updated — exclude vitest.setup.ts from build)

## Tests
9 tests added (3 ScrollReveal + 6 ExperienceVideoCard). 577 total tests passing.
