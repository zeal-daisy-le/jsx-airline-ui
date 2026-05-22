import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import HomePage, { getServerSideProps } from "@/pages/index"
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

function renderHomePage() {
  render(<HomePage destinations={destinations} />)
}

describe("HomePage", () => {
  it("renders the hero heading", () => {
    renderHomePage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Fly like you mean it.")
  })

  it("renders the primary CTA button", () => {
    renderHomePage()
    expect(screen.getByRole("button", { name: "Search Flights" })).toBeInTheDocument()
  })

  it("renders the navigation", () => {
    renderHomePage()
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument()
  })

  it("renders the Book a Flight nav button", () => {
    renderHomePage()
    expect(screen.getByRole("button", { name: "Book a Flight" })).toBeInTheDocument()
  })

  it("renders feature highlights", () => {
    renderHomePage()
    expect(screen.getByText("30-seat jets")).toBeInTheDocument()
    expect(screen.getByText("No hidden fees")).toBeInTheDocument()
    expect(screen.getByText("Terminal-to-terminal")).toBeInTheDocument()
  })

  describe("Hero image", () => {
    it("renders the hero image with priority to prevent LCP delay", () => {
      renderHomePage()
      const heroImg = screen.getByAltText(
        "JSX semi-private aircraft on the tarmac at sunset, ready for departure"
      )
      expect(heroImg).toBeInTheDocument()
      expect(heroImg).toHaveAttribute("data-priority", "true")
    })

    it("renders the hero image using fill layout for full-viewport coverage", () => {
      renderHomePage()
      const heroImg = screen.getByAltText(
        "JSX semi-private aircraft on the tarmac at sunset, ready for departure"
      )
      expect(heroImg).toHaveAttribute("data-fill", "true")
    })
  })

  describe("Destination grid", () => {
    it("renders the destinations section heading", () => {
      renderHomePage()
      expect(
        screen.getByRole("heading", { name: "Where will you fly next?" })
      ).toBeInTheDocument()
    })

    it("renders all destination cards from static data", () => {
      renderHomePage()
      const articles = screen.getAllByRole("article")
      expect(articles).toHaveLength(destinations.length)
    })

    it("renders the Dallas destination card", () => {
      renderHomePage()
      expect(screen.getByRole("article", { name: "Dallas, TX" })).toBeInTheDocument()
    })
  })

  describe("getServerSideProps", () => {
    it("is exported — page is server-rendered", () => {
      expect(getServerSideProps).toBeDefined()
      expect(typeof getServerSideProps).toBe("function")
    })

    it("returns all destinations as props", async () => {
      const result = await getServerSideProps({} as Parameters<typeof getServerSideProps>[0])
      expect("props" in result).toBe(true)
      if ("props" in result) {
        // Next.js types props as P | Promise<P>; our impl always returns a plain object
        const props = result.props as Awaited<typeof result.props>
        expect(props.destinations).toEqual(destinations)
        expect(props.destinations.length).toBeGreaterThan(0)
      }
    })
  })
})
