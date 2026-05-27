import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import BookingConfirmationPage from "@/pages/booking/confirmation"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import * as analytics from "@/features/booking/utils/analytics"

// ── Next.js stubs ─────────────────────────────────────────────────────────────

const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

// ── Layout stubs ──────────────────────────────────────────────────────────────

vi.mock("@/components/layout/SiteHeader", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}))

// ── Fetch stubs ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ── Window.print stub ─────────────────────────────────────────────────────────

vi.stubGlobal("print", vi.fn())

// ── Mock data ─────────────────────────────────────────────────────────────────

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

const MOCK_TRAVELER_1 = {
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  documentType: "passport" as const,
  documentNumber: "AB123456",
  nationality: "US",
}

const MOCK_TRAVELER_2 = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1992-05-15",
  documentType: "passport" as const,
  documentNumber: "CD789012",
  nationality: "US",
}

const MOCK_CONTACT = { email: "jane@example.com", phone: "+1234567890" }

const FULL_BOOKING_STATE = {
  selectedFlight: MOCK_FLIGHT,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelerInfo: [MOCK_TRAVELER_1],
  contactDetails: MOCK_CONTACT,
  bagSelections: [{ passengerIndex: 0, checkedBags: 1 }],
  seatAssignments: [{ passengerIndex: 0, seatNumber: "12A" }],
  paymentToken: "tok_test_123",
  bookingReference: "JSX-12345",
  confirmedTotalPrice: 218,
  currentStep: "confirmation" as const,
  stepValidity: {
    flights: true,
    passengers: true,
    details: true,
    bags: true,
    seats: true,
    review: true,
    payment: true,
    confirmation: false,
  },
  hasHydrated: true,
}

function guestAuthResponse() {
  return { ok: true, json: () => Promise.resolve({ user: null }) }
}

function loggedInAuthResponse() {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        user: { id: "u1", email: "jane@example.com", firstName: "Jane", lastName: "Doe" },
      }),
  }
}

function confirmationEmailResponse() {
  return { ok: true, json: () => Promise.resolve({ success: true }) }
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear()
  act(() => {
    useBookingStore.setState(FULL_BOOKING_STATE)
  })
  mockPush.mockClear()
  mockReplace.mockClear()
  mockFetch.mockClear()
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (url === "/api/auth/me") return Promise.resolve(guestAuthResponse())
    if (url === "/api/booking/send-confirmation" && opts?.method === "POST")
      return Promise.resolve(confirmationEmailResponse())
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
  vi.spyOn(analytics, "trackEvent").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Guard behavior ────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — guard", () => {
  it("renders nothing (returns null) when hasHydrated is false", () => {
    act(() => {
      useBookingStore.setState({ hasHydrated: false, bookingReference: null })
    })
    const { container } = render(<BookingConfirmationPage />)
    expect(container.firstChild).toBeNull()
  })

  it("redirects to flights when bookingReference is null after hydration", async () => {
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, bookingReference: null })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/booking/flights")
    })
  })
})

// ── Page structure ────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — structure", () => {
  it("renders the 'Booking confirmed!' heading", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /booking confirmed/i })
      ).toBeInTheDocument()
    })
  })

  it("renders the site header", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("site-header")).toBeInTheDocument()
    })
  })

  it("renders the print button", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("print-btn")).toBeInTheDocument()
    })
  })

  it("renders the back to homepage link", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("home-link")).toBeInTheDocument()
    })
  })

  it("home link points to /", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("home-link")).toHaveAttribute("href", "/")
    })
  })
})

// ── PNR display ───────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — PNR", () => {
  it("renders the booking reference", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("booking-reference")).toHaveTextContent("JSX-12345")
    })
  })

  it("PNR element has an accessible aria-label with the full reference", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      const pnr = screen.getByTestId("booking-reference")
      expect(pnr).toHaveAttribute("aria-label", "Booking reference: JSX-12345")
    })
  })

  it("renders the PNR section card", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("pnr-section")).toBeInTheDocument()
    })
  })

  it("PNR section contains 'Booking reference' label text", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("pnr-section")).toHaveTextContent(/booking reference/i)
    })
  })
})

// ── Flight section ────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — flight section", () => {
  it("renders the flight section", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("flight-section")).toBeInTheDocument()
    })
  })

  it("shows origin airport code", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("flight-origin")).toHaveTextContent("LAX")
    })
  })

  it("shows destination airport code", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("flight-destination")).toHaveTextContent("SFO")
    })
  })

  it("shows the departure date", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("flight-date")).toBeInTheDocument()
    })
  })

  it("does not render flight section when no flight selected", async () => {
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, selectedFlight: null })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.queryByTestId("flight-section")).not.toBeInTheDocument()
    })
  })
})

// ── Passengers section ────────────────────────────────────────────────────────

describe("BookingConfirmationPage — passengers section", () => {
  it("renders the passengers section", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("passengers-section")).toBeInTheDocument()
    })
  })

  it("shows passenger name from travelerInfo", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      const section = screen.getByTestId("passengers-section")
      expect(within(section).getByText("Jane Doe")).toBeInTheDocument()
    })
  })

  it("shows passenger type label", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      const section = screen.getByTestId("passengers-section")
      expect(within(section).getByText("adult")).toBeInTheDocument()
    })
  })

  it("shows all passengers for multi-passenger booking", async () => {
    act(() => {
      useBookingStore.setState({
        ...FULL_BOOKING_STATE,
        passengers: { adults: 2, children: 0, infants: 0 },
        travelerInfo: [MOCK_TRAVELER_1, MOCK_TRAVELER_2],
        seatAssignments: [],
      })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      const section = screen.getByTestId("passengers-section")
      expect(within(section).getByText("Jane Doe")).toBeInTheDocument()
      expect(within(section).getByText("John Doe")).toBeInTheDocument()
    })
  })

  it("shows contact email in passengers section", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-email")).toHaveTextContent("jane@example.com")
    })
  })
})

// ── Seats section ─────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — seats section", () => {
  it("renders seats section when seat assignments exist", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("seats-section")).toBeInTheDocument()
    })
  })

  it("shows seat number for each assignment", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByText("Seat 12A")).toBeInTheDocument()
    })
  })

  it("does not render seats section when no assignments", async () => {
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, seatAssignments: [] })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.queryByTestId("seats-section")).not.toBeInTheDocument()
    })
  })
})

// ── Price section ─────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — price section", () => {
  it("renders the price section", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("price-section")).toBeInTheDocument()
    })
  })

  it("shows confirmed total price", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("total-paid")).toHaveTextContent("$218")
    })
  })

  it("shows dash when confirmedTotalPrice is null", async () => {
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, confirmedTotalPrice: null })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("total-paid")).toHaveTextContent("–")
    })
  })

  it("total-paid has accessible aria-label when price is available", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("total-paid")).toHaveAttribute(
        "aria-label",
        "Total paid: $218"
      )
    })
  })
})

// ── Account prompt — guest users ──────────────────────────────────────────────

describe("BookingConfirmationPage — account prompt (guest)", () => {
  it("shows account prompt for guest users", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-prompt")).toBeInTheDocument()
    })
  })

  it("account prompt contains 'Save your booking' heading", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-prompt")).toHaveTextContent(/save your booking/i)
    })
  })

  it("account prompt has a create account button", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("create-account-btn")).toBeInTheDocument()
    })
  })

  it("account prompt has a dismiss button", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("dismiss-account-prompt")).toBeInTheDocument()
    })
  })

  it("dismissing account prompt hides it", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-prompt")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("dismiss-account-prompt"))
    await waitFor(() => {
      expect(screen.queryByTestId("account-prompt")).not.toBeInTheDocument()
    })
  })

  it("confirmation still shows after dismissing account prompt", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-prompt")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("dismiss-account-prompt"))
    expect(screen.getByTestId("booking-reference")).toBeInTheDocument()
  })

  it("does not show account association notice for guest users", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.queryByTestId("account-association-notice")).not.toBeInTheDocument()
    })
  })
})

// ── Account association — logged-in users ─────────────────────────────────────

describe("BookingConfirmationPage — account association (logged-in)", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/auth/me") return Promise.resolve(loggedInAuthResponse())
      if (url === "/api/booking/send-confirmation" && opts?.method === "POST")
        return Promise.resolve(confirmationEmailResponse())
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })
  })

  it("shows account association notice for logged-in users", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-association-notice")).toBeInTheDocument()
    })
  })

  it("does not show account creation prompt for logged-in users", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-association-notice")).toBeInTheDocument()
    })
    expect(screen.queryByTestId("account-prompt")).not.toBeInTheDocument()
  })
})

// ── Store clearing ────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — store clearing", () => {
  it("calls resetBooking to clear the store after displaying confirmation", async () => {
    const resetBooking = vi.fn()
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, resetBooking })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(resetBooking).toHaveBeenCalled()
    })
  })

  it("continues to display snapshot data after store is cleared", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("booking-reference")).toHaveTextContent("JSX-12345")
    })
    act(() => {
      useBookingStore.setState({
        bookingReference: null,
        selectedFlight: null,
        confirmedTotalPrice: null,
      })
    })
    // Snapshot should still be displayed
    expect(screen.getByTestId("booking-reference")).toHaveTextContent("JSX-12345")
  })
})

// ── GA4 events ────────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — GA4", () => {
  it("fires booking_completed event on mount", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        "booking_completed",
        expect.objectContaining({ booking_reference: "JSX-12345" })
      )
    })
  })

  it("includes total_value in booking_completed event", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        "booking_completed",
        expect.objectContaining({ total_value: 218 })
      )
    })
  })

  it("includes passenger_count in booking_completed event", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        "booking_completed",
        expect.objectContaining({ passenger_count: 1 })
      )
    })
  })
})

// ── Confirmation email BFF ────────────────────────────────────────────────────

describe("BookingConfirmationPage — send-confirmation", () => {
  it("calls POST /api/booking/send-confirmation on mount", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/booking/send-confirmation",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("includes bookingReference and contactEmail in the request body", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      const call = mockFetch.mock.calls.find(
        ([url]: [string]) => url === "/api/booking/send-confirmation"
      )
      expect(call).toBeDefined()
      const body = JSON.parse(call![1].body as string)
      expect(body.bookingReference).toBe("JSX-12345")
      expect(body.contactEmail).toBe("jane@example.com")
    })
  })

  it("shows toast if send-confirmation fetch fails — page still displays", async () => {
    const showToast = vi.spyOn(useErrorStore.getState(), "showToast")
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/auth/me") return Promise.resolve(guestAuthResponse())
      if (url === "/api/booking/send-confirmation") return Promise.reject(new Error("Network error"))
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("booking-reference")).toHaveTextContent("JSX-12345")
    })
    await waitFor(() => {
      expect(showToast).toHaveBeenCalled()
    })
  })

  it("does not call send-confirmation when no contact email is stored", async () => {
    act(() => {
      useBookingStore.setState({ ...FULL_BOOKING_STATE, contactDetails: null })
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("booking-reference")).toHaveTextContent("JSX-12345")
    })
    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/booking/send-confirmation",
      expect.anything()
    )
  })
})

// ── Print ─────────────────────────────────────────────────────────────────────

describe("BookingConfirmationPage — print", () => {
  it("clicking print button calls window.print()", async () => {
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("print-btn")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("print-btn"))
    expect(window.print).toHaveBeenCalled()
  })
})

// ── Auth failure fallback ─────────────────────────────────────────────────────

describe("BookingConfirmationPage — auth fetch failure", () => {
  it("treats user as guest if /api/auth/me fetch fails", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/auth/me") return Promise.reject(new Error("Network error"))
      if (url === "/api/booking/send-confirmation" && opts?.method === "POST")
        return Promise.resolve(confirmationEmailResponse())
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })
    render(<BookingConfirmationPage />)
    await waitFor(() => {
      expect(screen.getByTestId("account-prompt")).toBeInTheDocument()
    })
    expect(screen.queryByTestId("account-association-notice")).not.toBeInTheDocument()
  })
})
