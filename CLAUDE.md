# CLAUDE.md — JSX Airline UI

## Architecture

### Tech Stack
- **Framework**: Next.js 14 Pages Router (TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Animation**: Framer Motion (hero entrance + micro-interactions only)
- **State**: Zustand + sessionStorage (guests) / BFF sync (logged-in)
- **Forms**: React Hook Form + Zod
- **BFF**: Next.js API Routes (proxy to Navitaire, never expose credentials)
- **Auth**: Guest checkout allowed; optional JWT via httpOnly cookie
- **Testing**: Vitest + Testing Library + MSW (unit) / Playwright + axe-core (E2E)

### Key Design Decisions

#### Booking Flow
- Step order is enforced by `useBookingGuard` — every page renders null until `hasHydrated` is true and the step is accessible.
- `lib/booking/steps.ts` is the single source of truth for step ordering and metadata.
- `stores/bookingStore.ts` persists to `sessionStorage` via Zustand persist. `hasHydrated` is set in `onRehydrateStorage` — always wait for it before redirecting.
- `bookingReference` is stored in the booking store after successful payment and used on the confirmation page.

#### BFF Endpoints
- All Navitaire credentials stay server-side in env vars (`NAVITAIRE_API_URL`, `NAVITAIRE_API_KEY`).
- When `NAVITAIRE_API_URL` is unset, `GET /api/search` returns deterministic mock flights — useful for local dev and CI.
- Navitaire endpoint paths are placeholders (`/api/v1/availability/search`) pending issue #5 (HITL).

#### CSRF + Rate Limiting
- Handled globally in `middleware.ts` for all `/api/*` routes. No per-route configuration needed.
- Search routes: 10 req/min. Booking mutations: 5 req/min. Gracefully skipped when Upstash is unconfigured.

#### Error Recovery
- Use `useErrorStore` (`stores/errorStore.ts`) for toasts and retry state.
- Wrap fetch calls with `withRetry` from `lib/api/retry.ts` (2 retries, exponential backoff).
- Call `onAllRetriesExhausted` (not `showToast`) after retries are exhausted — this surfaces the support contact UI.
- For data *loading* failures (GET requests), use a plain `fetch` without `withRetry`. Show `showToast` + inline error with a manual retry button. This avoids long retry delays blocking the UI and keeps the step accessible for users who want to skip optional features.
- `withRetry` is reserved for *submit* mutations where data must be reliably saved.

#### Analytics
- `bookingEvents.stepViewed(step)` on mount, `bookingEvents.stepCompleted(step, params)` on successful step completion.
- Both are no-ops when `window.gtag` is absent (server-side or no GA loaded).

#### Booking Store — TravelerInfo + ContactDetails
- `TravelerInfo` (in `stores/bookingStore.ts`) includes `nationality` alongside name, DOB, document type/number.
- `contactDetails: ContactDetails | null` is a separate top-level store field (email + phone); set via `setContactDetails`. It is NOT cleared when passenger count changes — only on `resetBooking`.
- Passport/ID numbers persist to sessionStorage (store) and are sent to the BFF but never server-logged.

### Completed Issues (ralph/prd-35 branch)
- **#14**: Flight search step — BFF `/api/search`, search form (RHF+Zod), results, skeletons, GA4 events, error recovery
- **#15**: Passenger selection step — stepper UI, min-1-adult + infants≤adults constraints, GA4 events
- **#16**: Traveller details step — multi-passenger RHF+Zod form, per-field blur validation, auth pre-fill, BFF `POST /api/booking/details`, GA4 events, error recovery
- **#17**: Bags selection step — per-passenger bag option cards (0/1/2 bags), real-time running total, loading skeletons, BFF `GET /api/booking/bags` + `POST /api/booking/bags`, GA4 events, error recovery (showToast + inline retry), back-navigation pre-fill
- **#18**: Seat map step — interactive cabin layout (15 rows × 6 columns, first class rows 1–3), per-seat availability/occupied/selected/other-passenger states, active-passenger tabs for multi-passenger bookings, auto-advance to next unassigned passenger after selection, skip flow (setSeatAssignments([]) marks step valid without BFF call), BFF `GET /api/booking/seatmap` + `POST /api/booking/seatmap`, GA4 events, error recovery (showToast + inline retry on load; withRetry + onAllRetriesExhausted on submit), back-navigation pre-fill

#### Seat Map — Seat Selection UX
- `activePassengerIndex` tracks which passenger is being assigned. Clicking a seat assigns it to the active passenger and auto-advances to the next unassigned passenger.
- `seatToPassenger` (seatNumber → passengerIndex) is derived from `assignments` and used to render which passenger holds each seat; seats held by other passengers are disabled for the currently active passenger.
- Skip: calls `setSeatAssignments([])` directly — this marks `seats` step valid (so review is accessible) and does NOT call the BFF. Only the "Continue" flow (all passengers seated) calls the BFF `POST /api/booking/seatmap`.
- The `POST /api/booking/seatmap` Zod schema accepts `assignments` as an empty array (for skip edge cases) or up to 9 entries; seatNumber regex is `/^\d{1,2}[A-F]$/`.

#### Booking Review — Price Confirmation
- Review page fetches bag option prices via `GET /api/booking/bags` on mount (plain fetch, no retry) to compute the price breakdown. If this fails, bag prices show as "–" and the total shows "Price unavailable", but the user can still proceed.
- Seat prices are derived from the seat number: rows 1–3 = first class at $45, rows 4+ = economy at $0. This matches the seat map mock and must stay in sync with `FIRST_CLASS_ROWS` in `pages/api/booking/seatmap.ts`.
- Taxes are estimated at 12% of (base fare + bags + seat fees) and rounded to the nearest dollar.
- On "Confirm & pay": `POST /api/booking/confirm-price` is called with `withRetry`. The BFF re-confirms price with Navitaire (pending #5). If `confirmed: false` is returned, a price-change banner replaces the CTA button — user must accept or cancel. `markStepValid("review")` is called only after a confirmed or accepted-price-change response, not on page load.
- `contactDetails` is NOT in the bookingStore `partialize` list and does not persist to sessionStorage — it is available within the session only.
- `confirmedTotalPrice: number | null` is set by the review page when `confirm-price` returns `confirmed: true` (or when the user accepts a price change). It is read by the confirmation page to display "Total paid". It is persisted to sessionStorage.

### Completed Issues (ralph/prd-35 branch)
- **#19**: Booking review step — read-only order summary (flight, passengers, bags, seats, price breakdown), BFF `POST /api/booking/confirm-price`, price-change dialog (user must accept updated price before proceeding), GA4 events, error recovery (showToast + retry on bag load; withRetry + onAllRetriesExhausted on confirm-price)

#### Lighthouse CI — Performance Budget Gates
- Config in `.lighthouserc.js` at repo root; base URL injected via `LHCI_BASE_URL` env var so the same config works locally (fallback `http://localhost:3000`) and in CI against the Vercel preview URL.
- Budgets: mobile Performance ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1. Enforced on homepage (`/`) and first booking step (`/booking/flights`). 3 runs averaged per URL.
- `.github/workflows/lighthouse.yml` polls the GitHub Deployments API (up to 10 min) for the Vercel preview URL, installs `@lhci/cli@0.14.x` globally, then runs `lhci autorun`. Assertion failures cause the job to exit non-zero, blocking PR merges via required status checks.
- Results are posted/updated as a PR comment (markdown table with per-metric pass/fail icons) regardless of pass or fail. If no Vercel preview is found, a skip notice is posted instead.
- `LHCI_GITHUB_APP_TOKEN` (optional) enables the Lighthouse CI GitHub App for richer status annotations; the workflow works without it.

#### Booking Confirmation — Snapshot + Store Clear Pattern
- The confirmation page does NOT use `useBookingGuard`. Instead it waits for `hasHydrated`, reads `bookingReference` from the raw store state, and redirects to `/booking/flights` if it is null.
- On mount: all booking data is snapshotted into local React state, `trackEvent("booking_completed")` is fired, `POST /api/booking/send-confirmation` is called (fire-and-forget — page displays regardless of email delivery), then `resetBooking()` clears the Zustand store + sessionStorage.
- The page renders exclusively from the local snapshot after clearing — it does NOT subscribe to store fields after mount, so store clearing does not blank the display.
- Guest users see a non-blocking account creation prompt (dismissible). Logged-in users see an association notice. Auth status is determined via `GET /api/auth/me` on mount.
- The confirmation page is print-friendly: SiteHeader is wrapped in `print:hidden`, action buttons are `print:hidden`.

### Completed Issues (ralph/prd-35 branch)
- **#25**: Lighthouse CI — `.lighthouserc.js` (mobile budget: perf ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1, 3 runs, homepage + `/booking/flights`), `.github/workflows/lighthouse.yml` (Vercel preview URL detection via GitHub Deployments API, `@lhci/cli` autorun, PR comment with score breakdown, blocking status check on budget violations)

### Completed Issues (ralph/prd-35 branch)
- **#21**: Booking confirmation step — full confirmation screen (PNR, passenger names, flight, seats, total paid), store snapshot + clear pattern, `POST /api/booking/send-confirmation` BFF stub, guest account creation prompt (dismissible), logged-in account association notice, GA4 `booking_completed` event, print-friendly layout, WCAG 2.1 AA

#### Playwright E2E + axe-core
- Config in `playwright.config.ts` at repo root. `NAVITAIRE_API_URL` is intentionally unset so all BFF routes return deterministic mock data in both local and CI runs.
- Tests live in `e2e/`. Shared seeder helper `e2e/helpers/booking.ts` writes a Zustand persist payload into `sessionStorage` (key `jsx-booking`) so individual specs can start at any booking step without re-running earlier steps via the UI.
- `playwright.config.ts` `webServer` runs `next dev` locally (reusing existing server) and `next start` in CI (after the build job produces the `.next/` artifact).
- `e2e/*.spec.ts` files are excluded from Vitest via `vitest.config.ts`'s `exclude` list — they must NOT import from `vitest`, only `@playwright/test`.
- axe-core runs via `@axe-core/playwright` (`new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()`). Any violation fails the test.
- Session recovery tests (`e2e/session-recovery.spec.ts`) are skipped with `test.skip(true, '...')` pending issue #13.
- `.github/workflows/playwright.yml` builds then runs E2E tests, uploads HTML report as an artifact on every run, uploads video/trace on failure. Depends on no other CI job (parallel to Lighthouse).

#### Payment Page Stub — `POST /api/booking/pay`
- `pages/api/booking/pay.ts` stubs the payment finalisation call. Accepts `{ flightId, confirmedTotalPrice, totalPassengers }`, returns `{ success, bookingReference, paymentToken }` with a mock PNR.
- `pages/booking/payment.tsx` renders a "Pay now" button (`data-testid="pay-button"`) that calls this endpoint, then calls `setPaymentToken` + `setBookingReference` and navigates to confirmation. This enables the Playwright E2E critical-path test to flow through the full booking funnel.
- The real payment gateway integration (hosted fields, tokenisation) is reserved for issue #20.

### Completed Issues (ralph/prd-35 branch)
- **#24**: Playwright E2E critical path + axe-core accessibility CI — `playwright.config.ts`, `@axe-core/playwright` integration, `e2e/booking-flow.spec.ts` (full guest booking critical path), `e2e/back-navigation.spec.ts` (data retention on back nav), `e2e/api-failure.spec.ts` (BFF failure recovery via `page.route()`), `e2e/accessibility.spec.ts` (axe-core WCAG 2.1 AA on homepage + all booking steps), `e2e/auth-prefill.spec.ts` (pre-fill for logged-in users, no-overwrite, guest empty form), `e2e/session-recovery.spec.ts` (3 tests skipped pending #13), `.github/workflows/playwright.yml` (build + Playwright + axe CI job with HTML report artifact), `POST /api/booking/pay` BFF stub + payment page "Pay now" button enabling end-to-end flow
