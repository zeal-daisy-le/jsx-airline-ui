# Issue #17 — Bags selection step
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented bags selection at `/booking/bags`. Created BFF `GET /api/booking/bags` (mock bag options: 0/1/2 checked bags at $0/$30/$55) and `POST /api/booking/bags` with Zod validation. Built per-passenger fieldsets with radio-button option cards, real-time running total (`aria-live="polite"`), loading skeletons, inline error recovery for GET failures, `withRetry` on POST submit, GA4 events, back-navigation pre-fill.

## Files changed
- `pages/api/booking/bags.ts`
- `pages/booking/bags.tsx`

## Tests
34 tests added. 373 total tests passing.
