import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getRateLimitKey, getApplicableLimiter } from "@/lib/rate-limit"
import type { RateLimiters } from "@/lib/rate-limit"

// ── getRateLimitKey ──────────────────────────────────────────────────────────

describe("getRateLimitKey", () => {
  it("returns request.ip when present", () => {
    const req = {
      ip: "1.2.3.4",
      headers: { get: () => null },
    }
    expect(getRateLimitKey(req)).toBe("1.2.3.4")
  })

  it("falls back to x-forwarded-for first IP when request.ip is absent", () => {
    const req = {
      ip: undefined,
      headers: { get: (name: string) => (name === "x-forwarded-for" ? "5.6.7.8, 9.10.11.12" : null) },
    }
    expect(getRateLimitKey(req)).toBe("5.6.7.8")
  })

  it("returns 'anonymous' when neither ip nor x-forwarded-for is present", () => {
    const req = {
      ip: undefined,
      headers: { get: () => null },
    }
    expect(getRateLimitKey(req)).toBe("anonymous")
  })
})

// ── getApplicableLimiter ─────────────────────────────────────────────────────

describe("getApplicableLimiter", () => {
  // Use minimal stubs — the test only checks which limiter is selected
  const searchLimiter = { limit: vi.fn() } as unknown as RateLimiters["search"]
  const bookingLimiter = { limit: vi.fn() } as unknown as RateLimiters["booking"]
  const limiters: RateLimiters = { search: searchLimiter, booking: bookingLimiter }

  it("returns search limiter for /api/search routes", () => {
    expect(getApplicableLimiter("/api/search", limiters)).toBe(searchLimiter)
    expect(getApplicableLimiter("/api/search/flights", limiters)).toBe(searchLimiter)
  })

  it("returns search limiter for /api/flights routes", () => {
    expect(getApplicableLimiter("/api/flights", limiters)).toBe(searchLimiter)
    expect(getApplicableLimiter("/api/flights/availability", limiters)).toBe(searchLimiter)
  })

  it("returns booking limiter for /api/booking routes", () => {
    expect(getApplicableLimiter("/api/booking", limiters)).toBe(bookingLimiter)
    expect(getApplicableLimiter("/api/booking/passengers", limiters)).toBe(bookingLimiter)
  })

  it("returns null for unrelated API routes — no rate limit applied", () => {
    expect(getApplicableLimiter("/api/health", limiters)).toBeNull()
    expect(getApplicableLimiter("/api/auth/session", limiters)).toBeNull()
  })
})

// ── createRateLimiters ───────────────────────────────────────────────────────

describe("createRateLimiters", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  it("returns null when Upstash env vars are absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    // Re-import after clearing env so createRateLimiters sees the updated state
    const { createRateLimiters } = await import("@/lib/rate-limit")
    expect(createRateLimiters()).toBeNull()
  })

  it("returns limiter instances when Upstash env vars are present", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "token"

    vi.mock("@upstash/redis", () => ({
      Redis: {
        fromEnv: () => ({}),
      },
    }))
    vi.mock("@upstash/ratelimit", () => ({
      Ratelimit: class {
        constructor() {}
        static slidingWindow() { return {} }
        limit() { return Promise.resolve({ success: true, limit: 10, remaining: 9, reset: 0 }) }
      },
    }))

    const { createRateLimiters } = await import("@/lib/rate-limit")
    const limiters = createRateLimiters()
    expect(limiters).not.toBeNull()
    expect(limiters).toHaveProperty("search")
    expect(limiters).toHaveProperty("booking")
  })
})
