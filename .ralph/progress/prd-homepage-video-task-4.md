# PRD homepage-video-animations — Task 4: Hero background video
**Date:** 2026-05-27
**Status:** done
**Type:** AFK

## Summary
Created `HeroVideo` component implementing the poster-first pattern. Poster JPG renders via Next.js `<Image priority>` as the LCP element. After hydration, conditionally loads a `<video>` element with `preload="none"`, WebM + MP4 sources. Video crossfades over poster via CSS opacity transition (~500ms) on `canplaythrough`. Includes visible pause/play icon button (bottom-right) toggling playback and updating `aria-label` (WCAG 2.2.2). Video has `aria-hidden="true"`. Skips video entirely when `useReducedMotion` returns true or when `navigator.connection.effectiveType` is `slow-2g`/`2g`. Integrated into HeroSection replacing the static `<Image>`.

## Files changed
- `src/features/home/components/HeroVideo.tsx` (new — hero video with poster-first, lazy load, a11y)
- `src/features/home/components/HeroVideo.test.tsx` (new — 10 unit tests)
- `src/features/home/components/HeroSection.tsx` (updated — swapped Image for HeroVideo)

## Tests
10 tests added. 592 total tests passing.
