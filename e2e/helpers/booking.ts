import { Page } from "@playwright/test"

// ── Shared mock data ──────────────────────────────────────────────────────────

export const MOCK_FLIGHT = {
  flightId: "DAL-LAS-2026-06-15-0600",
  flightNumber: "JSX101",
  origin: "DAL",
  destination: "LAS",
  departureTime: "2026-06-15T06:00:00Z",
  arrivalTime: "2026-06-15T08:45:00Z",
  durationMinutes: 165,
  pricePerPassenger: 150,
  seatsAvailable: 20,
  aircraft: "Embraer E135",
  price: 150,
}

export const MOCK_TRAVELER = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  documentType: "passport" as const,
  documentNumber: "AB123456",
  nationality: "US",
}

export const MOCK_CONTACT = {
  email: "john@example.com",
  phone: "5551234567",
}

// ── Future date helper ────────────────────────────────────────────────────────

export function futureDateIso(daysAhead = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

// ── Booking step types ────────────────────────────────────────────────────────

type BookingStep =
  | "flights"
  | "passengers"
  | "details"
  | "bags"
  | "seats"
  | "review"
  | "payment"
  | "confirmation"

const STEPS: BookingStep[] = [
  "flights",
  "passengers",
  "details",
  "bags",
  "seats",
  "review",
  "payment",
  "confirmation",
]

// ── Session storage seeder ────────────────────────────────────────────────────

/**
 * Seeds the Zustand sessionStorage (`jsx-booking`) with booking state completed
 * up to (but not including) `targetStep`. Page is briefly navigated to `/` first
 * so the seed runs in a valid browser context.
 */
export async function seedBookingStateUpTo(
  page: Page,
  targetStep: BookingStep
): Promise<void> {
  const targetIndex = STEPS.indexOf(targetStep)

  const stepValidity: Record<BookingStep, boolean> = {
    flights: false,
    passengers: false,
    details: false,
    bags: false,
    seats: false,
    review: false,
    payment: false,
    confirmation: false,
  }

  STEPS.slice(0, targetIndex).forEach((s) => {
    stepValidity[s] = true
  })

  const state = {
    currentStep: targetStep,
    stepValidity,
    selectedFlight: targetIndex > 0 ? MOCK_FLIGHT : null,
    passengers: { adults: 1, children: 0, infants: 0 },
    travelerInfo: targetIndex > 2 ? [MOCK_TRAVELER] : [],
    bagSelections: targetIndex > 3 ? [{ passengerIndex: 0, checkedBags: 1 }] : [],
    seatAssignments: targetIndex > 4 ? [] : [],
    paymentToken: null as string | null,
    bookingReference: null as string | null,
    confirmedTotalPrice: targetIndex > 5 ? 186 : (null as number | null),
  }

  await page.goto("/")
  await page.evaluate((serialized) => {
    sessionStorage.setItem("jsx-booking", serialized)
  }, JSON.stringify({ state, version: 0 }))
}
