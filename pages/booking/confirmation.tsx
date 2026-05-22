import type { NextPage } from "next"
import Head from "next/head"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { useBookingStore } from "@/stores/bookingStore"
import { SiteHeader } from "@/components/layout/SiteHeader"

const BookingConfirmationPage: NextPage = () => {
  const { canAccess } = useBookingGuard("confirmation")
  const bookingReference = useBookingStore((s) => s.bookingReference)

  if (!canAccess) return null

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>Booking confirmed — JSX</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
          <h1 className="text-display-sm font-semibold text-jsx-black">
            Booking confirmed
          </h1>
          {bookingReference && (
            <p className="mt-4 text-lg text-jsx-gray-700">
              Your booking reference:{" "}
              <strong className="text-jsx-black">{bookingReference}</strong>
            </p>
          )}
          {/* Full confirmation details — implemented in a later issue */}
        </main>
      </div>
    </>
  )
}

export default BookingConfirmationPage
