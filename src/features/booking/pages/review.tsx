import type { NextPage } from "next"
import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { Button } from "@/components/ui/button"
import { withRetry } from "@/lib/api/retry"
import { bookingEvents } from "@/features/booking/utils/analytics"
import type { BagOption } from "@/pages/api/booking/bags"
import type { ConfirmPriceResponse } from "@/pages/api/booking/confirm-price"
import type { PassengerCount } from "@/features/booking/stores/bookingStore"

// ── Constants ─────────────────────────────────────────────────────────────────

const FIRST_CLASS_ROWS = [1, 2, 3]
const FIRST_CLASS_SEAT_PRICE = 45
const TAX_RATE = 0.12

// ── Helpers ───────────────────────────────────────────────────────────────────

type PassengerEntry = { type: "adult" | "child" | "infant"; label: string }

function buildPassengerList(passengers: PassengerCount): PassengerEntry[] {
  const list: PassengerEntry[] = []
  for (let i = 0; i < passengers.adults; i++) {
    list.push({ type: "adult", label: passengers.adults === 1 ? "Adult" : `Adult ${i + 1}` })
  }
  for (let i = 0; i < passengers.children; i++) {
    list.push({ type: "child", label: passengers.children === 1 ? "Child" : `Child ${i + 1}` })
  }
  for (let i = 0; i < passengers.infants; i++) {
    list.push({ type: "infant", label: passengers.infants === 1 ? "Infant" : `Infant ${i + 1}` })
  }
  return list
}

export function getSeatPrice(seatNumber: string): number {
  const row = parseInt(seatNumber, 10)
  return FIRST_CLASS_ROWS.includes(row) ? FIRST_CLASS_SEAT_PRICE : 0
}

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

// ── ReviewSectionCard ─────────────────────────────────────────────────────────

interface ReviewSectionCardProps {
  title: string
  editHref: string
  children: React.ReactNode
  "data-testid"?: string
}

function ReviewSectionCard({
  title,
  editHref,
  children,
  "data-testid": testId,
}: ReviewSectionCardProps) {
  return (
    <div className="rounded-xl border border-jsx-gray-200 bg-white p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-jsx-black">{title}</h2>
        <Link
          href={editHref}
          className="text-sm font-medium text-jsx-red hover:underline focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          Edit
        </Link>
      </div>
      {children}
    </div>
  )
}

// ── PriceRow ──────────────────────────────────────────────────────────────────

function PriceRow({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: string
  isTotal?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${isTotal ? "pt-3 mt-2 border-t border-jsx-gray-200" : ""}`}
    >
      <span
        className={`text-sm ${isTotal ? "font-semibold text-jsx-black" : "text-jsx-gray-600"}`}
      >
        {label}
      </span>
      <span
        className={
          isTotal ? "text-lg font-bold text-jsx-black" : "text-sm font-medium text-jsx-black"
        }
      >
        {value}
      </span>
    </div>
  )
}

// ── PriceBreakdownSkeleton ────────────────────────────────────────────────────

function PriceBreakdownSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between">
          <div className="h-4 w-28 bg-jsx-gray-200 rounded" />
          <div className="h-4 w-14 bg-jsx-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── PriceChangeBanner ─────────────────────────────────────────────────────────

interface PriceChangeBannerProps {
  newPrice: number
  oldPrice: number
  onAccept: () => void
  onCancel: () => void
}

function PriceChangeBanner({ newPrice, oldPrice, onAccept, onCancel }: PriceChangeBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-amber-300 bg-amber-50 p-5"
      data-testid="price-change-banner"
    >
      <h2 className="text-base font-semibold text-amber-900 mb-1">Price has changed</h2>
      <p className="text-sm text-amber-800 mb-4">
        The price for this booking has been updated from{" "}
        <span className="line-through">${oldPrice}</span> to{" "}
        <strong>${newPrice}</strong>. Please review the new total before proceeding.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="jsx"
          size="sm"
          onClick={onAccept}
          data-testid="accept-price-change"
        >
          Accept new price and continue
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          data-testid="cancel-price-change"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const BookingReviewPage: NextPage = () => {
  const { canAccess } = useBookingGuard("review")
  const router = useRouter()

  const selectedFlight = useBookingStore((s) => s.selectedFlight)
  const passengers = useBookingStore((s) => s.passengers)
  const travelerInfo = useBookingStore((s) => s.travelerInfo)
  const contactDetails = useBookingStore((s) => s.contactDetails)
  const bagSelections = useBookingStore((s) => s.bagSelections)
  const seatAssignments = useBookingStore((s) => s.seatAssignments)
  const markStepValid = useBookingStore((s) => s.markStepValid)
  const setConfirmedTotalPrice = useBookingStore((s) => s.setConfirmedTotalPrice)

  const showToast = useErrorStore((s) => s.showToast)
  const setRetrying = useErrorStore((s) => s.setRetrying)
  const onAllRetriesExhausted = useErrorStore((s) => s.onAllRetriesExhausted)

  const [bagOptions, setBagOptions] = useState<BagOption[]>([])
  const [isBagOptionsLoading, setIsBagOptionsLoading] = useState(true)
  const [bagOptionsError, setBagOptionsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [priceChange, setPriceChange] = useState<{ newPrice: number; oldPrice: number } | null>(
    null
  )

  const passengerList = useMemo(() => buildPassengerList(passengers), [passengers])
  const totalPassengers = passengerList.length

  // ── Price computations ────────────────────────────────────────────────────

  const baseFare = useMemo(() => {
    if (!selectedFlight) return 0
    const perPax = selectedFlight.pricePerPassenger as number | undefined
    if (perPax) return perPax * totalPassengers
    return (selectedFlight.price as number | undefined) ?? 0
  }, [selectedFlight, totalPassengers])

  const bagTotal = useMemo(() => {
    if (bagOptions.length === 0) return 0
    return bagSelections.reduce((sum, sel) => {
      const opt = bagOptions.find((o) => o.checkedBags === sel.checkedBags)
      return sum + (opt?.price ?? 0)
    }, 0)
  }, [bagSelections, bagOptions])

  const seatTotal = useMemo(
    () => seatAssignments.reduce((sum, a) => sum + getSeatPrice(a.seatNumber), 0),
    [seatAssignments]
  )

  const subtotal = baseFare + bagTotal + seatTotal
  const taxes = Math.round(subtotal * TAX_RATE)
  const total = subtotal + taxes

  // ── Per-passenger lookups ─────────────────────────────────────────────────

  const seatByPassenger = useMemo(() => {
    const map: Record<number, string> = {}
    seatAssignments.forEach(({ passengerIndex, seatNumber }) => {
      map[passengerIndex] = seatNumber
    })
    return map
  }, [seatAssignments])

  const bagByPassenger = useMemo(() => {
    const map: Record<number, number> = {}
    bagSelections.forEach(({ passengerIndex, checkedBags }) => {
      map[passengerIndex] = checkedBags
    })
    return map
  }, [bagSelections])

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadBagOptions = useCallback(async () => {
    setIsBagOptionsLoading(true)
    setBagOptionsError(false)
    try {
      const r = await fetch("/api/booking/bags")
      if (!r.ok) throw new Error("Failed to load bag options")
      const data = (await r.json()) as { bagOptions: BagOption[] }
      setBagOptions(data.bagOptions)
    } catch {
      setBagOptionsError(true)
      showToast("Unable to load bag prices. Price estimate may be incomplete.")
    } finally {
      setIsBagOptionsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (canAccess) {
      bookingEvents.stepViewed("review")
      loadBagOptions()
    }
  }, [canAccess, loadBagOptions])

  // ── Submit: confirm price ─────────────────────────────────────────────────

  const onConfirmAndPay = useCallback(async () => {
    if (!selectedFlight) return
    setIsSubmitting(true)
    try {
      const result = await withRetry(
        async () => {
          const res = await fetch("/api/booking/confirm-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              flightId: selectedFlight.flightId,
              totalPassengers,
              previousTotalPrice: total,
            }),
          })
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(body.error ?? "Failed to confirm price")
          }
          return res.json() as Promise<ConfirmPriceResponse>
        },
        { onRetrying: () => setRetrying(true) }
      )

      if (!result.confirmed) {
        setPriceChange({ newPrice: result.totalPrice, oldPrice: total })
        setIsSubmitting(false)
        return
      }

      setConfirmedTotalPrice(total)
      markStepValid("review")
      bookingEvents.stepCompleted("review", { totalPrice: total })
      router.push("/booking/payment")
    } catch {
      onAllRetriesExhausted(
        "We couldn't confirm your booking price. Please try again or contact support."
      )
      setIsSubmitting(false)
    }
  }, [
    selectedFlight,
    total,
    totalPassengers,
    markStepValid,
    setConfirmedTotalPrice,
    setRetrying,
    onAllRetriesExhausted,
    router,
  ])

  const onAcceptPriceChange = useCallback(() => {
    if (!priceChange) return
    setConfirmedTotalPrice(priceChange.newPrice)
    markStepValid("review")
    bookingEvents.stepCompleted("review", {
      totalPrice: priceChange.newPrice,
      priceChanged: true,
    })
    router.push("/booking/payment")
  }, [priceChange, markStepValid, setConfirmedTotalPrice, router])

  const onCancelPriceChange = useCallback(() => {
    setPriceChange(null)
  }, [])

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="review">
      <h1 className="text-display-sm font-semibold text-jsx-black">Review your booking</h1>
      <p className="mt-1 text-jsx-gray-500">Check everything looks right before you pay.</p>

      <div className="mt-6 space-y-4">
        {/* Flight */}
        <ReviewSectionCard
          title="Flight"
          editHref="/booking/flights"
          data-testid="flight-section"
        >
          {selectedFlight ? (
            <div className="space-y-1 text-sm text-jsx-gray-700">
              <div className="flex items-center gap-2 text-base font-medium text-jsx-black">
                <span>{selectedFlight.origin}</span>
                <span aria-hidden="true">→</span>
                <span>{selectedFlight.destination}</span>
              </div>
              {(selectedFlight.departureTime || selectedFlight.arrivalTime) && (
                <div className="text-jsx-gray-600">
                  {formatTime(selectedFlight.departureTime as string | undefined)}
                  {selectedFlight.arrivalTime && (
                    <> – {formatTime(selectedFlight.arrivalTime as string | undefined)}</>
                  )}
                </div>
              )}
              {selectedFlight.departureDate && (
                <div className="text-jsx-gray-600">
                  {formatDate(selectedFlight.departureDate as string | undefined)}
                </div>
              )}
              {selectedFlight.flightNumber && (
                <div className="text-jsx-gray-500 text-xs">
                  Flight {selectedFlight.flightNumber as string}
                </div>
              )}
              <div className="mt-2 text-jsx-gray-600">
                {totalPassengers} passenger{totalPassengers !== 1 ? "s" : ""}
                {(selectedFlight.pricePerPassenger as number | undefined) ? (
                  <> · ${selectedFlight.pricePerPassenger as number} per person</>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-jsx-gray-500">No flight selected</p>
          )}
        </ReviewSectionCard>

        {/* Passengers */}
        <ReviewSectionCard
          title="Passengers"
          editHref="/booking/details"
          data-testid="passengers-section"
        >
          <ul className="space-y-2" aria-label="Passenger details">
            {passengerList.map((pax, i) => {
              const info = travelerInfo[i]
              const name = info ? `${info.firstName} ${info.lastName}` : pax.label
              return (
                <li key={i} className="flex items-start justify-between text-sm">
                  <div>
                    <span className="font-medium text-jsx-black">{name}</span>
                    <span className="ml-2 text-jsx-gray-500 capitalize">{pax.type}</span>
                  </div>
                  {info?.dateOfBirth && (
                    <span className="text-jsx-gray-500 text-xs">DOB: {info.dateOfBirth}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {contactDetails && (
            <div className="mt-3 pt-3 border-t border-jsx-gray-100 text-sm text-jsx-gray-600">
              <div>{contactDetails.email}</div>
              <div>{contactDetails.phone}</div>
            </div>
          )}
        </ReviewSectionCard>

        {/* Bags */}
        <ReviewSectionCard title="Bags" editHref="/booking/bags" data-testid="bags-section">
          {isBagOptionsLoading ? (
            <div className="space-y-2 animate-pulse" aria-hidden="true">
              {passengerList.map((_, i) => (
                <div key={i} className="h-5 bg-jsx-gray-100 rounded w-48" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5" aria-label="Bag selections">
              {passengerList.map((pax, i) => {
                const checkedBags = bagByPassenger[i] ?? 0
                const opt = bagOptions.find((o) => o.checkedBags === checkedBags)
                const priceLabel = bagOptionsError
                  ? "–"
                  : opt
                  ? opt.price === 0
                    ? "Included"
                    : `$${opt.price}`
                  : "Included"
                return (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-jsx-gray-700">
                      {pax.label} —{" "}
                      {opt?.label ?? `${checkedBags} bag${checkedBags !== 1 ? "s" : ""}`}
                    </span>
                    <span className="font-medium text-jsx-black">{priceLabel}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </ReviewSectionCard>

        {/* Seats */}
        <ReviewSectionCard title="Seats" editHref="/booking/seats" data-testid="seats-section">
          {seatAssignments.length === 0 ? (
            <p className="text-sm text-jsx-gray-500">Seat selection skipped</p>
          ) : (
            <ul className="space-y-1.5" aria-label="Seat assignments">
              {passengerList.map((pax, i) => {
                const seatNumber = seatByPassenger[i]
                const price = seatNumber ? getSeatPrice(seatNumber) : 0
                return (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-jsx-gray-700">
                      {pax.label} — {seatNumber ? `Seat ${seatNumber}` : "No seat selected"}
                    </span>
                    {seatNumber && (
                      <span className="font-medium text-jsx-black">
                        {price === 0 ? "Included" : `$${price}`}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </ReviewSectionCard>

        {/* Price breakdown */}
        <div
          className="rounded-xl border border-jsx-gray-200 bg-white p-5"
          data-testid="price-breakdown"
        >
          <h2 className="text-base font-semibold text-jsx-black mb-4">Price breakdown</h2>
          {isBagOptionsLoading ? (
            <PriceBreakdownSkeleton />
          ) : (
            <div aria-label="Price breakdown">
              <PriceRow
                label={`Base fare (${totalPassengers} passenger${totalPassengers !== 1 ? "s" : ""})`}
                value={`$${baseFare}`}
              />
              <PriceRow
                label="Bags"
                value={bagOptionsError ? "–" : bagTotal === 0 ? "Included" : `$${bagTotal}`}
              />
              <PriceRow
                label="Seat fees"
                value={seatTotal === 0 ? "Included" : `$${seatTotal}`}
              />
              <PriceRow label="Taxes & fees (est.)" value={`$${taxes}`} />
              <PriceRow
                label="Total"
                value={bagOptionsError ? "Price unavailable" : `$${total}`}
                isTotal
              />
              {bagOptionsError && (
                <p className="text-xs text-jsx-gray-500 mt-2" role="note">
                  * Bag prices could not be loaded.{" "}
                  <button
                    type="button"
                    onClick={loadBagOptions}
                    className="underline focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
                  >
                    Try again
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Price change banner */}
        {priceChange && (
          <PriceChangeBanner
            newPrice={priceChange.newPrice}
            oldPrice={priceChange.oldPrice}
            onAccept={onAcceptPriceChange}
            onCancel={onCancelPriceChange}
          />
        )}

        {/* CTA */}
        {!priceChange && (
          <div>
            <Button
              type="button"
              variant="jsx"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isSubmitting || isBagOptionsLoading}
              onClick={onConfirmAndPay}
              data-testid="confirm-pay-button"
            >
              {isSubmitting ? "Confirming price…" : "Confirm & pay"}
            </Button>
          </div>
        )}
      </div>
    </BookingLayout>
  )
}

export default BookingReviewPage
