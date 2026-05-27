import type { NextPage } from "next"
import { useState, useEffect, useCallback } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/features/booking/utils/analytics"
import type {
  SelectedFlight,
  PassengerCount,
  TravelerInfo,
  ContactDetails,
  BagSelection,
  SeatAssignment,
} from "@/features/booking/stores/bookingStore"
import type { AuthUser } from "@/pages/api/auth/me"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfirmationSnapshot {
  bookingReference: string
  selectedFlight: SelectedFlight | null
  passengers: PassengerCount
  travelerInfo: TravelerInfo[]
  contactDetails: ContactDetails | null
  bagSelections: BagSelection[]
  seatAssignments: SeatAssignment[]
  confirmedTotalPrice: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(time?: string): string {
  if (!time) return "–"
  try {
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(":").map(Number)
      const d = new Date(0, 0, 0, h, m)
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    }
    const d = new Date(time)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  } catch {
    return time
  }
}

function formatDate(date?: string): string {
  if (!date) return "–"
  try {
    const suffix = date.length === 10 ? "T12:00:00" : ""
    const d = new Date(`${date}${suffix}`)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return date
  }
}

function totalPassengerCount(p: PassengerCount): number {
  return p.adults + p.children + p.infants
}

function passengerType(index: number, passengers: PassengerCount): string {
  if (index < passengers.adults) return "adult"
  if (index < passengers.adults + passengers.children) return "child"
  return "infant"
}

// ── ConfirmSectionCard ────────────────────────────────────────────────────────

function ConfirmSectionCard({
  title,
  children,
  "data-testid": testId,
}: {
  title: string
  children: React.ReactNode
  "data-testid"?: string
}) {
  return (
    <div className="rounded-xl border border-jsx-gray-200 bg-white p-5" data-testid={testId}>
      <h2 className="text-base font-semibold text-jsx-black mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const BookingConfirmationPage: NextPage = () => {
  const router = useRouter()
  const hasHydrated = useBookingStore((s) => s.hasHydrated)
  const showToast = useErrorStore((s) => s.showToast)

  const [snapshot, setSnapshot] = useState<ConfirmationSnapshot | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [accountPromptDismissed, setAccountPromptDismissed] = useState(false)

  // On mount: snapshot booking data, fire GA4, trigger confirmation email, clear store
  useEffect(() => {
    if (!hasHydrated || snapshot !== null) return

    const state = useBookingStore.getState()

    if (!state.bookingReference) {
      router.replace("/booking/flights")
      return
    }

    const snap: ConfirmationSnapshot = {
      bookingReference: state.bookingReference,
      selectedFlight: state.selectedFlight,
      passengers: state.passengers,
      travelerInfo: state.travelerInfo,
      contactDetails: state.contactDetails,
      bagSelections: state.bagSelections,
      seatAssignments: state.seatAssignments,
      confirmedTotalPrice: state.confirmedTotalPrice,
    }
    setSnapshot(snap)

    trackEvent("booking_completed", {
      booking_reference: state.bookingReference,
      total_value: state.confirmedTotalPrice,
      passenger_count: totalPassengerCount(state.passengers),
    })

    if (state.contactDetails?.email) {
      fetch("/api/booking/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingReference: state.bookingReference,
          contactEmail: state.contactDetails.email,
          passengerCount: totalPassengerCount(state.passengers),
          flightId: state.selectedFlight?.flightId ?? "",
        }),
      }).catch(() => {
        showToast("Confirmation email could not be sent. Please contact support.")
      })
    }

    // Clear Zustand state and sessionStorage to prevent re-booking
    state.resetBooking()
  }, [hasHydrated, snapshot, router, showToast])

  // Determine guest vs logged-in for account prompt
  useEffect(() => {
    if (!hasHydrated) return
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: AuthUser | null }) => setIsLoggedIn(!!data.user))
      .catch(() => setIsLoggedIn(false))
  }, [hasHydrated])

  const handleDismissAccountPrompt = useCallback(() => {
    setAccountPromptDismissed(true)
  }, [])

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print()
  }, [])

  if (!hasHydrated || !snapshot) return null

  const passengerCount = totalPassengerCount(snapshot.passengers)
  const showAccountPrompt = isLoggedIn === false && !accountPromptDismissed
  const contactEmail = snapshot.contactDetails?.email

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>Booking confirmed — JSX</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-jsx-gray-50 print:bg-white">
        <div className="print:hidden">
          <SiteHeader />
        </div>

        <main
          className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6"
          data-testid="confirmation-main"
        >
          {/* Success header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4"
              aria-hidden="true"
            >
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-display-sm font-semibold text-jsx-black">Booking confirmed!</h1>
            {contactEmail && (
              <p className="mt-2 text-jsx-gray-500">
                A confirmation has been sent to{" "}
                <span data-testid="confirmation-email">{contactEmail}</span>.
              </p>
            )}
          </div>

          {/* PNR */}
          <div
            className="rounded-xl border-2 border-jsx-red bg-white p-6 text-center mb-6"
            data-testid="pnr-section"
          >
            <p className="text-sm font-medium text-jsx-gray-500 uppercase tracking-wide">
              Booking reference
            </p>
            <p
              className="text-4xl font-bold text-jsx-black mt-1 tracking-widest font-mono"
              aria-label={`Booking reference: ${snapshot.bookingReference}`}
              data-testid="booking-reference"
            >
              {snapshot.bookingReference}
            </p>
            <p className="mt-3 text-xs text-jsx-gray-400">
              Save this reference — you&apos;ll need it to manage your booking.
            </p>
          </div>

          <div className="space-y-4">
            {/* Flight */}
            {snapshot.selectedFlight && (
              <ConfirmSectionCard title="Flight" data-testid="flight-section">
                <div className="space-y-1 text-sm text-jsx-gray-700">
                  <div
                    className="flex items-center gap-2 text-base font-medium text-jsx-black"
                    aria-label={`${snapshot.selectedFlight.origin} to ${snapshot.selectedFlight.destination}`}
                  >
                    <span data-testid="flight-origin">{snapshot.selectedFlight.origin}</span>
                    <span aria-hidden="true">→</span>
                    <span data-testid="flight-destination">
                      {snapshot.selectedFlight.destination}
                    </span>
                  </div>
                  {(snapshot.selectedFlight.departureTime ||
                    snapshot.selectedFlight.arrivalTime) && (
                    <div className="text-jsx-gray-600">
                      {formatTime(snapshot.selectedFlight.departureTime as string | undefined)}
                      {snapshot.selectedFlight.arrivalTime && (
                        <>
                          {" "}
                          –{" "}
                          {formatTime(snapshot.selectedFlight.arrivalTime as string | undefined)}
                        </>
                      )}
                    </div>
                  )}
                  {snapshot.selectedFlight.departureDate && (
                    <div className="text-jsx-gray-600" data-testid="flight-date">
                      {formatDate(snapshot.selectedFlight.departureDate as string | undefined)}
                    </div>
                  )}
                  {snapshot.selectedFlight.flightNumber && (
                    <div className="text-jsx-gray-500 text-xs">
                      Flight {snapshot.selectedFlight.flightNumber as string}
                    </div>
                  )}
                  <div className="mt-1 text-jsx-gray-600">
                    {passengerCount} passenger{passengerCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </ConfirmSectionCard>
            )}

            {/* Passengers */}
            <ConfirmSectionCard title="Passengers" data-testid="passengers-section">
              <ul className="space-y-2" aria-label="Passengers">
                {snapshot.travelerInfo.length > 0
                  ? snapshot.travelerInfo.map((info, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-jsx-black">
                          {info.firstName} {info.lastName}
                        </span>
                        <span className="text-jsx-gray-500 text-xs capitalize">
                          {passengerType(i, snapshot.passengers)}
                        </span>
                      </li>
                    ))
                  : Array.from({ length: passengerCount }, (_, i) => (
                      <li key={i} className="text-sm text-jsx-gray-700">
                        Passenger {i + 1}
                      </li>
                    ))}
              </ul>
              {contactEmail && (
                <div className="mt-3 pt-3 border-t border-jsx-gray-100 text-sm text-jsx-gray-600">
                  <span className="font-medium text-jsx-black">Contact: </span>
                  {contactEmail}
                </div>
              )}
            </ConfirmSectionCard>

            {/* Seats */}
            {snapshot.seatAssignments.length > 0 && (
              <ConfirmSectionCard title="Seats" data-testid="seats-section">
                <ul className="space-y-1.5" aria-label="Seat assignments">
                  {snapshot.seatAssignments.map((a, i) => {
                    const info = snapshot.travelerInfo[a.passengerIndex]
                    return (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-jsx-gray-700">
                          {info ? `${info.firstName} ${info.lastName}` : `Passenger ${a.passengerIndex + 1}`}
                        </span>
                        <span className="font-medium text-jsx-black">Seat {a.seatNumber}</span>
                      </li>
                    )
                  })}
                </ul>
              </ConfirmSectionCard>
            )}

            {/* Total paid */}
            <div
              className="rounded-xl border border-jsx-gray-200 bg-white p-5"
              data-testid="price-section"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-jsx-black">Total paid</h2>
                <span
                  className="text-xl font-bold text-jsx-black"
                  data-testid="total-paid"
                  aria-label={
                    snapshot.confirmedTotalPrice !== null
                      ? `Total paid: $${snapshot.confirmedTotalPrice}`
                      : "Total amount not available"
                  }
                >
                  {snapshot.confirmedTotalPrice !== null ? `$${snapshot.confirmedTotalPrice}` : "–"}
                </span>
              </div>
            </div>

            {/* Account prompt — guest users only, dismissible */}
            {showAccountPrompt && (
              <div
                className="rounded-xl border border-jsx-gray-200 bg-white p-5"
                data-testid="account-prompt"
                role="region"
                aria-label="Create an account"
              >
                <h2 className="text-base font-semibold text-jsx-black mb-1">
                  Save your booking to your account
                </h2>
                <p className="text-sm text-jsx-gray-600 mb-4">
                  Create a free JSX account to manage your booking, check in online, and access it
                  from any device.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="jsx"
                    size="sm"
                    data-testid="create-account-btn"
                    onClick={() => router.push("/auth/register")}
                  >
                    Create account
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-jsx-gray-500 underline focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
                    data-testid="dismiss-account-prompt"
                    onClick={handleDismissAccountPrompt}
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {/* Account association notice — logged-in users only */}
            {isLoggedIn === true && (
              <div
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                data-testid="account-association-notice"
                role="status"
              >
                This booking has been associated with your JSX account.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                data-testid="print-btn"
              >
                Print confirmation
              </Button>
              <Link
                href="/"
                className="text-sm font-medium text-jsx-red hover:underline focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
                data-testid="home-link"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default BookingConfirmationPage
