import { render, screen } from "@testing-library/react"
import { ExperienceVideoCard } from "./ExperienceVideoCard"

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion")
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  }
})

import { useReducedMotion } from "framer-motion"
const mockUseReducedMotion = vi.mocked(useReducedMotion)

const defaultProps = {
  title: "Skip the airport stress.",
  subtitle: "No TSA, no lines, no terminals",
  posterSrc: "/images/experience/skip-airport-stress-poster.jpg",
  videoWebm: "/videos/experience/skip-airport-stress.webm",
  videoMp4: "/videos/experience/skip-airport-stress.mp4",
  alt: "Woman walking with golden retriever past JSX jet",
}

describe("ExperienceVideoCard", () => {
  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  it("renders title and subtitle", () => {
    render(<ExperienceVideoCard {...defaultProps} />)
    expect(screen.getByText("Skip the airport stress.")).toBeInTheDocument()
    expect(screen.getByText("No TSA, no lines, no terminals")).toBeInTheDocument()
  })

  it("renders poster image", () => {
    render(<ExperienceVideoCard {...defaultProps} />)
    const img = screen.getByAltText(defaultProps.alt)
    expect(img).toBeInTheDocument()
  })

  it("renders video element with correct sources", () => {
    const { container } = render(<ExperienceVideoCard {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video).toBeInTheDocument()
    const sources = container.querySelectorAll("source")
    expect(sources).toHaveLength(2)
    expect(sources[0].getAttribute("src")).toBe(defaultProps.videoWebm)
    expect(sources[0].getAttribute("type")).toBe("video/webm")
    expect(sources[1].getAttribute("src")).toBe(defaultProps.videoMp4)
    expect(sources[1].getAttribute("type")).toBe("video/mp4")
  })

  it("video is decorative (aria-hidden)", () => {
    const { container } = render(<ExperienceVideoCard {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video?.getAttribute("aria-hidden")).toBe("true")
  })

  it("does not render video when reduced motion is preferred", () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { container } = render(<ExperienceVideoCard {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video).not.toBeInTheDocument()
    expect(screen.getByAltText(defaultProps.alt)).toBeInTheDocument()
  })

  it("renders pause button", () => {
    render(<ExperienceVideoCard {...defaultProps} />)
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
  })
})
