## Problem Statement

The JSX Airline homepage relies entirely on static images across its three visual sections (Hero, Experience, Where We Fly). This produces a flat, brochure-like first impression that doesn't convey the premium, modern brand airlines compete on. Visitors see a static page that looks the same as every other airline site using stock photography — there is no motion, no visual storytelling, and no scroll-driven discovery.

## Solution

Replace the static hero image with a looping background video that communicates the JSX experience within seconds of landing on the page. Add scroll-triggered entrance animations to the Experience and Where We Fly sections so the page reveals content progressively as the user scrolls. All motion respects accessibility preferences, connection quality, and Lighthouse performance budgets.

## User Stories

1. As a first-time visitor, I want to see a cinematic hero video when I land on the homepage, so that I immediately understand JSX is a premium airline experience.
2. As a visitor on a slow connection, I want the page to load a static poster image instead of the video, so that I don't wait for a large video to buffer.
3. As a visitor with reduced-motion preferences enabled, I want the video to never load or play, so that the page respects my accessibility settings.
4. As a visitor, I want a visible pause/play button on the hero video, so that I can stop the motion if it's distracting (WCAG 2.2.2).
5. As a visitor scrolling down the page, I want the Experience cards to animate into view with a staggered fade-up effect, so that the page feels alive and guides my attention.
6. As a visitor, I want the Experience card images to have a subtle Ken Burns (slow zoom/pan) effect once visible, so that the images feel cinematic rather than static.
7. As a visitor scrolling to the destinations section, I want the destination cards to stagger into view, so that the section feels dynamic and I'm drawn to explore routes.
8. As a visitor hovering over a destination card, I want a smooth zoom effect with a gradient shift on the image, so that the card feels interactive and clickable.
9. As a mobile user, I want the same animations to work smoothly on my device, so that the experience isn't degraded on lower-powered hardware.
10. As a developer, I want the hero video to not regress the Lighthouse performance score below 90 or push LCP above 2.5s, so that the performance budget is maintained.
11. As a developer, I want scroll-triggered animations to use a single reusable pattern, so that adding animations to future sections is trivial.
12. As a developer, I want the video component to be independently testable, so that lazy loading, reduced-motion, and connection-aware logic can be verified without rendering the full page.
13. As a screen reader user, I want the hero video to be marked as decorative (aria-hidden), so that it doesn't interfere with content navigation.
14. As a visitor, I want the transition from poster image to video to be a smooth crossfade, so that the page doesn't "pop" when the video loads.

## Implementation Decisions

### Hero Video — Poster-First Pattern
- The existing hero JPG becomes the poster image, rendered via Next.js `<Image priority>` — this remains the LCP element.
- The `<video>` element loads lazily after the page is interactive. Once the video can play through, it crossfades in over the poster (~500ms opacity transition).
- Video format: WebM (VP9) as primary `<source>`, MP4 (H.264) as fallback. Both compressed to under 2-3MB total. Resolution capped at 1920x1080.
- Video attributes: `autoPlay`, `muted`, `loop`, `playsInline`. No `preload="auto"` — use `preload="none"` and programmatic load after hydration.
- Videos self-hosted in `/public/videos/` — no external CDN or streaming service. Vercel edge CDN handles caching.

### Hero Video — Accessibility & Connection Awareness
- `prefers-reduced-motion: reduce` — video never loads, poster image shown permanently. Checked via Framer Motion's `useReducedMotion` hook (already used in HeroSection).
- `navigator.connection.effectiveType` — on `slow-2g` or `2g`, skip video entirely. Feature-detect the API; absent API means "load the video" (desktop browsers).
- Pause/play button: visible icon button in the bottom-right corner of the hero. Toggles `video.pause()`/`video.play()`. Updates `aria-label` between "Pause background video" and "Play background video". Satisfies WCAG 2.2.2 (Pause, Stop, Hide).
- The `<video>` element gets `aria-hidden="true"` — it's decorative, not content.

### Scroll-Triggered Animations — Shared Pattern
- A reusable `ScrollReveal` wrapper component using Framer Motion's `whileInView` with `viewport={{ once: true, amount: 0.3 }}`.
- Accepts `delay` prop for stagger timing (e.g., `index * 0.15`).
- Default animation: fade-up (`opacity: 0, y: 24` to `opacity: 1, y: 0`), `duration: 0.5`, `ease: "easeOut"`.
- `prefers-reduced-motion` disables all animation — elements render in their final state immediately.
- Used by both Experience and Where We Fly sections.

### Experience Section Animations
- Each of the 3 cards wrapped in `ScrollReveal` with stagger delays (0ms, 150ms, 300ms).
- Card images get a Ken Burns effect: slow continuous `scale` + `translate` animation (e.g., scale 1.0→1.05 over 12s, alternate) triggered when the card enters the viewport. Implemented via Framer Motion `animate` with `repeat: Infinity, repeatType: "reverse"`.
- Ken Burns disabled when `prefers-reduced-motion` is active.

### Where We Fly Section Animations
- Destination cards wrapped in `ScrollReveal` with stagger delays (4 visible cards × 150ms).
- Existing CSS `group-hover:scale-105` replaced with Framer Motion-driven hover: `scale: 1.05` on the image + gradient overlay opacity shift from 0.4 to 0.6 (darkens to improve text contrast on zoom).
- Existing `cardVariants` (y: -4 lift, scale: 0.98 tap) retained and combined with the new hover image zoom.
- `whileHover` and `whileTap` disabled when `prefers-reduced-motion` is active (already implemented in DestinationCard).

### Video Asset Pipeline
- Source: MP4 from Google Drive (11.8MB). MOV (76.2MB) is the raw source — not used directly.
- Compress MP4 to H.264 target ≤ 3MB using ffmpeg (CRF 28-32, 1080p, strip audio).
- Transcode to WebM VP9 target ≤ 2MB using ffmpeg (CRF 35-40, 1080p, strip audio).
- Extract poster frame as optimized JPG (replaces current hero.jpg or sits alongside it).
- All outputs placed in `/public/videos/` (hero.webm, hero.mp4) and `/public/images/` (hero-poster.jpg).

### Performance Budget Protection
- Lighthouse CI config (`.lighthouserc.js`) already gates homepage at Performance ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1.
- The poster-first pattern ensures LCP is measured on the poster `<Image>`, not the video.
- Video uses `preload="none"` — zero impact on initial page load metrics.
- CLS protection: the video container has fixed dimensions matching the poster, so no layout shift when the video fades in.
- Scroll animations use `will-change: transform, opacity` and Framer Motion's hardware-accelerated transforms — no layout thrashing.

## Testing Decisions

Tests should verify behavior through public interfaces, not implementation details. A test that breaks when internal code is refactored (but behavior is unchanged) is a bad test.

### HeroVideo component (unit — Vitest + Testing Library)
- Renders poster image by default (no video element in DOM initially)
- Does not render video when `prefers-reduced-motion` is active (mock `useReducedMotion`)
- Does not render video on slow connections (mock `navigator.connection`)
- Renders video element with correct sources (WebM + MP4) when conditions allow
- Pause button toggles video playback and updates aria-label
- Video has `aria-hidden="true"`

### ScrollReveal component (unit — Vitest + Testing Library)
- Renders children
- Applies correct initial animation state (opacity 0, translated)
- Respects reduced-motion preference (renders children in final state)

### E2E (Playwright)
- Homepage loads with hero poster visible (LCP check)
- Scroll-triggered animations fire on scroll (Experience and Where We Fly sections)
- axe-core accessibility scan passes on homepage with video

### Prior art
- Existing Vitest tests in the codebase use Testing Library with MSW for API mocking
- Existing Playwright E2E tests in `e2e/` use axe-core for accessibility scanning
- HeroSection already has Framer Motion patterns with `useReducedMotion` — tests follow the same mocking approach

## Out of Scope

- **Video CMS or DAM integration** — videos are static assets, not dynamically managed
- **Adaptive bitrate streaming** — single-quality delivery is sufficient for a short loop
- **Video on other pages** — this PRD covers homepage only
- **Club JSX section animations** — this section is text-only and out of scope
- **Mobile-specific video crops** — same video serves all breakpoints (CSS `object-fit: cover` handles framing)
- **Real Figma design sync** — animations are engineering-driven; Figma screens updated after implementation
- **Audio** — video is permanently muted (decorative background)

## Further Notes

- The source MP4 (11.8MB) must be compressed before use. The video asset pipeline task is a prerequisite — no other work can start until compressed assets are in `/public/videos/`.
- If Lighthouse scores regress after the video is added, the first mitigation is reducing video file size further or shortening the clip. The poster-first pattern means the video can be removed entirely without breaking the page — it's a progressive enhancement.
- The `ScrollReveal` component is intentionally generic. Future sections (e.g., testimonials, partners) can use it without modification.
- All animations must respect `prefers-reduced-motion`. This is a non-negotiable WCAG 2.1 AA requirement enforced by the existing axe-core E2E tests.

## Tasks

<!-- Dependency graph:
     Task 1 (HITL: video assets) ──→ Task 4 (hero video) ──┐
                                                             ├──→ Task 5 (E2E + Lighthouse)
     Task 2 (experience anims)  ──→ Task 3 (where we fly) ──┘
     Tasks 1 and 2 can start in parallel.
-->

### Task 1: Video asset compression
**Type:** HITL
**Blocked by:** None — can start immediately

#### What to build
Compress the source MP4 (11.8MB from Google Drive) into delivery-ready formats. Produce WebM (VP9, ≤2MB) and MP4 (H.264, ≤3MB) using ffmpeg with audio stripped and resolution capped at 1920x1080. Extract an optimized poster JPG from a representative frame. Place outputs in `/public/videos/` (hero.webm, hero.mp4) and `/public/images/` (hero-poster.jpg). HITL because the human must provide the source file and approve compression quality before downstream tasks can begin.

#### Acceptance criteria
- [ ] WebM file exists at `/public/videos/hero.webm` and is ≤ 2MB
- [ ] MP4 file exists at `/public/videos/hero.mp4` and is ≤ 3MB
- [ ] Poster JPG exists at `/public/images/hero-poster.jpg` and is optimized (≤ 80KB)
- [ ] Video is 1920x1080 or smaller, no audio track
- [ ] Human has approved visual quality of both compressed formats

### Task 2: Scroll-reveal Experience section
**Type:** AFK
**Blocked by:** None — can start immediately

#### What to build
Create a reusable `ScrollReveal` wrapper component using Framer Motion's `whileInView` with `viewport={{ once: true, amount: 0.3 }}`. It accepts a `delay` prop for stagger timing and a default fade-up animation (opacity 0 + y:24 → opacity 1 + y:0, duration 0.5s, easeOut). When `prefers-reduced-motion` is active, children render in their final state immediately with no animation. Integrate into ExperienceSection: wrap each of the 3 cards with stagger delays (0ms, 150ms, 300ms). Add Ken Burns effect (slow scale 1.0→1.05 over 12s, infinite reverse) on card images, triggered on viewport entry, disabled for reduced-motion. Write unit tests for ScrollReveal.

#### Acceptance criteria
- [ ] `ScrollReveal` component exists and is reusable (accepts children, delay, and custom animation props)
- [ ] Experience cards stagger in on scroll with fade-up animation
- [ ] Ken Burns zoom/pan effect runs on card images once visible
- [ ] All animations disabled when `prefers-reduced-motion` is active
- [ ] Unit tests pass: renders children, respects reduced-motion, applies initial animation state
- [ ] No visual regressions on Experience section at mobile and desktop breakpoints

### Task 3: Scroll-reveal Where We Fly + enhanced hover
**Type:** AFK
**Blocked by:** Task 2 (needs `ScrollReveal` component)

#### What to build
Wrap destination cards in `ScrollReveal` with stagger delays (4 visible cards × 150ms). Replace the existing CSS `group-hover:scale-105` on card images with a Framer Motion-driven hover: image scales to 1.05 and gradient overlay opacity shifts from 0.4 to 0.6 (darkens for better text contrast). Retain the existing `cardVariants` (y:-4 lift on hover, scale:0.98 on tap). All hover/tap animations disabled when `prefers-reduced-motion` is active. Write unit tests for the enhanced hover behavior.

#### Acceptance criteria
- [ ] Destination cards stagger in on scroll with fade-up animation
- [ ] Hover triggers smooth Framer Motion image zoom (1.05) + gradient darkening (0.4→0.6)
- [ ] Existing card lift (y:-4) and tap (scale:0.98) behaviors preserved
- [ ] Old CSS `group-hover:scale-105` removed, replaced by Framer Motion
- [ ] All animations disabled when `prefers-reduced-motion` is active
- [ ] No visual regressions on Where We Fly section at mobile and desktop breakpoints

### Task 4: Hero background video
**Type:** AFK
**Blocked by:** Task 1 (needs compressed video assets in `/public/videos/`)

#### What to build
Create a `HeroVideo` component implementing the poster-first pattern. Render the poster JPG via Next.js `<Image priority>` as the LCP element. After hydration, conditionally load a `<video>` element with `preload="none"`, WebM + MP4 `<source>` tags, and `autoPlay muted loop playsInline` attributes. On `canplaythrough`, crossfade the video over the poster (~500ms opacity transition). Include a visible pause/play icon button (bottom-right corner) that toggles playback and updates `aria-label`. Add `aria-hidden="true"` to the video element. Skip video entirely when `useReducedMotion` returns true or when `navigator.connection.effectiveType` is `slow-2g` or `2g` (feature-detect the API). Integrate into HeroSection, replacing the existing static `<Image>`. Write unit tests for all conditional rendering paths.

#### Acceptance criteria
- [ ] Poster image renders immediately and is the LCP element
- [ ] Video loads lazily after hydration with `preload="none"`
- [ ] Video crossfades over poster on `canplaythrough` (~500ms transition)
- [ ] WebM served as primary source, MP4 as fallback
- [ ] Pause/play button visible, toggles playback, updates `aria-label`
- [ ] Video has `aria-hidden="true"`
- [ ] Video never loads when `prefers-reduced-motion` is active
- [ ] Video never loads on `slow-2g` or `2g` connections
- [ ] `navigator.connection` API absence treated as "load the video"
- [ ] Unit tests pass for: poster-only render, reduced-motion skip, slow-connection skip, video sources, pause/play toggle, aria attributes
- [ ] No CLS — video container matches poster dimensions

### Task 5: E2E animations + Lighthouse gate
**Type:** AFK
**Blocked by:** Tasks 2, 3, 4

#### What to build
Add Playwright E2E tests covering homepage animations end-to-end. Test that the homepage loads with the hero poster visible and that scroll-triggered animations fire for Experience and Where We Fly sections. Test that the hero video pause/play button toggles playback. Run axe-core WCAG 2.1 AA scan on the homepage with the video present. Run Lighthouse CI against the homepage and verify Performance ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1 still pass. This task is the quality gate — all animation work must pass these checks before shipping.

#### Acceptance criteria
- [ ] Playwright test: homepage loads with hero poster visible
- [ ] Playwright test: scrolling triggers Experience card entrance animations
- [ ] Playwright test: scrolling triggers Where We Fly card entrance animations
- [ ] Playwright test: hero video pause/play button works
- [ ] axe-core scan passes on homepage with no WCAG 2.1 AA violations
- [ ] Lighthouse CI: Performance ≥ 90 on homepage
- [ ] Lighthouse CI: LCP ≤ 2.5s on homepage
- [ ] Lighthouse CI: CLS ≤ 0.1 on homepage
- [ ] All existing E2E tests continue to pass (no regressions)
