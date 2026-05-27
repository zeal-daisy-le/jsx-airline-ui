# PRD: Bulletproof-React Architecture Migration

## Summary

Migrate the JSX Airline codebase from a flat layer-based structure (`pages/`, `components/`, `stores/`, `lib/`) to the [bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) feature-based architecture under `src/`.

## Motivation

The current layout organizes code by type (all stores together, all components together). As the codebase grows, this makes it hard to reason about feature boundaries, encourages cross-feature coupling, and slows down onboarding. Feature-based organization keeps related code colocated and enforces clear dependency rules.

## Key Decisions

### Keep `bookingStore` unified
The booking flow is one tightly-coupled state machine with cascading invalidation (`setSelectedFlight` invalidates passengers → details → bags → seats → review). Splitting it per-step would create a coordination nightmare. It moves whole into `src/features/booking/stores/bookingStore.ts`.

### Use `src/pages/` for Next.js routing
Next.js supports `src/pages/` natively. Moving pages there lets everything live under `src/` cleanly. Page files become thin re-export shells that import feature page components.

### No barrel files
Import files directly to preserve Vite/Next.js tree-shaking. No `index.ts` re-exports.

## Target Structure

```
src/
├── components/           # Shared UI (button, toast, SiteHeader, SiteFooter, error/*)
├── config/               # Global config, env variables
├── data/                 # Static data (destinations, routes)
├── features/
│   ├── auth/
│   │   ├── api/          # Auth API types
│   │   ├── components/   # LoginForm, GuestAccountPrompt
│   │   ├── hooks/        # useAuth
│   │   ├── stores/       # authStore
│   │   └── utils/        # jwt, cookie
│   ├── booking/
│   │   ├── api/          # Booking API types (BagOption, SeatMapData, FlightResult, etc.)
│   │   ├── components/   # BookingLayout, StepProgress, PassengerStepper, FlightResultCard, FlightResultSkeleton
│   │   ├── hooks/        # useBookingGuard
│   │   ├── pages/        # Page-level components (FlightsPage, PassengersPage, etc.)
│   │   ├── stores/       # bookingStore
│   │   ├── types/        # PassengerCount, SelectedFlight, TravelerInfo, etc.
│   │   └── utils/        # steps, analytics (bookingEvents)
│   └── home/
│       ├── components/   # HeroSection, ExperienceSection, WhereWeFlySection, ClubJsxSection, DestinationCard, DestinationGrid
│       └── pages/        # HomePage
├── hooks/                # Shared custom hooks
├── lib/                  # Preconfigured libraries (api/retry, utils, csrf, rate-limit)
├── pages/                # Next.js route shells (thin re-exports)
│   ├── api/              # BFF endpoints (logic stays here, types extracted to features)
│   ├── booking/
│   ├── _app.tsx
│   └── _document.tsx
├── stores/               # Global stores (errorStore)
├── testing/              # Test utilities and mocks
├── types/                # Shared TypeScript types
└── utils/                # Shared utility functions
```

## Rules

- **Feature-first**: Organize code by feature, not by type.
- **No cross-feature imports**: Features must not import from other features. Compose at the app level (`pages/`).
- **Unidirectional flow**: shared (`src/lib`, `src/components`, `src/stores`) → features → pages. Never import backwards.
- **Direct imports**: No barrel files. Import files directly.
- **Only include what's needed**: A feature folder only has the subfolders it actually uses.

---

## Phases

Each phase is independently shippable — tests pass, app works, can merge and pause.

### Phase 1 — Scaffold `src/` and move shared code

Zero behavior change. File moves + path alias updates only.

**Create directories:**
- `src/components/ui/`
- `src/components/layout/`
- `src/components/error/`
- `src/stores/`
- `src/hooks/`
- `src/lib/`
- `src/lib/api/`
- `src/data/`

**File moves:**

| From | To |
|---|---|
| `components/ui/*` | `src/components/ui/*` |
| `components/layout/*` | `src/components/layout/*` |
| `components/error/*` | `src/components/error/*` |
| `stores/errorStore.ts` | `src/stores/errorStore.ts` |
| `lib/utils.ts` | `src/lib/utils.ts` |
| `lib/api/retry.ts` | `src/lib/api/retry.ts` |
| `lib/csrf.ts` | `src/lib/csrf.ts` |
| `lib/rate-limit.ts` | `src/lib/rate-limit.ts` |
| `data/*` | `src/data/*` |

**Config updates:**
- `tsconfig.json`: change `@/*` path alias to `src/*`
- `vitest.config.ts`: update path alias
- `tailwind.config.ts`: update content paths to include `src/`

**Verification:** full Vitest suite + `next build` + Playwright E2E

**Risk:** Low

- [ ] Create `src/` directory scaffold
- [ ] Move shared UI components
- [ ] Move shared stores, lib, data
- [ ] Update `@/*` path alias in tsconfig, vitest, tailwind
- [ ] Update all imports project-wide
- [ ] Verify: Vitest + build + E2E

---

### Phase 2 — Create `src/features/booking/`

Extract all booking-specific code into one feature module.

**Create directories:**
- `src/features/booking/api/`
- `src/features/booking/components/`
- `src/features/booking/hooks/`
- `src/features/booking/pages/`
- `src/features/booking/stores/`
- `src/features/booking/types/`
- `src/features/booking/utils/`

**File moves:**

| From | To |
|---|---|
| `stores/bookingStore.ts` | `src/features/booking/stores/bookingStore.ts` |
| `hooks/useBookingGuard.ts` | `src/features/booking/hooks/useBookingGuard.ts` |
| `lib/booking/steps.ts` | `src/features/booking/utils/steps.ts` |
| `lib/analytics.ts` | `src/features/booking/utils/analytics.ts` |
| `components/booking/BookingLayout.tsx` | `src/features/booking/components/BookingLayout.tsx` |
| `components/booking/StepProgress.tsx` | `src/features/booking/components/StepProgress.tsx` |
| `components/booking/PassengerStepper.tsx` | `src/features/booking/components/PassengerStepper.tsx` |
| `components/booking/FlightResultCard.tsx` | `src/features/booking/components/FlightResultCard.tsx` |
| `components/booking/FlightResultSkeleton.tsx` | `src/features/booking/components/FlightResultSkeleton.tsx` |

**Extract types** from `bookingStore.ts` into `src/features/booking/types/booking.ts`:
- `PassengerCount`, `SelectedFlight`, `TravelerInfo`, `ContactDetails`, `BagSelection`, `SeatAssignment`, `StepValidity`

**Extract API response types** into `src/features/booking/api/types.ts`:
- `FlightResult`, `SearchResponse` (from `pages/api/search.ts`)
- `BagOption` (from `pages/api/booking/bags.ts`)
- `SeatMapData`, `Seat` (from `pages/api/booking/seatmap.ts`)
- `ConfirmPriceResponse` (from `pages/api/booking/confirm-price.ts`)
- `PayResponse` (from `pages/api/booking/pay.ts`)

API route files import these types back from the feature.

**Thin out page files** — each `pages/booking/*.tsx` becomes a re-export shell:
```tsx
export { default } from "@/features/booking/pages/BagsPage"
```

The actual UI moves to `src/features/booking/pages/`:
- `FlightsPage.tsx`, `PassengersPage.tsx`, `DetailsPage.tsx`, `BagsPage.tsx`
- `SeatsPage.tsx`, `ReviewPage.tsx`, `PaymentPage.tsx`, `ConfirmationPage.tsx`

**Verification:** full Vitest suite + `next build` + Playwright E2E after each page extraction

**Risk:** Medium — many import rewrites, but no logic changes

- [ ] Create feature directory scaffold
- [ ] Extract booking types into `types/booking.ts`
- [ ] Extract API response types into `api/types.ts`
- [ ] Move bookingStore, useBookingGuard, steps, analytics
- [ ] Move booking components
- [ ] Extract page components and create thin page shells
- [ ] Update all imports
- [ ] Update test file imports in `__tests__/`
- [ ] Verify: Vitest + build + E2E

---

### Phase 3 — Create `src/features/auth/`

**Create directories:**
- `src/features/auth/api/`
- `src/features/auth/components/`
- `src/features/auth/hooks/`
- `src/features/auth/stores/`
- `src/features/auth/utils/`
- `src/features/auth/pages/`

**File moves:**

| From | To |
|---|---|
| `stores/authStore.ts` | `src/features/auth/stores/authStore.ts` |
| `hooks/useAuth.ts` | `src/features/auth/hooks/useAuth.ts` |
| `components/auth/LoginForm.tsx` | `src/features/auth/components/LoginForm.tsx` |
| `components/auth/GuestAccountPrompt.tsx` | `src/features/auth/components/GuestAccountPrompt.tsx` |
| `lib/auth/jwt.ts` | `src/features/auth/utils/jwt.ts` |
| `lib/auth/cookie.ts` | `src/features/auth/utils/cookie.ts` |

**Thin out:** `pages/login.tsx` → re-exports `src/features/auth/pages/LoginPage.tsx`

**Extract API types** from `pages/api/auth/me.ts` into `src/features/auth/api/types.ts` (`AuthUser`).

**Verification:** Vitest + build + E2E

**Risk:** Low — auth is already well-isolated

- [ ] Create feature directory scaffold
- [ ] Move authStore, useAuth, auth utils
- [ ] Move auth components
- [ ] Extract LoginPage, create thin page shell
- [ ] Extract AuthUser type
- [ ] Update all imports
- [ ] Update test file imports
- [ ] Verify: Vitest + build + E2E

---

### Phase 4 — Create `src/features/home/`

**Create directories:**
- `src/features/home/components/`
- `src/features/home/pages/`

**File moves:**

| From | To |
|---|---|
| `components/home/HeroSection.tsx` | `src/features/home/components/HeroSection.tsx` |
| `components/home/ExperienceSection.tsx` | `src/features/home/components/ExperienceSection.tsx` |
| `components/home/WhereWeFlySection.tsx` | `src/features/home/components/WhereWeFlySection.tsx` |
| `components/home/ClubJsxSection.tsx` | `src/features/home/components/ClubJsxSection.tsx` |
| `components/destinations/DestinationCard.tsx` | `src/features/home/components/DestinationCard.tsx` |
| `components/destinations/DestinationGrid.tsx` | `src/features/home/components/DestinationGrid.tsx` |

**Thin out:** `pages/index.tsx` → re-exports `src/features/home/pages/HomePage.tsx`

**Verification:** Vitest + build + E2E

**Risk:** Very low — no shared state, purely presentational

- [ ] Create feature directory scaffold
- [ ] Move home and destination components
- [ ] Extract HomePage, create thin page shell
- [ ] Update all imports
- [ ] Update test file imports
- [ ] Verify: Vitest + build + E2E

---

### Phase 5 — Move pages into `src/` and clean up

**Moves:**
- `pages/` → `src/pages/` (Next.js supports this natively)
- `middleware.ts` → `src/middleware.ts`
- `e2e/` stays at project root (Playwright convention)

**Test colocation** (optional, can defer):
- Move `__tests__/` files to colocate next to their source files, or into `src/testing/`

**Clean up:**
- Delete empty root-level `components/`, `stores/`, `hooks/`, `lib/`, `data/` directories
- Remove the `.gitkeep` files from emptied directories

**Add ESLint rule** — `import/no-restricted-paths` to enforce:
- No cross-feature imports (`features/auth` cannot import from `features/booking`)
- No backwards imports (features cannot import from pages)

**Verification:** full Vitest suite + `next build` + Playwright E2E

**Risk:** Low — final cleanup, everything is already moved

- [ ] Move `pages/` → `src/pages/`
- [ ] Move `middleware.ts` → `src/middleware.ts`
- [ ] Delete empty root directories
- [ ] Add ESLint `import/no-restricted-paths` rule
- [ ] Verify: Vitest + build + E2E

---

## Phase Ordering Rationale

1. **Phase 1** — establishes `src/` and moves shared code. Everything else builds on this.
2. **Phase 2** — booking is the largest feature with the most coupling. Getting it right unlocks the rest.
3. **Phases 3–4** — smaller, independent features. Can be done in either order or in parallel.
4. **Phase 5** — cleanup only works after everything is moved.

## Out of Scope

- Splitting `bookingStore` into per-step stores (intentionally kept unified due to cascading invalidation)
- Migrating from Pages Router to App Router
- Adding new features or changing behavior
