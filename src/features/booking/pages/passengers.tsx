import type { NextPage } from "next"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { PassengerStepper } from "@/features/booking/components/PassengerStepper"
import { Button } from "@/components/ui/button"
import { bookingEvents } from "@/features/booking/utils/analytics"

const MAX_PASSENGERS = 9

const BookingPassengersPage: NextPage = () => {
  const { canAccess } = useBookingGuard("passengers")
  const router = useRouter()

  const storePassengers = useBookingStore((s) => s.passengers)
  const setPassengers = useBookingStore((s) => s.setPassengers)

  // Local state mirrors the store so edits are transient until "Continue" is pressed.
  const [adults, setAdults] = useState(storePassengers.adults)
  const [children, setChildren] = useState(storePassengers.children)
  const [infants, setInfants] = useState(storePassengers.infants)
  const [errors, setErrors] = useState<{ adults?: string; infants?: string }>({})

  // Sync pre-filled values once the store has rehydrated.
  useEffect(() => {
    if (canAccess) {
      setAdults(storePassengers.adults)
      setChildren(storePassengers.children)
      setInfants(storePassengers.infants)
    }
  }, [canAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fire step viewed event once the guard settles.
  useEffect(() => {
    if (canAccess) {
      bookingEvents.stepViewed("passengers")
    }
  }, [canAccess])

  // Enforce infant cap whenever adults change.
  const handleAdultsChange = useCallback(
    (next: number) => {
      setAdults(next)
      if (infants > next) setInfants(next)
      setErrors((prev) => ({ ...prev, adults: undefined }))
    },
    [infants]
  )

  const handleInfantsChange = useCallback((next: number) => {
    setInfants(next)
    setErrors((prev) => ({ ...prev, infants: undefined }))
  }, [])

  const handleChildrenChange = useCallback((next: number) => {
    setChildren(next)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const nextErrors: typeof errors = {}
      if (adults < 1) nextErrors.adults = "At least 1 adult is required"
      if (infants > adults) nextErrors.infants = "Infants cannot exceed the number of adults"

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        return
      }

      setPassengers({ adults, children, infants })
      bookingEvents.stepCompleted("passengers", { adults, children, infants })
      router.push("/booking/details")
    },
    [adults, children, infants, setPassengers, router]
  )

  if (!canAccess) return null

  const total = adults + children + infants

  return (
    <BookingLayout currentStep="passengers">
      <h1 className="text-display-sm font-semibold text-jsx-black">Passengers</h1>
      <p className="mt-1 text-jsx-gray-500">
        Who&apos;s travelling? You can add up to {MAX_PASSENGERS} passengers.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Passenger selection"
        className="mt-6 rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5"
      >
        <fieldset className="space-y-5">
          <legend className="sr-only">Passenger counts</legend>

          <PassengerStepper
            id="adults"
            label="Adults"
            sublabel="Age 18+"
            value={adults}
            min={1}
            max={MAX_PASSENGERS}
            onChange={handleAdultsChange}
            error={errors.adults}
          />

          <hr className="border-jsx-gray-200" />

          <PassengerStepper
            id="children"
            label="Children"
            sublabel="Ages 2–17"
            value={children}
            min={0}
            max={MAX_PASSENGERS - adults}
            onChange={handleChildrenChange}
          />

          <hr className="border-jsx-gray-200" />

          <PassengerStepper
            id="infants"
            label="Infants"
            sublabel="Under 2 · must sit on an adult's lap"
            value={infants}
            min={0}
            max={adults}
            onChange={handleInfantsChange}
            error={errors.infants}
          />
        </fieldset>

        <p
          aria-live="polite"
          aria-atomic="true"
          className="mt-5 text-sm text-jsx-gray-600"
        >
          {total} passenger{total !== 1 ? "s" : ""} selected
        </p>

        <div className="mt-6">
          <Button
            type="submit"
            variant="jsx"
            size="lg"
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </form>
    </BookingLayout>
  )
}

export default BookingPassengersPage
