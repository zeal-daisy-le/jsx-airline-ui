import type { NextApiRequest, NextApiResponse } from "next"
import { verifyJWT } from "@/lib/auth/jwt"
import { AUTH_COOKIE_NAME, clearAuthCookie } from "@/lib/auth/cookie"

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const token = req.cookies[AUTH_COOKIE_NAME]

  if (!token) {
    return res.status(200).json({ user: null })
  }

  const payload = verifyJWT(token)

  if (!payload) {
    res.setHeader("Set-Cookie", clearAuthCookie())
    return res.status(200).json({ user: null })
  }

  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
  }

  return res.status(200).json({ user })
}
