import { describe, it, expect } from "vitest"
import {
  BOOKING_STEPS,
  PROGRESS_STEPS,
  canAccessStep,
  getEarliestIncompleteStep,
  getStepIndex,
  STEP_META,
} from "@/lib/booking/steps"
import type { BookingStep } from "@/lib/booking/steps"

type Validity = Record<BookingStep, boolean>

const allFalse: Validity = Object.fromEntries(
  BOOKING_STEPS.map((s) => [s, false])
) as Validity

const allTrue: Validity = Object.fromEntries(
  BOOKING_STEPS.map((s) => [s, true])
) as Validity

function validThrough(step: BookingStep): Validity {
  const idx = BOOKING_STEPS.indexOf(step)
  return Object.fromEntries(
    BOOKING_STEPS.map((s, i) => [s, i <= idx])
  ) as Validity
}

describe("BOOKING_STEPS", () => {
  it("has 8 steps in the correct order", () => {
    expect(BOOKING_STEPS).toEqual([
      "flights",
      "passengers",
      "details",
      "bags",
      "seats",
      "review",
      "payment",
      "confirmation",
    ])
  })
})

describe("PROGRESS_STEPS", () => {
  it("excludes confirmation from the progress indicator", () => {
    expect(PROGRESS_STEPS).not.toContain("confirmation")
    expect(PROGRESS_STEPS).toHaveLength(7)
  })
})

describe("STEP_META", () => {
  it("maps every step to a label and path", () => {
    for (const step of BOOKING_STEPS) {
      expect(STEP_META[step]).toHaveProperty("label")
      expect(STEP_META[step]).toHaveProperty("path")
      expect(STEP_META[step].path).toMatch(/^\/booking\//)
    }
  })
})

describe("getStepIndex", () => {
  it("returns 0 for flights", () => expect(getStepIndex("flights")).toBe(0))
  it("returns 7 for confirmation", () =>
    expect(getStepIndex("confirmation")).toBe(7))
})

describe("canAccessStep", () => {
  it("always allows access to the first step (flights)", () => {
    expect(canAccessStep("flights", allFalse)).toBe(true)
  })

  it("allows access to passengers once flights is valid", () => {
    const validity = { ...allFalse, flights: true }
    expect(canAccessStep("passengers", validity)).toBe(true)
  })

  it("denies access to passengers when flights is invalid", () => {
    expect(canAccessStep("passengers", allFalse)).toBe(false)
  })

  it("allows confirmation only when every preceding step is valid", () => {
    expect(canAccessStep("confirmation", allTrue)).toBe(true)
    const missingPayment = { ...allTrue, payment: false }
    expect(canAccessStep("confirmation", missingPayment)).toBe(false)
  })

  it("denies a mid-flow step when an earlier step is invalid", () => {
    const validity = { ...allFalse, flights: true, passengers: true }
    // details is accessible because flights + passengers are valid
    expect(canAccessStep("details", validity)).toBe(true)
    // bags requires flights + passengers + details — details is false here
    expect(canAccessStep("bags", { ...allFalse, flights: true })).toBe(false)
  })
})

describe("getEarliestIncompleteStep", () => {
  it("returns 'flights' when nothing is valid", () => {
    expect(getEarliestIncompleteStep(allFalse)).toBe("flights")
  })

  it("returns 'passengers' when only flights is valid", () => {
    expect(getEarliestIncompleteStep({ ...allFalse, flights: true })).toBe(
      "passengers"
    )
  })

  it("returns 'confirmation' when all steps are valid", () => {
    expect(getEarliestIncompleteStep(allTrue)).toBe("confirmation")
  })

  it("returns the correct step when a mid-flow step is the first invalid one", () => {
    const validity = validThrough("passengers")
    expect(getEarliestIncompleteStep(validity)).toBe("details")
  })
})
