import { createHmac } from "crypto"

export interface JWTPayload {
  sub: string
  email: string
  firstName: string
  lastName: string
  iat: number
  exp: number
}

const HEADER_B64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
  "base64url",
)

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error("JWT_SECRET environment variable is not set")
  return s
}

export function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresInSeconds = 60 * 60 * 24 * 7,
): string {
  const now = Math.floor(Date.now() / 1000)
  const full: JWTPayload = { ...payload, iat: now, exp: now + expiresInSeconds }
  const body = Buffer.from(JSON.stringify(full)).toString("base64url")
  const unsigned = `${HEADER_B64}.${body}`
  const sig = createHmac("sha256", secret()).update(unsigned).digest("base64url")
  return `${unsigned}.${sig}`
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const unsigned = `${header}.${body}`
    const expected = createHmac("sha256", secret()).update(unsigned).digest("base64url")
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as JWTPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
