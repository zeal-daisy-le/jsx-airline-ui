import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import handler from "@/pages/api/search"
import type { NextApiRequest, NextApiResponse } from "next"

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.NAVITAIRE_API_URL
})

function mockReq(query: Record<string, string> = {}): NextApiRequest {
  return {
    method: "GET",
    query: {
      origin: "DAL",
      destination: "LAS",
      date: "2099-06-01",
      adults: "1",
      ...query,
    },
  } as unknown as NextApiRequest
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
  return { res: res as unknown as NextApiResponse, calls }
}

describe("GET /api/search — input validation", () => {
  it("returns 405 for non-GET requests", async () => {
    const { res, calls } = mockRes()
    await handler({ ...mockReq(), method: "POST" } as NextApiRequest, res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 400 when origin is missing", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ origin: "" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when destination is missing", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ destination: "" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 for an invalid date format", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ date: "June 1st" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when date is in the past", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ date: "2000-01-01" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when origin equals destination", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ origin: "DAL", destination: "DAL" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when adults is 0", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ adults: "0" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when infants exceed adults", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ adults: "1", infants: "2" }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })
})

describe("GET /api/search — mock mode (no NAVITAIRE_API_URL)", () => {
  it("returns 200 with a flights array", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall).toBeDefined()
    const body = jsonCall!.args[0] as { flights: unknown[] }
    expect(Array.isArray(body.flights)).toBe(true)
    expect(body.flights.length).toBeGreaterThan(0)
  })

  it("returns flights with required fields", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    const body = calls.find((c) => c.method === "json")!.args[0] as {
      flights: Array<Record<string, unknown>>
    }
    const flight = body.flights[0]
    expect(flight).toHaveProperty("flightId")
    expect(flight).toHaveProperty("flightNumber")
    expect(flight).toHaveProperty("origin", "DAL")
    expect(flight).toHaveProperty("destination", "LAS")
    expect(flight).toHaveProperty("departureTime")
    expect(flight).toHaveProperty("arrivalTime")
    expect(flight).toHaveProperty("durationMinutes")
    expect(flight).toHaveProperty("pricePerPassenger")
    expect(flight).toHaveProperty("seatsAvailable")
  })

  it("returns flights with departure times on the requested date", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ date: "2099-07-04" }), res)
    const body = calls.find((c) => c.method === "json")!.args[0] as {
      flights: Array<{ departureTime: string }>
    }
    for (const flight of body.flights) {
      expect(flight.departureTime).toContain("2099-07-04")
    }
  })

  it("accepts valid children and infants counts", async () => {
    const { res, calls } = mockRes()
    await handler(mockReq({ adults: "2", children: "1", infants: "1" }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})

describe("GET /api/search — Navitaire proxy mode", () => {
  beforeEach(() => {
    process.env.NAVITAIRE_API_URL = "https://navitaire.test"
  })

  it("proxies to Navitaire and returns mapped flights", async () => {
    const mockFlight = {
      flightId: "nav-1",
      flightNumber: "JSX999",
      origin: "DAL",
      destination: "LAS",
      departureTime: "2099-06-01T06:00:00Z",
      arrivalTime: "2099-06-01T08:45:00Z",
      durationMinutes: 165,
      pricePerPassenger: 299,
      seatsAvailable: 20,
      aircraft: "Embraer E135",
    }

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ journeys: [mockFlight] }),
    } as Response)

    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const body = calls.find((c) => c.method === "json")!.args[0] as {
      flights: unknown[]
    }
    expect(body.flights).toHaveLength(1)
  })

  it("returns 502 when Navitaire returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [502] })
  })

  it("returns 502 when Navitaire fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"))

    const { res, calls } = mockRes()
    await handler(mockReq(), res)
    expect(calls).toContainEqual({ method: "status", args: [502] })
  })
})
