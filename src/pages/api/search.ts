import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"

const querySchema = z.object({
  origin: z.string().length(3, "Origin must be a 3-letter airport code"),
  destination: z.string().length(3, "Destination must be a 3-letter airport code"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  adults: z.coerce.number().int().min(1).max(9),
  children: z.coerce.number().int().min(0).max(8).default(0),
  infants: z.coerce.number().int().min(0).max(8).default(0),
})

export interface FlightResult {
  flightId: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  pricePerPassenger: number
  seatsAvailable: number
  aircraft: string
}

export interface SearchResponse {
  flights: FlightResult[]
}

// Approximate durations in minutes for JSX routes
const ROUTE_DURATIONS: Record<string, number> = {
  "DAL-LAS": 165,
  "DAL-BUR": 175,
  "DAL-OAK": 195,
  "DAL-PHX": 135,
  "DAL-SJC": 200,
  "DAL-CLD": 180,
  "DAL-MRY": 210,
  "LAS-DAL": 165,
  "LAS-BUR": 60,
  "LAS-OAK": 75,
  "LAS-PHX": 60,
  "BUR-DAL": 175,
  "BUR-LAS": 60,
  "BUR-OAK": 65,
  "OAK-DAL": 195,
  "OAK-LAS": 75,
  "PHX-DAL": 135,
  "PHX-LAS": 60,
}

function getRouteDuration(origin: string, destination: string): number {
  return ROUTE_DURATIONS[`${origin}-${destination}`] ?? 120
}

function addMinutes(isoDate: string, hours: number, minutes: number, durationMins: number): [string, string] {
  // Use UTC so the ISO string always has the requested date regardless of server timezone
  const dep = new Date(`${isoDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`)
  const arr = new Date(dep.getTime() + durationMins * 60 * 1000)
  return [dep.toISOString(), arr.toISOString()]
}

function generateMockFlights(
  origin: string,
  destination: string,
  date: string
): FlightResult[] {
  const duration = getRouteDuration(origin, destination)
  const basePrice = Math.round((duration * 1.4 + 50) / 10) * 10

  const departureTimes: [number, number][] = [
    [6, 0],
    [10, 30],
    [14, 0],
    [17, 30],
    [20, 0],
  ]

  return departureTimes.map(([h, m], i) => {
    const [departureTime, arrivalTime] = addMinutes(date, h, m, duration)
    const flightNum = 100 + (origin.charCodeAt(0) % 10) * 10 + i + 1
    const seats = 18 + ((i * 7 + origin.charCodeAt(1)) % 12)
    const priceVariant = i === 0 ? 0.9 : i === departureTimes.length - 1 ? 1.1 : 1

    return {
      flightId: `${origin}-${destination}-${date}-${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`,
      flightNumber: `JSX${flightNum}`,
      origin,
      destination,
      departureTime,
      arrivalTime,
      durationMinutes: duration,
      pricePerPassenger: Math.round(basePrice * priceVariant),
      seatsAvailable: seats,
      aircraft: "Embraer E135",
    }
  })
}

async function fetchNavitaireFlights(
  navitaireUrl: string,
  params: z.infer<typeof querySchema>
): Promise<FlightResult[]> {
  // TODO(#5): Update endpoint path and request shape once Navitaire API surface is discovered
  const res = await fetch(`${navitaireUrl}/api/v1/availability/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NAVITAIRE_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      beginDate: params.date,
      paxCount: { adult: params.adults, child: params.children, infant: params.infants },
    }),
  })

  if (!res.ok) {
    throw new Error(`Navitaire search failed: ${res.status}`)
  }

  // TODO(#5): Map Navitaire response shape to FlightResult[]
  const data = (await res.json()) as { journeys?: unknown[] }
  return (data.journeys ?? []) as FlightResult[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string; details?: unknown }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid search parameters",
      details: parsed.error.flatten().fieldErrors,
    })
  }

  const { origin, destination, date, adults, children, infants } = parsed.data

  if (origin === destination) {
    return res.status(400).json({ error: "Origin and destination must be different" })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(date) < today) {
    return res.status(400).json({ error: "Date must be today or in the future" })
  }

  if (infants > adults) {
    return res.status(400).json({ error: "Infants cannot exceed adults" })
  }

  const navitaireUrl = process.env.NAVITAIRE_API_URL

  try {
    let flights: FlightResult[]

    if (navitaireUrl) {
      flights = await fetchNavitaireFlights(navitaireUrl, { origin, destination, date, adults, children, infants })
    } else {
      // Navitaire not yet configured — return mock data so the UI is exercisable
      flights = generateMockFlights(origin, destination, date)
    }

    return res.status(200).json({ flights })
  } catch {
    return res.status(502).json({ error: "Flight search unavailable. Please try again." })
  }
}
