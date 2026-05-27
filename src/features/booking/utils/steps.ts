export const BOOKING_STEPS = [
  "flights",
  "passengers",
  "details",
  "bags",
  "seats",
  "review",
  "payment",
  "confirmation",
] as const

export type BookingStep = (typeof BOOKING_STEPS)[number]

export interface StepMeta {
  label: string
  path: string
}

export const STEP_META: Record<BookingStep, StepMeta> = {
  flights: { label: "Flights", path: "/booking/flights" },
  passengers: { label: "Passengers", path: "/booking/passengers" },
  details: { label: "Details", path: "/booking/details" },
  bags: { label: "Bags", path: "/booking/bags" },
  seats: { label: "Seats", path: "/booking/seats" },
  review: { label: "Review", path: "/booking/review" },
  payment: { label: "Payment", path: "/booking/payment" },
  confirmation: { label: "Confirmation", path: "/booking/confirmation" },
}

// Steps shown in the progress indicator (confirmation is the end state, not a flow step)
export const PROGRESS_STEPS: BookingStep[] = [
  "flights",
  "passengers",
  "details",
  "bags",
  "seats",
  "review",
  "payment",
]

export function getStepIndex(step: BookingStep): number {
  return BOOKING_STEPS.indexOf(step)
}

/**
 * A step is accessible if every step before it has been marked valid.
 * The first step (flights) is always accessible.
 */
export function canAccessStep(
  step: BookingStep,
  stepValidity: Record<BookingStep, boolean>
): boolean {
  const index = getStepIndex(step)
  if (index === 0) return true
  return BOOKING_STEPS.slice(0, index).every((s) => stepValidity[s])
}

/**
 * Returns the first step that has not been marked valid. If all steps are
 * complete, returns "confirmation".
 */
export function getEarliestIncompleteStep(
  stepValidity: Record<BookingStep, boolean>
): BookingStep {
  for (const step of BOOKING_STEPS) {
    if (!stepValidity[step]) return step
  }
  return "confirmation"
}
