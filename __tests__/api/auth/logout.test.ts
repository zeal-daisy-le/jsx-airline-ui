import { describe, it, expect } from "vitest"
import handler from "@/pages/api/auth/logout"
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookie"
import type { NextApiRequest, NextApiResponse } from "next"

function mockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return { method: "POST", cookies: {}, ...overrides } as unknown as NextApiRequest
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

describe("POST /api/auth/logout", () => {
  it("returns { ok: true }", () => {
    const { res, calls } = mockRes()
    handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "json", args: [{ ok: true }] })
  })

  it("clears the auth cookie via Set-Cookie with Max-Age=0", () => {
    const { res, calls } = mockRes()
    handler(mockReq(), res)
    const setCookie = calls.find((c) => c.method === "setHeader")
    expect(setCookie).toBeDefined()
    const value = String(setCookie?.args[1] ?? "")
    expect(value).toContain(AUTH_COOKIE_NAME)
    expect(value).toContain("Max-Age=0")
    expect(value).toContain("HttpOnly")
  })

  it("returns 405 for GET requests", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ method: "GET" }), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })
})
