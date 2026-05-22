import Image from "next/image"
import Link from "next/link"
import type { Destination } from "@/data/destinations"

interface WhereWeFlySectionProps {
  destinations: Destination[]
}

export function WhereWeFlySection({ destinations }: WhereWeFlySectionProps) {
  return (
    <section className="px-6 py-12" aria-labelledby="where-we-fly-heading">
      <h2
        id="where-we-fly-heading"
        className="text-[32px] font-semibold leading-tight text-black"
      >
        Where We Fly
      </h2>
      <p className="mt-2 text-base text-gray-500">Discover your perfect getaway.</p>

      <ul className="mt-6 flex flex-col gap-4" role="list" aria-label="Flight destinations">
        {destinations.slice(0, 4).map((dest) => (
          <li key={dest.id} role="listitem">
            <Link
              href={`/flights/${dest.id}`}
              className="group block"
              aria-label={`Flights to ${dest.city}, ${dest.state}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-200">
                <Image
                  src={dest.imageUrl}
                  alt={dest.imageAlt}
                  fill
                  sizes="(max-width: 768px) calc(100vw - 48px), 700px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* scrim for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-4 text-sm font-medium text-white">
                  {dest.city}, {dest.state}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/flights"
        className="mt-6 flex w-full items-center justify-center rounded-full bg-jsx-red py-4 text-base font-semibold text-white transition-colors hover:bg-jsx-red-dark"
      >
        See All Routes
      </Link>
    </section>
  )
}
