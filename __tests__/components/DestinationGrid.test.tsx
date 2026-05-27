import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DestinationGrid } from "@/features/home/components/DestinationGrid"
import type { Destination } from "@/data/destinations"

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

const featuredDestination: Destination = {
  id: "dallas",
  city: "Dallas",
  state: "TX",
  airport: "DAL",
  airportName: "Dallas Love Field",
  tagline: "Where every flight begins",
  imageUrl: "/images/destinations/dallas.jpg",
  imageAlt: "Dallas skyline at dusk",
  featured: true,
}

const regularDestination: Destination = {
  id: "las-vegas",
  city: "Las Vegas",
  state: "NV",
  airport: "LAS",
  airportName: "Harry Reid International Airport",
  tagline: "The Strip, on your terms",
  imageUrl: "/images/destinations/las-vegas.jpg",
  imageAlt: "Las Vegas Strip at night",
}

describe("DestinationGrid", () => {
  it("renders the section heading", () => {
    render(<DestinationGrid destinations={[featuredDestination]} />)
    expect(
      screen.getByRole("heading", { name: "Where will you fly next?" })
    ).toBeInTheDocument()
  })

  it("renders the 'Destinations' label", () => {
    render(<DestinationGrid destinations={[featuredDestination]} />)
    expect(screen.getByText("Destinations")).toBeInTheDocument()
  })

  it("renders all destination cards", () => {
    render(
      <DestinationGrid destinations={[featuredDestination, regularDestination]} />
    )
    expect(screen.getByRole("article", { name: "Dallas, TX" })).toBeInTheDocument()
    expect(screen.getByRole("article", { name: "Las Vegas, NV" })).toBeInTheDocument()
  })

  it("passes priority to the first featured card to prevent LCP delay", () => {
    render(<DestinationGrid destinations={[featuredDestination]} />)
    // The first featured card image should have priority
    const images = screen.getAllByRole("img")
    const firstFeaturedImage = images[0]
    expect(firstFeaturedImage).toHaveAttribute("data-priority", "true")
  })

  it("does not pass priority to regular (below-fold) destination cards", () => {
    render(
      <DestinationGrid destinations={[featuredDestination, regularDestination]} />
    )
    // The regular card image should not have priority (lazy-loaded)
    const regularCard = screen.getByRole("article", { name: "Las Vegas, NV" })
    const regularImg = regularCard.querySelector("img")
    expect(regularImg).not.toHaveAttribute("data-priority")
  })

  it("renders with an accessible section landmark", () => {
    render(<DestinationGrid destinations={[featuredDestination]} />)
    expect(
      screen.getByRole("region", { name: "Where will you fly next?" })
    ).toBeInTheDocument()
  })

  it("renders nothing when destinations array is empty", () => {
    const { container } = render(<DestinationGrid destinations={[]} />)
    // Section heading still renders but no cards
    expect(screen.queryAllByRole("article")).toHaveLength(0)
    expect(container.querySelector("[aria-label]")).toBeNull()
  })
})
