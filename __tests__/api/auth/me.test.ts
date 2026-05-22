import { describe, it, expect, beforeAll } from "vitest"
import handler from "@/pages/api/auth/me"
import { signJWT } from "@/lib/auth/jwt"
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookie"
import type { NextApiRequest, NextApiResponse } from "next"

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-vitest-at-least-32-chars"
})

function mockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return { method: "GET", cookies: {}, ...overrides } as unknown as NextApiRequest
}

function mockRes() {
  const calls: { method: string; args: unknown[] }[] = []
  const res: Record<string, unknown> = {}
  res.status = (code: number) => {
    calls.push({ method: "status", args: [code] })
    return res
  }
  res.json = (body: unknown) => {
    calls.push({ method: "json", args: [body] })
    return res
  }
  res.setHeader = (name: string, value: unknown) => {
    calls.push({ method: "setHeader", args: [name, value] })
    return res
  }
  return { res: res as unknown as NextApiResponse, calls }
}

const SAMPLE = { sub: "u1", email: "a@jsx.com", firstName: "Alice", lastName: "Smith" }

describe("GET /api/auth/me", () => {
  it("returns { user: null } when no cookie is present", () => {
    const { res, calls } = mockRes()
    handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "json", args: [{ user: null }] })
  })

  it("returns the user profile when a valid JWT cookie is present", () => {
    const token = signJWT(SAMPLE)
    const { res, calls } = mockRes()
    handler(mockReq({ cookies: { [AUTH_COOKIE_NAME]: token } }), res)
    expect(calls).toContainEqual({
      method: "json",
      args: [
        {
          user: {
            id: SAMPLE.sub,
            email: SAMPLE.email,
            firstName: SAMPLE.firstName,
            lastName: SAMPLE.lastName,
          },
        },
      ],
    })
  })

  it("returns { user: null } and clears the cookie when the JWT is invalid", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ cookies: { [AUTH_COOKIE_NAME]: "bad.token.here" } }), res)
    expect(calls).toContainEqual({ method: "json", args: [{ user: null }] })
    const setHeaderCall = calls.find((c) => c.method === "setHeader")
    expect(setHeaderCall).toBeDefined()
    expect(String((setHeaderCall?.args[1] as string) ?? "")).toContain("Max-Age=0")
  })

  it("returns { user: null } and clears the cookie when the JWT is expired", () => {
    const token = signJWT(SAMPLE, -1)
    const { res, calls } = mockRes()
    handler(mockReq({ cookies: { [AUTH_COOKIE_NAME]: token } }), res)
    expect(calls).toContainEqual({ method: "json", args: [{ user: null }] })
  })

  it("returns 405 for non-GET requests", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ method: "POST" }), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })
})
