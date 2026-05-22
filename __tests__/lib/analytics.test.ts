import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { pageview, trackEvent, bookingEvents } from "@/lib/analytics"

describe("analytics", () => {
  let mockGtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGtag = vi.fn()
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("trackEvent", () => {
    it("calls window.gtag with event name and params", () => {
      trackEvent("test_event", { foo: "bar" })
      expect(mockGtag).toHaveBeenCalledWith("event", "test_event", { foo: "bar" })
    })

    it("calls window.gtag without params when none provided", () => {
      trackEvent("test_event")
      expect(mockGtag).toHaveBeenCalledWith("event", "test_event", undefined)
    })

    it("is a no-op when window.gtag is not defined", () => {
      // @ts-expect-error intentional — simulates missing gtag in test/ad-blocked env
      window.gtag = undefined
      expect(() => trackEvent("test_event")).not.toThrow()
      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe("pageview", () => {
    it("fires page_view event with page_path", () => {
      pageview("/flights")
      expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
        page_path: "/flights",
      })
    })

    it("is a no-op when window.gtag is not defined", () => {
      // @ts-expect-error intentional
      window.gtag = undefined
      expect(() => pageview("/flights")).not.toThrow()
      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe("bookingEvents", () => {
    it("stepViewed fires booking_step_viewed with step", () => {
      bookingEvents.stepViewed("flights")
      expect(mockGtag).toHaveBeenCalledWith("event", "booking_step_viewed", {
        step: "flights",
      })
    })

    it("stepCompleted fires booking_step_completed with step", () => {
      bookingEvents.stepCompleted("passengers")
      expect(mockGtag).toHaveBeenCalledWith("event", "booking_step_completed", {
        step: "passengers",
      })
    })

    it("abandoned fires booking_abandoned with step", () => {
      bookingEvents.abandoned("payment")
      expect(mockGtag).toHaveBeenCalledWith("event", "booking_abandoned", {
        step: "payment",
      })
    })

    it("forwards extra params alongside step", () => {
      bookingEvents.stepViewed("seats", { flight_id: "JSX100" })
      expect(mockGtag).toHaveBeenCalledWith("event", "booking_step_viewed", {
        step: "seats",
        flight_id: "JSX100",
      })
    })
  })
})
