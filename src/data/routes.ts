export interface FlightRoute {
  id: string
  /** URL slug, e.g. "dallas-to-las-vegas" */
  slug: string
  /** References Destination.id */
  originId: string
  /** References Destination.id */
  destinationId: string
  flightNumber: string
  /** Typical flight duration in minutes */
  durationMinutes: number
  aircraftName: string
  /** ISO 8601 datetime used as a representative departure time in JSON-LD */
  departureDatetime: string
  /** ISO 8601 datetime used as a representative arrival time in JSON-LD */
  arrivalDatetime: string
}

export const routes: FlightRoute[] = [
  // Dallas ↔ Burbank
  {
    id: "dal-bur",
    slug: "dallas-to-burbank",
    originId: "dallas",
    destinationId: "burbank",
    flightNumber: "JSX101",
    durationMinutes: 195,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T08:00:00-05:00",
    arrivalDatetime: "2026-06-01T11:15:00-07:00",
  },
  {
    id: "bur-dal",
    slug: "burbank-to-dallas",
    originId: "burbank",
    destinationId: "dallas",
    flightNumber: "JSX102",
    durationMinutes: 195,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T13:00:00-07:00",
    arrivalDatetime: "2026-06-01T18:15:00-05:00",
  },

  // Dallas ↔ Las Vegas
  {
    id: "dal-las",
    slug: "dallas-to-las-vegas",
    originId: "dallas",
    destinationId: "las-vegas",
    flightNumber: "JSX111",
    durationMinutes: 165,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T08:00:00-05:00",
    arrivalDatetime: "2026-06-01T09:45:00-07:00",
  },
  {
    id: "las-dal",
    slug: "las-vegas-to-dallas",
    originId: "las-vegas",
    destinationId: "dallas",
    flightNumber: "JSX112",
    durationMinutes: 165,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T11:00:00-07:00",
    arrivalDatetime: "2026-06-01T14:45:00-05:00",
  },

  // Dallas ↔ Oakland
  {
    id: "dal-oak",
    slug: "dallas-to-oakland",
    originId: "dallas",
    destinationId: "oakland",
    flightNumber: "JSX121",
    durationMinutes: 210,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T07:00:00-05:00",
    arrivalDatetime: "2026-06-01T10:30:00-07:00",
  },
  {
    id: "oak-dal",
    slug: "oakland-to-dallas",
    originId: "oakland",
    destinationId: "dallas",
    flightNumber: "JSX122",
    durationMinutes: 210,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T12:00:00-07:00",
    arrivalDatetime: "2026-06-01T17:30:00-05:00",
  },

  // Dallas ↔ Phoenix
  {
    id: "dal-phx",
    slug: "dallas-to-phoenix",
    originId: "dallas",
    destinationId: "phoenix",
    flightNumber: "JSX131",
    durationMinutes: 135,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T08:00:00-05:00",
    arrivalDatetime: "2026-06-01T08:15:00-07:00",
  },
  {
    id: "phx-dal",
    slug: "phoenix-to-dallas",
    originId: "phoenix",
    destinationId: "dallas",
    flightNumber: "JSX132",
    durationMinutes: 135,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T10:00:00-07:00",
    arrivalDatetime: "2026-06-01T14:15:00-05:00",
  },

  // Dallas ↔ San Jose
  {
    id: "dal-sjc",
    slug: "dallas-to-san-jose",
    originId: "dallas",
    destinationId: "san-jose",
    flightNumber: "JSX141",
    durationMinutes: 210,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T07:00:00-05:00",
    arrivalDatetime: "2026-06-01T10:30:00-07:00",
  },
  {
    id: "sjc-dal",
    slug: "san-jose-to-dallas",
    originId: "san-jose",
    destinationId: "dallas",
    flightNumber: "JSX142",
    durationMinutes: 210,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T12:00:00-07:00",
    arrivalDatetime: "2026-06-01T17:30:00-05:00",
  },

  // Dallas ↔ Carlsbad
  {
    id: "dal-cld",
    slug: "dallas-to-carlsbad",
    originId: "dallas",
    destinationId: "carlsbad",
    flightNumber: "JSX151",
    durationMinutes: 195,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T07:30:00-05:00",
    arrivalDatetime: "2026-06-01T10:45:00-07:00",
  },
  {
    id: "cld-dal",
    slug: "carlsbad-to-dallas",
    originId: "carlsbad",
    destinationId: "dallas",
    flightNumber: "JSX152",
    durationMinutes: 195,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T13:00:00-07:00",
    arrivalDatetime: "2026-06-01T18:15:00-05:00",
  },

  // Dallas ↔ Monterey
  {
    id: "dal-mry",
    slug: "dallas-to-monterey",
    originId: "dallas",
    destinationId: "monterey",
    flightNumber: "JSX161",
    durationMinutes: 205,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T07:30:00-05:00",
    arrivalDatetime: "2026-06-01T10:55:00-07:00",
  },
  {
    id: "mry-dal",
    slug: "monterey-to-dallas",
    originId: "monterey",
    destinationId: "dallas",
    flightNumber: "JSX162",
    durationMinutes: 205,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T13:00:00-07:00",
    arrivalDatetime: "2026-06-01T18:25:00-05:00",
  },

  // Burbank ↔ Oakland
  {
    id: "bur-oak",
    slug: "burbank-to-oakland",
    originId: "burbank",
    destinationId: "oakland",
    flightNumber: "JSX201",
    durationMinutes: 65,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T08:00:00-07:00",
    arrivalDatetime: "2026-06-01T09:05:00-07:00",
  },
  {
    id: "oak-bur",
    slug: "oakland-to-burbank",
    originId: "oakland",
    destinationId: "burbank",
    flightNumber: "JSX202",
    durationMinutes: 65,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T11:00:00-07:00",
    arrivalDatetime: "2026-06-01T12:05:00-07:00",
  },

  // Burbank ↔ San Jose
  {
    id: "bur-sjc",
    slug: "burbank-to-san-jose",
    originId: "burbank",
    destinationId: "san-jose",
    flightNumber: "JSX211",
    durationMinutes: 65,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T08:00:00-07:00",
    arrivalDatetime: "2026-06-01T09:05:00-07:00",
  },
  {
    id: "sjc-bur",
    slug: "san-jose-to-burbank",
    originId: "san-jose",
    destinationId: "burbank",
    flightNumber: "JSX212",
    durationMinutes: 65,
    aircraftName: "Embraer E135",
    departureDatetime: "2026-06-01T11:00:00-07:00",
    arrivalDatetime: "2026-06-01T12:05:00-07:00",
  },
]
