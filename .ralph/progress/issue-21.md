# Issue #21 — Booking confirmation step
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented booking confirmation at `/booking/confirmation`. Added `confirmedTotalPrice` to Zustand store. Created BFF `POST /api/booking/send-confirmation` stub. Built confirmation page with snapshot-then-clear pattern: captures booking data into local state on mount, fires GA4 `booking_completed`, calls send-confirmation fire-and-forget, then clears store. Renders PNR card, flight/passenger/seat/price sections entirely from snapshot. Guest account creation prompt (dismissible), logged-in association notice, print-friendly layout.

## Files changed
- `stores/bookingStore.ts` (added `confirmedTotalPrice`)
- `pages/api/booking/send-confirmation.ts`
- `pages/booking/confirmation.tsx`

## Tests
66 tests added. 568 total tests passing.
