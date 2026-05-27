# Issue #15 — Passenger selection step
**Date:** 2026-05-22
**Status:** done

## Summary
Implemented passenger selection at `/booking/passengers`. Created reusable `PassengerStepper` component with accessible +/− controls (`role="group"`, `aria-label`, `aria-live="polite"`). Page pre-fills from Zustand store, enforces min-1-adult and infants-≤-adults constraints, auto-caps infants when adults reduced, fires GA4 events, and navigates to `/booking/details`.

## Files changed
- `components/booking/PassengerStepper.tsx`
- `pages/booking/passengers.tsx`

## Tests
29 tests added. 276 total tests passing.
