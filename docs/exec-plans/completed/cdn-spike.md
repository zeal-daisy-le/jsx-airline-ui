# CDN Spike — Exec Plan

**Task**: Evaluate CDN options (Vercel Edge, CloudFront, Bunny.net, Contentful) for serving static assets and video files  
**Type**: Investigation / Spike  
**WARP Score**: 🟡 2.5/4.0 (gaps resolved in Phase 2)  
**Phase 4 Status**: AWAITING APPROVAL

---

## Context

The JSX Airline homepage serves ~19 MB of static assets (17 MB video, 2 MB images) directly from Vercel's `/public/` directory. There is no dedicated CDN layer. The site is deployed to `iad1` (US East) but needs **global** coverage. Lighthouse CI enforces LCP ≤ 2.5s on mobile — video load time directly impacts this budget.

### Current Asset Inventory

| Category | Files | Total Size | Format | Loading Strategy |
|---|---|---|---|---|
| Hero video | 2 | 5.1 MB | mp4 + webm | `preload="auto"`, slow-connection skip |
| Experience videos | 8 | 11.9 MB | 4× (mp4 + webm) | `preload="none"`, autoPlay on scroll |
| Destination images | 9 | 1.3 MB | jpg via next/image | AVIF/WebP auto-optimize |
| Poster images | 5 | 0.5 MB | jpg via next/image | Priority (hero), lazy (cards) |
| Other images | 3 | 0.2 MB | jpg/png | Various |

---

## Exec-Plan Steps

### Step 1: Evaluate Vercel Edge Network (built-in)

Assess what Vercel already provides for free with the current deployment:
- Edge network coverage and global PoP locations
- Default cache headers for `/public/` static assets
- `next/image` optimization pipeline (already active)
- Video serving behavior (no optimization — raw files)
- Limitations: no video transcoding, no HLS, no fine-grained cache rules beyond `vercel.json`
- Pricing: included in Vercel plan (Pro plan limits)

**Output**: Baseline performance profile. What we get for free and where the gaps are.

### Step 2: Evaluate CloudFront

Assess AWS CloudFront as a dedicated CDN layer:
- Global edge network (450+ PoPs)
- Integration pattern: S3 origin bucket + CloudFront distribution, or Vercel as custom origin
- Video delivery: direct file serving from edge cache
- HLS support: via MediaConvert for transcoding + CloudFront for delivery
- Cache invalidation strategy
- Pricing model: per-GB egress + per-request, free tier (1 TB/mo first year)
- Integration effort with Next.js (`assetPrefix` in next.config.js, or rewrite rules)

**Output**: Architecture diagram, pricing estimate at 3 traffic tiers, migration effort score.

### Step 3: Evaluate Bunny.net

Assess Bunny.net as a video-optimized CDN:
- Global edge network (114+ PoPs)
- Bunny Stream: built-in video transcoding + adaptive HLS delivery
- Pull zone setup (origin = Vercel deployment URL)
- Per-video analytics and thumbnail generation
- Pricing model: per-GB egress (starts at $0.01/GB), Bunny Stream ($1/month + $0.005/min stored + $0.005/min delivered)
- Integration effort: URL rewrite for video sources, optional for images

**Output**: Architecture diagram, pricing estimate at 3 traffic tiers, migration effort score.

### Step 4: Evaluate Contentful

Assess Contentful as a CMS + CDN layer:
- Contentful's CDN (Fastly-backed) for managed assets
- Images API: on-the-fly transforms (resize, format, quality)
- Video handling: serves raw files from CDN, no transcoding
- Content model: videos and images as Contentful assets, referenced in entries
- Integration pattern: Contentful SDK + `next/image` loader, video URLs from API
- Pricing model: Community (free, 25K API calls), Team ($300/mo), asset storage limits
- Migration effort: requires CMS adoption, content modeling, component refactor to pull from API

**Output**: Architecture diagram, pricing estimate at 3 traffic tiers, migration effort score.

### Step 5: Direct Serving vs HLS Comparison

For each provider that supports it, compare:
- **Direct file serving**: Current mp4/webm dual-source approach served from CDN edge
  - Pros: zero migration for video components, simple cache model
  - Cons: no adaptive bitrate, full file download on mobile
- **Adaptive streaming (HLS)**: Transcode to HLS with multiple quality levels
  - Pros: adaptive bitrate per connection speed, faster initial playback, better mobile experience
  - Cons: transcoding pipeline needed, player changes (hls.js), more complex infrastructure
- Which providers support each approach natively
- LCP impact modeling for hero video under both approaches

**Output**: Side-by-side comparison matrix with winner per use case.

### Step 6: Recommendation & Next Steps

Synthesize findings into a recommendation:
- Recommended provider (or hybrid approach)
- Recommended delivery method (direct vs HLS vs hybrid)
- Estimated monthly cost at current and projected traffic
- Implementation roadmap (what changes in next.config.js, components, CI)
- Risk assessment and rollback plan
- Decision: proceed to implementation ticket or gather more data

**Output**: Final recommendation document with decision matrix.

---

## Deliverable

A single markdown document at `docs/cdn-spike-report.md` containing:
1. Provider comparison matrix (features, pricing, global coverage, integration effort)
2. Direct vs HLS analysis
3. Recommendation with rationale
4. Implementation roadmap if proceeding

---

## Acceptance Criteria

- [ ] All 4 providers evaluated with consistent criteria
- [ ] Pricing estimated at 3 traffic tiers (current ~1K visits/mo, 10K/mo, 100K/mo)
- [ ] Direct vs HLS comparison included
- [ ] LCP impact analysis for hero video
- [ ] Clear recommendation with next steps
- [ ] No code changes in this spike
