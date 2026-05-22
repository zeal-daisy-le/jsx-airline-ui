import { describe, it, expect, afterEach, vi } from "vitest"
import {
  requiresCsrfCheck,
  isValidOrigin,
  getAllowedOrigins,
} from "@/lib/csrf"

describe("requiresCsrfCheck", () => {
  it.each([["POST"], ["PUT"], ["PATCH"], ["DELETE"]])(
    "returns true for %s",
    (method) => {
      expect(requiresCsrfCheck(method)).toBe(true)
    },
  )

  it.each([["GET"], ["HEAD"], ["OPTIONS"]])(
    "returns false for %s",
    (method) => {
      expect(requiresCsrfCheck(method)).toBe(false)
    },
  )

  it("is case-insensitive", () => {
    expect(requiresCsrfCheck("post")).toBe(true)
    expect(requiresCsrfCheck("get")).toBe(false)
  })
})

describe("isValidOrigin", () => {
  const allowed = ["https://jsx.com", "https://app.jsx.com"]

  it("returns true when origin exactly matches an allowed origin", () => {
    expect(isValidOrigin("https://jsx.com", allowed)).toBe(true)
    expect(isValidOrigin("https://app.jsx.com", allowed)).toBe(true)
  })

  it("returns false when origin is not in the allowlist", () => {
    expect(isValidOrigin("https://evil.com", allowed)).toBe(false)
  })

  it("returns false for null origin", () => {
    expect(isValidOrigin(null, allowed)).toBe(false)
  })

  it("returns false for undefined origin", () => {
    expect(isValidOrigin(undefined, allowed)).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isValidOrigin("", allowed)).toBe(false)
  })

  it("returns false when allowlist is empty", () => {
    expect(isValidOrigin("https://jsx.com", [])).toBe(false)
  })

  it("does not allow partial matches or subdomain bypass", () => {
    expect(isValidOrigin("https://evil.jsx.com", allowed)).toBe(false)
    expect(isValidOrigin("https://jsx.com.evil.com", allowed)).toBe(false)
  })

  it("is scheme-sensitive — http does not match https", () => {
    expect(isValidOrigin("http://jsx.com", allowed)).toBe(false)
  })
})

describe("getAllowedOrigins", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("includes NEXT_PUBLIC_APP_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://jsx.com")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_URL", "")
    const origins = getAllowedOrigins()
    expect(origins).toContain("https://jsx.com")
  })

  it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://jsx.com/")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_URL", "")
    const origins = getAllowedOrigins()
    expect(origins).toContain("https://jsx.com")
    expect(origins).not.toContain("https://jsx.com/")
  })

  it("includes https://VERCEL_URL when set", () => {
    vi.stubEnv("VERCEL_URL", "jsx-preview.vercel.app")
    vi.stubEnv("NODE_ENV", "production")
    const origins = getAllowedOrigins()
    expect(origins).toContain("https://jsx-preview.vercel.app")
  })

  it("includes localhost in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development")
    const origins = getAllowedOrigins()
    expect(origins).toContain("http://localhost:3000")
    expect(origins).toContain("http://localhost:3001")
  })

  it("excludes localhost in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_URL", "")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
    const origins = getAllowedOrigins()
    expect(origins).not.toContain("http://localhost:3000")
  })
})
