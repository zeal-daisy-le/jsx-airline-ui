import type { Destination } from "@/data/destinations"
import { DestinationCard } from "./DestinationCard"

interface DestinationGridProps {
  destinations: Destination[]
}

export function DestinationGrid({ destinations }: DestinationGridProps) {
  const featured = destinations.filter((d) => d.featured)
  const regular = destinations.filter((d) => !d.featured)

  return (
    <section aria-labelledby="destinations-heading" className="py-16 sm:py-20 bg-white">
      <div className="container">
        <div className="mb-10 sm:mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-jsx-red">
            Destinations
          </p>
          <h2
            id="destinations-heading"
            className="text-display-sm font-bold tracking-tight text-jsx-black"
          >
            Where will you fly next?
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">
            Semi-private jets to the destinations that matter. No main terminals, no middle seats —
            just you and the sky.
          </p>
        </div>

        {/* Featured editorial row — 2 equal columns on md+, stacked on mobile */}
        {featured.length > 0 && (
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            {featured.map((destination, index) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                featured
                priority={index === 0}
              />
            ))}
          </div>
        )}

        {/* Regular grid — 3 columns on lg+, 2 on sm+, 1 on mobile */}
        {regular.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
