import { describe, it, expect, beforeAll } from "vitest"
import { signJWT, verifyJWT } from "@/features/auth/utils/jwt"

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-vitest-at-least-32-chars"
})

const SAMPLE = {
  sub: "user-1",
  email: "alice@jsx.com",
  firstName: "Alice",
  lastName: "Smith",
}

describe("signJWT", () => {
  it("produces a three-part dot-separated token", () => {
    const token = signJWT(SAMPLE)
    expect(token.split(".")).toHaveLength(3)
  })

  it("embeds the correct claims in the payload", () => {
    const token = signJWT(SAMPLE)
    const [, body] = token.split(".")
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"))
    expect(payload.sub).toBe(SAMPLE.sub)
    expect(payload.email).toBe(SAMPLE.email)
    expect(payload.firstName).toBe(SAMPLE.firstName)
    expect(payload.lastName).toBe(SAMPLE.lastName)
  })

  it("sets exp to approximately now + expiresInSeconds", () => {
    const before = Math.floor(Date.now() / 1000)
    const token = signJWT(SAMPLE, 3600)
    const [, body] = token.split(".")
    const { exp, iat } = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"))
    expect(exp - iat).toBe(3600)
    expect(iat).toBeGreaterThanOrEqual(before)
  })
})

describe("verifyJWT", () => {
  it("returns the payload for a valid token", () => {
    const token = signJWT(SAMPLE)
    const payload = verifyJWT(token)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe(SAMPLE.sub)
    expect(payload?.email).toBe(SAMPLE.email)
    expect(payload?.firstName).toBe(SAMPLE.firstName)
    expect(payload?.lastName).toBe(SAMPLE.lastName)
  })

  it("returns null when the signature is tampered", () => {
    const token = signJWT(SAMPLE)
    const tampered = token.slice(0, -4) + "XXXX"
    expect(verifyJWT(tampered)).toBeNull()
  })

  it("returns null for a token with fewer than three parts", () => {
    expect(verifyJWT("only.two")).toBeNull()
  })

  it("returns null for a completely invalid string", () => {
    expect(verifyJWT("not-a-jwt-at-all")).toBeNull()
  })

  it("returns null for a token that has already expired", () => {
    const token = signJWT(SAMPLE, -1)
    expect(verifyJWT(token)).toBeNull()
  })

  it("returns null when the payload JSON is corrupted", () => {
    const token = signJWT(SAMPLE)
    const parts = token.split(".")
    parts[1] = Buffer.from("not-json!!!").toString("base64url")
    expect(verifyJWT(parts.join("."))).toBeNull()
  })
})
