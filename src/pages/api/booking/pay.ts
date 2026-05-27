import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

const paySchema = z.object({
  flightId: z.string().min(1),
  confirmedTotalPrice: z.number().min(0),
  totalPassengers: z.number().int().min(1).max(9),
})

export interface PayResponse {
  success: boolean
  bookingReference: string
  paymentToken: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PayResponse | { error: string; details?: unknown }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const parsed = paySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payment request",
      details: parsed.error.flatten().fieldErrors,
    })
  }

  // TODO(#20): Integrate with actual payment gateway (tokenise card, charge, finalise with Navitaire)
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  const bookingReference = `JSX-${suffix}`
  const paymentToken = `tok_mock_${Date.now()}`

  return res.status(200).json({ success: true, bookingReference, paymentToken })
}
