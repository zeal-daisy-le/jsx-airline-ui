# CLAUDE.md — JSX Airline UI

## Execution Model — LOOM

This project uses **LOOM** (Livefront Orchestrated Operations Model) as the execution loop for all engineering tasks. The workflow is:

1. **WARP** — Readiness gate. Score the task on 4 dimensions before execution.
2. **LOOM** — 8-phase execution loop (Setup → Understand → Clarify → Scope → Plan → Build → Verify → Handoff).
3. **TRUE** — Drift detection between runs. Run weekly or after sprints.

### Task Source
- Tasks come from **Jira**. Use `livefront-jira` / `acli-jira` for status transitions and PR linking.
- Phase 0 moves ticket to `In Progress`. Phase 7 moves to `In Review` and links the PR.

### Git Workflow
- Every LOOM execution runs inside a **git worktree** scoped to the ticket.
- Branch naming: `[developer]/[ticket-id]` (e.g., `daisy/JSX-42`).
- Create worktree: `git worktree add ../jsx-[ticket-id] -b [branch-name] origin/main`

### Phase 4 Gate
- Human approval is **required** before Phase 5 build begins.
- Exec-plans are committed to `docs/exec-plans/active/[task-slug].md`.
- Approve / Redirect / Reject via AskUserQuestion. No auto-approve.

### Phase 5 — TDD Build (Custom)
- Phase 5 uses the `/loom-tdd-build` skill — a TDD replacement for LOOM's default build phase.
- **Test-first is mandatory**: RED (failing test) → GREEN (minimal impl) → REFACTOR. Every new behavior starts with a failing test.
- Vertical slices only — one test → one implementation → repeat. Never write all tests first.
- See `.claude/commands/loom-tdd-build.md` for full procedure.

### Exec-Plans
- Active plans: `docs/exec-plans/active/`
- Completed plans: `docs/exec-plans/completed/` (moved at Phase 7 handoff)

---

## Guardrails

Hard stops that LOOM Phase 3 must surface. Guardrail contact = **STOP and escalate immediately**.

- **BFF credentials server-side only**: `NAVITAIRE_API_URL`, `NAVITAIRE_API_KEY` must never appear in client-side code. All Navitaire calls go through `pages/api/` routes. See `src/lib/api/` and `pages/api/`.
- **Auth middleware**: Changes to `middleware.ts` (CSRF + rate limiting) require human review. File: `middleware.ts`.
- **Booking step order**: `lib/booking/steps.ts` is the single source of truth. Do not duplicate step logic elsewhere.
- **Session storage secrets**: Passport/ID numbers in `stores/bookingStore.ts` are sent to BFF but must never be server-logged.
- **WCAG 2.1 AA mandatory**: Every component must pass axe-core accessibility checks. No exceptions.
- **Figma design match (UI work)**: Any UI component or page change MUST reference Figma file `8TPHDvgnAX08HgIZlja3jK`. Call `get_design_context` or `get_screenshot` on the relevant node. Match colors, spacing, typography, border-radius exactly. Map to Tailwind tokens in `tailwind.config.ts`, not hardcoded hex values. For non-UI work, Figma is not required.

---

## Failure Memory

> This section is authored by the engineering team based on real project experience.
> TRUE will flag if this section is missing on established repos (20+ merged PRs).

- **Header position change breaks layout**: Switching SiteHeader from `sticky` to `absolute` removes it from document flow. Sections below no longer account for header height. Always verify downstream layout after header position changes.
- **axe-core catches translucent backgrounds**: Translucent backgrounds (e.g., `rgba(20,20,20,0.42)`) composite against the page background, not the visual background behind them. On white pages, low-opacity dark backgrounds fail WCAG AA contrast for white text. Calculate the composited color against worst-case (white) background.
- **Preview tool blank at wide viewports**: The Claude Preview tool renders blank screenshots when scrolled at viewports wider than ~768px. This is a tool limitation. Verify wide layouts via DOM queries or `preview_inspect`, not screenshots.
- **Footer duplicate elements break tests**: When using responsive show/hide patterns (`hidden lg:block` + `lg:hidden`), `getByRole` finds multiple elements. Keep single elements and use CSS grid responsive classes instead.

---

## Architecture

### Project Structure — Bulletproof React
Follow the [bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) feature-based architecture:

```
src/
├── app/          # App layer: routes, providers, router
├── assets/       # Static files (images, fonts)
├── components/   # Shared components used across features
├── config/       # Global config, env variables
├── features/     # Feature modules (primary organization unit)
│   └── <feature>/
│       ├── api/        # Feature API requests and hooks
│       ├── components/ # Feature-scoped components
│       ├── hooks/      # Feature-scoped hooks
│       ├── stores/     # Feature state management
│       ├── types/      # Feature TypeScript types
│       └── utils/      # Feature utility functions
├── hooks/        # Shared custom hooks
├── lib/          # Preconfigured reusable libraries
├── stores/       # Global state management
├── testing/      # Test utilities and mocks
├── types/        # Shared TypeScript types
└── utils/        # Shared utility functions
```

Key rules:
- **Feature-first**: Organize code by feature, not by type. Each feature is self-contained.
- **No cross-feature imports**: Features must not import from other features. Compose at the app level.
- **Unidirectional flow**: shared → features → app. Never import backwards.
- **Direct imports**: Import files directly, no barrel files (preserves tree-shaking).
- **Only include what's needed**: A feature folder only has the subfolders it actually uses.

### Tech Stack
- **Framework**: Next.js 14 Pages Router (TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Animation**: Framer Motion (hero entrance + micro-interactions only)
- **State**: Zustand + sessionStorage (guests) / BFF sync (logged-in)
- **Forms**: React Hook Form + Zod
- **BFF**: Next.js API Routes (proxy to Navitaire, never expose credentials)
- **Auth**: Guest checkout allowed; optional JWT via httpOnly cookie
- **Testing**: Vitest + Testing Library + MSW (unit) / Playwright + axe-core (E2E)
- **Task Tracking**: Jira (status transitions via `acli-jira`)
- **Design System**: Figma MCP plugin (`mcp__plugin_figma_figma__*` tools), file key `8TPHDvgnAX08HgIZlja3jK`

---

## Preferences

> These are conventions, not hard stops. Useful context for implementation.

### Booking Flow
- Step order enforced by `useBookingGuard` — every page renders null until `hasHydrated` is true and step is accessible.
- `stores/bookingStore.ts` persists to `sessionStorage` via Zustand persist. `hasHydrated` is set in `onRehydrateStorage`.
- `bookingReference` stored in booking store after successful payment, used on confirmation page.

### BFF Endpoints
- When `NAVITAIRE_API_URL` is unset, `GET /api/search` returns deterministic mock flights — useful for local dev and CI.
- Navitaire endpoint paths are placeholders (`/api/v1/availability/search`) pending HITL.

### CSRF + Rate Limiting
- Handled globally in `middleware.ts` for all `/api/*` routes.
- Search: 10 req/min. Booking mutations: 5 req/min. Gracefully skipped when Upstash is unconfigured.

### Error Recovery
- `useErrorStore` (`stores/errorStore.ts`) for toasts and retry state.
- `withRetry` from `lib/api/retry.ts` (2 retries, exponential backoff) — reserved for submit mutations.
- `onAllRetriesExhausted` (not `showToast`) after retries exhausted — surfaces support contact UI.
- Data loading failures (GET): plain `fetch`, `showToast` + inline retry button. No `withRetry`.

### Analytics
- `bookingEvents.stepViewed(step)` on mount, `bookingEvents.stepCompleted(step, params)` on completion.
- No-ops when `window.gtag` is absent.

### Booking Store
- `TravelerInfo` includes `nationality` alongside name, DOB, document type/number.
- `contactDetails: ContactDetails | null` — separate top-level field, not cleared on passenger count change.
- `confirmedTotalPrice: number | null` — set by review page, read by confirmation page.

### Seat Map UX
- `activePassengerIndex` tracks assignment. Auto-advance after selection.
- `seatToPassenger` derived from `assignments`. Skip calls `setSeatAssignments([])`.
- `POST /api/booking/seatmap` accepts empty array (skip) or up to 9 entries.

### Review Page
- Bag prices fetched via `GET /api/booking/bags` on mount (plain fetch).
- Seat prices: rows 1-3 = $45 (first class), rows 4+ = $0. Synced with `FIRST_CLASS_ROWS` in `pages/api/booking/seatmap.ts`.
- Taxes: 12% of (base fare + bags + seats), rounded to nearest dollar.
- Price change: `confirmed: false` → banner replaces CTA.

### Confirmation Page
- Does NOT use `useBookingGuard`. Waits for `hasHydrated`, reads `bookingReference`.
- Snapshots data to local state, fires GA4 event, calls send-confirmation (fire-and-forget), then `resetBooking()`.
- Print-friendly: SiteHeader and action buttons are `print:hidden`.

---

## CI / Testing

### Lighthouse CI
- Config: `.lighthouserc.js`. Mobile perf ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1.
- Enforced on `/` and `/booking/flights`. 3 runs averaged.
- Workflow: `.github/workflows/lighthouse.yml`

### Playwright E2E + axe-core
- Config: `playwright.config.ts`. `NAVITAIRE_API_URL` unset for deterministic mocks.
- Tests: `e2e/`. Seeder helper: `e2e/helpers/booking.ts`.
- axe-core: `@axe-core/playwright` with `wcag2a`, `wcag2aa`, `wcag21aa` tags.
- Workflow: `.github/workflows/playwright.yml`

### Payment Stub
- `POST /api/booking/pay` — mock endpoint for E2E flow. Real gateway reserved for future work.

---

## Completed Work

> Reference for LOOM Phase 1 (prior art) and TRUE (drift detection).

- **Booking flow**: Search (#14), passengers (#15), details (#16), bags (#17), seats (#18), review (#19), confirmation (#21), payment stub (#24)
- **CI**: Lighthouse (#25), Playwright E2E + axe-core (#24)
- **Homepage**: Responsive layout, floating header, centered hero, experience cards, destination grid, Club JSX stats, footer
