import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

const schema = z.object({
  flightId: z.string().min(1),
  totalPassengers: z.number().int().min(1).max(9),
  previousTotalPrice: z.number().min(0),
})

export type ConfirmPriceRequestBody = z.infer<typeof schema>

export interface ConfirmPriceResponse {
  confirmed: boolean
  totalPrice: number
  previousPrice?: number
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", issues: parsed.error.issues })
  }

  const { previousTotalPrice } = parsed.data

  // TODO: Proxy to Navitaire (issue #5)
  return res.status(200).json({
    confirmed: true,
    totalPrice: previousTotalPrice,
  } satisfies ConfirmPriceResponse)
}
