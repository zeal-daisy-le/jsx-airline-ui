import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  requiresCsrfCheck,
  isValidOrigin,
  getAllowedOrigins,
} from "@/lib/csrf"
import {
  createRateLimiters,
  getRateLimitKey,
  getApplicableLimiter,
} from "@/lib/rate-limit"

// Initialised once per edge function instance; null when Upstash is unconfigured.
const rateLimiters = createRateLimiters()

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Security checks only apply to API routes — pages receive headers via
  // next.config.js and are not subject to CSRF or rate limiting here.
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // ── CSRF ────────────────────────────────────────────────────────────────────
  // Validate the Origin header on all state-changing requests.
  // Browsers always include Origin on POST/PUT/PATCH/DELETE; its absence or a
  // mismatched value indicates a cross-site request.
  if (requiresCsrfCheck(request.method)) {
    const origin = request.headers.get("origin")
    const allowedOrigins = getAllowedOrigins()

    if (!isValidOrigin(origin, allowedOrigins)) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: "Invalid or missing Origin header.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  }

  // ── Rate limiting ────────────────────────────────────────────────────────────
  // Skip silently when Redis is not configured (dev / CI without Upstash).
  if (rateLimiters) {
    try {
      const limiter = getApplicableLimiter(pathname, rateLimiters)

      if (limiter) {
        const key = getRateLimitKey(request)
        const { success, limit, remaining, reset } = await limiter.limit(key)

        if (!success) {
          const retryAfter = Math.max(
            1,
            Math.ceil((reset - Date.now()) / 1000),
          )

          return new NextResponse(
            JSON.stringify({
              error: "Too Many Requests",
              message:
                "You have made too many requests. Please wait before trying again.",
              retryAfter,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": String(limit),
                "X-RateLimit-Remaining": String(remaining),
                "X-RateLimit-Reset": String(reset),
                "Retry-After": String(retryAfter),
              },
            },
          )
        }
      }
    } catch {
      // Rate limiting is best-effort — a Redis failure must never block a request.
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply to every API route. New routes are secure by default without any
  // per-route configuration needed.
  matcher: "/api/:path*",
}
