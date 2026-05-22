export const AUTH_COOKIE_NAME = "jsx_auth"

export interface SerializeCookieOptions {
  httpOnly?: boolean
  sameSite?: "Strict" | "Lax" | "None"
  secure?: boolean
  path?: string
  maxAge?: number
}

export function serializeCookie(
  name: string,
  value: string,
  options: SerializeCookieOptions = {},
): string {
  let cookie = name + "=" + value
  if (options.path) cookie += "; Path=" + options.path
  if (options.maxAge != null) cookie += "; Max-Age=" + options.maxAge
  if (options.httpOnly) cookie += "; HttpOnly"
  if (options.sameSite) cookie += "; SameSite=" + options.sameSite
  if (options.secure) cookie += "; Secure"
  return cookie
}

export function authCookie(value: string): string {
  return serializeCookie(AUTH_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearAuthCookie(): string {
  return serializeCookie(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
