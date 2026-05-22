import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingPaymentPage: NextPage = () => {
  const { canAccess } = useBookingGuard("payment")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="payment">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Payment
      </h1>
      {/* Payment gateway integration — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingPaymentPage
