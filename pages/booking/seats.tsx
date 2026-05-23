import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingSeatsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("seats")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="seats">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Choose your seats
      </h1>
      {/* Interactive seat map — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingSeatsPage
