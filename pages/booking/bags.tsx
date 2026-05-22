import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingBagsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("bags")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="bags">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Bag allowances
      </h1>
      {/* Bag selection per passenger — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingBagsPage
