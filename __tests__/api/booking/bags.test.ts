import { describe, it, expect, afterEach, vi } from "vitest"
import handler from "@/pages/api/booking/bags"
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

const validSelections = {
  selections: [{ passengerIndex: 0, checkedBags: 1 }],
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe("GET /api/booking/bags — mock mode", () => {
  it("returns 200 with bagOptions array", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ bagOptions: expect.any(Array) })
  })

  it("returns at least one bag option with checkedBags === 0", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { bagOptions } = jsonCall?.args[0] as { bagOptions: { checkedBags: number }[] }
    expect(bagOptions.some((o) => o.checkedBags === 0)).toBe(true)
  })

  it("each bag option has required fields: checkedBags, price, label, description", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { bagOptions } = jsonCall?.args[0] as {
      bagOptions: { checkedBags: number; price: number; label: string; description: string }[]
    }
    for (const opt of bagOptions) {
      expect(typeof opt.checkedBags).toBe("number")
      expect(typeof opt.price).toBe("number")
      expect(typeof opt.label).toBe("string")
      expect(typeof opt.description).toBe("string")
    }
  })

  it("free option has price === 0", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { bagOptions } = jsonCall?.args[0] as { bagOptions: { checkedBags: number; price: number }[] }
    const freeBag = bagOptions.find((o) => o.checkedBags === 0)
    expect(freeBag?.price).toBe(0)
  })
})

// ── POST — method guard ───────────────────────────────────────────────────────

describe("POST /api/booking/bags — method guard", () => {
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

// ── POST — validation ─────────────────────────────────────────────────────────

describe("POST /api/booking/bags — validation", () => {
  it("returns 400 when body is empty", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when selections array is empty", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when checkedBags exceeds max (2)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: 0, checkedBags: 3 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when checkedBags is negative", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: 0, checkedBags: -1 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerIndex is negative", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: -1, checkedBags: 1 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when selections has more than 9 entries", () => {
    const { res, calls } = mockRes()
    const tooMany = Array.from({ length: 10 }, (_, i) => ({ passengerIndex: i, checkedBags: 0 }))
    handler(mockReq({ selections: tooMany }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when checkedBags is not an integer", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: 0, checkedBags: 1.5 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })
})

// ── POST — success ────────────────────────────────────────────────────────────

describe("POST /api/booking/bags — success (mock mode)", () => {
  it("returns 200 with success:true for one passenger with 0 bags", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: 0, checkedBags: 0 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ success: true })
  })

  it("returns 200 for a single passenger selecting 1 bag", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validSelections), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns 200 for multiple passengers with different bag counts", () => {
    const { res, calls } = mockRes()
    handler(
      mockReq({
        selections: [
          { passengerIndex: 0, checkedBags: 2 },
          { passengerIndex: 1, checkedBags: 0 },
          { passengerIndex: 2, checkedBags: 1 },
        ],
      }),
      res
    )
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("accepts checkedBags === 2 (max allowed)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ selections: [{ passengerIndex: 0, checkedBags: 2 }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})
