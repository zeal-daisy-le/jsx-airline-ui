import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

const passengerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((v) => new Date(v) < new Date(), "Date of birth must be in the past"),
  documentType: z.enum(["passport", "id"]),
  documentNumber: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[A-Z0-9]+$/i, "Alphanumeric only"),
  nationality: z.string().min(1).max(100),
})

const bodySchema = z.object({
  passengers: z.array(passengerSchema).min(1).max(9),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(6).max(30),
  }),
})

export type DetailsRequestBody = z.infer<typeof bodySchema>

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid passenger details", issues: parsed.error.issues })
  }

  // NOTE: Document numbers are never written to server logs (security requirement).
  // In production this forwards to the Navitaire booking session update endpoint.
  // TODO: Proxy to Navitaire (issue #5)
  return res.status(200).json({ success: true, sessionUpdated: true })
}
