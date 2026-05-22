import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DestinationCard } from "@/components/destinations/DestinationCard"
import HomePage from "@/pages/index"
import { destinations } from "@/data/destinations"
import type { Destination } from "@/data/destinations"

// Capture motion element props for assertion in tests.
// Arrays are reset in beforeEach so each test starts clean.
const capturedProps = {
  articles: [] as any[],
  divs: [] as any[],
}

vi.mock("framer-motion", async () => {
  const { forwardRef } = await import("react")
  return {
    motion: {
      div: forwardRef(
        (
          {
            children,
            whileHover,
            whileTap,
            initial,
            animate,
            exit,
            variants,
            transition,
            ...rest
          }: any,
          ref: any
        ) => {
          capturedProps.divs.push({ whileHover, whileTap, initial, animate, exit, variants, transition })
          return (
            <div ref={ref} {...rest}>
              {children}
            </div>
          )
        }
      ),
      article: ({
        children,
        whileHover,
        whileTap,
        initial,
        animate,
        variants,
        transition,
        ...rest
      }: any) => {
        capturedProps.articles.push({ whileHover, whileTap, initial, animate, variants, transition })
        return <article {...rest}>{children}</article>
      },
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: vi.fn(() => false),
    useInView: vi.fn(() => true),
  }
})

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

import { useReducedMotion, useInView } from "framer-motion"

const mockDestination: Destination = {
  id: "test-city",
  city: "Dallas",
  state: "TX",
  airport: "DAL",
  tagline: "Where every flight begins",
  imageUrl: "/images/destinations/dallas.jpg",
  imageAlt: "Dallas skyline at dusk",
  featured: true,
}

describe("DestinationCard micro-interactions", () => {
  beforeEach(() => {
    capturedProps.articles = []
    capturedProps.divs = []
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  it("applies hover and tap variant names when reduced motion is off", () => {
    render(<DestinationCard destination={mockDestination} />)
    const props = capturedProps.articles[0]
    expect(props.whileHover).toBe("hover")
    expect(props.whileTap).toBe("tap")
  })

  it("disables whileHover and whileTap when reduced motion is on", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<DestinationCard destination={mockDestination} />)
    const props = capturedProps.articles[0]
    expect(props.whileHover).toBeUndefined()
    expect(props.whileTap).toBeUndefined()
  })

  it("defines a hover variant that lifts the card on the Y axis", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(capturedProps.articles[0].variants).toMatchObject({ hover: { y: -4 } })
  })

  it("defines a tap variant that scales the card down", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(capturedProps.articles[0].variants).toMatchObject({ tap: { scale: 0.98 } })
  })

  it("renders the accessible article landmark regardless of animation state", () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByRole("article", { name: "Dallas, TX" })).toBeInTheDocument()
  })

  it("still renders accessible content when reduced motion disables animations", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByRole("article", { name: "Dallas, TX" })).toBeInTheDocument()
    expect(screen.getByText("Dallas, TX")).toBeInTheDocument()
  })
})

describe("Hero entrance animation", () => {
  beforeEach(() => {
    capturedProps.articles = []
    capturedProps.divs = []
    vi.mocked(useReducedMotion).mockReturnValue(false)
    vi.mocked(useInView).mockReturnValue(true)
  })

  it("renders hero content when the element enters the viewport", () => {
    render(<HomePage destinations={destinations} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Fly like you mean it.")
  })

  it("sets an initial hidden state (opacity 0, y 20) when reduced motion is off", () => {
    render(<HomePage destinations={destinations} />)
    const heroDivProps = capturedProps.divs.find(
      (p) => p.initial !== undefined && p.initial !== false && p.initial?.opacity === 0
    )
    expect(heroDivProps).toBeDefined()
    expect(heroDivProps.initial).toEqual({ opacity: 0, y: 20 })
  })

  it("skips the initial hidden state (initial=false) when reduced motion is on", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<HomePage destinations={destinations} />)
    const heroSkipsInitial = capturedProps.divs.find((p) => p.initial === false)
    expect(heroSkipsInitial).toBeDefined()
  })

  it("renders hero heading immediately when reduced motion is on and element is not yet in view", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    vi.mocked(useInView).mockReturnValue(false)
    render(<HomePage destinations={destinations} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Fly like you mean it.")
  })

  it("applies scale micro-interactions to CTA buttons when reduced motion is off", () => {
    render(<HomePage destinations={destinations} />)
    const buttonWrappers = capturedProps.divs.filter(
      (p) =>
        p.whileHover !== undefined &&
        typeof p.whileHover === "object" &&
        "scale" in p.whileHover
    )
    expect(buttonWrappers.length).toBeGreaterThanOrEqual(2)
  })

  it("removes button micro-interactions when reduced motion is on", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<HomePage destinations={destinations} />)
    const animatedButtons = capturedProps.divs.filter((p) => p.whileHover !== undefined)
    expect(animatedButtons).toHaveLength(0)
  })
})
