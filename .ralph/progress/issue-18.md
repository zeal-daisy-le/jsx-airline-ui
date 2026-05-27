# Issue #18 — Seat map step
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented seat map at `/booking/seats`. Created BFF `GET /api/booking/seatmap` (15 rows × 6 columns, first class rows 1–3 at $45, economy rows 4–15 at $0, 11 pre-occupied seats) and `POST /api/booking/seatmap` with Zod validation. Built visual cabin grid with aisle gap, class dividers, colour-coded legend, per-seat `aria-label` and `aria-pressed`. Multi-passenger tabs with auto-advance after selection. Skip flow calls `setSeatAssignments([])` without BFF call. `withRetry` on submit, inline error recovery on load, GA4 events, back-navigation pre-fill.

## Files changed
- `pages/api/booking/seatmap.ts`
- `pages/booking/seats.tsx`

## Tests
57 tests added. 430 total tests passing.
