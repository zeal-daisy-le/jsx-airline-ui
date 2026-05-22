import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingFlightsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("flights")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="flights">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Select your flight
      </h1>
      {/* Flight search and selection — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingFlightsPage
