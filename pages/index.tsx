import type { GetServerSideProps } from "next"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DestinationGrid } from "@/components/destinations/DestinationGrid"
import { destinations as allDestinations, type Destination } from "@/data/destinations"

interface HomePageProps {
  destinations: Destination[]
}

export default function HomePage({ destinations }: HomePageProps) {
  return (
    <>
      <Head>
        <title>JSX — Premium Private Aviation</title>
        <meta
          name="description"
          content="JSX offers semi-private jet travel with flexible booking, no hidden fees, and a premium experience from gate to gate. Book your next flight today."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="JSX — Premium Private Aviation" />
        <meta
          property="og:description"
          content="Semi-private jet travel. No crowds. No hidden fees. Just you and the sky."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JSX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JSX — Premium Private Aviation" />
        <meta
          name="twitter:description"
          content="Semi-private jet travel. No crowds. No hidden fees. Just you and the sky."
        />
        <link rel="canonical" href="https://jsx.com/" />
      </Head>

      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" aria-label="JSX home">
              <span className="text-2xl font-bold tracking-tight text-jsx-red">JSX</span>
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-6 text-sm font-medium text-gray-600">
                <li>
                  <a href="#destinations" className="transition-colors hover:text-jsx-red">
                    Destinations
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-jsx-red">
                    About
                  </a>
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

        {/* Hero — priority image above the fold, prevents LCP delay */}
        <section
          className="relative flex min-h-[80vh] flex-col items-center justify-center bg-jsx-black px-6 text-center text-white overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <Image
            src="/images/hero.jpg"
            alt="JSX semi-private aircraft on the tarmac at sunset, ready for departure"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="relative z-10 mx-auto max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-jsx-red">
              Semi-private aviation
            </p>
            <h1
              id="hero-heading"
              className="mb-6 text-display-md font-bold leading-tight tracking-tight sm:text-display-lg"
            >
              Fly like you mean it.
            </h1>
            <p className="mb-10 mx-auto max-w-xl text-lg text-gray-300">
              No crowds, no chaos. Just 30 seats, terminal-to-terminal service, and the freedom to
              actually enjoy the journey.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button variant="jsx" size="xl">
                Search Flights
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Our Destinations
              </Button>
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="border-b border-gray-100 bg-gray-50 py-16" aria-label="Key features">
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
                  <h2 className="mb-2 text-xl font-semibold text-jsx-black">{feature.title}</h2>
                  <p className="text-gray-500">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Destination photography grid — below the fold, images lazy-loaded by default */}
        <div id="destinations">
          <DestinationGrid destinations={destinations} />
        </div>

        <footer className="py-10 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} JSX. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  return {
    props: {
      destinations: allDestinations,
    },
  }
}
