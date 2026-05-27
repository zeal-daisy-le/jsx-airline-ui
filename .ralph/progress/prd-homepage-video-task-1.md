# PRD homepage-video-animations — Task 1: Video asset compression
**Date:** 2026-05-27
**Status:** done
**Type:** HITL

## Summary
Compressed source videos from Google Drive for the hero section and 4 experience cards. Hero MOV (76.2MB, 2808×1924, 20s) was cropped to 1920×1080, trimmed to 15s, and compressed to WebM VP9 (2.3MB) + MP4 H.264 (2.8MB) + poster JPG (79KB). Four portrait experience videos were compressed to WebM + MP4 (all under 1.5MB each) with poster frames extracted. All outputs placed in `/public/videos/` and `/public/images/experience/`. ffmpeg installed via Homebrew for compression pipeline.

## Files changed
- `public/videos/hero.webm` (2.3MB, VP9, 1920×1080, 15s)
- `public/videos/hero.mp4` (2.8MB, H.264, 1920×1080, 15s)
- `public/images/hero-poster.jpg` (79KB)
- `public/videos/experience/skip-airport-stress.webm` + `.mp4`
- `public/videos/experience/bring-the-whole-party.webm` + `.mp4`
- `public/videos/experience/vacation-starts-on-tarmac.webm` + `.mp4`
- `public/videos/experience/get-there-faster.webm` + `.mp4`
- `public/images/experience/skip-airport-stress-poster.jpg`
- `public/images/experience/bring-the-whole-party-poster.jpg`
- `public/images/experience/vacation-starts-on-tarmac-poster.jpg`
- `public/images/experience/get-there-faster-poster.jpg`

## Tests
No tests added (asset-only task). 577 existing tests unaffected.
