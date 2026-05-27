# Issue #16 — Traveller details step
**Date:** 2026-05-22
**Status:** done

## Summary
Implemented traveller details at `/booking/details`. Extended bookingStore with `nationality` on `TravelerInfo` and new `ContactDetails` type. Created BFF `POST /api/booking/details` with Zod validation. Built multi-passenger form with React Hook Form + Zod (`mode: "onBlur"`), per-passenger fieldsets (name, DOB, document type/number, nationality), shared contact details, auth pre-fill from `/api/auth/me`, `withRetry` on submit, GA4 events.

## Files changed
- `stores/bookingStore.ts` (added `ContactDetails`, `nationality`)
- `pages/api/booking/details.ts`
- `pages/booking/details.tsx`

## Tests
32 tests added. 308 total tests passing.
