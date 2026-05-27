const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

/** Returns true when the HTTP method can modify server state and needs CSRF protection. */
export function requiresCsrfCheck(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase())
}

/**
 * Returns true when the given Origin matches one of the allowed origins.
 * A null/missing Origin always fails — browsers always send Origin on
 * cross-origin requests and on same-origin POST requests.
 */
export function isValidOrigin(
  origin: string | null | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false
  return allowedOrigins.some((allowed) => origin === allowed)
}

/**
 * Builds the list of origins that are permitted to call the BFF.
 * Includes the configured app URL, Vercel preview URLs, and localhost
 * in non-production environments.
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = []

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    origins.push(appUrl.replace(/\/$/, ""))
  }

  // Vercel sets VERCEL_URL to the deployment domain (no scheme)
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    origins.push(`https://${vercelUrl}`)
  }

  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000")
    origins.push("http://localhost:3001")
  }

  return origins
}
