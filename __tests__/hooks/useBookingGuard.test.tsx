import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { BOOKING_STEPS } from "@/features/booking/utils/steps"

const mockReplace = vi.fn()

vi.mock("next/router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    query: {},
    pathname: "/booking/flights",
  }),
}))

const INITIAL_VALIDITY = Object.fromEntries(
  BOOKING_STEPS.map((s) => [s, false])
) as ReturnType<typeof useBookingStore.getState>["stepValidity"]

function resetStore(overrides: Partial<ReturnType<typeof useBookingStore.getState>> = {}) {
  act(() => {
    useBookingStore.setState({
      currentStep: "flights",
      stepValidity: { ...INITIAL_VALIDITY },
      hasHydrated: true,
      selectedFlight: null,
      passengers: { adults: 1, children: 0, infants: 0 },
      travelerInfo: [],
      bagSelections: [],
      seatAssignments: [],
      paymentToken: null,
      bookingReference: null,
      ...overrides,
    })
  })
}

beforeEach(() => {
  resetStore()
  mockReplace.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("useBookingGuard — direct URL access to locked step", () => {
  it("redirects to /booking/flights when accessing /booking/seats with no steps complete", () => {
    renderHook(() => useBookingGuard("seats"))

    expect(mockReplace).toHaveBeenCalledWith("/booking/flights")
  })

  it("redirects to /booking/flights when accessing /booking/passengers with no steps complete", () => {
    renderHook(() => useBookingGuard("passengers"))

    expect(mockReplace).toHaveBeenCalledWith("/booking/flights")
  })

  it("redirects to /booking/passengers when flights is done but accessing /booking/details", () => {
    resetStore({
      stepValidity: {
        ...INITIAL_VALIDITY,
        flights: true,
      },
    })

    renderHook(() => useBookingGuard("details"))

    expect(mockReplace).toHaveBeenCalledWith("/booking/passengers")
  })

  it("redirects to /booking/bags when flights/passengers/details are done but accessing /booking/seats", () => {
    resetStore({
      stepValidity: {
        ...INITIAL_VALIDITY,
        flights: true,
        passengers: true,
        details: true,
      },
    })

    renderHook(() => useBookingGuard("seats"))

    expect(mockReplace).toHaveBeenCalledWith("/booking/bags")
  })

  it("does not redirect when accessing /booking/flights (always accessible)", () => {
    renderHook(() => useBookingGuard("flights"))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("does not redirect when accessing /booking/passengers after flights is complete", () => {
    resetStore({
      stepValidity: { ...INITIAL_VALIDITY, flights: true },
    })

    renderHook(() => useBookingGuard("passengers"))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("does not redirect when all prerequisites are met for /booking/payment", () => {
    resetStore({
      stepValidity: {
        ...INITIAL_VALIDITY,
        flights: true,
        passengers: true,
        details: true,
        bags: true,
        seats: true,
        review: true,
      },
    })

    renderHook(() => useBookingGuard("payment"))

    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe("useBookingGuard — canAccess return value", () => {
  it("returns canAccess: false for a locked step", () => {
    const { result } = renderHook(() => useBookingGuard("seats"))

    expect(result.current.canAccess).toBe(false)
  })

  it("returns canAccess: true for an accessible step", () => {
    const { result } = renderHook(() => useBookingGuard("flights"))

    expect(result.current.canAccess).toBe(true)
  })

  it("returns canAccess: false while hydration is pending", () => {
    resetStore({ hasHydrated: false })

    const { result } = renderHook(() => useBookingGuard("flights"))

    // flights is always accessible, but hydration hasn't completed yet
    expect(result.current.canAccess).toBe(false)
    expect(result.current.isHydrating).toBe(true)
  })

  it("does not redirect while hydration is pending", () => {
    resetStore({ hasHydrated: false })

    renderHook(() => useBookingGuard("seats"))

    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe("useBookingGuard — setCurrentStep side effect", () => {
  it("updates currentStep in the store when the step is accessible", () => {
    resetStore({
      stepValidity: { ...INITIAL_VALIDITY, flights: true },
    })

    renderHook(() => useBookingGuard("passengers"))

    expect(useBookingStore.getState().currentStep).toBe("passengers")
  })

  it("does not update currentStep when the step is locked", () => {
    renderHook(() => useBookingGuard("seats"))

    // currentStep should remain unchanged since we redirected
    expect(useBookingStore.getState().currentStep).toBe("flights")
  })
})

describe("useBookingGuard — back navigation data retention", () => {
  it("retains passengers in the store after navigating back from details to passengers", () => {
    const config = { adults: 2, children: 0, infants: 1 }

    // Set up state as if user completed flights and passengers
    act(() => {
      useBookingStore.getState().setPassengers(config)
      useBookingStore.setState({
        stepValidity: {
          ...INITIAL_VALIDITY,
          flights: true,
          passengers: true,
        },
        currentStep: "details",
      })
    })

    // User hits back — now on passengers
    renderHook(() => useBookingGuard("passengers"))

    expect(useBookingStore.getState().passengers).toEqual(config)
  })

  it("retains selectedFlight after navigating back from passengers to flights", () => {
    const flight = {
      flightId: "FL007",
      origin: "DAL",
      destination: "BUR",
      departureDate: "2026-08-15",
      price: 149,
    }

    act(() => {
      useBookingStore.getState().setSelectedFlight(flight)
      useBookingStore.setState({
        stepValidity: { ...INITIAL_VALIDITY, flights: true },
        currentStep: "passengers",
      })
    })

    // User hits back — now on flights
    renderHook(() => useBookingGuard("flights"))

    expect(useBookingStore.getState().selectedFlight).toEqual(flight)
  })

  it("retains all collected data after navigating back multiple steps", () => {
    const flight = {
      flightId: "FL999",
      origin: "DAL",
      destination: "SFO",
      departureDate: "2026-09-01",
      price: 399,
    }
    const config = { adults: 1, children: 0, infants: 0 }
    const details = { passenger_0: { firstName: "Bob", lastName: "Jones" } }

    act(() => {
      useBookingStore.getState().setSelectedFlight(flight)
      useBookingStore.getState().setPassengers(config)
      useBookingStore.getState().setTravelerInfo([{ firstName: "Bob", lastName: "Jones", dateOfBirth: "1990-01-01", documentType: "passport", documentNumber: "X1", nationality: "US" }])
      useBookingStore.setState({
        stepValidity: {
          ...INITIAL_VALIDITY,
          flights: true,
          passengers: true,
          details: true,
        },
        currentStep: "bags",
      })
    })

    // User navigates back two steps to passengers
    renderHook(() => useBookingGuard("passengers"))

    const s = useBookingStore.getState()
    expect(s.selectedFlight).toEqual(flight)
    expect(s.passengers).toEqual(config)
    expect(s.travelerInfo[0].firstName).toBe("Bob")
  })
})
