import type { NextPage } from "next"
import { useCallback, useState } from "react"
import { useRouter } from "next/router"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { Button } from "@/components/ui/button"
import { bookingEvents } from "@/features/booking/utils/analytics"
import type { PayResponse } from "@/pages/api/booking/pay"

const BookingPaymentPage: NextPage = () => {
  const { canAccess } = useBookingGuard("payment")
  const router = useRouter()

  const selectedFlight = useBookingStore((s) => s.selectedFlight)
  const passengers = useBookingStore((s) => s.passengers)
  const confirmedTotalPrice = useBookingStore((s) => s.confirmedTotalPrice)
  const setPaymentToken = useBookingStore((s) => s.setPaymentToken)
  const setBookingReference = useBookingStore((s) => s.setBookingReference)

  const showToast = useErrorStore((s) => s.showToast)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPassengers =
    passengers.adults + passengers.children + passengers.infants

  const handlePay = useCallback(async () => {
    if (!selectedFlight) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/booking/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: selectedFlight.flightId,
          confirmedTotalPrice: confirmedTotalPrice ?? 0,
          totalPassengers,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Payment failed. Please try again.")
      }

      const data = (await res.json()) as PayResponse
      setPaymentToken(data.paymentToken)
      setBookingReference(data.bookingReference)
      bookingEvents.stepCompleted("payment", {
        bookingReference: data.bookingReference,
        totalPrice: confirmedTotalPrice,
      })
      router.push("/booking/confirmation")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment failed. Please try again."
      setError(message)
      showToast(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    selectedFlight,
    confirmedTotalPrice,
    totalPassengers,
    setPaymentToken,
    setBookingReference,
    showToast,
    router,
  ])

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="payment">
      <h1 className="text-display-sm font-semibold text-jsx-black">Payment</h1>
      <p className="mt-2 text-jsx-gray-600">
        Complete your payment to confirm your booking.
      </p>

      {/* Payment gateway placeholder — integration pending issue #20 */}
      <div className="mt-8 rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-6">
        <p className="text-sm text-jsx-gray-500">
          Payment gateway integration is coming soon. Click below to complete
          your booking with a test payment.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-jsx-red"
          >
            {error}
          </p>
        )}

        <div className="mt-6">
          <Button
            type="button"
            variant="jsx"
            size="lg"
            data-testid="pay-button"
            onClick={handlePay}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Processing…" : "Pay now"}
          </Button>
        </div>
      </div>
    </BookingLayout>
  )
}

export default BookingPaymentPage
