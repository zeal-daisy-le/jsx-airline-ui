import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimiters = {
  search: Ratelimit
  booking: Ratelimit
}

/**
 * Creates rate limiter instances backed by Upstash Redis.
 * Returns null when Redis credentials are absent so the middleware
 * degrades gracefully in environments without Upstash configured.
 *
 * Limits:
 *  search  — 10 req / min  (flight availability, destination lookups)
 *  booking — 5  req / min  (PNR mutations, payment operations)
 */
export function createRateLimiters(): RateLimiters | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null
  }

  const redis = Redis.fromEnv()

  return {
    search: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "jsx:ratelimit:search",
    }),
    booking: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "jsx:ratelimit:booking",
    }),
  }
}

/**
 * Extracts a per-client identifier for rate limit bucketing.
 * Prefers the real IP forwarded by the Vercel edge; falls back to 'anonymous'
 * so the limiter always has a key even in local dev.
 */
export function getRateLimitKey(request: {
  ip?: string
  headers: { get(name: string): string | null }
}): string {
  return (
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "anonymous"
  )
}

/**
 * Returns the appropriate rate limiter for the given API pathname,
 * or null when the route has no per-route limit.
 *
 * Routes:
 *   /api/search/*  — search limiter (10 req/min)
 *   /api/flights/* — search limiter (10 req/min)
 *   /api/booking/* — booking limiter (5 req/min)
 */
export function getApplicableLimiter(
  pathname: string,
  limiters: RateLimiters,
): Ratelimit | null {
  if (pathname.startsWith("/api/booking")) return limiters.booking
  if (
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/flights")
  )
    return limiters.search
  return null
}
