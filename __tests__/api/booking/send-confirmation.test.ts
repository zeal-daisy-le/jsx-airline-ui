import { describe, it, expect, afterEach, vi } from "vitest"
import handler from "@/pages/api/booking/send-confirmation"
import type { NextApiRequest, NextApiResponse } from "next"

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.NAVITAIRE_API_URL
})

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
  return { res: res as unknown as NextApiResponse, calls }
}

function mockReq(body: unknown = {}, method = "POST"): NextApiRequest {
  return { method, body } as unknown as NextApiRequest
}

const validBody = {
  bookingReference: "JSX-12345",
  contactEmail: "jane@example.com",
  passengerCount: 1,
  flightId: "FL001",
}

// ── Method guard ──────────────────────────────────────────────────────────────

describe("POST /api/booking/send-confirmation — method guard", () => {
  it("returns 405 for GET", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 405 for PUT", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "PUT"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 405 for DELETE", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "DELETE"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })
})

// ── Validation ────────────────────────────────────────────────────────────────

describe("POST /api/booking/send-confirmation — validation", () => {
  it("returns 400 for empty body", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when bookingReference is missing", () => {
    const { res, calls } = mockRes()
    const { bookingReference: _, ...body } = validBody
    handler(mockReq(body), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when bookingReference is empty string", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, bookingReference: "" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when contactEmail is missing", () => {
    const { res, calls } = mockRes()
    const { contactEmail: _, ...body } = validBody
    handler(mockReq(body), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when contactEmail is not a valid email", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, contactEmail: "not-an-email" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerCount is missing", () => {
    const { res, calls } = mockRes()
    const { passengerCount: _, ...body } = validBody
    handler(mockReq(body), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerCount is 0", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, passengerCount: 0 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerCount is 10 (max is 9)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, passengerCount: 10 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerCount is non-integer", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, passengerCount: 1.5 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("error response includes 'issues' field from Zod", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ error: "Invalid request", issues: expect.any(Array) })
  })
})

// ── Success ───────────────────────────────────────────────────────────────────

describe("POST /api/booking/send-confirmation — success", () => {
  it("returns 200 for a valid request", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns success: true in the response body", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toEqual({ success: true })
  })

  it("accepts passengerCount of 9 (max allowed)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, passengerCount: 9 }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("accepts an empty flightId (stub allows unknown flight)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, flightId: "" }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns 200 even when NAVITAIRE_API_URL is set (stub mode)", () => {
    process.env.NAVITAIRE_API_URL = "https://navitaire.example.com"
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})
