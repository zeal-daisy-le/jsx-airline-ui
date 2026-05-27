# Issue #19 — Booking review step
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented booking review at `/booking/review`. Created BFF `POST /api/booking/confirm-price` with Zod validation. Built read-only order summary with four section cards (Flight, Passengers, Bags, Seats) each with "Edit" links. Bag prices fetched from `GET /api/booking/bags` on mount (plain fetch). Seat prices derived from row number. Price breakdown shows base fare, bags, seat fees, 12% taxes, and total. "Confirm & pay" uses `withRetry`; price-change dialog shows if `confirmed: false`. GA4 events, error recovery.

## Files changed
- `pages/api/booking/confirm-price.ts`
- `pages/booking/review.tsx`

## Tests
72 tests added. 502 total tests passing.
