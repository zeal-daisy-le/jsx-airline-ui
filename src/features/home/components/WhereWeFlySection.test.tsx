import { render, screen } from "@testing-library/react"
import { WhereWeFlySection } from "./WhereWeFlySection"
import type { Destination } from "@/data/destinations"

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion")
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  }
})

import { useReducedMotion } from "framer-motion"
const mockUseReducedMotion = vi.mocked(useReducedMotion)

const mockDestinations: Destination[] = [
  {
    id: "dallas-to-burbank",
    city: "Burbank",
    state: "CA",
    airport: "BUR",
    tagline: "The gateway to LA",
    imageUrl: "/images/destinations/burbank.jpg",
    imageAlt: "Aerial view of Burbank",
    from: "Dallas",
    fromAirport: "DAL",
    flightDuration: "3h 15m",
    startingPrice: 199,
  },
  {
    id: "dallas-to-las-vegas",
    city: "Las Vegas",
    state: "NV",
    airport: "LAS",
    tagline: "Entertainment capital",
    imageUrl: "/images/destinations/las-vegas.jpg",
    imageAlt: "Las Vegas strip at night",
    from: "Dallas",
    fromAirport: "DAL",
    flightDuration: "2h 45m",
    startingPrice: 179,
  },
]

describe("WhereWeFlySection", () => {
  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  it("renders destination cards with city and state", () => {
    render(<WhereWeFlySection destinations={mockDestinations} />)
    expect(screen.getByText("Burbank, CA")).toBeInTheDocument()
    expect(screen.getByText("Las Vegas, NV")).toBeInTheDocument()
  })

  it("renders section heading", () => {
    render(<WhereWeFlySection destinations={mockDestinations} />)
    expect(screen.getByText("Where We Fly")).toBeInTheDocument()
  })

  it("does not use CSS group-hover:scale-105 on images", () => {
    const { container } = render(<WhereWeFlySection destinations={mockDestinations} />)
    const images = container.querySelectorAll("img")
    images.forEach((img) => {
      expect(img.className).not.toContain("group-hover:scale-105")
    })
  })

  it("wraps cards in scroll-reveal wrappers with stagger delays", () => {
    const { container } = render(<WhereWeFlySection destinations={mockDestinations} />)
    const motionDivs = container.querySelectorAll("[style]")
    expect(motionDivs.length).toBeGreaterThan(0)
  })

  it("renders See All Routes link", () => {
    render(<WhereWeFlySection destinations={mockDestinations} />)
    expect(screen.getByText("See All Routes")).toBeInTheDocument()
  })
})
