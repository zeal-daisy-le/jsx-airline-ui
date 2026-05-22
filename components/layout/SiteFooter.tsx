import Link from "next/link"
import { Instagram, Facebook, Youtube, Linkedin } from "lucide-react"

const flyJsx = [
  { label: "Where We Fly", href: "/flights" },
  { label: "Our Fleet", href: "/fleet" },
  { label: "Pet & Service Animals", href: "/pets" },
  { label: "Refer Friends", href: "/refer" },
  { label: "Shop JSX", href: "/shop" },
]

const support = [
  { label: "FAQs", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
]

const company = [
  { label: "Charter With Us", href: "/charter" },
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
]

const legal = [
  { label: "Visit Legal Information", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
]

function FooterSection({
  heading,
  links,
}: {
  heading: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-white">{heading}</h3>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-[#2B2B2B] px-6 pt-12 pb-8" aria-label="Site footer">
      <FooterSection heading="Fly JSX" links={flyJsx} />
      <FooterSection heading="Support" links={support} />
      <FooterSection heading="Company" links={company} />

      <div className="mb-8 flex items-center gap-4">
        <a href="https://instagram.com/jsx" aria-label="JSX on Instagram" className="text-white/70 hover:text-white">
          <Instagram className="h-7 w-7" />
        </a>
        <a href="https://facebook.com/jsx" aria-label="JSX on Facebook" className="text-white/70 hover:text-white">
          <Facebook className="h-7 w-7" />
        </a>
        <a href="https://youtube.com/jsx" aria-label="JSX on YouTube" className="text-white/70 hover:text-white">
          <Youtube className="h-7 w-7" />
        </a>
        <a href="https://linkedin.com/company/jsx" aria-label="JSX on LinkedIn" className="text-white/70 hover:text-white">
          <Linkedin className="h-7 w-7" />
        </a>
      </div>

      <FooterSection heading="Legal" links={legal} />
    </footer>
  )
}
