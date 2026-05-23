import type { NextPage } from "next"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { BookingLayout } from "@/components/booking/BookingLayout"

const BookingDetailsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("details")

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="details">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Traveller details
      </h1>
      {/* Traveller name, DOB, and ID details — implemented in a later issue */}
    </BookingLayout>
  )
}

export default BookingDetailsPage
