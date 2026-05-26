import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

export type SeatClass = "first" | "economy"

export interface Seat {
  seatNumber: string
  row: number
  column: string
  class: SeatClass
  price: number
  available: boolean
}

export interface SeatRow {
  row: number
  seats: Seat[]
}

export interface SeatMapData {
  aircraft: string
  columns: string[]
  rows: SeatRow[]
  firstClassRows: number[]
}

// Pre-occupied seats (other passengers' bookings)
const OCCUPIED_SEATS = new Set([
  "2B", "3D", "5A", "7C", "8F", "10B", "11D", "12A", "13E", "14C", "15B",
])

function buildSeatMap(): SeatMapData {
  const columns = ["A", "B", "C", "D", "E", "F"]
  const firstClassRows = [1, 2, 3]
  const rows: SeatRow[] = []

  for (let row = 1; row <= 15; row++) {
    const seatClass: SeatClass = firstClassRows.includes(row) ? "first" : "economy"
    const price = seatClass === "first" ? 45 : 0
    const seats: Seat[] = columns.map((col) => {
      const seatNumber = `${row}${col}`
      return {
        seatNumber,
        row,
        column: col,
        class: seatClass,
        price,
        available: !OCCUPIED_SEATS.has(seatNumber),
      }
    })
    rows.push({ row, seats })
  }

  return { aircraft: "737-800", columns, rows, firstClassRows }
}

const MOCK_SEAT_MAP = buildSeatMap()

const assignmentsSchema = z.object({
  assignments: z
    .array(
      z.object({
        passengerIndex: z.number().int().min(0),
        seatNumber: z.string().regex(/^\d{1,2}[A-F]$/),
      })
    )
    .max(9),
})

export type SeatMapRequestBody = z.infer<typeof assignmentsSchema>

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // TODO: Proxy to Navitaire (issue #5)
    return res.status(200).json({ seatMap: MOCK_SEAT_MAP })
  }

  if (req.method === "POST") {
    const parsed = assignmentsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid seat assignments", issues: parsed.error.issues })
    }
    // TODO: Proxy to Navitaire (issue #5)
    return res.status(200).json({ success: true, sessionUpdated: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
