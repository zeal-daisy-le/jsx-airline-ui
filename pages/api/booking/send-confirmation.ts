import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

const schema = z.object({
  bookingReference: z.string().min(1),
  contactEmail: z.string().email(),
  passengerCount: z.number().int().min(1).max(9),
  flightId: z.string(),
})

export type SendConfirmationRequestBody = z.infer<typeof schema>

export interface SendConfirmationResponse {
  success: boolean
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", issues: parsed.error.issues })
  }

  // TODO: Proxy to Navitaire to trigger confirmation email dispatch (issue #5)
  return res.status(200).json({ success: true } satisfies SendConfirmationResponse)
}
