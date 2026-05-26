import { describe, it, expect, afterEach, vi } from "vitest"
import handler from "@/pages/api/booking/confirm-price"
import type { NextApiRequest, NextApiResponse } from "next"

afterEach(() => {
  vi.restoreAllMocks()
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
  flightId: "FL001",
  totalPassengers: 1,
  previousTotalPrice: 200,
}

// ── Method guard ──────────────────────────────────────────────────────────────

describe("non-POST requests", () => {
  it("returns 405 for GET", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 405 for DELETE", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "DELETE"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })
})

// ── Validation ────────────────────────────────────────────────────────────────

describe("POST /api/booking/confirm-price — validation", () => {
  it("returns 400 when body is empty", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when flightId is missing", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ totalPassengers: 1, previousTotalPrice: 200 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when flightId is empty string", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, flightId: "" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when totalPassengers is 0", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, totalPassengers: 0 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when totalPassengers exceeds 9", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, totalPassengers: 10 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when totalPassengers is not an integer", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, totalPassengers: 1.5 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when previousTotalPrice is negative", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, previousTotalPrice: -10 }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 error message includes 'Invalid request'", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    const jsonCall = calls.find((c) => c.method === "json")
    expect((jsonCall?.args[0] as { error: string }).error).toBe("Invalid request")
  })
})

// ── Mock mode ─────────────────────────────────────────────────────────────────

describe("POST /api/booking/confirm-price — mock mode", () => {
  it("returns 200 for valid request", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns confirmed: true", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    const json = calls.find((c) => c.method === "json")?.args[0] as { confirmed: boolean }
    expect(json.confirmed).toBe(true)
  })

  it("returns totalPrice matching previousTotalPrice", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, previousTotalPrice: 450 }), res)
    const json = calls.find((c) => c.method === "json")?.args[0] as { totalPrice: number }
    expect(json.totalPrice).toBe(450)
  })

  it("returns 200 for max totalPassengers of 9", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, totalPassengers: 9 }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns 200 when previousTotalPrice is 0", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, previousTotalPrice: 0 }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})
