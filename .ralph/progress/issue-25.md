# Issue #25 — Lighthouse CI + performance budget
**Date:** 2026-05-26
**Status:** done

## Summary
Implemented Lighthouse CI performance gates. Created `.lighthouserc.js` (3 mobile runs, perf ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1, homepage + `/booking/flights`). Created `.github/workflows/lighthouse.yml` (polls GitHub Deployments API for Vercel preview URL, runs `@lhci/cli` autorun, posts markdown score table as PR comment, fails job on budget violations).

## Files changed
- `.lighthouserc.js`
- `.github/workflows/lighthouse.yml`

## Tests
502 existing tests continue to pass.
