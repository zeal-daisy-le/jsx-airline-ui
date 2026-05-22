declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", eventName, params)
}

export function pageview(url: string): void {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", "page_view", { page_path: url })
}

export const bookingEvents = {
  stepViewed(step: string, params?: Record<string, unknown>): void {
    trackEvent("booking_step_viewed", { step, ...params })
  },
  stepCompleted(step: string, params?: Record<string, unknown>): void {
    trackEvent("booking_step_completed", { step, ...params })
  },
  abandoned(step: string, params?: Record<string, unknown>): void {
    trackEvent("booking_abandoned", { step, ...params })
  },
}
