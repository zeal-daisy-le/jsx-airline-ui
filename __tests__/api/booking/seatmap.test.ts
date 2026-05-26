import { describe, it, expect, afterEach, vi } from "vitest"
import handler from "@/pages/api/booking/seatmap"
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

// ── GET ───────────────────────────────────────────────────────────────────────

describe("GET /api/booking/seatmap — mock mode", () => {
  it("returns 200 with seatMap data", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ seatMap: expect.any(Object) })
  })

  it("seatMap has aircraft, columns, rows, and firstClassRows fields", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as {
      seatMap: { aircraft: string; columns: string[]; rows: unknown[]; firstClassRows: number[] }
    }
    expect(typeof seatMap.aircraft).toBe("string")
    expect(Array.isArray(seatMap.columns)).toBe(true)
    expect(Array.isArray(seatMap.rows)).toBe(true)
    expect(Array.isArray(seatMap.firstClassRows)).toBe(true)
  })

  it("columns contains A through F", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as { seatMap: { columns: string[] } }
    expect(seatMap.columns).toEqual(["A", "B", "C", "D", "E", "F"])
  })

  it("each row has a row number and seats array", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as {
      seatMap: { rows: { row: number; seats: unknown[] }[] }
    }
    for (const r of seatMap.rows) {
      expect(typeof r.row).toBe("number")
      expect(Array.isArray(r.seats)).toBe(true)
    }
  })

  it("each seat has seatNumber, row, column, class, price, and available fields", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as {
      seatMap: {
        rows: {
          row: number
          seats: {
            seatNumber: string
            row: number
            column: string
            class: string
            price: number
            available: boolean
          }[]
        }[]
      }
    }
    const firstSeat = seatMap.rows[0].seats[0]
    expect(typeof firstSeat.seatNumber).toBe("string")
    expect(typeof firstSeat.row).toBe("number")
    expect(typeof firstSeat.column).toBe("string")
    expect(["first", "economy"]).toContain(firstSeat.class)
    expect(typeof firstSeat.price).toBe("number")
    expect(typeof firstSeat.available).toBe("boolean")
  })

  it("first class rows have higher price than economy rows", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as {
      seatMap: {
        firstClassRows: number[]
        rows: { row: number; seats: { class: string; price: number }[] }[]
      }
    }
    const firstClassRow = seatMap.rows.find((r) => seatMap.firstClassRows.includes(r.row))
    const economyRow = seatMap.rows.find((r) => !seatMap.firstClassRows.includes(r.row))
    expect(firstClassRow!.seats[0].price).toBeGreaterThan(economyRow!.seats[0].price)
  })

  it("some seats are marked as not available (pre-occupied)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}, "GET"), res)
    const jsonCall = calls.find((c) => c.method === "json")
    const { seatMap } = jsonCall?.args[0] as {
      seatMap: { rows: { seats: { available: boolean }[] }[] }
    }
    const allSeats = seatMap.rows.flatMap((r) => r.seats)
    expect(allSeats.some((s) => !s.available)).toBe(true)
  })
})

// ── POST — method guard ───────────────────────────────────────────────────────

describe("POST /api/booking/seatmap — method guard", () => {
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

describe("POST /api/booking/seatmap — validation", () => {
  it("returns 400 when body is empty", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when assignments is missing", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ foo: "bar" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when seatNumber has invalid format", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [{ passengerIndex: 0, seatNumber: "Z1" }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengerIndex is negative", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [{ passengerIndex: -1, seatNumber: "1A" }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when assignments has more than 9 entries", () => {
    const { res, calls } = mockRes()
    const tooMany = Array.from({ length: 10 }, (_, i) => ({
      passengerIndex: i,
      seatNumber: `${i + 1}A`,
    }))
    handler(mockReq({ assignments: tooMany }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })
})

// ── POST — success ────────────────────────────────────────────────────────────

describe("POST /api/booking/seatmap — success", () => {
  it("returns 200 with success:true for empty assignments (skip)", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ success: true })
  })

  it("returns 200 for single passenger assignment", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [{ passengerIndex: 0, seatNumber: "4A" }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("returns 200 for multiple passenger assignments", () => {
    const { res, calls } = mockRes()
    handler(
      mockReq({
        assignments: [
          { passengerIndex: 0, seatNumber: "4A" },
          { passengerIndex: 1, seatNumber: "4B" },
          { passengerIndex: 2, seatNumber: "4C" },
        ],
      }),
      res
    )
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("accepts two-digit row number like 12A", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [{ passengerIndex: 0, seatNumber: "12A" }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("accepts first class seat assignment", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ assignments: [{ passengerIndex: 0, seatNumber: "1A" }] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})
