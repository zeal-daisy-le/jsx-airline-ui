import Link from "next/link"
import { Button } from "@/components/ui/button"

interface GuestAccountPromptProps {
  bookingReference?: string
}

export function GuestAccountPrompt({ bookingReference }: GuestAccountPromptProps) {
  return (
    <section
      aria-labelledby="guest-prompt-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 id="guest-prompt-heading" className="mb-1 text-lg font-semibold text-jsx-black">
        Save your booking to an account
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Create a free JSX account to manage your booking, check in online, and enjoy faster
        checkout next time.
      </p>
      {bookingReference && (
        <p className="mb-4 text-xs text-gray-400">
          Booking reference:{" "}
          <span className="font-mono font-semibold text-jsx-black">{bookingReference}</span>
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="jsx" size="sm" asChild>
          <Link href="/signup">Create account</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </section>
  )
}
