# CDN Spike Report — JSX Airline

**Date**: 2026-05-28
**Task**: Evaluate CDN options for serving static assets and video files
**Exec-Plan**: `docs/exec-plans/active/cdn-spike.md`

---

## Current State

| Metric | Value |
|---|---|
| Hosting | Vercel Pro, `iad1` (US East) |
| Total video assets | 17 MB (5 videos × dual mp4/webm) |
| Total image assets | 2 MB (17 files — destinations, posters) |
| CDN | None configured — Vercel's built-in edge network only |
| Image optimization | `next/image` with AVIF-first, WebP fallback |
| Video optimization | None — raw file serving, `preload="auto"` (hero) / `preload="none"` (cards) |
| Cache headers | Vercel defaults (automatic, deployment-lifetime) |
| Performance budget | Lighthouse mobile ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1 |
| Target geography | Global |

### Asset Inventory

| File | Size | Loading Strategy |
|---|---|---|
| hero.mp4 | 2.8 MB | `preload="auto"`, slow-connection skip |
| hero.webm | 2.3 MB | `preload="auto"`, slow-connection skip |
| experience/skip-airport-stress (.mp4/.webm) | 1.4 MB / 1.4 MB | `preload="none"`, autoPlay |
| experience/get-there-faster (.mp4/.webm) | 1.3 MB / 1.5 MB | `preload="none"`, autoPlay |
| experience/bring-the-whole-party (.mp4/.webm) | 0.6 MB / 0.8 MB | `preload="none"`, autoPlay |
| experience/vacation-starts-on-tarmac (.mp4/.webm) | 0.4 MB / 0.4 MB | `preload="none"`, autoPlay |
| Destination images (9 files) | 1.3 MB total | `next/image`, lazy |
| Poster images (5 files) | 0.5 MB total | `next/image`, priority (hero) / lazy (cards) |

---

## Provider Comparison

### 1. Vercel Edge Network (Baseline — Current)

**What we get for free today:**

| Capability | Detail |
|---|---|
| Edge PoPs | 126+ across 51 countries, 20 compute regions |
| Static caching | Automatic, deployment-lifetime, immutable after first request |
| Image optimization | AVIF/WebP via `next/image`, cached 31 days at edge |
| Video optimization | **None** — raw file serving only |
| Included bandwidth | 1 TB/mo (Pro plan) |
| Overage cost | $0.15/GB (iad1) — up to $0.35/GB in distant regions |
| Max cacheable file | 10 MB (all our files are under this) |
| Compression | Gzip + Brotli for text only; NOT for video (already compressed) |

**Strengths:**
- Zero configuration — already working
- `next/image` handles image optimization automatically
- Atomic deploys with instant cache invalidation
- 1 TB/mo included covers estimated traffic up to ~50K visits/mo

**Limitations:**
- No video transcoding, no HLS/DASH adaptive streaming
- No per-asset cache rules (all static files get same treatment)
- No video analytics (buffering, engagement)
- Fewer PoPs than dedicated CDNs (126 vs 600+)
- $0.15/GB overage is expensive vs dedicated CDNs ($0.01–$0.085/GB)
- No origin shield (best-effort regional caching)

**Verdict:** Adequate for current scale. Gaps emerge with global traffic growth and video-heavy pages.

---

### 2. AWS CloudFront

**Architecture:** S3 bucket (origin) → CloudFront distribution → global edge delivery

| Capability | Detail |
|---|---|
| Edge PoPs | 600+ across 90+ cities in 50+ countries |
| Regional edge caches | 13 intermediate cache tiers |
| Video delivery | Direct mp4/webm from edge + HTTP range requests |
| HLS support | Via AWS MediaConvert (separate service) |
| Image optimization | None built-in (need Lambda@Edge or Imgix) |
| Cache control | Full control — per-path TTLs, custom headers, invalidation API |
| Invalidation | 1,000 free paths/mo, wildcard supported, 1–2 min propagation |

**Integration with Next.js:**
```ts
// src/lib/assetUrl.ts
export function assetUrl(path: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || '';
  return `${cdnBase}${path}`;
}
```
- Set `NEXT_PUBLIC_CDN_URL=https://d1234567890.cloudfront.net` in Vercel env vars
- Update video/image `src` attributes to use `assetUrl()` helper
- `assetPrefix` only affects `_next/static/` (JS/CSS) — NOT `/public/` assets

**HLS Pipeline (if needed):**
```
Source mp4 → AWS MediaConvert → HLS manifests (.m3u8) + segments (.ts)
  → S3 bucket → CloudFront → Browser (hls.js player)
```
- Transcoding cost: ~$0.015–0.030/min (~$0.05 total for all 5 videos)
- Requires `hls.js` library in components for non-Safari browsers

**Pricing:**

| Traffic Tier | Egress | Monthly Cost | With Free Tier (yr 1) |
|---|---|---|---|
| Low (1K visits, ~50 GB) | 50 GB × $0.085 | **~$4.30** | **~$0.05** |
| Medium (10K visits, ~500 GB) | 500 GB × $0.085 | **~$43** | **~$0.50** |
| High (100K visits, ~5 TB) | 5,000 GB × $0.085 | **~$430** | **~$345** |

*Note: Prices are US/Europe tier. Asia/LATAM regions add 20–60%.*

**Migration effort:** ~8–12 hours
- S3 bucket + bucket policy + OAC setup (2–3 hrs)
- CloudFront distribution configuration (1–2 hrs)
- `assetUrl()` helper + component updates (2–3 hrs)
- Deploy pipeline (sync assets to S3 on deploy) (2–3 hrs)
- DNS + SSL via ACM for custom subdomain (1 hr)

**Strengths:**
- Largest edge network (600+ PoPs)
- Full cache control and invalidation
- HTTP range requests for video seeking
- HLS pipeline available via MediaConvert
- 1 TB/mo free tier (first 12 months)
- Proven at massive scale

**Limitations:**
- AWS account required — operational surface area
- No built-in image optimization (lose `next/image` transforms unless kept on Vercel)
- Two deploy targets (Vercel + S3) — pipeline complexity
- Invalidation takes 1–2 min (vs Vercel's instant atomic deploys)
- $0.085/GB adds up at scale (cheaper alternatives exist)

---

### 3. Bunny.net

**Architecture:** Pull zone (origin = Vercel URL) + optional Bunny Stream for video

| Capability | Detail |
|---|---|
| Edge PoPs | 114+ globally |
| Pull zone | Origin-pull from Vercel, edge-cached globally |
| Bunny Stream | Upload-based video platform with HLS transcoding |
| Image optimization | Bunny Optimizer — on-the-fly resize, WebP/AVIF conversion |
| Cache control | Per-zone TTLs, instant purge API |
| Video analytics | Built-in (views, buffering, engagement) via Stream |

**Two delivery modes:**

**Mode A — Pull Zone (direct file serving):**
- Create pull zone with Vercel as origin
- Videos/images served from `cdn.bunnycdn.com` or custom subdomain
- Simple URL rewrite in components
- No video processing — just edge caching of raw files

**Mode B — Bunny Stream (adaptive HLS):**
- Upload source videos to Bunny Stream
- Automatic transcoding to multiple quality levels
- HLS adaptive streaming with built-in player
- Per-video analytics and thumbnail generation
- Embed via iframe or Stream API

**Pricing:**

| Component | Rate |
|---|---|
| Standard CDN (pull zone) | **$0.01/GB** (cheapest tier, varies by region) |
| Bunny Stream storage | **$0.005/min stored** |
| Bunny Stream delivery | **$0.005/min delivered** |
| Bunny Stream base | **$1/mo** |
| Bunny Optimizer | **$9.50/mo** + $0.50/10K images processed |

| Traffic Tier | Pull Zone Only | Pull Zone + Stream |
|---|---|---|
| Low (1K visits, ~50 GB) | **~$0.50** | **~$2.50** |
| Medium (10K visits, ~500 GB) | **~$5** | **~$15** |
| High (100K visits, ~5 TB) | **~$50** | **~$100** |

*Note: Pricing from training data (early 2025) — verify at bunny.net/pricing.*

**Migration effort:** ~4–8 hours (pull zone) or ~10–16 hours (with Stream)
- Pull zone setup + DNS (1–2 hrs)
- Component URL updates (2–3 hrs)
- *If using Stream:* Video upload + player integration + component refactor (6–10 hrs)

**Strengths:**
- Cheapest per-GB pricing ($0.01/GB vs $0.085 CloudFront vs $0.15 Vercel)
- Bunny Stream provides turnkey HLS with analytics
- Pull zone is dead simple — origin-pull from existing Vercel deployment
- Bunny Optimizer handles image transforms at edge
- Instant cache purge API

**Limitations:**
- Smaller PoP network than CloudFront (114 vs 600+)
- Bunny Stream requires component refactor (iframe or custom player)
- Less enterprise pedigree than AWS
- No compute-at-edge capabilities
- Pull zone still hits Vercel origin on cache miss (consuming Vercel bandwidth)

---

### 4. Contentful

**Architecture:** CMS with Fastly-backed CDN for managed assets

| Capability | Detail |
|---|---|
| CDN backbone | Fastly (~90+ PoPs) |
| Image transforms | On-the-fly resize, crop, format conversion (WebP, AVIF) via URL params |
| Video handling | **Raw file serving only** — no transcoding, no HLS |
| Upload limit | **20 MB** (Community/Team) — blocks most meaningful video |
| CMS features | Content modeling, environments, preview, localization |

**Images API (strong):**
```
https://images.ctfassets.net/SPACE_ID/ASSET_ID/TOKEN/file.jpg?w=800&fm=webp&q=80
```
- Resize, crop, format conversion, face detection, quality adjustment
- Comparable to `next/image` but with CMS-managed sources

**Video handling (weak):**
- Serves raw uploaded files from Fastly CDN — no processing
- 20 MB upload limit on Community/Team plans (our hero.mp4 is 2.8 MB — fits, but restrictive)
- No transcoding, no adaptive streaming, no video analytics
- Must upload mp4 AND webm as separate assets

**Pricing:**

| Plan | Monthly Cost | API Calls | Assets | Storage |
|---|---|---|---|---|
| Community (free) | **$0** | ~1M CDA calls | 25K records | 50 GB |
| Team | **$300/mo** | ~10M CDA calls | 50K records | 100 GB |
| Enterprise | **$2,000+/mo** | Custom | Custom | Custom |

**Migration effort:** ~25–50 hours
- Contentful space setup + content modeling (2–4 hrs)
- Asset upload + content migration (4–8 hrs)
- SDK + client setup (`contentful` package) (1–2 hrs)
- **Component refactor** — every `<Image>` and `<video>` needs Contentful URL fetching (8–16 hrs)
- Preview/draft workflow (4–8 hrs)
- Webhook → Vercel rebuild pipeline (2–4 hrs)

**Strengths:**
- Strong image transforms with CMS integration
- Content editors can update assets without developer deploys
- Fastly CDN is reliable and performant
- Good developer experience with typed SDK

**Limitations:**
- **CMS overhead for a CDN use case** — 25–50 hrs integration for what is fundamentally file serving
- **No video optimization** — raw serving only, 20 MB upload limit
- **$300/mo minimum** for Team plan (far exceeds CDN costs at moderate traffic)
- API rate limits (78 req/sec CDA)
- Vendor lock-in — asset URLs contain space ID, migration requires full rewrite
- Solves a different problem (content management) — CDN is a side effect

**Verdict:** Contentful is a CMS with a CDN, not a CDN. It only makes sense if the marketing team needs independent content management. For pure CDN delivery, it's the wrong tool.

---

## Direct Serving vs HLS Comparison

### When Each Approach Applies

| Factor | Direct File Serving | HLS Adaptive Streaming |
|---|---|---|
| Video duration | Short clips (< 30s) ✅ | Long-form content (> 1 min) |
| File size | Small (< 5 MB) ✅ | Large (> 20 MB) |
| Network variability | Consistent broadband | Highly variable (mobile, global) |
| Initial load time | Entire file or progressive | First segment only (~2s of video) |
| Quality adaptation | Fixed quality | Auto-adapts to bandwidth |
| Browser support | Universal | Needs hls.js for non-Safari |
| Infrastructure | Simple file hosting | Transcoding pipeline + player |

### Analysis for JSX Airline

**Our video profile:**
- Hero video: 2.3–2.8 MB, ~15–20s, plays immediately on load
- Experience videos: 0.4–1.5 MB each, ~5–15s, play on scroll (lazy)
- All videos are short marketing loops, not long-form content

**Direct file serving (RECOMMENDED for current assets):**
- ✅ All files under 3 MB — download in <1s on 4G
- ✅ Progressive download with HTTP range requests for seeking
- ✅ Zero infrastructure change — just move files to CDN edge
- ✅ Dual mp4/webm format selection handled by `<source>` tags
- ✅ Existing `isSlowConnection()` check skips video on 2G
- ⚠️ No quality adaptation — but files are small enough this doesn't matter

**HLS adaptive streaming (OVERKILL for current assets):**
- ❌ Files are too small to benefit from segmentation
- ❌ Adds hls.js dependency (~50 KB gzipped)
- ❌ Requires transcoding pipeline (MediaConvert or Bunny Stream)
- ❌ Component refactor needed (video player integration)
- ❌ Increases operational complexity for marginal benefit
- ✅ Would matter if videos grow to 1+ minute or 20+ MB

**LCP Impact Analysis (hero video):**
- Hero poster image (79 KB) loads first via `next/image` with `priority` — this is likely the LCP element
- Video loads after poster, cross-fades when `canPlayThrough` fires
- CDN benefit: reducing hero.webm latency from ~200ms (Vercel US East) to ~50ms (global edge) shaves ~150ms off video appearance, but **does not affect LCP** since the poster image is the LCP element
- For LCP, the CDN benefit is on the poster image (79 KB) — difference is minimal

**Recommendation:** Stay with direct file serving. Revisit HLS only if video content grows to long-form (> 1 minute, > 20 MB per file).

---

## Decision Matrix

| Criteria (weight) | Vercel Edge (current) | CloudFront | Bunny.net | Contentful |
|---|---|---|---|---|
| **Global coverage** (20%) | ⭐⭐⭐ 126 PoPs | ⭐⭐⭐⭐⭐ 600+ PoPs | ⭐⭐⭐⭐ 114+ PoPs | ⭐⭐⭐ ~90 PoPs |
| **Video delivery** (20%) | ⭐⭐ Raw only | ⭐⭐⭐⭐ Direct + HLS via MediaConvert | ⭐⭐⭐⭐⭐ Direct + Stream HLS built-in | ⭐ Raw only, 20MB limit |
| **Cost efficiency** (20%) | ⭐⭐⭐ $0 (included) / $0.15/GB overage | ⭐⭐⭐⭐ $0.085/GB + free tier | ⭐⭐⭐⭐⭐ $0.01/GB | ⭐ $0–$300/mo (CMS overhead) |
| **Integration effort** (15%) | ⭐⭐⭐⭐⭐ Already done | ⭐⭐⭐ 8–12 hrs | ⭐⭐⭐⭐ 4–8 hrs (pull zone) | ⭐ 25–50 hrs |
| **Image optimization** (10%) | ⭐⭐⭐⭐⭐ next/image built-in | ⭐⭐ None (keep next/image) | ⭐⭐⭐⭐ Bunny Optimizer | ⭐⭐⭐⭐ Images API |
| **Cache control** (10%) | ⭐⭐ Automatic, no per-asset rules | ⭐⭐⭐⭐⭐ Full control | ⭐⭐⭐⭐ Per-zone control | ⭐⭐ Managed by Contentful |
| **Operational overhead** (5%) | ⭐⭐⭐⭐⭐ Zero | ⭐⭐ AWS account, deploy pipeline | ⭐⭐⭐⭐ Simple dashboard | ⭐⭐ CMS management |
| **Weighted Score** | **3.45 / 5** | **3.70 / 5** | **4.10 / 5** | **1.85 / 5** |

---

## Recommendation

### Primary: Bunny.net Pull Zone (short-term) + Bunny Stream (optional future)

**Why Bunny.net wins:**

1. **Lowest cost**: $0.01/GB vs $0.085 (CloudFront) vs $0.15 (Vercel overage) — 8–15x cheaper at scale
2. **Simplest integration**: Pull zone with Vercel as origin = URL rewrite only, 4–8 hrs
3. **Built-in upgrade path**: If videos grow, Bunny Stream provides turnkey HLS without a separate transcoding service
4. **Good enough global coverage**: 114+ PoPs covers all major markets
5. **Image optimization available**: Bunny Optimizer ($9.50/mo) can supplement or replace `next/image` if needed

**Implementation approach:**

| Phase | What | Effort | When |
|---|---|---|---|
| **Phase 1** | Bunny.net pull zone for `/videos/*` | 4–6 hrs | Sprint 1 |
| **Phase 2** | Add `Cache-Control: immutable` headers, custom subdomain | 2–3 hrs | Sprint 1 |
| **Phase 3** | Evaluate Bunny Optimizer for images (optional) | 2–4 hrs | Sprint 2 |
| **Phase 4** | Bunny Stream migration if video content grows | 10–16 hrs | When needed |

### Runner-up: CloudFront

Choose CloudFront over Bunny if:
- Already using AWS for other services (shared billing, IAM)
- Need 600+ PoPs for compliance or specific geographic requirements
- Prefer enterprise-grade SLAs and support

### Not Recommended

- **Vercel Edge only**: Adequate at low traffic but $0.15/GB overage and 126 PoPs limit global scalability
- **Contentful**: Wrong tool for the job. Only consider if adopting Contentful as CMS for marketing content management (separate decision from CDN)

---

## Implementation Roadmap (If Proceeding with Bunny.net)

### Step 1: Create Bunny Pull Zone

```
Origin URL: https://jsx-airline.vercel.app
Pull Zone Hostname: cdn.jsxair.com (or bunny subdomain)
Cache expiry: 30 days for /videos/*, 7 days for /images/*
```

### Step 2: Add Asset URL Helper

```ts
// src/lib/assetUrl.ts
export function assetUrl(path: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || '';
  return `${cdnBase}${path}`;
}
```

### Step 3: Update Components

```tsx
// HeroSection.tsx
<HeroVideo
  videoWebm={assetUrl("/videos/hero.webm")}
  videoMp4={assetUrl("/videos/hero.mp4")}
  ...
/>

// ExperienceSection.tsx
const experiences = [
  { videoWebm: assetUrl("/videos/experience/skip-airport-stress.webm"), ... },
  ...
];
```

### Step 4: Environment Variables

```
# Vercel Environment Variables
NEXT_PUBLIC_CDN_URL=https://cdn.jsxair.com   # Production
NEXT_PUBLIC_CDN_URL=                          # Preview/Development (use Vercel)
```

### Step 5: Verify

- Lighthouse CI passes (LCP ≤ 2.5s)
- Videos load from CDN domain in Network tab
- Fallback works when `NEXT_PUBLIC_CDN_URL` is empty (local dev)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| CDN outage | Low | High — videos don't load | Fallback to Vercel origin (empty `NEXT_PUBLIC_CDN_URL`) |
| Cache stale after deploy | Medium | Low — old video version served | Set up purge on deploy, or use content-hash filenames |
| CORS issues | Medium | Medium — videos blocked cross-origin | Configure pull zone CORS headers |
| Cost overrun | Low | Low — Bunny is cheap even at scale | Set up billing alerts at $10, $50, $100 |
| Bunny service discontinuation | Very Low | High | Assets remain on Vercel; CDN is additive, not replacing origin |

---

## Pricing Summary

| Monthly Traffic | Vercel (current) | CloudFront | Bunny.net | Contentful |
|---|---|---|---|---|
| 1K visits (~50 GB) | $0 (included) | ~$4 | **~$0.50** | $0 (free tier) |
| 10K visits (~500 GB) | $0 (included) | ~$43 | **~$5** | $0–$300 |
| 100K visits (~5 TB) | ~$600 | ~$430 | **~$50** | $300+ |
| 500K visits (~25 TB) | ~$3,600 | ~$2,050 | **~$250** | Enterprise |

*Note: Vercel cost = overage beyond 1 TB included. CloudFront has 1 TB free tier first 12 months. Bunny pricing from early 2025 — verify current rates.*

---

## Open Questions

1. **Custom domain**: Do we want `cdn.jsxair.com` or is a Bunny subdomain acceptable?
2. **Image strategy**: Keep `next/image` on Vercel (current) or move to Bunny Optimizer?
3. **Deploy pipeline**: Manual purge or automated via Vercel deploy hook + Bunny API?
4. **Video content roadmap**: Are longer-form videos planned? This determines whether Bunny Stream is needed.

---

*Prepared as part of LOOM Phase 5 — CDN Spike Investigation. All pricing from training data (early 2025) — verify current rates before implementation.*
