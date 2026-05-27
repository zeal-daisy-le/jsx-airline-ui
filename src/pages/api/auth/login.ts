import type { NextApiRequest, NextApiResponse } from "next"
import { signJWT } from "@/features/auth/utils/jwt"
import { authCookie } from "@/features/auth/utils/cookie"

interface NavitaireUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  const navitaireUrl = process.env.NAVITAIRE_API_URL
  if (!navitaireUrl) {
    return res.status(503).json({ error: "Auth service unavailable" })
  }

  try {
    const navRes = await fetch(navitaireUrl + "/api/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: email,
        password,
        domain: "WWW",
      }),
    })

    if (!navRes.ok) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const user = (await navRes.json()) as NavitaireUser

    const token = signJWT({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    res.setHeader("Set-Cookie", authCookie(token))
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(502).json({ error: "Authentication service unavailable" })
  }
}
