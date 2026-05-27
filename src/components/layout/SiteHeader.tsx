import Link from "next/link"
import { Menu } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="absolute left-0 right-0 top-0 z-50 px-6 pt-[calc(env(safe-area-inset-top)+12px)]">
      <nav className="flex items-center justify-between rounded-full border border-white/[0.08] bg-[rgba(20,20,20,0.42)] px-5 py-2 backdrop-blur-[14px]">
        <Link href="/" aria-label="JSX home">
          <span className="text-[1.4rem] font-medium tracking-[0.22em] text-white">JSX</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="rounded-full bg-white px-[18px] py-1.5 text-[0.95rem] font-medium text-[#111] transition-colors hover:bg-white/90"
          >
            Sign in
          </Link>
          <button
            aria-label="Open navigation menu"
            className="flex h-11 w-11 items-center justify-center text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>
    </header>
  )
}
