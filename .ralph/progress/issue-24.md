# Issue #24 — Playwright E2E + axe-core CI
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented Playwright E2E tests and axe-core accessibility CI. Created `playwright.config.ts`, `e2e/helpers/booking.ts` (sessionStorage seeder), and five test files: `booking-flow.spec.ts` (full guest critical path), `back-navigation.spec.ts` (data retention), `api-failure.spec.ts` (BFF failure recovery), `accessibility.spec.ts` (axe-core WCAG 2.1 AA on all pages), `auth-prefill.spec.ts`, `session-recovery.spec.ts` (skipped pending #13). Created `.github/workflows/playwright.yml`. Added `POST /api/booking/pay` BFF stub and working payment page with "Pay now" button.

## Files changed
- `playwright.config.ts`
- `e2e/helpers/booking.ts`
- `e2e/booking-flow.spec.ts`
- `e2e/back-navigation.spec.ts`
- `e2e/api-failure.spec.ts`
- `e2e/accessibility.spec.ts`
- `e2e/auth-prefill.spec.ts`
- `e2e/session-recovery.spec.ts`
- `.github/workflows/playwright.yml`
- `pages/api/booking/pay.ts`
- `pages/booking/payment.tsx`

## Tests
568 Vitest tests passing. E2E suite added separately.
