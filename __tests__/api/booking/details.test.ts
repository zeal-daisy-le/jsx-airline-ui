import { describe, it, expect, afterEach, vi } from "vitest"
import handler from "@/pages/api/booking/details"
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

const validPassenger = {
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1990-06-15",
  documentType: "passport",
  documentNumber: "AB123456",
  nationality: "Australian",
}

const validBody = {
  passengers: [validPassenger],
  contact: { email: "jane.doe@example.com", phone: "+61412345678" },
}

function mockReq(body: unknown = validBody, method = "POST"): NextApiRequest {
  return { method, body } as unknown as NextApiRequest
}

describe("POST /api/booking/details — method guard", () => {
  it("returns 405 for GET", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody, "GET"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })

  it("returns 405 for PUT", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody, "PUT"), res)
    expect(calls).toContainEqual({ method: "status", args: [405] })
  })
})

describe("POST /api/booking/details — validation", () => {
  it("returns 400 when body is an empty object", () => {
    const { res, calls } = mockRes()
    handler(mockReq({}), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when passengers array is empty", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, passengers: [] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when firstName is missing", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, firstName: "" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when dateOfBirth is in the future", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, dateOfBirth: "2099-01-01" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when documentNumber is too short", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, documentNumber: "AB1" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when documentNumber contains special characters", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, documentNumber: "AB!@#$%" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when documentType is invalid", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, documentType: "drivers_license" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when contact email is invalid", () => {
    const { res, calls } = mockRes()
    handler(mockReq({ ...validBody, contact: { email: "not-an-email", phone: "+61412345678" } }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })

  it("returns 400 when nationality is missing", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, nationality: "" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [400] })
  })
})

describe("POST /api/booking/details — success (mock mode)", () => {
  it("returns 200 with success:true for a valid single passenger", () => {
    const { res, calls } = mockRes()
    handler(mockReq(validBody), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
    const jsonCall = calls.find((c) => c.method === "json")
    expect(jsonCall?.args[0]).toMatchObject({ success: true })
  })

  it("returns 200 for multiple passengers", () => {
    const { res, calls } = mockRes()
    const body = {
      passengers: [validPassenger, { ...validPassenger, firstName: "John", documentNumber: "CD789012" }],
      contact: validBody.contact,
    }
    handler(mockReq(body), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })

  it("accepts 'id' as documentType", () => {
    const { res, calls } = mockRes()
    const p = { ...validPassenger, documentType: "id" }
    handler(mockReq({ ...validBody, passengers: [p] }), res)
    expect(calls).toContainEqual({ method: "status", args: [200] })
  })
})
