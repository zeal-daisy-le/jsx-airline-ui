# PRD homepage-video-animations — Task 3: Scroll-reveal Where We Fly + enhanced hover
**Date:** 2026-05-27
**Status:** done
**Type:** AFK

## Summary
Wrapped destination cards in `ScrollReveal` with staggered delays (4 visible cards × 0.15s). Replaced CSS `group-hover:scale-105` with Framer Motion variant-driven hover: image wrapper scales to 1.05 and gradient overlay opacity intensifies on hover. Updated both `WhereWeFlySection` (inline cards) and standalone `DestinationCard` component with matching Framer Motion hover patterns. Existing card lift (y:-4) and tap (scale:0.98) behaviors preserved in `DestinationCard`. All hover/tap animations disabled when `prefers-reduced-motion` is active. Fixed existing `DestinationCard.test.tsx` mock to include `motion.div` alongside `motion.article`.

## Files changed
- `src/features/home/components/WhereWeFlySection.tsx` (updated — ScrollReveal + Framer Motion hover)
- `src/features/home/components/WhereWeFlySection.test.tsx` (new — 5 unit tests)
- `src/features/home/components/DestinationCard.tsx` (updated — Framer Motion hover replacing CSS)
- `__tests__/components/DestinationCard.test.tsx` (updated — added motion.div to mock)

## Tests
5 tests added. 582 total tests passing.
