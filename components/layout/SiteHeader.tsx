import Link from "next/link"
import { Menu } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-[#2B2B2B] px-6 py-4">
      <Link href="/" aria-label="JSX home">
        <span className="text-xl font-bold tracking-widest text-white">JSX</span>
      </Link>
      <div className="flex items-center gap-5">
        <Link
          href="/login"
          className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
        <button aria-label="Open navigation menu">
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>
    </header>
  )
}
