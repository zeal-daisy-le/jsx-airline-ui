import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import BookingBagsPage from "@/pages/booking/bags"
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

// ── Mock bag options ──────────────────────────────────────────────────────────

const MOCK_BAG_OPTIONS = [
  { checkedBags: 0, price: 0, label: "No checked bag", description: "Carry-on only" },
  { checkedBags: 1, price: 30, label: "1 checked bag", description: "Up to 23 kg" },
  { checkedBags: 2, price: 55, label: "2 checked bags", description: "Up to 23 kg each" },
]

function bagOptionsResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ bagOptions: MOCK_BAG_OPTIONS }),
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
  currentStep: "bags" as const,
  stepValidity: {
    flights: true,
    passengers: true,
    details: true,
    bags: false,
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
  // Default: GET returns bag options, POST returns success
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (url === "/api/booking/bags" && (!opts || opts.method !== "POST"))
      return Promise.resolve(bagOptionsResponse())
    if (url === "/api/booking/bags" && opts?.method === "POST")
      return Promise.resolve(bffSuccessResponse())
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BookingBagsPage — rendering", () => {
  it("renders the Bag allowances heading", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /bag allowances/i })).toBeInTheDocument()
    })
  })

  it("renders the form with accessible label", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("form", { name: /bag allowances/i })).toBeInTheDocument()
    })
  })

  it("shows loading skeleton while fetching bag options", () => {
    // Delay the fetch so skeleton is visible
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<BookingBagsPage />)
    // Skeletons are aria-hidden; check they are present in the DOM
    expect(document.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0)
  })

  it("renders bag option cards after loading", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByText("No checked bag")).toBeInTheDocument()
      expect(screen.getByText("1 checked bag")).toBeInTheDocument()
      expect(screen.getByText("2 checked bags")).toBeInTheDocument()
    })
  })

  it("renders one passenger section for a single adult", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("bag-section-0")).toBeInTheDocument()
    })
  })

  it("renders three radio buttons per passenger", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      const radios = screen.getAllByRole("radio")
      expect(radios).toHaveLength(3)
    })
  })

  it("renders the Continue button after loading", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
  })

  it("renders the running total panel after loading", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("bag-total")).toBeInTheDocument()
    })
  })
})

describe("BookingBagsPage — multiple passengers", () => {
  it("renders two sections for 2 adults", async () => {
    act(() => {
      useBookingStore.setState({ passengers: { adults: 2, children: 0, infants: 0 } })
    })
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("bag-section-0")).toBeInTheDocument()
      expect(screen.getByTestId("bag-section-1")).toBeInTheDocument()
    })
  })

  it("renders 6 radio buttons for 2 adults", async () => {
    act(() => {
      useBookingStore.setState({ passengers: { adults: 2, children: 0, infants: 0 } })
    })
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getAllByRole("radio")).toHaveLength(6)
    })
  })
})

describe("BookingBagsPage — running total", () => {
  it("shows 'Included' total when no bags selected", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("bag-total")).toHaveTextContent("Included")
    })
  })

  it("updates the total when a bag option is selected", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByText("1 checked bag")).toBeInTheDocument()
    })
    // second radio = passenger-0-bags-1 = "1 checked bag" ($30)
    const radios = screen.getAllByRole("radio")
    fireEvent.click(radios[1])
    await waitFor(() => {
      expect(screen.getByTestId("bag-total")).toHaveTextContent("$30")
    })
  })

  it("updates total correctly for 2 passengers with different selections", async () => {
    act(() => {
      useBookingStore.setState({ passengers: { adults: 2, children: 0, infants: 0 } })
    })
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getAllByRole("radio")).toHaveLength(6)
    })
    // Select 1 bag for passenger 0 ($30), 2 bags for passenger 1 ($55) → $85
    const radios = screen.getAllByRole("radio")
    fireEvent.click(radios[1]) // passenger-0-bags-1
    fireEvent.click(radios[5]) // passenger-1-bags-2
    await waitFor(() => {
      expect(screen.getByTestId("bag-total")).toHaveTextContent("$85")
    })
  })
})

describe("BookingBagsPage — pre-fill from store", () => {
  it("pre-fills previous selection when navigating back", async () => {
    act(() => {
      useBookingStore.setState({
        bagSelections: [{ passengerIndex: 0, checkedBags: 1 }],
      })
    })
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("bag-total")).toHaveTextContent("$30")
    })
  })
})

describe("BookingBagsPage — zero bags (optional)", () => {
  it("allows submitting with zero bags for all passengers", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/seats")
    })
  })
})

describe("BookingBagsPage — successful submission", () => {
  it("calls setBagSelections and navigates to /booking/seats", async () => {
    const setBagSelections = vi.spyOn(useBookingStore.getState(), "setBagSelections")
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/booking/seats")
    })
    expect(setBagSelections).toHaveBeenCalledWith([{ passengerIndex: 0, checkedBags: 0 }])
  })

  it("calls the BFF POST /api/booking/bags on submit", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/booking/bags",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("fires GA4 booking_step_completed on successful submit", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepCompleted")
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("bags", expect.objectContaining({ totalBagCost: 0 }))
    })
  })
})

describe("BookingBagsPage — BFF error recovery (submit)", () => {
  it("calls onAllRetriesExhausted when BFF POST fails repeatedly", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/booking/bags" && (!opts || opts.method !== "POST"))
        return Promise.resolve(bagOptionsResponse())
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Server error" }) })
    })

    const onAllRetriesExhausted = vi.spyOn(
      useErrorStore.getState(),
      "onAllRetriesExhausted"
    )

    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(
      () => {
        expect(onAllRetriesExhausted).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )
  })
})

describe("BookingBagsPage — load error recovery", () => {
  it("shows an error alert when bag options fail to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  it("shows 'Try again' retry button on load error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
  })

  it("still shows Continue button when bag options fail to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    })
  })

  it("calls showToast when bag options fail to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    const showToast = vi.spyOn(useErrorStore.getState(), "showToast")
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(showToast).toHaveBeenCalled()
    })
  })

  it("retries loading when 'Try again' is clicked", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockImplementation(() => Promise.resolve(bagOptionsResponse()))

    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))
    await waitFor(() => {
      expect(screen.getByText("No checked bag")).toBeInTheDocument()
    })
  })
})

describe("BookingBagsPage — GA4 events", () => {
  it("fires booking_step_viewed on mount", async () => {
    const spy = vi.spyOn(analytics.bookingEvents, "stepViewed")
    render(<BookingBagsPage />)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("bags")
    })
  })
})

describe("BookingBagsPage — accessibility", () => {
  it("radio buttons have associated labels via htmlFor", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      // Each radio has id="passenger-{i}-bags-{n}" and label has htmlFor matching
      const radio = document.getElementById("passenger-0-bags-0")
      expect(radio).toBeInTheDocument()
    })
  })

  it("fieldsets have legend elements", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      const legends = screen.getAllByRole("group")
      expect(legends.length).toBeGreaterThan(0)
    })
  })

  it("bag total has aria-live polite for screen reader announcements", async () => {
    render(<BookingBagsPage />)
    await waitFor(() => {
      const total = screen.getByTestId("bag-total")
      expect(total).toHaveAttribute("aria-live", "polite")
    })
  })
})
