import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import FlightRoutePage, {
  getStaticPaths,
  getStaticProps,
  buildFlightJsonLd,
} from "@/pages/flights/[slug]"
import { routes } from "@/data/routes"
import { destinations } from "@/data/destinations"

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    fill,
    ...props
  }: {
    src: string
    alt: string
    priority?: boolean
    fill?: boolean
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-priority={priority ? "true" : undefined}
      data-fill={fill ? "true" : undefined}
      {...props}
    />
  ),
}))

const dallasToLasVegas = routes.find((r) => r.slug === "dallas-to-las-vegas")!
const dallas = destinations.find((d) => d.id === "dallas")!
const lasVegas = destinations.find((d) => d.id === "las-vegas")!

function renderPage() {
  render(
    <FlightRoutePage
      route={dallasToLasVegas}
      origin={dallas}
      destination={lasVegas}
    />
  )
}

describe("FlightRoutePage", () => {
  it("renders the route heading with origin and destination cities", () => {
    renderPage()
    expect(
      screen.getByRole("heading", { level: 1, name: "Dallas to Las Vegas" })
    ).toBeInTheDocument()
  })

  it("renders the route airport codes", () => {
    renderPage()
    expect(screen.getByText("DAL → LAS")).toBeInTheDocument()
  })

  it("renders the destination tagline", () => {
    renderPage()
    expect(screen.getByText(lasVegas.tagline)).toBeInTheDocument()
  })

  it("renders origin and destination airport names in route details", () => {
    renderPage()
    expect(screen.getByText(dallas.airportName)).toBeInTheDocument()
    expect(screen.getByText(lasVegas.airportName)).toBeInTheDocument()
  })

  it("renders the flight duration", () => {
    renderPage()
    // 165 minutes = 2h 45m
    expect(screen.getByText("2h 45m")).toBeInTheDocument()
  })

  it("renders the aircraft name", () => {
    renderPage()
    expect(screen.getAllByText("Embraer E135")[0]).toBeInTheDocument()
  })

  it("renders the destination hero image with priority for LCP", () => {
    renderPage()
    const heroImg = screen.getByAltText(lasVegas.imageAlt)
    expect(heroImg).toBeInTheDocument()
    expect(heroImg).toHaveAttribute("data-priority", "true")
  })

  it("renders at least one Search Flights CTA", () => {
    renderPage()
    const ctaButtons = screen.getAllByRole("button", { name: "Search Flights" })
    expect(ctaButtons.length).toBeGreaterThan(0)
  })
})

describe("getStaticPaths", () => {
  it("is exported — pages are statically generated", () => {
    expect(getStaticPaths).toBeDefined()
    expect(typeof getStaticPaths).toBe("function")
  })

  it("generates a path for every route in static data", async () => {
    const result = await getStaticPaths({})
    expect(result.paths).toHaveLength(routes.length)
  })

  it("generates the correct slug path for dallas-to-las-vegas", async () => {
    const result = await getStaticPaths({})
    const slugs = (result.paths as Array<{ params: { slug: string } }>).map(
      (p) => p.params.slug
    )
    expect(slugs).toContain("dallas-to-las-vegas")
  })

  it("sets fallback to false — unknown slugs 404", async () => {
    const result = await getStaticPaths({})
    expect(result.fallback).toBe(false)
  })
})

describe("getStaticProps", () => {
  it("returns route, origin, and destination for a valid slug", async () => {
    const result = await getStaticProps({ params: { slug: "dallas-to-las-vegas" } } as Parameters<typeof getStaticProps>[0])
    expect("props" in result).toBe(true)
    if ("props" in result) {
      const props = result.props as Awaited<typeof result.props>
      expect(props.route.slug).toBe("dallas-to-las-vegas")
      expect(props.origin.id).toBe("dallas")
      expect(props.destination.id).toBe("las-vegas")
    }
  })

  it("returns notFound for an unknown slug", async () => {
    const result = await getStaticProps({ params: { slug: "nowhere-to-nowhere" } } as Parameters<typeof getStaticProps>[0])
    expect("notFound" in result && result.notFound).toBe(true)
  })

  it("every route slug resolves to props without error", async () => {
    for (const route of routes) {
      const result = await getStaticProps({ params: { slug: route.slug } } as Parameters<typeof getStaticProps>[0])
      expect("props" in result).toBe(true)
    }
  })
})

describe("buildFlightJsonLd", () => {
  const jsonLd = buildFlightJsonLd(dallasToLasVegas, dallas, lasVegas)

  it("uses the Flight schema type", () => {
    expect(jsonLd["@type"]).toBe("Flight")
  })

  it("includes the schema.org context", () => {
    expect(jsonLd["@context"]).toBe("https://schema.org")
  })

  it("includes the flight number", () => {
    expect(jsonLd.flightNumber).toBe(dallasToLasVegas.flightNumber)
  })

  it("includes the JSX airline as provider", () => {
    expect(jsonLd.provider["@type"]).toBe("Airline")
    expect(jsonLd.provider.name).toBe("JSX")
    expect(jsonLd.provider.iataCode).toBe("XE")
  })

  it("includes departure airport with full name and IATA code", () => {
    expect(jsonLd.departureAirport["@type"]).toBe("Airport")
    expect(jsonLd.departureAirport.name).toBe(dallas.airportName)
    expect(jsonLd.departureAirport.iataCode).toBe("DAL")
  })

  it("includes arrival airport with full name and IATA code", () => {
    expect(jsonLd.arrivalAirport["@type"]).toBe("Airport")
    expect(jsonLd.arrivalAirport.name).toBe(lasVegas.airportName)
    expect(jsonLd.arrivalAirport.iataCode).toBe("LAS")
  })

  it("includes departure and arrival times as ISO 8601 strings", () => {
    expect(jsonLd.departureTime).toBe(dallasToLasVegas.departureDatetime)
    expect(jsonLd.arrivalTime).toBe(dallasToLasVegas.arrivalDatetime)
    // Must be parseable as a date
    expect(new Date(jsonLd.departureTime).toString()).not.toBe("Invalid Date")
    expect(new Date(jsonLd.arrivalTime).toString()).not.toBe("Invalid Date")
  })

  it("includes aircraft information", () => {
    expect(jsonLd.aircraft["@type"]).toBe("Vehicle")
    expect(jsonLd.aircraft.name).toBe(dallasToLasVegas.aircraftName)
  })

  it("serialises to valid JSON", () => {
    expect(() => JSON.stringify(jsonLd)).not.toThrow()
    const parsed = JSON.parse(JSON.stringify(jsonLd))
    expect(parsed["@type"]).toBe("Flight")
  })
})
