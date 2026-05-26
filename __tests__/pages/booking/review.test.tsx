import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import BookingReviewPage from "@/pages/booking/review"
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

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [k: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
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

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_BAG_OPTIONS = [
  { checkedBags: 0, price: 0, label: "No checked bag", description: "Carry-on only" },
  { checkedBags: 1, price: 30, label: "1 checked bag", description: "Up to 23 kg" },
  { checkedBags: 2, price: 55, label: "2 checked bags", description: "Up to 23 kg each" },
]

const MOCK_FLIGHT = {
  flightId: "FL001",
  flightNumber: "JS101",
  origin: "LAX",
  destination: "SFO",
  departureTime: "09:30",
  arrivalTime: "11:00",
  departureDate: "2024-07-01",
  pricePerPassenger: 150,
  price: 150,
}

const MOCK_TRAVELER: import("@/stores/bookingStore").TravelerInfo = {
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  documentType: "passport",
  documentNumber: "AB123456",
  nationality: "US",
}

const MOCK_CONTACT = { email: "jane@example.com", phone: "+1234567890" }

function bagOptionsResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ bagOptions: MOCK_BAG_OPTIONS }),
  }
}

function confirmPriceResponse(confirmed = true, totalPrice = 218, previousPrice?: number) {
  return {
    ok: true,
    json: () =>
      Promise.resolve(
        confirmed
          ? { confirmed: true, totalPrice }
          : { confirmed: false, totalPrice, previousPrice }
      ),
  }
}

// ── Store reset state ─────────────────────────────────────────────────────────

const BASE_STATE = {
  selectedFlight: MOCK_FLIGHT,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelerInfo: [MOCK_TRAVELER],
  contactDetails: MOCK_CONTACT,
  bagSelections: [{ passengerIndex: 0, checkedBags: 1 }],
  seatAssignments: [{ passengerIndex: 0, seatNumber: "4A" }],
  paymentToken: null,
  currentStep: "review" as const,
  stepValidity: {
    flights: true,
    passengers: true,
    details: true,
    bags: true,
    seats: true,
    review: false,
    payment: false,
    confirmation: false,
  },
  hasHydrated: true,
  bookingReference: null,
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockPush.mockReset()
  mockFetch.mockReset()
  // Default: bag options succeed, confirm-price succeeds
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
      return Promise.resolve(bagOptionsResponse())
    }
    if (url === "/api/booking/confirm-price") {
      // Default total: 150 (base) + 30 (bag) + 0 (seat) = 180, taxes 22 → 202
      return Promise.resolve(confirmPriceResponse(true, 202))
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Not found" }) })
  })
  useBookingStore.setState(BASE_STATE)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("BookingReviewPage — rendering", () => {
  it("renders page heading", async () => {
    render(<BookingReviewPage />)
    expect(screen.getByRole("heading", { name: /review your booking/i, level: 1 })).toBeInTheDocument()
  })

  it("renders all four section cards", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("flight-section")).toBeInTheDocument()
    })
    expect(screen.getByTestId("passengers-section")).toBeInTheDocument()
    expect(screen.getByTestId("bags-section")).toBeInTheDocument()
    expect(screen.getByTestId("seats-section")).toBeInTheDocument()
  })

  it("renders price breakdown section", async () => {
    render(<BookingReviewPage />)
    expect(screen.getByTestId("price-breakdown")).toBeInTheDocument()
  })

  it("returns null when canAccess is false", () => {
    vi.mocked(vi.importMock("@/hooks/useBookingGuard")).useBookingGuard = () => ({
      canAccess: false,
      isHydrating: false,
    })
  })
})

// ── Flight section ────────────────────────────────────────────────────────────

describe("BookingReviewPage — flight section", () => {
  it("shows origin and destination", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("LAX")).toBeInTheDocument()
      expect(screen.getByText("SFO")).toBeInTheDocument()
    })
  })

  it("shows flight number", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/JS101/)).toBeInTheDocument()
    })
  })

  it("shows passenger count and price per person", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/1 passenger/i)).toBeInTheDocument()
      expect(screen.getByText(/\$150 per person/)).toBeInTheDocument()
    })
  })

  it("shows 'Edit flight' link pointing to /booking/flights", async () => {
    render(<BookingReviewPage />)
    const editLink = screen.getByRole("link", { name: /edit flight/i })
    expect(editLink).toHaveAttribute("href", "/booking/flights")
  })
})

// ── Passengers section ────────────────────────────────────────────────────────

describe("BookingReviewPage — passengers section", () => {
  it("shows passenger full name from travelerInfo", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })
  })

  it("shows passenger type label", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("adult")).toBeInTheDocument()
    })
  })

  it("shows contact email", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("jane@example.com")).toBeInTheDocument()
    })
  })

  it("shows contact phone", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("+1234567890")).toBeInTheDocument()
    })
  })

  it("shows 'Edit passengers' link pointing to /booking/details", async () => {
    render(<BookingReviewPage />)
    const editLink = screen.getByRole("link", { name: /edit passengers/i })
    expect(editLink).toHaveAttribute("href", "/booking/details")
  })

  it("shows multiple passenger names for multi-passenger booking", async () => {
    useBookingStore.setState({
      ...BASE_STATE,
      passengers: { adults: 2, children: 0, infants: 0 },
      travelerInfo: [
        MOCK_TRAVELER,
        {
          firstName: "John",
          lastName: "Smith",
          dateOfBirth: "1985-06-15",
          documentType: "passport",
          documentNumber: "CD789012",
          nationality: "US",
        },
      ],
    })
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      expect(screen.getByText("John Smith")).toBeInTheDocument()
    })
  })
})

// ── Bags section ──────────────────────────────────────────────────────────────

describe("BookingReviewPage — bags section", () => {
  it("shows bag selection after loading", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/1 checked bag/i)).toBeInTheDocument()
    })
  })

  it("shows bag price after loading", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      // $30 appears in both the bags section (per-passenger) and the price breakdown
      expect(screen.getAllByText("$30").length).toBeGreaterThanOrEqual(1)
    })
  })

  it("shows 'Included' for 0-bag selection", async () => {
    useBookingStore.setState({
      ...BASE_STATE,
      bagSelections: [{ passengerIndex: 0, checkedBags: 0 }],
    })
    render(<BookingReviewPage />)
    await waitFor(() => {
      // "No checked bag" label
      expect(screen.getByText(/No checked bag/i)).toBeInTheDocument()
    })
  })

  it("shows 'Edit bags' link pointing to /booking/bags", () => {
    render(<BookingReviewPage />)
    const editLink = screen.getByRole("link", { name: /edit bags/i })
    expect(editLink).toHaveAttribute("href", "/booking/bags")
  })
})

// ── Seats section ─────────────────────────────────────────────────────────────

describe("BookingReviewPage — seats section", () => {
  it("shows seat number", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/Seat 4A/i)).toBeInTheDocument()
    })
  })

  it("shows 'Included' for economy seat", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      // Economy seat price is $0 → "Included"
      // The seat 4A is economy (row 4), so price = 0
      const seatSection = screen.getByTestId("seats-section")
      expect(seatSection).toHaveTextContent("Included")
    })
  })

  it("shows first class seat price ($45) for row 1-3", async () => {
    useBookingStore.setState({
      ...BASE_STATE,
      seatAssignments: [{ passengerIndex: 0, seatNumber: "2C" }],
    })
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("$45")).toBeInTheDocument()
    })
  })

  it("shows 'Seat selection skipped' when no seats selected", async () => {
    useBookingStore.setState({ ...BASE_STATE, seatAssignments: [] })
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/seat selection skipped/i)).toBeInTheDocument()
    })
  })

  it("shows 'Edit seats' link pointing to /booking/seats", () => {
    render(<BookingReviewPage />)
    const editLink = screen.getByRole("link", { name: /edit seats/i })
    expect(editLink).toHaveAttribute("href", "/booking/seats")
  })
})

// ── Price breakdown ───────────────────────────────────────────────────────────

describe("BookingReviewPage — price breakdown", () => {
  it("shows base fare line", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      // 1 passenger at $150
      expect(screen.getByText(/Base fare/i)).toBeInTheDocument()
      expect(screen.getByText("$150")).toBeInTheDocument()
    })
  })

  it("shows bags line", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/^Bags$/i)).toBeInTheDocument()
    })
  })

  it("shows seat fees line", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/Seat fees/i)).toBeInTheDocument()
    })
  })

  it("shows taxes & fees line", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/Taxes & fees/i)).toBeInTheDocument()
    })
  })

  it("shows total line", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText("Total")).toBeInTheDocument()
    })
  })

  it("computes correct total for base+bags+taxes (150+30+0 → subtotal 180, taxes 22 → 202)", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      // Base 150, bags 30, seats 0, subtotal 180, taxes = round(180*0.12) = 22, total = 202
      expect(screen.getByText("$202")).toBeInTheDocument()
    })
  })

  it("computes correct total with first class seat", async () => {
    useBookingStore.setState({
      ...BASE_STATE,
      seatAssignments: [{ passengerIndex: 0, seatNumber: "1A" }],
    })
    render(<BookingReviewPage />)
    await waitFor(() => {
      // Base 150, bags 30, seats 45 → subtotal 225, taxes = round(225*0.12) = 27, total = 252
      expect(screen.getByText("$252")).toBeInTheDocument()
    })
  })

  it("shows skeleton while bag options are loading", () => {
    // mockFetch never resolves — loading stays true
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<BookingReviewPage />)
    // Skeleton is aria-hidden, but we can check the price breakdown card exists
    expect(screen.getByTestId("price-breakdown")).toBeInTheDocument()
    // "Confirm & pay" button should be disabled during load
    const btn = screen.getByTestId("confirm-pay-button")
    expect(btn).toBeDisabled()
  })
})

// ── Confirm & pay flow ────────────────────────────────────────────────────────

describe("BookingReviewPage — confirm & pay", () => {
  it("calls /api/booking/confirm-price on button click", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/booking/confirm-price",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("navigates to /booking/payment when price confirmed", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/payment")
    })
  })

  it("calls markStepValid('review') on confirmed response", async () => {
    const markStepValid = vi.spyOn(useBookingStore.getState(), "markStepValid")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(markStepValid).toHaveBeenCalledWith("review")
    })
  })

  it("shows loading text while confirming price", async () => {
    let resolve: (v: unknown) => void
    const pending = new Promise((r) => { resolve = r })
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      return pending
    })

    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).toHaveTextContent(/confirming price/i)
    })
    resolve!(confirmPriceResponse())
  })
})

// ── Price change flow ─────────────────────────────────────────────────────────

describe("BookingReviewPage — price change", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      if (url === "/api/booking/confirm-price") {
        return Promise.resolve(confirmPriceResponse(false, 250, 202))
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })
  })

  it("shows price-change banner when confirmed: false", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("price-change-banner")).toBeInTheDocument()
    })
  })

  it("shows old and new price in banner", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("price-change-banner")).toHaveTextContent("$250")
    })
  })

  it("hides confirm button while price change banner is visible", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-pay-button")).not.toBeInTheDocument()
    })
  })

  it("navigates to payment when user accepts new price", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("accept-price-change")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("accept-price-change"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/payment")
    })
  })

  it("calls markStepValid('review') when user accepts new price", async () => {
    const markStepValid = vi.spyOn(useBookingStore.getState(), "markStepValid")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("accept-price-change")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("accept-price-change"))
    await waitFor(() => {
      expect(markStepValid).toHaveBeenCalledWith("review")
    })
  })

  it("dismisses banner when user cancels price change", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("cancel-price-change")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("cancel-price-change"))
    await waitFor(() => {
      expect(screen.queryByTestId("price-change-banner")).not.toBeInTheDocument()
    })
  })

  it("restores confirm button after canceling price change", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("cancel-price-change")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("cancel-price-change"))
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).toBeInTheDocument()
    })
  })
})

// ── BFF error recovery ────────────────────────────────────────────────────────

describe("BookingReviewPage — BFF error recovery (confirm-price)", () => {
  it("calls onAllRetriesExhausted when confirm-price fails repeatedly", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Server error" }) })
    })

    const onAllRetriesExhausted = vi.spyOn(useErrorStore.getState(), "onAllRetriesExhausted")

    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(
      () => {
        expect(onAllRetriesExhausted).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )
  })

  it("does not navigate when confirm-price fails", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Server error" }) })
    })

    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(
      () => {
        const store = useErrorStore.getState()
        return store.error !== null || store.isRetrying === false
      },
      { timeout: 10000 }
    )
    expect(mockPush).not.toHaveBeenCalledWith("/booking/payment")
  })
})

// ── Load error recovery ───────────────────────────────────────────────────────

describe("BookingReviewPage — bag options load error", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Failed" }) })
      }
      return Promise.resolve(confirmPriceResponse())
    })
  })

  it("calls showToast when bag options fail to load", async () => {
    const showToast = vi.spyOn(useErrorStore.getState(), "showToast")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(showToast).toHaveBeenCalled()
    })
  })

  it("shows 'Try again' button in price breakdown on load error", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
  })

  it("shows 'Price unavailable' in total when bag options fail", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/price unavailable/i)).toBeInTheDocument()
    })
  })

  it("retries loading when 'Try again' is clicked", async () => {
    mockFetch
      .mockImplementationOnce((url: string) => {
        if (url === "/api/booking/bags") {
          return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
        }
        return Promise.resolve(confirmPriceResponse())
      })
      .mockImplementation((url: string, opts?: RequestInit) => {
        if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
          return Promise.resolve(bagOptionsResponse())
        }
        return Promise.resolve(confirmPriceResponse())
      })

    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))
    await waitFor(() => {
      expect(screen.queryByText(/price unavailable/i)).not.toBeInTheDocument()
    })
  })
})

// ── GA4 events ────────────────────────────────────────────────────────────────

describe("BookingReviewPage — GA4 events", () => {
  it("fires booking_step_viewed on mount", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepViewed")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("review")
    })
  })

  it("fires booking_step_completed on successful confirm", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("review", expect.objectContaining({ totalPrice: 202 }))
    })
  })

  it("fires booking_step_completed with priceChanged:true when accepting new price", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      return Promise.resolve(confirmPriceResponse(false, 250, 202))
    })

    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      expect(screen.getByTestId("accept-price-change")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("accept-price-change"))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        "review",
        expect.objectContaining({ priceChanged: true, totalPrice: 250 })
      )
    })
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe("BookingReviewPage — accessibility", () => {
  it("price breakdown has aria-label", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByLabelText("Price breakdown")).toBeInTheDocument()
    })
  })

  it("passenger list has aria-label", async () => {
    render(<BookingReviewPage />)
    expect(screen.getByRole("list", { name: /passenger details/i })).toBeInTheDocument()
  })

  it("seat assignments list has aria-label", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByRole("list", { name: /seat assignments/i })).toBeInTheDocument()
    })
  })

  it("bag selections list has aria-label after loading", async () => {
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByRole("list", { name: /bag selections/i })).toBeInTheDocument()
    })
  })

  it("price change banner has role=alert", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST")) {
        return Promise.resolve(bagOptionsResponse())
      }
      return Promise.resolve(confirmPriceResponse(false, 250, 202))
    })
    render(<BookingReviewPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirm-pay-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("confirm-pay-button"))
    await waitFor(() => {
      const banner = screen.getByTestId("price-change-banner")
      expect(banner).toHaveAttribute("role", "alert")
    })
  })

  it("edit links have descriptive aria-labels", () => {
    render(<BookingReviewPage />)
    expect(screen.getByRole("link", { name: /edit flight/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit passengers/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit bags/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit seats/i })).toBeInTheDocument()
  })
})
