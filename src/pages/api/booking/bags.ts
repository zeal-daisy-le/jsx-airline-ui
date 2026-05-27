import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

export interface BagOption {
  checkedBags: number
  price: number
  label: string
  description: string
}

const MOCK_BAG_OPTIONS: BagOption[] = [
  { checkedBags: 0, price: 0, label: "No checked bag", description: "Carry-on only" },
  { checkedBags: 1, price: 30, label: "1 checked bag", description: "Up to 23 kg" },
  { checkedBags: 2, price: 55, label: "2 checked bags", description: "Up to 23 kg each" },
]

const selectionsSchema = z.object({
  selections: z
    .array(
      z.object({
        passengerIndex: z.number().int().min(0),
        checkedBags: z.number().int().min(0).max(2),
      })
    )
    .min(1)
    .max(9),
})

export type BagsRequestBody = z.infer<typeof selectionsSchema>

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // TODO: Proxy to Navitaire (issue #5)
    return res.status(200).json({ bagOptions: MOCK_BAG_OPTIONS })
  }

  if (req.method === "POST") {
    const parsed = selectionsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid bag selections", issues: parsed.error.issues })
    }
    // TODO: Proxy to Navitaire (issue #5)
    return res.status(200).json({ success: true, sessionUpdated: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
