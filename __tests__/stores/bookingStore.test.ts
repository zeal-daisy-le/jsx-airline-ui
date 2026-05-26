import { describe, it, expect, beforeEach } from "vitest"
import { act } from "@testing-library/react"
import { useBookingStore } from "@/stores/bookingStore"
import type { SelectedFlight, PassengerCount, TravelerInfo, BagSelection, SeatAssignment } from "@/stores/bookingStore"
import { BOOKING_STEPS } from "@/lib/booking/steps"

const STORAGE_KEY = "jsx-booking"

const MOCK_FLIGHT: SelectedFlight = {
  flightId: "dal-las",
  flightNumber: "JSX111",
  origin: "DAL",
  destination: "LAS",
  departureTime: "2026-06-01T08:00:00-05:00",
  arrivalTime: "2026-06-01T09:45:00-07:00",
  pricePerPassenger: 299,
}
const MOCK_PASSENGERS: PassengerCount = { adults: 2, children: 1, infants: 0 }
const MOCK_TRAVELER: TravelerInfo = {
  firstName: "Alice",
  lastName: "Smith",
  dateOfBirth: "1990-01-15",
  documentType: "passport",
  documentNumber: "A12345678",
  nationality: "US",
}
const MOCK_BAGS: BagSelection[] = [{ passengerIndex: 0, checkedBags: 1 }]
const MOCK_SEATS: SeatAssignment[] = [{ passengerIndex: 0, seatNumber: "3A" }]

function allValid() {
  return Object.fromEntries(BOOKING_STEPS.map((s) => [s, true])) as Record<typeof BOOKING_STEPS[number], boolean>
}

beforeEach(() => {
  sessionStorage.clear()
  act(() => {
    useBookingStore.setState({
      currentStep: "flights",
      stepValidity: Object.fromEntries(BOOKING_STEPS.map((s) => [s, false])) as ReturnType<typeof useBookingStore.getState>["stepValidity"],
      hasHydrated: true,
      selectedFlight: null,
      passengers: { adults: 1, children: 0, infants: 0 },
      travelerInfo: [],
      bagSelections: [],
      seatAssignments: [],
      paymentToken: null,
      bookingReference: null,
    })
  })
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts on the flights step with 1 adult passenger", () => {
    const { currentStep, passengers } = useBookingStore.getState()
    expect(currentStep).toBe("flights")
    expect(passengers).toEqual({ adults: 1, children: 0, infants: 0 })
  })

  it("starts with all steps invalid", () => {
    const { stepValidity } = useBookingStore.getState()
    BOOKING_STEPS.forEach((step) => expect(stepValidity[step]).toBe(false))
  })

  it("starts with null flight, empty collections, and null payment token", () => {
    const s = useBookingStore.getState()
    expect(s.selectedFlight).toBeNull()
    expect(s.travelerInfo).toEqual([])
    expect(s.bagSelections).toEqual([])
    expect(s.seatAssignments).toEqual([])
    expect(s.paymentToken).toBeNull()
    expect(s.bookingReference).toBeNull()
  })
})

// ─── Step setters ─────────────────────────────────────────────────────────────

describe("setCurrentStep", () => {
  it("updates the active step", () => {
    act(() => { useBookingStore.getState().setCurrentStep("bags") })
    expect(useBookingStore.getState().currentStep).toBe("bags")
  })
})

describe("markStepValid / setStepValid", () => {
  it("markStepValid marks the step true", () => {
    act(() => { useBookingStore.getState().markStepValid("flights") })
    expect(useBookingStore.getState().stepValidity.flights).toBe(true)
  })

  it("markStepValid does not affect other steps", () => {
    act(() => { useBookingStore.getState().markStepValid("flights") })
    BOOKING_STEPS.filter((s) => s !== "flights").forEach((s) => {
      expect(useBookingStore.getState().stepValidity[s]).toBe(false)
    })
  })

  it("setStepValid can set a step to false", () => {
    act(() => { useBookingStore.getState().markStepValid("review") })
    act(() => { useBookingStore.getState().setStepValid("review", false) })
    expect(useBookingStore.getState().stepValidity.review).toBe(false)
  })
})

// ─── invalidateStepsFrom ──────────────────────────────────────────────────────

describe("invalidateStepsFrom", () => {
  it("clears the given step and all after it", () => {
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    act(() => { useBookingStore.getState().invalidateStepsFrom("bags") })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.flights).toBe(true)
    expect(stepValidity.passengers).toBe(true)
    expect(stepValidity.details).toBe(true)
    expect(stepValidity.bags).toBe(false)
    expect(stepValidity.seats).toBe(false)
    expect(stepValidity.review).toBe(false)
    expect(stepValidity.payment).toBe(false)
    expect(stepValidity.confirmation).toBe(false)
  })

  it("invalidating from flights clears everything", () => {
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    act(() => { useBookingStore.getState().invalidateStepsFrom("flights") })
    BOOKING_STEPS.forEach((s) => expect(useBookingStore.getState().stepValidity[s]).toBe(false))
  })
})

// ─── canAccessStep ────────────────────────────────────────────────────────────

describe("canAccessStep", () => {
  it("flights is always accessible", () => {
    expect(useBookingStore.getState().canAccessStep("flights")).toBe(true)
  })

  it("passengers is not accessible when flights is incomplete", () => {
    expect(useBookingStore.getState().canAccessStep("passengers")).toBe(false)
  })

  it("passengers is accessible after flights is marked valid", () => {
    act(() => { useBookingStore.getState().markStepValid("flights") })
    expect(useBookingStore.getState().canAccessStep("passengers")).toBe(true)
  })

  it("seats requires flights, passengers, details, and bags to be valid", () => {
    const prereqs: Array<typeof BOOKING_STEPS[number]> = ["flights", "passengers", "details"]
    prereqs.forEach((step) => {
      expect(useBookingStore.getState().canAccessStep("seats")).toBe(false)
      act(() => { useBookingStore.getState().markStepValid(step) })
    })
    expect(useBookingStore.getState().canAccessStep("seats")).toBe(false)
    act(() => { useBookingStore.getState().markStepValid("bags") })
    expect(useBookingStore.getState().canAccessStep("seats")).toBe(true)
  })
})

// ─── getEarliestIncompleteStep ────────────────────────────────────────────────

describe("getEarliestIncompleteStep", () => {
  it("returns flights when nothing is complete", () => {
    expect(useBookingStore.getState().getEarliestIncompleteStep()).toBe("flights")
  })

  it("returns passengers once flights is complete", () => {
    act(() => { useBookingStore.getState().markStepValid("flights") })
    expect(useBookingStore.getState().getEarliestIncompleteStep()).toBe("passengers")
  })

  it("returns confirmation once all steps are complete", () => {
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    expect(useBookingStore.getState().getEarliestIncompleteStep()).toBe("confirmation")
  })
})

// ─── Data setters + downstream invalidation ───────────────────────────────────

describe("setSelectedFlight", () => {
  it("stores the flight and marks flights valid", () => {
    act(() => { useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT) })
    const { selectedFlight, stepValidity } = useBookingStore.getState()
    expect(selectedFlight).toEqual(MOCK_FLIGHT)
    expect(stepValidity.flights).toBe(true)
  })

  it("invalidates all steps downstream of flights", () => {
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    act(() => { useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT) })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.flights).toBe(true)
    expect(stepValidity.passengers).toBe(false)
    expect(stepValidity.details).toBe(false)
  })
})

describe("setPassengers", () => {
  it("stores the count and marks passengers valid", () => {
    act(() => { useBookingStore.getState().setPassengers(MOCK_PASSENGERS) })
    const { passengers, stepValidity } = useBookingStore.getState()
    expect(passengers).toEqual(MOCK_PASSENGERS)
    expect(stepValidity.passengers).toBe(true)
  })

  it("clears travelerInfo, bagSelections, seatAssignments", () => {
    act(() => {
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
    })
    act(() => { useBookingStore.getState().setPassengers({ adults: 3, children: 0, infants: 0 }) })
    const { travelerInfo, bagSelections, seatAssignments } = useBookingStore.getState()
    expect(travelerInfo).toEqual([])
    expect(bagSelections).toEqual([])
    expect(seatAssignments).toEqual([])
  })

  it("invalidates details through confirmation but preserves flights validity", () => {
    act(() => { useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT) })
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    act(() => { useBookingStore.getState().setPassengers(MOCK_PASSENGERS) })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.passengers).toBe(true)
    expect(stepValidity.details).toBe(false)
    expect(stepValidity.bags).toBe(false)
  })
})

describe("setTravelerInfo", () => {
  it("stores info and marks details valid", () => {
    act(() => { useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER]) })
    expect(useBookingStore.getState().travelerInfo).toEqual([MOCK_TRAVELER])
    expect(useBookingStore.getState().stepValidity.details).toBe(true)
  })

  it("invalidates bags through confirmation", () => {
    act(() => { useBookingStore.setState({ stepValidity: allValid() }) })
    act(() => { useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER]) })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.details).toBe(true)
    expect(stepValidity.bags).toBe(false)
  })
})

describe("setBagSelections", () => {
  it("stores bags and marks bags valid", () => {
    act(() => { useBookingStore.getState().setBagSelections(MOCK_BAGS) })
    expect(useBookingStore.getState().bagSelections).toEqual(MOCK_BAGS)
    expect(useBookingStore.getState().stepValidity.bags).toBe(true)
  })
})

describe("setSeatAssignments", () => {
  it("stores seats and marks seats valid", () => {
    act(() => { useBookingStore.getState().setSeatAssignments(MOCK_SEATS) })
    expect(useBookingStore.getState().seatAssignments).toEqual(MOCK_SEATS)
    expect(useBookingStore.getState().stepValidity.seats).toBe(true)
  })
})

describe("setPaymentToken", () => {
  it("stores the token and marks payment valid", () => {
    act(() => { useBookingStore.getState().setPaymentToken("tok_abc123") })
    expect(useBookingStore.getState().paymentToken).toBe("tok_abc123")
    expect(useBookingStore.getState().stepValidity.payment).toBe(true)
  })
})

// ─── resetBooking ─────────────────────────────────────────────────────────────

describe("resetBooking", () => {
  it("clears all data and returns to flights step", () => {
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
      useBookingStore.getState().setPaymentToken("tok_abc")
      useBookingStore.getState().setCurrentStep("review")
    })
    act(() => { useBookingStore.getState().resetBooking() })
    const s = useBookingStore.getState()
    expect(s.currentStep).toBe("flights")
    expect(s.selectedFlight).toBeNull()
    expect(s.travelerInfo).toEqual([])
    expect(s.paymentToken).toBeNull()
    BOOKING_STEPS.forEach((step) => expect(s.stepValidity[step]).toBe(false))
  })
})

// ─── Payment security ─────────────────────────────────────────────────────────

describe("payment security", () => {
  it("stores only a gateway token reference — no card fields exist on the store", () => {
    act(() => { useBookingStore.getState().setPaymentToken("tok_gateway_xyz") })
    const keys = Object.keys(useBookingStore.getState())
    expect(keys).not.toContain("cardNumber")
    expect(keys).not.toContain("cvv")
    expect(keys).not.toContain("cardHolder")
    expect(keys).not.toContain("expiryDate")
  })

  it("navitaireSessionToken is not a field on the store", () => {
    const keys = Object.keys(useBookingStore.getState())
    expect(keys).not.toContain("navitaireSessionToken")
    expect(keys).not.toContain("sessionToken")
  })
})

// ─── sessionStorage persistence ───────────────────────────────────────────────

describe("sessionStorage persistence", () => {
  it("writes state to sessionStorage after a store update", () => {
    act(() => { useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT) })
    const raw = sessionStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const { state } = JSON.parse(raw!)
    expect(state.selectedFlight).toEqual(MOCK_FLIGHT)
  })

  it("persists stepValidity to sessionStorage", () => {
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
    })
    const { state } = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(state.stepValidity.flights).toBe(true)
    expect(state.stepValidity.passengers).toBe(true)
    expect(state.stepValidity.details).toBe(false)
  })

  it("does not persist raw card data to sessionStorage", () => {
    act(() => { useBookingStore.getState().setPaymentToken("tok_secure_abc") })
    const raw = sessionStorage.getItem(STORAGE_KEY)!
    expect(raw).not.toMatch(/cardNumber/)
    expect(raw).not.toMatch(/cvv/)
    expect(raw).toContain("tok_secure_abc")
  })

  it("rehydrates state from sessionStorage", async () => {
    const persisted = {
      state: {
        selectedFlight: MOCK_FLIGHT,
        passengers: MOCK_PASSENGERS,
        travelerInfo: [MOCK_TRAVELER],
        bagSelections: MOCK_BAGS,
        seatAssignments: MOCK_SEATS,
        paymentToken: null,
        bookingReference: null,
        currentStep: "seats",
        stepValidity: Object.fromEntries(
          BOOKING_STEPS.map((s, i) => [s, i < 4])
        ),
      },
      version: 0,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    await useBookingStore.persist.rehydrate()
    const s = useBookingStore.getState()
    expect(s.selectedFlight).toEqual(MOCK_FLIGHT)
    expect(s.passengers).toEqual(MOCK_PASSENGERS)
    expect(s.currentStep).toBe("seats")
    expect(s.stepValidity.flights).toBe(true)
    expect(s.stepValidity.seats).toBe(false)
  })

  it("_setHasHydrated sets hasHydrated to true", async () => {
    act(() => {
      useBookingStore.setState({ hasHydrated: false })
      useBookingStore.getState()._setHasHydrated()
    })
    expect(useBookingStore.getState().hasHydrated).toBe(true)
  })

  it("hasHydrated becomes true after rehydration via onRehydrateStorage", async () => {
    act(() => { useBookingStore.setState({ hasHydrated: false }) })
    await useBookingStore.persist.rehydrate()
    expect(useBookingStore.getState().hasHydrated).toBe(true)
  })
})

// ─── bookingReference ────────────────────────────────────────────────────────

describe("bookingReference", () => {
  it("is null by default", () => {
    act(() => { useBookingStore.getState().resetBooking() })
    expect(useBookingStore.getState().bookingReference).toBeNull()
  })

  it("setBookingReference stores the reference", () => {
    act(() => { useBookingStore.getState().setBookingReference("JSX-ABC123") })
    expect(useBookingStore.getState().bookingReference).toBe("JSX-ABC123")
  })

  it("resetBooking clears bookingReference", () => {
    act(() => {
      useBookingStore.getState().setBookingReference("JSX-XYZ")
      useBookingStore.getState().resetBooking()
    })
    expect(useBookingStore.getState().bookingReference).toBeNull()
  })
})
