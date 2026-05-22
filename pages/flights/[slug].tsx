import type { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { destinations, type Destination } from "@/data/destinations"
import { routes, type FlightRoute } from "@/data/routes"

interface FlightRoutePageProps {
  route: FlightRoute
  origin: Destination
  destination: Destination
}

function buildFlightJsonLd(
  route: FlightRoute,
  origin: Destination,
  destination: Destination
) {
  return {
    "@context": "https://schema.org",
    "@type": "Flight",
    flightNumber: route.flightNumber,
    provider: {
      "@type": "Airline",
      name: "JSX",
      iataCode: "XE",
      url: "https://jsx.com",
    },
    departureAirport: {
      "@type": "Airport",
      name: origin.airportName,
      iataCode: origin.airport,
    },
    arrivalAirport: {
      "@type": "Airport",
      name: destination.airportName,
      iataCode: destination.airport,
    },
    departureTime: route.departureDatetime,
    arrivalTime: route.arrivalDatetime,
    aircraft: {
      "@type": "Vehicle",
      name: route.aircraftName,
    },
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function FlightRoutePage({
  route,
  origin,
  destination,
}: FlightRoutePageProps) {
  const title = `Flights from ${origin.city} to ${destination.city} | JSX`
  const description = `Book semi-private JSX flights from ${origin.city} (${origin.airport}) to ${destination.city} (${destination.airport}). ${destination.tagline}. No crowds, no hidden fees — just 30 seats and the open sky.`
  const canonicalUrl = `https://jsx.com/flights/${route.slug}`
  const jsonLd = buildFlightJsonLd(route, origin, destination)

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="JSX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" aria-label="JSX home">
              <span className="text-2xl font-bold tracking-tight text-jsx-red">JSX</span>
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-6 text-sm font-medium text-gray-600">
                <li>
                  <Link href="/#destinations" className="transition-colors hover:text-jsx-red">
                    Destinations
                  </Link>
                </li>
                <li>
                  <Button variant="jsx" size="sm">
                    Book a Flight
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Hero — destination image */}
        <section
          className="relative flex min-h-[60vh] flex-col items-center justify-center bg-jsx-black px-6 text-center text-white overflow-hidden"
          aria-labelledby="route-heading"
        >
          <Image
            src={destination.imageUrl}
            alt={destination.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-jsx-red">
              {origin.airport} → {destination.airport}
            </p>
            <h1
              id="route-heading"
              className="mb-4 text-display-md font-bold leading-tight tracking-tight sm:text-display-lg"
            >
              {origin.city} to {destination.city}
            </h1>
            <p className="mb-8 mx-auto max-w-xl text-lg text-gray-300">
              {destination.tagline}
            </p>
            <Button variant="jsx" size="xl">
              Search Flights
            </Button>
          </div>
        </section>

        {/* Route details */}
        <section
          className="py-16 bg-gray-50 border-b border-gray-100"
          aria-label="Flight route details"
        >
          <div className="container">
            <dl className="grid gap-8 sm:grid-cols-3 text-center">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-widest text-jsx-red mb-1">
                  From
                </dt>
                <dd className="text-xl font-bold text-jsx-black">
                  {origin.city}
                </dd>
                <dd className="text-gray-500">{origin.airportName}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-widest text-jsx-red mb-1">
                  Flight time
                </dt>
                <dd className="text-xl font-bold text-jsx-black">
                  {formatDuration(route.durationMinutes)}
                </dd>
                <dd className="text-gray-500">{route.aircraftName}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-widest text-jsx-red mb-1">
                  To
                </dt>
                <dd className="text-xl font-bold text-jsx-black">
                  {destination.city}
                </dd>
                <dd className="text-gray-500">{destination.airportName}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Destination highlights */}
        <section className="py-16" aria-labelledby="destination-highlights-heading">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-jsx-red">
                Why fly JSX
              </p>
              <h2
                id="destination-highlights-heading"
                className="mb-4 text-display-sm font-bold tracking-tight text-jsx-black"
              >
                The JSX way to {destination.city}
              </h2>
              <p className="mb-10 text-gray-500">
                Skip the chaos of the main terminal. Arrive 20 minutes before
                departure, board directly from a private terminal, and land
                feeling like yourself.
              </p>
              <Button variant="jsx" size="xl">
                Search Flights
              </Button>
            </div>
          </div>
        </section>

        {/* Feature bar */}
        <section className="border-t border-gray-100 bg-gray-50 py-14" aria-label="Key features">
          <div className="container">
            <ul className="grid gap-8 sm:grid-cols-3" role="list">
              {[
                {
                  title: "30-seat jets",
                  description: "Private-jet comfort at a fraction of the price.",
                },
                {
                  title: "No hidden fees",
                  description: "The price you see is the price you pay. Always.",
                },
                {
                  title: "Terminal-to-terminal",
                  description: "Skip the main terminal chaos entirely.",
                },
              ].map((feature) => (
                <li key={feature.title} className="text-center">
                  <h3 className="mb-2 text-xl font-semibold text-jsx-black">{feature.title}</h3>
                  <p className="text-gray-500">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} JSX. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = routes.map((route) => ({
    params: { slug: route.slug },
  }))
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps<FlightRoutePageProps> = async ({ params }) => {
  const slug = params?.slug as string
  const route = routes.find((r) => r.slug === slug)

  if (!route) {
    return { notFound: true }
  }

  const origin = destinations.find((d) => d.id === route.originId)
  const destination = destinations.find((d) => d.id === route.destinationId)

  if (!origin || !destination) {
    return { notFound: true }
  }

  return {
    props: { route, origin, destination },
  }
}

export { buildFlightJsonLd }
