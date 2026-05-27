import type { NextPage } from "next"
import { Fragment, useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/router"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { Button } from "@/components/ui/button"
import { withRetry } from "@/lib/api/retry"
import { bookingEvents } from "@/features/booking/utils/analytics"
import type { SeatMapData, Seat } from "@/pages/api/booking/seatmap"
import type { PassengerCount } from "@/features/booking/stores/bookingStore"

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

// ── SeatMapSkeleton ───────────────────────────────────────────────────────────

function SeatMapSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-64 bg-jsx-gray-200 rounded" />
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, row) => (
          <div key={row} className="flex gap-1">
            <div className="w-6 h-8 bg-jsx-gray-100 rounded" />
            {Array.from({ length: 6 }).map((_, col) => (
              <Fragment key={col}>
                {col === 3 && <div className="w-4" />}
                <div className="w-8 h-8 bg-jsx-gray-200 rounded" />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SeatMapGrid ───────────────────────────────────────────────────────────────

interface SeatMapGridProps {
  seatMap: SeatMapData
  assignments: Record<number, string>
  activePassengerIndex: number
  seatToPassenger: Record<string, number>
  passengerList: PassengerEntry[]
  onSeatClick: (seat: Seat) => void
}

function SeatMapGrid({
  seatMap,
  assignments,
  activePassengerIndex,
  seatToPassenger,
  passengerList,
  onSeatClick,
}: SeatMapGridProps) {
  const lastFirstClassRow = seatMap.firstClassRows[seatMap.firstClassRows.length - 1]

  return (
    <div>
      {/* Legend */}
      <div
        className="flex gap-4 mb-4 text-xs text-jsx-gray-600 flex-wrap"
        aria-label="Seat map legend"
        role="list"
      >
        <div className="flex items-center gap-1.5" role="listitem">
          <div className="w-5 h-5 rounded border border-jsx-gray-300 bg-white" aria-hidden="true" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <div className="w-5 h-5 rounded bg-jsx-red" aria-hidden="true" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <div className="w-5 h-5 rounded bg-jsx-gray-300" aria-hidden="true" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <div className="w-5 h-5 rounded bg-amber-100 border border-amber-300" aria-hidden="true" />
          <span>First Class</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto" role="group" aria-label="Aircraft seat map">
        {/* Column headers */}
        <div className="flex items-center gap-1 mb-1 pl-7">
          {seatMap.columns.map((col, i) => (
            <Fragment key={col}>
              {i === 3 && <div className="w-4 shrink-0" aria-hidden="true" />}
              <div
                className="w-8 text-center text-xs font-semibold text-jsx-gray-500 shrink-0"
                aria-hidden="true"
              >
                {col}
              </div>
            </Fragment>
          ))}
        </div>

        {/* Rows */}
        {seatMap.rows.map(({ row, seats }) => (
          <Fragment key={row}>
            {/* Class section dividers */}
            {row === 1 && (
              <div className="flex items-center gap-2 my-2 text-xs text-amber-800" aria-hidden="true">
                <div className="flex-1 border-t border-dashed border-amber-300" />
                <span>First Class — $45</span>
                <div className="flex-1 border-t border-dashed border-amber-300" />
              </div>
            )}
            {row === lastFirstClassRow + 1 && (
              <div className="flex items-center gap-2 my-2 text-xs text-jsx-gray-500" aria-hidden="true">
                <div className="flex-1 border-t border-dashed border-jsx-gray-300" />
                <span>Economy — Included</span>
                <div className="flex-1 border-t border-dashed border-jsx-gray-300" />
              </div>
            )}

            <div className="flex items-center gap-1 mb-1">
              {/* Row label */}
              <div className="w-6 text-right text-xs text-jsx-gray-500 mr-1 shrink-0" aria-hidden="true">
                {row}
              </div>

              {/* Seat buttons */}
              {seats.map((seat, i) => {
                const isOccupied = !seat.available
                const assignedPassenger = seatToPassenger[seat.seatNumber]
                const isAssigned = assignedPassenger !== undefined
                const isActivePassenger = assignedPassenger === activePassengerIndex
                const isSelectedByOther = isAssigned && !isActivePassenger
                const isSelectedForActive = assignments[activePassengerIndex] === seat.seatNumber

                const disabled = isOccupied || isSelectedByOther

                // Build aria-label
                const classLabel = seat.class === "first" ? "First Class" : "Economy"
                const priceLabel = seat.price === 0 ? "Included" : `$${seat.price}`
                let statusLabel: string
                if (isOccupied) {
                  statusLabel = "Occupied"
                } else if (isSelectedForActive) {
                  statusLabel = `Selected for ${passengerList[activePassengerIndex]?.label ?? "you"}`
                } else if (isSelectedByOther) {
                  statusLabel = `Selected for ${passengerList[assignedPassenger]?.label ?? `Passenger ${assignedPassenger + 1}`}`
                } else {
                  statusLabel = "Available"
                }
                const ariaLabel = `Row ${row}, Seat ${seat.column}, ${classLabel}, ${priceLabel}, ${statusLabel}`

                // Button styling
                let btnClass: string
                if (isOccupied) {
                  btnClass = "bg-jsx-gray-300 cursor-not-allowed"
                } else if (isSelectedForActive) {
                  btnClass = "bg-jsx-red text-white border-jsx-red"
                } else if (isSelectedByOther) {
                  btnClass = "bg-jsx-gray-400 cursor-not-allowed text-white"
                } else if (seat.class === "first") {
                  btnClass =
                    "bg-amber-100 border-amber-300 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-jsx-red focus:ring-offset-1"
                } else {
                  btnClass =
                    "bg-white border-jsx-gray-300 hover:bg-jsx-gray-100 focus:outline-none focus:ring-2 focus:ring-jsx-red focus:ring-offset-1"
                }

                return (
                  <Fragment key={seat.seatNumber}>
                    {i === 3 && <div className="w-4 shrink-0" aria-hidden="true" />}
                    <button
                      type="button"
                      aria-label={ariaLabel}
                      aria-pressed={isSelectedForActive}
                      disabled={disabled}
                      onClick={() => !disabled && onSeatClick(seat)}
                      className={[
                        "w-8 h-8 rounded text-xs font-medium border transition-colors shrink-0",
                        btnClass,
                      ].join(" ")}
                      data-testid={`seat-${seat.seatNumber}`}
                    >
                      {seat.column}
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

const BookingSeatsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("seats")
  const router = useRouter()

  const passengers = useBookingStore((s) => s.passengers)
  const storedSeatAssignments = useBookingStore((s) => s.seatAssignments)
  const setSeatAssignments = useBookingStore((s) => s.setSeatAssignments)

  const showToast = useErrorStore((s) => s.showToast)
  const setRetrying = useErrorStore((s) => s.setRetrying)
  const onAllRetriesExhausted = useErrorStore((s) => s.onAllRetriesExhausted)

  const passengerList = useMemo(() => buildPassengerList(passengers), [passengers])
  const totalPassengers = passengerList.length

  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // assignments: passengerIndex → seatNumber (pre-fill from store for back-navigation)
  const [assignments, setAssignments] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    storedSeatAssignments.forEach(({ passengerIndex, seatNumber }) => {
      if (passengerIndex < totalPassengers) initial[passengerIndex] = seatNumber
    })
    return initial
  })

  const [activePassengerIndex, setActivePassengerIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const assignedCount = Object.keys(assignments).length
  const allAssigned = assignedCount === totalPassengers

  // seatNumber → passengerIndex (for rendering which passenger holds a seat)
  const seatToPassenger = useMemo(() => {
    const map: Record<string, number> = {}
    Object.entries(assignments).forEach(([pIdx, seat]) => {
      map[seat] = Number(pIdx)
    })
    return map
  }, [assignments])

  const loadSeatMap = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const r = await fetch("/api/booking/seatmap")
      if (!r.ok) throw new Error("Failed to load seat map")
      const data = (await r.json()) as { seatMap: SeatMapData }
      setSeatMap(data.seatMap)
    } catch {
      setLoadError(true)
      showToast("Unable to load seat map. You can retry or skip seat selection.")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (canAccess) {
      bookingEvents.stepViewed("seats")
      loadSeatMap()
    }
  }, [canAccess, loadSeatMap])

  const handleSeatClick = useCallback(
    (seat: Seat) => {
      const seatNum = seat.seatNumber
      const newAssignments = { ...assignments }

      if (newAssignments[activePassengerIndex] === seatNum) {
        // Deselect current seat
        delete newAssignments[activePassengerIndex]
      } else {
        newAssignments[activePassengerIndex] = seatNum
      }

      setAssignments(newAssignments)

      // Auto-advance to next unassigned passenger
      for (let offset = 1; offset < totalPassengers; offset++) {
        const candidate = (activePassengerIndex + offset) % totalPassengers
        if (newAssignments[candidate] === undefined) {
          setActivePassengerIndex(candidate)
          break
        }
      }
    },
    [assignments, activePassengerIndex, totalPassengers]
  )

  const handleContinue = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!allAssigned) return
      setIsSubmitting(true)

      const assignmentsArray = Object.entries(assignments).map(([pIdx, seatNumber]) => ({
        passengerIndex: Number(pIdx),
        seatNumber,
      }))

      try {
        await withRetry(
          async () => {
            const res = await fetch("/api/booking/seatmap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignments: assignmentsArray }),
            })
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string }
              throw new Error(body.error ?? "Failed to save seat assignments")
            }
            return res.json()
          },
          { onRetrying: () => setRetrying(true) }
        )
      } catch {
        onAllRetriesExhausted(
          "We couldn't save your seat selections. Please try again or contact support."
        )
        setIsSubmitting(false)
        return
      }

      setSeatAssignments(assignmentsArray)
      bookingEvents.stepCompleted("seats", { seatsAssigned: assignedCount })
      router.push("/booking/review")
    },
    [
      allAssigned,
      assignments,
      assignedCount,
      setSeatAssignments,
      setRetrying,
      onAllRetriesExhausted,
      router,
    ]
  )

  const handleSkip = useCallback(() => {
    setSeatAssignments([])
    bookingEvents.stepCompleted("seats", { seatsAssigned: 0, skipped: true })
    router.push("/booking/review")
  }, [setSeatAssignments, router])

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="seats">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-display-sm font-semibold text-jsx-black">Choose your seats</h1>
          <p className="mt-1 text-jsx-gray-500">
            Select a seat for each passenger. Seats are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-jsx-gray-500 underline hover:text-jsx-black focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
          data-testid="skip-link"
        >
          Skip seat selection
        </button>
      </div>

      {/* Passenger selector tabs — shown only for multi-passenger bookings */}
      {totalPassengers > 1 && (
        <div className="mt-4 flex gap-2 flex-wrap" role="group" aria-label="Select passenger">
          {passengerList.map((pax, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActivePassengerIndex(index)}
              aria-pressed={activePassengerIndex === index}
              data-testid={`passenger-tab-${index}`}
              className={[
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activePassengerIndex === index
                  ? "bg-jsx-red text-white border-jsx-red"
                  : "bg-white text-jsx-gray-700 border-jsx-gray-300 hover:border-jsx-gray-500",
              ].join(" ")}
            >
              {pax.label}
              {assignments[index] !== undefined && (
                <span className="ml-1.5 text-xs opacity-80">({assignments[index]})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Seat assignment progress */}
      <p
        className="mt-3 text-sm text-jsx-gray-600"
        aria-live="polite"
        aria-atomic="true"
        data-testid="seat-progress"
      >
        {assignedCount === 0
          ? "Select a seat to get started"
          : `${assignedCount} of ${totalPassengers} passenger${totalPassengers !== 1 ? "s" : ""} seated`}
      </p>

      {/* Seat map or loading/error state */}
      <div className="mt-6">
        {isLoading ? (
          <SeatMapSkeleton />
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-jsx-red bg-red-50 p-5 text-sm text-jsx-red"
          >
            Unable to load seat map.{" "}
            <button
              type="button"
              onClick={loadSeatMap}
              className="underline font-medium focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
            >
              Try again
            </button>
          </div>
        ) : seatMap ? (
          <SeatMapGrid
            seatMap={seatMap}
            assignments={assignments}
            activePassengerIndex={activePassengerIndex}
            seatToPassenger={seatToPassenger}
            passengerList={passengerList}
            onSeatClick={handleSeatClick}
          />
        ) : null}
      </div>

      {/* Footer actions */}
      <form onSubmit={handleContinue} noValidate className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          variant="jsx"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isSubmitting || !allAssigned}
          data-testid="continue-btn"
        >
          {isSubmitting ? "Saving…" : "Continue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleSkip}
          data-testid="skip-btn"
        >
          Skip seats
        </Button>
      </form>
    </BookingLayout>
  )
}

export default BookingSeatsPage
