import { describe, it, expect, beforeEach } from "vitest"
import { act } from "@testing-library/react"
import { useBookingStore } from "@/stores/bookingStore"
import type {
  SelectedFlight,
  PassengerCount,
  TravelerInfo,
  BagSelection,
  SeatAssignment,
} from "@/stores/bookingStore"

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
}

const MOCK_BAGS: BagSelection[] = [{ passengerIndex: 0, checkedBags: 1 }]
const MOCK_SEATS: SeatAssignment[] = [{ passengerIndex: 0, seatNumber: "3A" }]

const RESET_STATE = {
  selectedFlight: null,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelerInfo: [],
  bagSelections: [],
  seatAssignments: [],
  paymentToken: null,
  currentStep: "flights" as const,
  stepValidity: {
    flights: false,
    passengers: false,
    details: false,
    bags: false,
    seats: false,
    review: false,
    payment: false,
    confirmation: false,
  },
}

beforeEach(() => {
  sessionStorage.clear()
  act(() => {
    useBookingStore.setState(RESET_STATE)
  })
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts with null flight, 1 adult passenger, and flights as the current step", () => {
    const { selectedFlight, passengers, currentStep } = useBookingStore.getState()
    expect(selectedFlight).toBeNull()
    expect(passengers).toEqual({ adults: 1, children: 0, infants: 0 })
    expect(currentStep).toBe("flights")
  })

  it("starts with all steps invalid", () => {
    const { stepValidity } = useBookingStore.getState()
    for (const valid of Object.values(stepValidity)) {
      expect(valid).toBe(false)
    }
  })

  it("starts with empty travelerInfo, bagSelections, seatAssignments and null paymentToken", () => {
    const { travelerInfo, bagSelections, seatAssignments, paymentToken } =
      useBookingStore.getState()
    expect(travelerInfo).toEqual([])
    expect(bagSelections).toEqual([])
    expect(seatAssignments).toEqual([])
    expect(paymentToken).toBeNull()
  })
})

// ─── Step transitions ─────────────────────────────────────────────────────────

describe("step transitions", () => {
  it("setSelectedFlight stores the flight and marks flights valid", () => {
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
    })
    const { selectedFlight, stepValidity } = useBookingStore.getState()
    expect(selectedFlight).toEqual(MOCK_FLIGHT)
    expect(stepValidity.flights).toBe(true)
  })

  it("setSelectedFlight invalidates all steps downstream of flights", () => {
    act(() => {
      // pre-mark every step valid
      useBookingStore.setState({
        stepValidity: {
          flights: true,
          passengers: true,
          details: true,
          bags: true,
          seats: true,
          review: true,
          payment: true,
          confirmation: true,
        },
      })
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
    })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.flights).toBe(true)
    expect(stepValidity.passengers).toBe(false)
    expect(stepValidity.details).toBe(false)
    expect(stepValidity.bags).toBe(false)
    expect(stepValidity.seats).toBe(false)
    expect(stepValidity.review).toBe(false)
    expect(stepValidity.payment).toBe(false)
    expect(stepValidity.confirmation).toBe(false)
  })

  it("setPassengers stores the passenger count and marks passengers valid", () => {
    act(() => {
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
    })
    const { passengers, stepValidity } = useBookingStore.getState()
    expect(passengers).toEqual(MOCK_PASSENGERS)
    expect(stepValidity.passengers).toBe(true)
  })

  it("setTravelerInfo stores traveler details and marks details valid", () => {
    act(() => {
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
    })
    const { travelerInfo, stepValidity } = useBookingStore.getState()
    expect(travelerInfo).toEqual([MOCK_TRAVELER])
    expect(stepValidity.details).toBe(true)
  })

  it("setTravelerInfo invalidates bags through confirmation", () => {
    act(() => {
      useBookingStore.setState({
        stepValidity: {
          flights: true,
          passengers: true,
          details: true,
          bags: true,
          seats: true,
          review: true,
          payment: true,
          confirmation: true,
        },
      })
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
    })
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

  it("setBagSelections stores bag choices and marks bags valid", () => {
    act(() => {
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
    })
    const { bagSelections, stepValidity } = useBookingStore.getState()
    expect(bagSelections).toEqual(MOCK_BAGS)
    expect(stepValidity.bags).toBe(true)
  })

  it("setBagSelections invalidates seats through confirmation", () => {
    act(() => {
      useBookingStore.setState({
        stepValidity: {
          flights: true,
          passengers: true,
          details: true,
          bags: true,
          seats: true,
          review: true,
          payment: true,
          confirmation: true,
        },
      })
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
    })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.bags).toBe(true)
    expect(stepValidity.seats).toBe(false)
    expect(stepValidity.review).toBe(false)
    expect(stepValidity.payment).toBe(false)
    expect(stepValidity.confirmation).toBe(false)
  })

  it("setSeatAssignments stores seat choices and marks seats valid", () => {
    act(() => {
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
    })
    const { seatAssignments, stepValidity } = useBookingStore.getState()
    expect(seatAssignments).toEqual(MOCK_SEATS)
    expect(stepValidity.seats).toBe(true)
  })

  it("setSeatAssignments invalidates review through confirmation", () => {
    act(() => {
      useBookingStore.setState({
        stepValidity: {
          flights: true,
          passengers: true,
          details: true,
          bags: true,
          seats: true,
          review: true,
          payment: true,
          confirmation: true,
        },
      })
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
    })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.seats).toBe(true)
    expect(stepValidity.review).toBe(false)
    expect(stepValidity.payment).toBe(false)
    expect(stepValidity.confirmation).toBe(false)
  })

  it("setPaymentToken stores the token and marks payment valid", () => {
    act(() => {
      useBookingStore.getState().setPaymentToken("tok_abc123")
    })
    const { paymentToken, stepValidity } = useBookingStore.getState()
    expect(paymentToken).toBe("tok_abc123")
    expect(stepValidity.payment).toBe(true)
  })

  it("setCurrentStep updates the active step", () => {
    act(() => {
      useBookingStore.getState().setCurrentStep("bags")
    })
    expect(useBookingStore.getState().currentStep).toBe("bags")
  })

  it("setStepValid can mark any step valid or invalid independently", () => {
    act(() => {
      useBookingStore.getState().setStepValid("review", true)
    })
    expect(useBookingStore.getState().stepValidity.review).toBe(true)
    act(() => {
      useBookingStore.getState().setStepValid("review", false)
    })
    expect(useBookingStore.getState().stepValidity.review).toBe(false)
  })

  it("resetBooking clears all data back to initial values", () => {
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
      useBookingStore.getState().setPaymentToken("tok_abc123")
      useBookingStore.getState().setCurrentStep("review")
    })
    act(() => {
      useBookingStore.getState().resetBooking()
    })
    const state = useBookingStore.getState()
    expect(state.selectedFlight).toBeNull()
    expect(state.passengers).toEqual({ adults: 1, children: 0, infants: 0 })
    expect(state.travelerInfo).toEqual([])
    expect(state.bagSelections).toEqual([])
    expect(state.seatAssignments).toEqual([])
    expect(state.paymentToken).toBeNull()
    expect(state.currentStep).toBe("flights")
    for (const valid of Object.values(state.stepValidity)) {
      expect(valid).toBe(false)
    }
  })

  it("completes a full happy-path flow and has all steps valid", () => {
    act(() => {
      const s = useBookingStore.getState()
      s.setSelectedFlight(MOCK_FLIGHT)
      s.setPassengers({ adults: 1, children: 0, infants: 0 })
      s.setTravelerInfo([MOCK_TRAVELER])
      s.setBagSelections(MOCK_BAGS)
      s.setSeatAssignments(MOCK_SEATS)
      s.setStepValid("review", true)
      s.setPaymentToken("tok_completed_123")
    })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.flights).toBe(true)
    expect(stepValidity.passengers).toBe(true)
    expect(stepValidity.details).toBe(true)
    expect(stepValidity.bags).toBe(true)
    expect(stepValidity.seats).toBe(true)
    expect(stepValidity.review).toBe(true)
    expect(stepValidity.payment).toBe(true)
  })
})

// ─── Downstream invalidation on passenger count change ───────────────────────

describe("downstream invalidation when passenger count changes", () => {
  it("clears travelerInfo, bagSelections, and seatAssignments", () => {
    act(() => {
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
    })
    act(() => {
      useBookingStore.getState().setPassengers({ adults: 3, children: 0, infants: 0 })
    })
    const { travelerInfo, bagSelections, seatAssignments } = useBookingStore.getState()
    expect(travelerInfo).toEqual([])
    expect(bagSelections).toEqual([])
    expect(seatAssignments).toEqual([])
  })

  it("invalidates details, bags, seats, review, payment, and confirmation", () => {
    act(() => {
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
      useBookingStore.getState().setBagSelections(MOCK_BAGS)
      useBookingStore.getState().setSeatAssignments(MOCK_SEATS)
      useBookingStore.getState().setStepValid("review", true)
      useBookingStore.getState().setPaymentToken("tok_abc123")
    })
    act(() => {
      useBookingStore.getState().setPassengers({ adults: 2, children: 0, infants: 0 })
    })
    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.passengers).toBe(true)
    expect(stepValidity.details).toBe(false)
    expect(stepValidity.bags).toBe(false)
    expect(stepValidity.seats).toBe(false)
    expect(stepValidity.review).toBe(false)
    expect(stepValidity.payment).toBe(false)
    expect(stepValidity.confirmation).toBe(false)
  })

  it("preserves the flights step validity when passengers change", () => {
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
    })
    act(() => {
      useBookingStore.getState().setPassengers({ adults: 1, children: 0, infants: 0 })
    })
    expect(useBookingStore.getState().stepValidity.flights).toBe(true)
  })

  it("marks the passengers step valid even after it changes", () => {
    act(() => {
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
      useBookingStore.getState().setPassengers({ adults: 1, children: 0, infants: 0 })
    })
    expect(useBookingStore.getState().stepValidity.passengers).toBe(true)
  })

  it("stores the new passenger count", () => {
    const newCount: PassengerCount = { adults: 2, children: 2, infants: 1 }
    act(() => {
      useBookingStore.getState().setPassengers(newCount)
    })
    expect(useBookingStore.getState().passengers).toEqual(newCount)
  })
})

// ─── Payment security ─────────────────────────────────────────────────────────

describe("payment security", () => {
  it("stores only a gateway token reference — no card fields exist on the store", () => {
    act(() => {
      useBookingStore.getState().setPaymentToken("tok_gateway_xyz")
    })
    const state = useBookingStore.getState()
    expect(state.paymentToken).toBe("tok_gateway_xyz")
    const keys = Object.keys(state)
    expect(keys).not.toContain("cardNumber")
    expect(keys).not.toContain("cvv")
    expect(keys).not.toContain("cardHolder")
    expect(keys).not.toContain("expiryDate")
    expect(keys).not.toContain("cardExpiry")
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
    act(() => {
      useBookingStore.getState().setSelectedFlight(MOCK_FLIGHT)
    })
    const raw = sessionStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const { state } = JSON.parse(raw!)
    expect(state.selectedFlight).toEqual(MOCK_FLIGHT)
  })

  it("persists passengers and travelerInfo after each step", () => {
    act(() => {
      useBookingStore.getState().setPassengers(MOCK_PASSENGERS)
      useBookingStore.getState().setTravelerInfo([MOCK_TRAVELER])
    })
    const { state } = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(state.passengers).toEqual(MOCK_PASSENGERS)
    expect(state.travelerInfo).toEqual([MOCK_TRAVELER])
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
    act(() => {
      useBookingStore.getState().setPaymentToken("tok_secure_abc")
    })
    const raw = sessionStorage.getItem(STORAGE_KEY)!
    expect(raw).not.toMatch(/cardNumber/)
    expect(raw).not.toMatch(/cvv/)
    expect(raw).not.toMatch(/cardHolder/)
    // paymentToken itself IS stored (gateway reference, not card data)
    expect(raw).toContain("tok_secure_abc")
  })

  it("rehydrates full state from sessionStorage", async () => {
    const persistedState = {
      state: {
        selectedFlight: MOCK_FLIGHT,
        passengers: MOCK_PASSENGERS,
        travelerInfo: [MOCK_TRAVELER],
        bagSelections: MOCK_BAGS,
        seatAssignments: MOCK_SEATS,
        paymentToken: null,
        currentStep: "seats",
        stepValidity: {
          flights: true,
          passengers: true,
          details: true,
          bags: true,
          seats: false,
          review: false,
          payment: false,
          confirmation: false,
        },
      },
      version: 0,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState))
    await useBookingStore.persist.rehydrate()

    const state = useBookingStore.getState()
    expect(state.selectedFlight).toEqual(MOCK_FLIGHT)
    expect(state.passengers).toEqual(MOCK_PASSENGERS)
    expect(state.travelerInfo).toEqual([MOCK_TRAVELER])
    expect(state.bagSelections).toEqual(MOCK_BAGS)
    expect(state.seatAssignments).toEqual(MOCK_SEATS)
    expect(state.currentStep).toBe("seats")
    expect(state.stepValidity.flights).toBe(true)
    expect(state.stepValidity.passengers).toBe(true)
    expect(state.stepValidity.details).toBe(true)
    expect(state.stepValidity.bags).toBe(true)
    expect(state.stepValidity.seats).toBe(false)
  })

  it("rehydrated state preserves stepValidity accurately", async () => {
    const persistedState = {
      state: {
        ...RESET_STATE,
        stepValidity: {
          flights: true,
          passengers: true,
          details: false,
          bags: false,
          seats: false,
          review: false,
          payment: false,
          confirmation: false,
        },
      },
      version: 0,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState))
    await useBookingStore.persist.rehydrate()

    const { stepValidity } = useBookingStore.getState()
    expect(stepValidity.flights).toBe(true)
    expect(stepValidity.passengers).toBe(true)
    expect(stepValidity.details).toBe(false)
  })
})
