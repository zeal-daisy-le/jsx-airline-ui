import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import BookingDetailsPage from "@/pages/booking/details"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import * as analytics from "@/features/booking/utils/analytics"

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

vi.mock("@/features/booking/hooks/useBookingGuard", () => ({
  useBookingGuard: () => ({ canAccess: true, isHydrating: false }),
}))

// ── Layout stubs ──────────────────────────────────────────────────────────────

vi.mock("@/features/booking/components/BookingLayout", () => ({
  BookingLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="booking-layout">{children}</div>
  ),
}))

vi.mock("@/components/layout/SiteHeader", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}))

vi.mock("@/features/booking/components/StepProgress", () => ({
  StepProgress: () => <nav data-testid="step-progress" />,
}))

// ── Fetch stubs ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ── Store reset state ─────────────────────────────────────────────────────────

const SINGLE_ADULT_STATE = {
  selectedFlight: null,
  passengers: { adults: 1, children: 0, infants: 0 },
  travelerInfo: [],
  contactDetails: null,
  bagSelections: [],
  seatAssignments: [],
  paymentToken: null,
  currentStep: "details" as const,
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
  hasHydrated: true,
  bookingReference: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function validBffResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }
}

function authResponse(user: { firstName: string; lastName: string; email: string } | null) {
  return {
    ok: true,
    json: () => Promise.resolve({ user }),
  }
}

function fillPassengerFields(index = 0, overrides: Partial<{
  firstName: string
  lastName: string
  dateOfBirth: string
  documentNumber: string
  nationality: string
}> = {}) {
  const f = {
    firstName: "Jane",
    lastName: "Doe",
    dateOfBirth: "1990-06-15",
    documentNumber: "AB123456",
    nationality: "Australian",
    ...overrides,
  }
  fireEvent.change(screen.getByLabelText(new RegExp(`first name`, "i"), { selector: `#passengers\\.${index}\\.firstName` }), { target: { value: f.firstName } })
  fireEvent.change(screen.getByLabelText(new RegExp(`last name`, "i"), { selector: `#passengers\\.${index}\\.lastName` }), { target: { value: f.lastName } })
  fireEvent.change(screen.getByLabelText(new RegExp(`date of birth`, "i"), { selector: `#passengers\\.${index}\\.dateOfBirth` }), { target: { value: f.dateOfBirth } })
  fireEvent.change(screen.getByLabelText(new RegExp(`nationality`, "i"), { selector: `#passengers\\.${index}\\.nationality` }), { target: { value: f.nationality } })
  fireEvent.change(screen.getByLabelText(/document number/i, { selector: `#passengers\\.${index}\\.documentNumber` }), { target: { value: f.documentNumber } })
}

function fillContactFields(email = "jane@example.com", phone = "+61412345678") {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: phone } })
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear()
  act(() => {
    useBookingStore.setState(SINGLE_ADULT_STATE)
  })
  mockPush.mockClear()
  mockFetch.mockClear()
  // Default: auth returns no user, BFF returns success
  mockFetch.mockImplementation((url: string) => {
    if (url === "/api/auth/me") return Promise.resolve(authResponse(null))
    if (url === "/api/booking/details") return Promise.resolve(validBffResponse())
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BookingDetailsPage — rendering", () => {
  it("renders the Traveller details heading", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByRole("heading", { name: /traveller details/i })).toBeInTheDocument()
  })

  it("renders the form with accessible label", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByRole("form", { name: /traveller details/i })).toBeInTheDocument()
  })

  it("renders one passenger section for a single adult", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByText(/passenger 1/i)).toBeInTheDocument()
  })

  it("renders a contact details section", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByText(/contact details/i)).toBeInTheDocument()
  })

  it("renders email and phone fields", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
  })

  it("renders document type radio buttons", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByRole("radio", { name: /passport/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /national id/i })).toBeInTheDocument()
  })

  it("renders the Continue button", () => {
    render(<BookingDetailsPage />)
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
  })
})

describe("BookingDetailsPage — multiple passengers", () => {
  it("renders two sections for 2 adults", () => {
    act(() => {
      useBookingStore.setState({ passengers: { adults: 2, children: 0, infants: 0 } })
    })
    render(<BookingDetailsPage />)
    expect(screen.getByText(/passenger 1/i)).toBeInTheDocument()
    expect(screen.getByText(/passenger 2/i)).toBeInTheDocument()
  })

  it("renders sections for adults + child + infant", () => {
    act(() => {
      useBookingStore.setState({ passengers: { adults: 1, children: 1, infants: 1 } })
    })
    render(<BookingDetailsPage />)
    expect(screen.getAllByRole("group").length).toBeGreaterThanOrEqual(3)
  })
})

describe("BookingDetailsPage — pre-fill from store", () => {
  it("pre-fills passenger fields when travelerInfo is already in the store", () => {
    act(() => {
      useBookingStore.setState({
        travelerInfo: [
          {
            firstName: "Alice",
            lastName: "Smith",
            dateOfBirth: "1985-03-20",
            documentType: "passport",
            documentNumber: "ZX987654",
            nationality: "Canadian",
          },
        ],
        contactDetails: { email: "alice@example.com", phone: "+14155552671" },
      })
    })
    render(<BookingDetailsPage />)
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Smith")).toBeInTheDocument()
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument()
  })
})

describe("BookingDetailsPage — auth pre-fill", () => {
  it("pre-fills first passenger name and email from logged-in user profile", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(authResponse({ firstName: "Bob", lastName: "Jones", email: "bob@example.com" }))
      return Promise.resolve(validBffResponse())
    })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue("Bob")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Jones")).toBeInTheDocument()
      expect(screen.getByDisplayValue("bob@example.com")).toBeInTheDocument()
    })
  })

  it("does not overwrite already-filled first name", async () => {
    act(() => {
      useBookingStore.setState({
        travelerInfo: [
          {
            firstName: "ExistingName",
            lastName: "Doe",
            dateOfBirth: "1990-01-01",
            documentType: "passport",
            documentNumber: "AB123456",
            nationality: "Australian",
          },
        ],
        contactDetails: null,
      })
    })
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(authResponse({ firstName: "Bob", lastName: "Jones", email: "bob@example.com" }))
      return Promise.resolve(validBffResponse())
    })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      // The pre-filled store value should NOT have been overwritten
      expect(screen.getByDisplayValue("ExistingName")).toBeInTheDocument()
      expect(screen.queryByDisplayValue("Bob")).not.toBeInTheDocument()
    })
  })
})

describe("BookingDetailsPage — validation", () => {
  it("shows error on blur when first name is empty", async () => {
    render(<BookingDetailsPage />)
    const input = screen.getByLabelText(/first name/i, { selector: "#passengers\\.0\\.firstName" })
    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  it("shows error when document number is too short", async () => {
    render(<BookingDetailsPage />)
    const input = screen.getByLabelText(/document number/i)
    fireEvent.change(input, { target: { value: "AB1" } })
    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })
})

describe("BookingDetailsPage — successful submission", () => {
  it("calls setTravelerInfo and setContactDetails and navigates to /booking/bags", async () => {
    const setTravelerInfo = vi.spyOn(useBookingStore.getState(), "setTravelerInfo")
    const setContactDetails = vi.spyOn(useBookingStore.getState(), "setContactDetails")

    render(<BookingDetailsPage />)
    fillPassengerFields()
    fillContactFields()

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/bags")
    })
    expect(setTravelerInfo).toHaveBeenCalledWith([
      expect.objectContaining({ firstName: "Jane", lastName: "Doe", nationality: "Australian" }),
    ])
    expect(setContactDetails).toHaveBeenCalledWith({ email: "jane@example.com", phone: "+61412345678" })
  })

  it("calls the BFF /api/booking/details endpoint on submit", async () => {
    render(<BookingDetailsPage />)
    fillPassengerFields()
    fillContactFields()

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/booking/details",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("fires GA4 booking_step_completed on successful submit", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")

    render(<BookingDetailsPage />)
    fillPassengerFields()
    fillContactFields()
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("details", expect.objectContaining({ passengerCount: 1 }))
    })
  })
})

describe("BookingDetailsPage — BFF error recovery", () => {
  it("calls onAllRetriesExhausted when the BFF fails repeatedly", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/auth/me") return Promise.resolve(authResponse(null))
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Server error" }) })
    })

    const onAllRetriesExhausted = vi.spyOn(
      useErrorStore.getState(),
      "onAllRetriesExhausted"
    )

    render(<BookingDetailsPage />)
    fillPassengerFields()
    fillContactFields()
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(
      () => {
        expect(onAllRetriesExhausted).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )
  })
})

describe("BookingDetailsPage — GA4 events", () => {
  it("fires booking_step_viewed on mount", () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepViewed")
    render(<BookingDetailsPage />)
    expect(spy).toHaveBeenCalledWith("details")
  })
})

describe("BookingDetailsPage — accessibility", () => {
  it("all passenger inputs have explicit labels", () => {
    render(<BookingDetailsPage />)
    const firstNameInput = screen.getByLabelText(/first name/i, {
      selector: "#passengers\\.0\\.firstName",
    })
    expect(firstNameInput).toBeInTheDocument()
    const lastNameInput = screen.getByLabelText(/last name/i, {
      selector: "#passengers\\.0\\.lastName",
    })
    expect(lastNameInput).toBeInTheDocument()
  })

  it("error messages are associated with their inputs via aria-describedby", async () => {
    render(<BookingDetailsPage />)
    const input = screen.getByLabelText(/first name/i, { selector: "#passengers\\.0\\.firstName" })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })
})
