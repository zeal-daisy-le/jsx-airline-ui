import { render, screen, fireEvent } from "@testing-library/react"
import { HeroVideo } from "./HeroVideo"

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
  posterSrc: "/images/hero-poster.jpg",
  posterAlt: "JSX semi-private jet on the tarmac at golden hour",
  videoWebm: "/videos/hero.webm",
  videoMp4: "/videos/hero.mp4",
}

describe("HeroVideo", () => {
  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
    vi.restoreAllMocks()
  })

  it("renders poster image", () => {
    render(<HeroVideo {...defaultProps} />)
    expect(screen.getByAltText(defaultProps.posterAlt)).toBeInTheDocument()
  })

  it("renders video element with correct sources", () => {
    const { container } = render(<HeroVideo {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video).toBeInTheDocument()
    const sources = container.querySelectorAll("source")
    expect(sources).toHaveLength(2)
    expect(sources[0].getAttribute("src")).toBe(defaultProps.videoWebm)
    expect(sources[0].getAttribute("type")).toBe("video/webm")
    expect(sources[1].getAttribute("src")).toBe(defaultProps.videoMp4)
    expect(sources[1].getAttribute("type")).toBe("video/mp4")
  })

  it("video has aria-hidden true", () => {
    const { container } = render(<HeroVideo {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video?.getAttribute("aria-hidden")).toBe("true")
  })

  it("video has preload auto", () => {
    const { container } = render(<HeroVideo {...defaultProps} />)
    const video = container.querySelector("video")
    expect(video?.getAttribute("preload")).toBe("auto")
  })

  it("does not render video when reduced motion is preferred", () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { container } = render(<HeroVideo {...defaultProps} />)
    expect(container.querySelector("video")).not.toBeInTheDocument()
    expect(screen.getByAltText(defaultProps.posterAlt)).toBeInTheDocument()
  })

  it("does not render video on slow connections", () => {
    Object.defineProperty(navigator, "connection", {
      value: { effectiveType: "2g" },
      writable: true,
      configurable: true,
    })
    const { container } = render(<HeroVideo {...defaultProps} />)
    expect(container.querySelector("video")).not.toBeInTheDocument()
    Object.defineProperty(navigator, "connection", {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it("does not render video on slow-2g connections", () => {
    Object.defineProperty(navigator, "connection", {
      value: { effectiveType: "slow-2g" },
      writable: true,
      configurable: true,
    })
    const { container } = render(<HeroVideo {...defaultProps} />)
    expect(container.querySelector("video")).not.toBeInTheDocument()
    Object.defineProperty(navigator, "connection", {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it("renders video when connection API is absent", () => {
    Object.defineProperty(navigator, "connection", {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const { container } = render(<HeroVideo {...defaultProps} />)
    expect(container.querySelector("video")).toBeInTheDocument()
  })

  it("renders pause button", () => {
    render(<HeroVideo {...defaultProps} />)
    expect(screen.getByRole("button", { name: /pause background video/i })).toBeInTheDocument()
  })

  it("pause button toggles aria-label on click", () => {
    render(<HeroVideo {...defaultProps} />)
    const button = screen.getByRole("button", { name: /pause background video/i })
    fireEvent.click(button)
    expect(screen.getByRole("button", { name: /play background video/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /play background video/i }))
    expect(screen.getByRole("button", { name: /pause background video/i })).toBeInTheDocument()
  })
})
