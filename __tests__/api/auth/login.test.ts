import { describe, it, expect, beforeAll, vi, afterEach } from "vitest"
import handler from "@/pages/api/auth/login"
import { AUTH_COOKIE_NAME } from "@/features/auth/utils/cookie"
import type { NextApiRequest, NextApiResponse } from "next"

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-vitest-at-least-32-chars"
  process.env.NAVITAIRE_API_URL = "https://navitaire.test"
})

afterEach(() => { vi.restoreAllMocks() })

function mockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "POST",
    cookies: {},
    body: { email: "alice@jsx.com", password: "secret" },
    ...overrides,
  } as unknown as NextApiRequest
}

function mockRes() {
  const calls: { method: string; args: unknown[] }[] = []
  const res: Record<string, unknown> = {}
  res.status = (code: number) => { calls.push({ method: "status", args: [code] }); return res }
  res.json = (body: unknown) => { calls.push({ method: "json", args: [body] }); return res }
  res.setHeader = (name: string, value: unknown) => { calls.push({ method: "setHeader", args: [name, value] }); return res }
  return { res: res as unknown as NextApiResponse, calls }
}

const NAV_USER = { id: "u1", email: "alice@jsx.com", firstName: "Alice", lastName: "Smith" }

function navOk() {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => NAV_USER,
  } as Response)
}

function navFail() {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: "Unauthorized" }),
  } as Response)
}

describe("POST /api/auth/login", () => {
  it("returns 405 for non-POST requests", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ method: "GET" }), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 400 when email is missing", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ body: { password: "secret" } }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when password is missing", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ body: { email: "alice@jsx.com" } }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("issues an httpOnly JWT cookie on successful auth", async () => {
    navOk()
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    const setCookie = calls.find((c) => c.method === "setHeader")
    expect(setCookie).toBeDefined()
    const value = String(setCookie?.args[1] ?? "")
    expect(value).toContain(AUTH_COOKIE_NAME)
    expect(value).toContain("HttpOnly")
    expect(value).toContain("SameSite=Strict")
  })

  it("returns { ok: true } on successful login", async () => {
    navOk()
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "json", args: [{ ok: true }] })
  })

  it("returns 401 when Navitaire rejects the credentials", async () => {
    navFail()
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [401] })
  })

  it("returns 502 when the fetch to Navitaire throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"))
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [502] })
  })

  it("never includes the raw password in any response body", async () => {
    navOk()
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    const jsonCalls = calls.filter((c) => c.method === "json")
    for (const call of jsonCalls) {
      expect(JSON.stringify(call.args)).not.toContain("secret")
    }
  })
})
