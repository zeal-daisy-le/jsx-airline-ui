# PRD: JSX Airline — Mobile-First Web Application (Phase 1)

**Author:** Daisy Le, Zeal IT Consultants  
**Date:** 2026-05-21  
**Status:** Ready for Development  

---

## Problem Statement

JSX airline's current website is outdated and fails to deliver the modern, mobile-first booking experience that today's travelers expect. The majority of JSX's users access the site on mobile devices, but the current UI is not optimised for mobile interaction. The booking flow is cumbersome, lacks state persistence (users lose progress if they switch apps or lose connectivity), and does not meet modern performance, accessibility, or SEO standards. The current site does not reflect the JSX brand quality and is losing conversions to competitors with superior digital experiences.

---

## Solution

A brand-new mobile-first web application built on Next.js (Pages Router) that replaces the existing JSX website UI while reusing all existing backend services (Navitaire New Skies PSS). The application will feature a visually engaging homepage with editorial destination photography, a smooth multi-step booking flow with persistent state that survives interruptions, full guest and authenticated checkout, WCAG 2.1 AA accessibility compliance, and production-grade performance targeting Lighthouse mobile scores ≥ 90.

---

## User Stories

### Homepage & Discovery

1. As a mobile traveller, I want a fast-loading homepage that showcases JSX destinations with high-quality photography, so that I feel inspired to book a flight.
2. As a first-time visitor, I want to immediately understand what JSX is and where they fly, so that I can decide if JSX serves my travel needs.
3. As a mobile user, I want smooth entrance animations on the homepage hero that don't cause jank or dropped frames, so that the experience feels premium without sacrificing performance.
4. As a user with motion sensitivity, I want all animations to be disabled when I have "reduce motion" enabled on my device, so that I can use the site comfortably.
5. As a traveller researching destinations, I want static destination landing pages that load instantly, so that I can explore routes without waiting.
6. As a traveller using Google, I want JSX destination pages to appear in search results with rich flight information, so that I can find relevant flights directly from search.
7. As a returning user, I want to quickly find the flight search form from the homepage, so that I can start booking without scrolling.

### Flight Search

8. As a mobile traveller, I want to search for available flights by selecting origin, destination, and date on a touch-friendly interface, so that I can find suitable flights quickly.
9. As a traveller, I want to select the number and type of passengers (adult, child, infant) before searching, so that the results reflect my actual booking needs.
10. As a traveller, I want to see clear pricing and availability in flight search results, so that I can make an informed decision.
11. As a traveller, I want search results to load with a meaningful loading state rather than a blank screen, so that I know the app is working during Navitaire API calls.
12. As a traveller, I want to filter and sort flight results, so that I can find the best option for my schedule and budget.

### Booking Flow

13. As a traveller, I want to book a flight without creating an account, so that I can complete my purchase quickly as a guest.
14. As a traveller mid-booking, I want my progress saved automatically, so that I don't lose my selections if I switch apps or receive a phone call.
15. As a traveller who returns after a Navitaire session expires, I want to see a clear message that my session timed out with my form data pre-filled, so that I can resume my booking quickly without re-entering all my information.
16. As a traveller, I want a warning notification when my booking session is about to expire (10 minutes remaining), so that I can complete my booking before losing my flight hold.
17. As a traveller, I want clear progress indication through the booking steps, so that I always know where I am in the process and how many steps remain.
18. As a traveller, I want to navigate back to previous booking steps without losing data I've already entered, so that I can review or correct my selections.
19. As a traveller who changes the number of passengers on an earlier step, I want the app to clearly indicate which later steps need to be re-confirmed, so that I don't submit an incomplete booking.
20. As a traveller, I want inline validation on every form field as I complete it, so that I know immediately if I've made an error without having to submit the full form.
21. As a traveller, I want form errors to be clearly described and actionable, so that I know exactly what to fix.
22. As a traveller, I want to enter traveller details (name, date of birth, passport/ID) for each passenger, so that my booking meets airline documentation requirements.
23. As a traveller, I want to select bag allowances for each passenger, so that I know my total baggage costs before payment.
24. As a traveller, I want to select seats from an interactive seat map, so that I can choose my preferred seat position.
25. As a traveller, I want to review a full order summary before payment, so that I can confirm all details are correct before being charged.
26. As a traveller, I want to pay securely using my credit or debit card without the app ever storing my card details, so that my payment information is protected.
27. As a traveller, I want a booking confirmation screen with my PNR (booking reference) immediately after successful payment, so that I have proof of my booking.
28. As a traveller, I want a confirmation email sent automatically after booking, so that I have a record outside the app.

### Error Handling & Recovery

29. As a traveller, I want to see a clear, friendly error message when a Navitaire API call fails, so that I understand what went wrong without technical jargon.
30. As a traveller, I want the app to automatically retry a failed API call before showing an error, so that transient network issues don't interrupt my booking.
31. As a traveller, I want a clear retry button when an API call fails after all retry attempts, so that I can try again without losing my progress.
32. As a traveller, I want my form data to be preserved when an API error occurs, so that I never have to re-enter information due to a server error.
33. As a traveller, I want to see a support contact option when repeated errors occur, so that I can get help completing my booking.
34. As a traveller on a slow mobile connection, I want the app to remain usable with loading skeletons and progress indicators, so that I don't think the app has crashed during slow Navitaire responses.

### Authentication & Accounts

35. As a returning JSX customer, I want to log in to my account during or after booking, so that my booking history is saved to my profile.
36. As a guest traveller who just completed a booking, I want to be offered the option to create an account, so that I can easily manage my booking and earn loyalty benefits without it being forced on me.
37. As a logged-in user, I want my booking progress synced to my account, so that I can resume a booking from a different device.
38. As a logged-in user, I want my traveller details pre-filled from my profile, so that I can complete bookings faster.

### Performance & Accessibility

39. As a mobile user on a slow connection, I want the homepage to load in under 2.5 seconds (LCP), so that I don't abandon the site before seeing content.
40. As a screen reader user, I want all booking form fields to have clear, programmatic labels, so that I can complete a booking without sighted assistance.
41. As a keyboard-only user, I want to navigate the entire booking flow using only the keyboard, so that the app is fully accessible to me.
42. As a screen reader user on mobile (VoiceOver), I want all interactive elements to announce their purpose and state, so that I can operate the booking flow independently.
43. As a user with low vision, I want all text to meet WCAG 2.1 AA colour contrast ratios, so that I can read the content clearly.
44. As a traveller, I want all dialogs and modals (e.g. session expiry warning) to trap focus correctly, so that keyboard and screen reader navigation works correctly within them.

### SEO & Marketing

45. As the JSX marketing team, I want destination landing pages to appear in Google search results with rich flight schema data, so that JSX attracts organic traffic from travellers searching specific routes.
46. As the JSX marketing team, I want an auto-generated XML sitemap, so that search engines can discover and index all public pages.
47. As a traveller discovering JSX via Google, I want destination pages to load instantly and be fully server-rendered, so that the page is immediately readable.

---

## Implementation Decisions

### Module: BookingStore
- Implemented with Zustand. Holds all user selections for the active booking: selected flight, passenger configuration, traveller details per passenger, bag selections, seat assignments, payment token reference, current step identifier, and a per-step validity map.
- Persisted to `sessionStorage` for guest users so state survives page refreshes within the same browser session. Cleared on tab close.
- For logged-in users, the store is additionally synced to a BFF endpoint on every meaningful state change, enabling cross-device resumption.
- Changing an upstream step (e.g. passenger count) triggers invalidation of all downstream steps in the validity map, requiring the user to re-confirm those steps.
- The Navitaire session token is never stored in this module — it lives exclusively in an httpOnly cookie managed by the BFF.
- Payment card data never enters this module under any circumstances. Only a payment gateway token reference is stored post-authorisation.

### Module: NavitaireBFF
- All Navitaire API calls are proxied through Next.js API Routes. The browser never communicates with Navitaire directly.
- Navitaire credentials and session tokens are stored server-side. The session token is issued as an httpOnly, SameSite=Strict, Secure cookie — never returned to the client as a JSON value.
- All API routes validate the `Origin` request header to prevent CSRF attacks.
- Search and booking API routes are rate-limited using Upstash Redis (10 req/min on search, 5 req/min on booking mutations).
- Navitaire API errors are normalised into a consistent error shape before being returned to the client, so the frontend never needs to handle Navitaire-specific error codes directly.
- API route middleware handles session validation, attaching the Navitaire session to outgoing requests transparently.

### Module: BookingFlowRouter
- The booking flow is structured as discrete URL segments: `/booking/flights`, `/booking/passengers`, `/booking/details`, `/booking/bags`, `/booking/seats`, `/booking/review`, `/booking/payment`, `/booking/confirmation`.
- All `/booking/*` routes are marked `noindex` to prevent partial booking URLs from being indexed by search engines.
- Route guards enforce step order: navigating directly to `/booking/seats` without completing earlier steps redirects to the earliest incomplete step.
- The Zustand store's `currentStep` and `stepValidity` map are the source of truth for navigation permissions.
- Browser back/forward navigation is supported — stepping back populates the previous step's form from the Zustand store.

### Module: SessionRecovery
- A background timer tracks time elapsed since the Navitaire session was established (obtained from the BFF on session creation).
- At 10 minutes remaining, a dismissible toast warning is shown.
- On session expiry, a full-page recovery screen is shown. It pre-fills all available form data from the Zustand store (traveller info, passenger count, etc.) and re-initiates the booking from flight selection. Pricing and availability are re-fetched from Navitaire.
- The recovery screen clearly communicates that prices may have changed due to session expiry.

### Module: ErrorRecovery
- All BFF API calls are wrapped in a retry utility that attempts the call up to 2 additional times with exponential backoff (1s, 2s) before surfacing an error.
- On final failure, a toast notification is displayed with a retry action. The Zustand store state is not modified on failure.
- If errors persist, an inline support contact prompt is shown within the current booking step.

### Module: AuthModule
- Authentication is entirely optional — the full booking flow including payment is available without an account.
- Login/account creation is prompted post-booking on the confirmation screen.
- For logged-in users, a JWT is issued as an httpOnly cookie. The BFF validates this token on all authenticated endpoints.
- Logged-in users have their traveller profile data (name, DOB, contact info) returned from the BFF to pre-fill booking forms.

### Module: SecurityMiddleware
- Content Security Policy headers are configured in `next.config.js` to restrict script sources and prevent XSS.
- All sensitive data (passport numbers, contact info) stored in sessionStorage is treated as ephemeral and never logged server-side.
- Upstash Redis rate limiting is enforced at the API route level, not in client code.

### Module: HomepageModule
- The homepage is server-rendered (`getServerSideProps`) to ensure full HTML is available for SEO crawlers and LCP performance.
- Destination content (copy, imagery, routes) is managed as static TypeScript data files in the repository for Phase 1. No CMS integration.
- Images are served via `next/image` with automatic WebP/AVIF conversion and lazy loading. All hero images have explicit `priority` flags to avoid LCP delay.
- A single Framer Motion entrance animation is applied to the hero section: `opacity` 0→1 and `translateY` 20px→0 triggered via `useInView`. No parallax, no scroll event listeners.
- All animations are gated behind a `useReducedMotion()` check — users with "reduce motion" enabled see no animation.
- Page transitions between routes use `AnimatePresence` in `_app.tsx` with a 200ms fade. Booking flow step transitions use a subtle `translateX` slide.
- Micro-interactions (button hovers, card lifts) are implemented with `motion.div` variants.

### Module: SEOModule
- Destination landing pages are statically generated at build time via `getStaticProps`.
- JSON-LD structured data using the `schema.org/Flight` type is embedded in destination pages to qualify for Google rich results.
- `next-sitemap` generates an XML sitemap automatically at build time. All `/booking/*` routes are excluded.

### Module: PaymentIntegration
- The specific payment gateway is a day-one discovery item — must be confirmed with JSX before this module is built.
- Regardless of gateway, the integration must use the gateway's hosted fields or tokenization SDK so raw card data never passes through JSX infrastructure.
- The booking store receives only a payment token reference after authorisation, never card details.
- Navitaire payment finalisation is called from the BFF using the token, completing the booking server-side.

### Module: AnalyticsModule
- Google Analytics 4 with custom events at each booking step to enable funnel drop-off analysis.
- Sentry is integrated for both client-side exception capture and Next.js API route error monitoring, with session replay enabled.
- A Sentry release marker is created on each Vercel production deployment.

### General Architectural Decisions
- **Framework:** Next.js 14 Pages Router. App Router is explicitly out of scope for Phase 1 due to RSC complexity and streaming behaviour conflicts with Navitaire session state.
- **Styling:** Tailwind CSS with shadcn/ui component primitives (built on Radix UI). Provides accessible components (dialogs, dropdowns, date pickers) with full visual customisation to match the Figma design system.
- **Form management:** React Hook Form with Zod schemas on every booking step. Zod schemas double as runtime validators for Navitaire API response shapes.
- **Deployment:** Vercel. Navitaire credentials and session secrets are stored as Vercel environment variables, never in the repository. Preview deployments are created for every pull request for client review.

---

## Testing Decisions

**What makes a good test:** Tests should assert observable, external behaviour — what the module does — not how it does it internally. A test that breaks when you rename a private function is not a good test. A test that breaks when a user loses their booking state after a session expiry is a good test.

**Modules to test and approach:**

| Module | Tool | What to test |
|---|---|---|
| BookingStore | Vitest | Step transitions, downstream invalidation when upstream changes, sessionStorage persistence/rehydration, session expiry state |
| NavitaireBFF | Vitest + MSW | All Navitaire endpoint shapes (Zod schema tests), CSRF header validation, rate limit enforcement, error normalisation |
| BookingFlowRouter | Vitest + Testing Library | Step order enforcement, back navigation data retention, redirect on incomplete step access |
| SessionRecovery | Vitest | Timer logic, warning threshold trigger, recovery screen data pre-fill accuracy |
| PaymentIntegration | Vitest + MSW | Token storage (card data must never appear in store), Navitaire finalisation call, payment failure recovery |
| E2E critical path | Playwright | Full booking: search → flight → passengers → details → bags → seats → review → payment → confirmation |
| Accessibility | axe-core in Playwright | Run on every booking step and the homepage; WCAG violations fail CI |

**CI enforcement:** All tests run on every pull request via GitHub Actions before Vercel deploys a preview. A failing axe-core accessibility check blocks merge.

---

## Out of Scope

- **Phase 1 backend changes:** No modifications to Navitaire configuration, pricing rules, inventory, or any backend service. The frontend consumes existing services as-is.
- **CMS integration:** Homepage and destination content is managed via static files. A headless CMS (Sanity, Contentful) is a Phase 2 consideration pending confirmation of who owns content updates at JSX.
- **Native mobile app:** This is a mobile-first web application only. iOS/Android native apps are out of scope.
- **Next.js App Router / React Server Components:** Explicitly deferred to Phase 2 to reduce architectural risk.
- **Loyalty/miles programme UI:** Account management, miles balance, and loyalty rewards are out of scope for Phase 1 beyond the post-booking account creation prompt.
- **Multi-language / i18n:** Internationalisation is out of scope for Phase 1.
- **Visual regression testing:** Chromatic/Percy integration is a Phase 2 item once the design system stabilises.
- **Load testing / performance benchmarking:** Basic Lighthouse CI gates are in scope; full load testing of the Navitaire BFF under production traffic is a pre-launch Phase 1E activity, not ongoing CI.

---

## Further Notes

**Two day-one discovery items block all booking flow development:**
1. **Navitaire API surface mapping** — Open DevTools on the existing jsx.com site and capture all network calls through a complete booking flow. This reveals the actual endpoint structure, session token format, and error response shapes before any BFF code is written.
2. **Payment gateway identification** — Confirm with JSX which payment gateway is used via Navitaire (Stripe, Braintree, Cybersource, Adyen, or Navitaire hosted payment page). The `PaymentIntegration` module cannot be designed until this is known.

**ACAA compliance:** As a US airline, JSX is subject to the Air Carrier Access Act, which mandates WCAG 2.1 AA accessibility for airline websites. This is a legal requirement, not a nice-to-have. Accessibility must be built in from the first component, not retrofitted.

**Navitaire session timeout risk:** Navitaire server-side booking sessions typically expire after 15–30 minutes. This is the highest-severity UX risk in the booking flow. The SessionRecovery module must be treated as a first-class feature, not an afterthought.

**Performance budget:** Lighthouse mobile score ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1. These are enforced as CI gates using `lighthouse-ci` on the homepage and the first booking step.
