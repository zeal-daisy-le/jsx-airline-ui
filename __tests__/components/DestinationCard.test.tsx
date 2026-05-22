import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DestinationCard } from "@/components/destinations/DestinationCard"
import type { Destination } from "@/data/destinations"

vi.mock("framer-motion", () => ({
  motion: {
    article: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      variants,
      transition,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => (
      <article {...props}>{children}</article>
    ),
  },
  useReducedMotion: vi.fn(() => false),
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

const mockDestination: Destination = {
  id: "dallas",
  city: "Dallas",
  state: "TX",
  airport: "DAL",
  tagline: "Where every flight begins",
  imageUrl: "/images/destinations/dallas.jpg",
  imageAlt: "Dallas skyline at dusk",
  featured: true,
}

describe("DestinationCard", () => {
  it("renders the city and state", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByText("Dallas, TX")).toBeInTheDocument()
  })

  it("renders the airport code", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByText("DAL")).toBeInTheDocument()
  })

  it("renders the tagline", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByText("Where every flight begins")).toBeInTheDocument()
  })

  it("renders an image with the correct alt text", () => {
    render(<DestinationCard destination={mockDestination} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("alt", "Dallas skyline at dusk")
  })

  it("renders an image with explicit width and height for CLS prevention", () => {
    render(<DestinationCard destination={mockDestination} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("width", "800")
    expect(img).toHaveAttribute("height", "533")
  })

  it("does not set priority by default", () => {
    render(<DestinationCard destination={mockDestination} />)
    const img = screen.getByRole("img")
    expect(img).not.toHaveAttribute("data-priority")
  })

  it("sets priority when the priority prop is true", () => {
    render(<DestinationCard destination={mockDestination} priority />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("data-priority", "true")
  })

  it("has an accessible article landmark with a descriptive label", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(
      screen.getByRole("article", { name: "Dallas, TX" })
    ).toBeInTheDocument()
  })
})
