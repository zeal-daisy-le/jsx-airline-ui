import type { NextPage } from "next"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/router"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { Button } from "@/components/ui/button"
import { withRetry } from "@/lib/api/retry"
import { bookingEvents } from "@/features/booking/utils/analytics"
import type { BagOption } from "@/pages/api/booking/bags"
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

// ── Sub-components ────────────────────────────────────────────────────────────

function BagSectionSkeleton() {
  return (
    <div
      className="rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-5 w-40 bg-jsx-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 bg-jsx-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ── Page component ─────────────────────────────────────────────────────────────

const BookingBagsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("bags")
  const router = useRouter()

  const passengers = useBookingStore((s) => s.passengers)
  const storedBagSelections = useBookingStore((s) => s.bagSelections)
  const setBagSelections = useBookingStore((s) => s.setBagSelections)

  const showToast = useErrorStore((s) => s.showToast)
  const setRetrying = useErrorStore((s) => s.setRetrying)
  const onAllRetriesExhausted = useErrorStore((s) => s.onAllRetriesExhausted)

  const passengerList = useMemo(() => buildPassengerList(passengers), [passengers])
  const totalPassengers = passengerList.length

  const [bagOptions, setBagOptions] = useState<BagOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Pre-fill from store for back-navigation
  const [selections, setSelections] = useState<number[]>(() => {
    const initial = Array(totalPassengers).fill(0)
    storedBagSelections.forEach(({ passengerIndex, checkedBags }) => {
      if (passengerIndex < totalPassengers) initial[passengerIndex] = checkedBags
    })
    return initial
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadBagOptions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const r = await fetch("/api/booking/bags")
      if (!r.ok) throw new Error("Failed to load bag options")
      const data = (await r.json()) as { bagOptions: BagOption[] }
      setBagOptions(data.bagOptions)
    } catch {
      setLoadError(true)
      showToast("Unable to load bag options. You can retry or continue without bags.")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (canAccess) {
      bookingEvents.stepViewed("bags")
      loadBagOptions()
    }
  }, [canAccess, loadBagOptions])

  const runningTotal = useMemo(() => {
    if (bagOptions.length === 0) return 0
    return selections.reduce((sum, bags) => {
      const option = bagOptions.find((o) => o.checkedBags === bags)
      return sum + (option?.price ?? 0)
    }, 0)
  }, [selections, bagOptions])

  const handleSelectionChange = (passengerIndex: number, checkedBags: number) => {
    setSelections((prev) => {
      const next = [...prev]
      next[passengerIndex] = checkedBags
      return next
    })
  }

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      try {
        await withRetry(
          async () => {
            const res = await fetch("/api/booking/bags", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                selections: selections.map((checkedBags, passengerIndex) => ({
                  passengerIndex,
                  checkedBags,
                })),
              }),
            })
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string }
              throw new Error(body.error ?? "Failed to save bag selections")
            }
            return res.json()
          },
          { onRetrying: () => setRetrying(true) }
        )
      } catch {
        onAllRetriesExhausted(
          "We couldn't save your bag selections. Please try again or contact support."
        )
        setIsSubmitting(false)
        return
      }

      setBagSelections(
        selections.map((checkedBags, passengerIndex) => ({ passengerIndex, checkedBags }))
      )

      bookingEvents.stepCompleted("bags", { totalBagCost: runningTotal })
      router.push("/booking/seats")
    },
    [selections, runningTotal, setBagSelections, setRetrying, onAllRetriesExhausted, router]
  )

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="bags">
      <h1 className="text-display-sm font-semibold text-jsx-black">Bag allowances</h1>
      <p className="mt-1 text-jsx-gray-500">
        Choose your checked bag allowance for each passenger. Bags are optional.
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Bag allowances"
        className="mt-6 space-y-6"
      >
        {isLoading ? (
          passengerList.map((_, i) => <BagSectionSkeleton key={i} />)
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-jsx-red bg-red-50 p-5 text-sm text-jsx-red"
          >
            Unable to load bag options.{" "}
            <button
              type="button"
              onClick={loadBagOptions}
              className="underline font-medium focus:outline-none focus:ring-2 focus:ring-jsx-red rounded"
            >
              Try again
            </button>
          </div>
        ) : (
          passengerList.map((pax, index) => (
            <fieldset
              key={index}
              data-testid={`bag-section-${index}`}
              className="rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5"
            >
              <legend className="text-base font-semibold text-jsx-black px-1">
                {`Passenger ${index + 1} — ${pax.label}`}
              </legend>

              <div className="mt-4 space-y-2">
                {bagOptions.map((option) => {
                  const isSelected = selections[index] === option.checkedBags
                  const radioId = `passenger-${index}-bags-${option.checkedBags}`
                  const priceLabel = option.price === 0 ? "Included" : `$${option.price}`

                  return (
                    <label
                      key={option.checkedBags}
                      htmlFor={radioId}
                      className={[
                        "flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer",
                        "transition-colors focus-within:ring-2 focus-within:ring-jsx-red focus-within:ring-offset-1",
                        isSelected
                          ? "border-jsx-red bg-red-50"
                          : "border-jsx-gray-200 bg-white hover:border-jsx-gray-400",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          id={radioId}
                          type="radio"
                          name={`passenger-${index}-bags`}
                          value={option.checkedBags}
                          checked={isSelected}
                          onChange={() => handleSelectionChange(index, option.checkedBags)}
                          className="text-jsx-red focus:ring-jsx-red"
                        />
                        <div>
                          <p className="text-sm font-medium text-jsx-black">{option.label}</p>
                          <p className={`text-xs ${isSelected ? "text-jsx-gray-600" : "text-jsx-gray-500"}`}>{option.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-jsx-black">
                        {priceLabel}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))
        )}

        {!isLoading && (
          <>
            {!loadError && (
              <div className="rounded-xl border border-jsx-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-jsx-gray-700">Bag total</span>
                  <span
                    className="text-lg font-semibold text-jsx-black"
                    aria-live="polite"
                    aria-atomic="true"
                    data-testid="bag-total"
                  >
                    {runningTotal === 0 ? "Included" : `$${runningTotal}`}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="jsx"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Continue"}
              </Button>
            </div>
          </>
        )}
      </form>
    </BookingLayout>
  )
}

export default BookingBagsPage
