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
- **Testing**: Vitest + Testing Library + MSW (planned)

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
