import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import BookingSeatsPage from "@/pages/booking/seats"
import { useBookingStore } from "@/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import * as analytics from "@/lib/analytics"

// ── Next.js stubs ─────────────────────────────────────────────────────────────

const mockPush = vi.fn()
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}))

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// ── Booking guard — always allow access ───────────────────────────────────────

vi.mock("@/hooks/useBookingGuard", () => ({
  useBookingGuard: () => ({ canAccess: true, isHydrating: false }),
}))

// ── Layout stubs ──────────────────────────────────────────────────────────────

vi.mock("@/components/booking/BookingLayout", () => ({
  BookingLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="booking-layout">{children}</div>
  ),
}))

vi.mock("@/components/layout/SiteHeader", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}))

vi.mock("@/components/booking/StepProgress", () => ({
  StepProgress: () => <nav data-testid="step-progress" />,
}))

// ── Fetch stubs ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ── Mock seat map ─────────────────────────────────────────────────────────────

const MOCK_SEAT_MAP = {
  aircraft: "737-800",
  columns: ["A", "B", "C", "D", "E", "F"],
  firstClassRows: [1, 2, 3],
  rows: [
    {
      row: 1,
      seats: [
        { seatNumber: "1A", row: 1, column: "A", class: "first", price: 45, available: true },
        { seatNumber: "1B", row: 1, column: "B", class: "first", price: 45, available: true },
        { seatNumber: "1C", row: 1, column: "C", class: "first", price: 45, available: true },
        { seatNumber: "1D", row: 1, column: "D", class: "first", price: 45, available: true },
        { seatNumber: "1E", row: 1, column: "E", class: "first", price: 45, available: true },
        { seatNumber: "1F", row: 1, column: "F", class: "first", price: 45, available: true },
      ],
    },
    {
      row: 4,
      seats: [
        { seatNumber: "4A", row: 4, column: "A", class: "economy", price: 0, available: true },
        { seatNumber: "4B", row: 4, column: "B", class: "economy", price: 0, available: true },
        { seatNumber: "4C", row: 4, column: "C", class: "economy", price: 0, available: true },
        { seatNumber: "4D", row: 4, column: "D", class: "economy", price: 0, available: true },
        { seatNumber: "4E", row: 4, column: "E", class: "economy", price: 0, available: false },
        { seatNumber: "4F", row: 4, column: "F", class: "economy", price: 0, available: true },
      ],
    },
  ],
}

function seatMapResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ seatMap: MOCK_SEAT_MAP }),
  }
}

function bffSuccessResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }
}

// ── Store reset state ─────────────────────────────────────────────────────────

const SINGLE_ADULT_STATE = {
  selectedFlight: null,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelerInfo: [],
  contactDetails: null,
  bagSelections: [],
  seatAssignments: [],
  paymentToken: null,
  currentStep: "seats" as const,
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
  hasHydrated: true,
  bookingReference: null,
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear()
  act(() => {
    useBookingStore.setState(SINGLE_ADULT_STATE)
  })
  mockPush.mockClear()
  mockFetch.mockClear()
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (url === "/api/booking/seatmap" && (!opts || opts.method !== "POST"))
      return Promise.resolve(seatMapResponse())
    if (url === "/api/booking/seatmap" && opts?.method === "POST")
      return Promise.resolve(bffSuccessResponse())
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("BookingSeatsPage — rendering", () => {
  it("renders the 'Choose your seats' heading", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /choose your seats/i })).toBeInTheDocument()
    })
  })

  it("renders the seat progress indicator", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-progress")).toBeInTheDocument()
    })
  })

  it("shows loading skeleton while fetching seat map", () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<BookingSeatsPage />)
    expect(document.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0)
  })

  it("renders seat buttons after loading", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-1A")).toBeInTheDocument()
    })
  })

  it("renders the Continue button after loading", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).toBeInTheDocument()
    })
  })

  it("renders the Skip seats button after loading", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
  })

  it("renders the Skip seat selection link in the header", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-link")).toBeInTheDocument()
    })
  })

  it("Continue button is disabled when no seats selected", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).toBeDisabled()
    })
  })

  it("does not render passenger tabs for single passenger", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.queryByTestId("passenger-tab-0")).not.toBeInTheDocument()
    })
  })

  it("occupied seats have aria-label containing 'Occupied'", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      const occupiedSeat = screen.getByTestId("seat-4E")
      expect(occupiedSeat).toHaveAttribute("aria-label", expect.stringContaining("Occupied"))
    })
  })
})

// ── Multiple passengers ───────────────────────────────────────────────────────

describe("BookingSeatsPage — multiple passengers", () => {
  beforeEach(() => {
    act(() => {
      useBookingStore.setState({
        passengers: { adults: 2, children: 0, infants: 0 },
      })
    })
  })

  it("renders passenger tabs for multiple passengers", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("passenger-tab-0")).toBeInTheDocument()
      expect(screen.getByTestId("passenger-tab-1")).toBeInTheDocument()
    })
  })

  it("first passenger tab is active by default", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("passenger-tab-0")).toHaveAttribute("aria-pressed", "true")
    })
  })

  it("clicking second passenger tab makes it active", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("passenger-tab-1")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("passenger-tab-1"))
    await waitFor(() => {
      expect(screen.getByTestId("passenger-tab-1")).toHaveAttribute("aria-pressed", "true")
    })
  })
})

// ── Seat selection ────────────────────────────────────────────────────────────

describe("BookingSeatsPage — seat selection", () => {
  it("clicking an available seat updates the progress counter", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("seat-progress")).toHaveTextContent("1 of 1")
    })
  })

  it("clicking a selected seat deselects it", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("seat-progress")).toHaveTextContent("Select a seat")
    })
  })

  it("selected seat has aria-pressed=true", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toHaveAttribute("aria-pressed", "true")
    })
  })

  it("occupied seat is disabled", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4E")).toBeDisabled()
    })
  })

  it("Continue button enabled when all passengers have seats (single adult)", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).not.toBeDisabled()
    })
  })
})

// ── Seat aria-labels ──────────────────────────────────────────────────────────

describe("BookingSeatsPage — seat accessibility", () => {
  it("available seat has aria-label with row, seat, class, price, and Available", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      const seat = screen.getByTestId("seat-4A")
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("Row 4"))
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("Seat A"))
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("Economy"))
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("Available"))
    })
  })

  it("first class seat aria-label includes 'First Class' and price", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      const seat = screen.getByTestId("seat-1A")
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("First Class"))
      expect(seat).toHaveAttribute("aria-label", expect.stringContaining("$45"))
    })
  })

  it("seat progress has aria-live polite", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-progress")).toHaveAttribute("aria-live", "polite")
    })
  })

  it("seat buttons have aria-pressed attribute", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      const seat = screen.getByTestId("seat-4A")
      expect(seat).toHaveAttribute("aria-pressed")
    })
  })
})

// ── Pre-fill from store ───────────────────────────────────────────────────────

describe("BookingSeatsPage — pre-fill from store", () => {
  it("pre-fills seat selection when navigating back", async () => {
    act(() => {
      useBookingStore.setState({
        seatAssignments: [{ passengerIndex: 0, seatNumber: "4A" }],
      })
    })
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-progress")).toHaveTextContent("1 of 1")
    })
  })
})

// ── Skip ──────────────────────────────────────────────────────────────────────

describe("BookingSeatsPage — skip", () => {
  it("skip button navigates to /booking/review", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("skip-btn"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/review")
    })
  })

  it("skip link navigates to /booking/review", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-link")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("skip-link"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/review")
    })
  })

  it("skip calls setSeatAssignments with empty array", async () => {
    const setSeatAssignments = vi.spyOn(useBookingStore.getState(), "setSeatAssignments")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("skip-btn"))
    await waitFor(() => {
      expect(setSeatAssignments).toHaveBeenCalledWith([])
    })
  })

  it("skip does not call the BFF", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
    const postCallsBefore = mockFetch.mock.calls.filter(
      (c) => c[1]?.method === "POST"
    ).length
    fireEvent.click(screen.getByTestId("skip-btn"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
    const postCallsAfter = mockFetch.mock.calls.filter(
      (c) => c[1]?.method === "POST"
    ).length
    expect(postCallsAfter).toBe(postCallsBefore)
  })
})

// ── Successful submission ─────────────────────────────────────────────────────

describe("BookingSeatsPage — successful submission", () => {
  it("calls the BFF POST /api/booking/seatmap on Continue", async () => {
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("continue-btn"))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/booking/seatmap",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("calls setSeatAssignments and navigates to /booking/review on success", async () => {
    const setSeatAssignments = vi.spyOn(useBookingStore.getState(), "setSeatAssignments")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("continue-btn"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/review")
    })
    expect(setSeatAssignments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ passengerIndex: 0, seatNumber: "4A" }),
      ])
    )
  })
})

// ── BFF error recovery ────────────────────────────────────────────────────────

describe("BookingSeatsPage — BFF error recovery (submit)", () => {
  it("calls onAllRetriesExhausted when BFF POST fails", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/seatmap" && (!opts || opts.method !== "POST"))
        return Promise.resolve(seatMapResponse())
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Server error" }) })
    })

    const onAllRetriesExhausted = vi.spyOn(
      useErrorStore.getState(),
      "onAllRetriesExhausted"
    )

    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("continue-btn"))

    await waitFor(
      () => {
        expect(onAllRetriesExhausted).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )
  })
})

// ── Load error recovery ───────────────────────────────────────────────────────

describe("BookingSeatsPage — load error recovery", () => {
  it("shows an error alert when seat map fails to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  it("shows 'Try again' retry button on load error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
  })

  it("still shows Skip buttons when seat map fails to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
  })

  it("calls showToast when seat map fails to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    const showToast = vi.spyOn(useErrorStore.getState(), "showToast")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(showToast).toHaveBeenCalled()
    })
  })

  it("retries loading when 'Try again' is clicked", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockImplementation(() => Promise.resolve(seatMapResponse()))

    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))
    await waitFor(() => {
      expect(screen.getByTestId("seat-1A")).toBeInTheDocument()
    })
  })
})

// ── GA4 events ────────────────────────────────────────────────────────────────

describe("BookingSeatsPage — GA4 events", () => {
  it("fires booking_step_viewed on mount", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepViewed")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("seats")
    })
  })

  it("fires booking_step_completed on successful submit", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seat-4A")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("seat-4A"))
    await waitFor(() => {
      expect(screen.getByTestId("continue-btn")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("continue-btn"))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("seats", expect.objectContaining({ seatsAssigned: 1 }))
    })
  })

  it("fires booking_step_completed on skip with skipped:true", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")
    render(<BookingSeatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("skip-btn"))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        "seats",
        expect.objectContaining({ seatsAssigned: 0, skipped: true })
      )
    })
  })
})
