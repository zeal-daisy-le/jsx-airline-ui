import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingReviewPage: NextPage = () => {
  const { canAccess } = useBookingGuard("review")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="review">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Review your booking
      </h1>
      {/* Full order summary — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingReviewPage
