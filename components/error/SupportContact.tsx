import { useErrorStore } from "@/stores/errorStore"

export function SupportContact() {
  const showSupportContact = useErrorStore((s) => s.showSupportContact)

  if (!showSupportContact) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"
    >
      <p className="font-semibold text-amber-800">Still having trouble?</p>
      <p className="mt-1 text-amber-700">
        Our support team can help you complete your booking.
      </p>
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:gap-3">
        <a
          href="tel:+18005972722"
          className="font-medium text-jsx-red underline-offset-2 hover:underline"
        >
          Call 1-800-JSX-HELP
        </a>
        <span className="hidden text-amber-600 sm:inline" aria-hidden="true">
          ·
        </span>
        <a
          href="mailto:support@jsx.com"
          className="font-medium text-jsx-red underline-offset-2 hover:underline"
        >
          support@jsx.com
        </a>
      </div>
    </div>
  )
}
