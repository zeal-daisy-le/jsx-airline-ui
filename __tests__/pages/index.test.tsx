import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import HomePage, { getServerSideProps } from "@/pages/index"
import { destinations } from "@/data/destinations"

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
            ...props
          }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>
        ) => (
          <div ref={ref} {...props}>
            {children}
          </div>
        )
      ),
      span: ({
        children,
        initial,
        animate,
        exit,
        transition,
        ...props
      }: React.HTMLAttributes<HTMLSpanElement> & Record<string, unknown>) => (
        <span {...props}>{children}</span>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: vi.fn(() => false),
    useInView: vi.fn(() => true),
  }
})

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

const ADJECTIVES = ["EFFICIENT", "EFFORTLESS", "ELEVATED"]

function renderHomePage() {
  render(<HomePage destinations={destinations} />)
}

describe("HomePage", () => {
  it("renders the hero heading with a rotating adjective", () => {
    renderHomePage()
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(ADJECTIVES.some((word) => h1.textContent?.includes(word))).toBe(true)
  })

  it("renders the search flights link", () => {
    renderHomePage()
    expect(
      screen.getByRole("link", { name: /search flights/i })
    ).toBeInTheDocument()
  })

  it("renders the JSX logo link", () => {
    renderHomePage()
    expect(screen.getByRole("link", { name: /JSX home/i })).toBeInTheDocument()
  })

  it("renders the sign in link", () => {
    renderHomePage()
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument()
  })

  it("renders the hamburger menu button", () => {
    renderHomePage()
    expect(
      screen.getByRole("button", { name: /open navigation menu/i })
    ).toBeInTheDocument()
  })

  describe("Hero image", () => {
    it("renders the hero image with priority to prevent LCP delay", () => {
      renderHomePage()
      const heroImg = screen.getByAltText(
        "JSX semi-private jet on the tarmac at golden hour"
      )
      expect(heroImg).toBeInTheDocument()
      expect(heroImg).toHaveAttribute("data-priority", "true")
    })

    it("renders the hero image using fill layout for full-viewport coverage", () => {
      renderHomePage()
      const heroImg = screen.getByAltText(
        "JSX semi-private jet on the tarmac at golden hour"
      )
      expect(heroImg).toHaveAttribute("data-fill", "true")
    })
  })

  describe("JSX Experience section", () => {
    it("renders the section heading", () => {
      renderHomePage()
      expect(
        screen.getByRole("heading", { name: "The JSX Experience" })
      ).toBeInTheDocument()
    })

    it("renders the experience card list", () => {
      renderHomePage()
      expect(
        screen.getByRole("list", { name: "JSX experience highlights" })
      ).toBeInTheDocument()
    })
  })

  describe("Where We Fly section", () => {
    it("renders the section heading", () => {
      renderHomePage()
      expect(screen.getByRole("heading", { name: "Where We Fly" })).toBeInTheDocument()
    })

    it("renders exactly 4 destination links", () => {
      renderHomePage()
      const destList = screen.getByRole("list", { name: "Flight destinations" })
      const destLinks = Array.from(destList.querySelectorAll("[aria-label*='Flights to']"))
      expect(destLinks.length).toBe(4)
    })

    it("renders the See All Routes link", () => {
      renderHomePage()
      expect(screen.getByRole("link", { name: /see all routes/i })).toBeInTheDocument()
    })
  })

  describe("Join Club JSX section", () => {
    it("renders the section heading", () => {
      renderHomePage()
      expect(screen.getByRole("heading", { name: "Join Club JSX" })).toBeInTheDocument()
    })

    it("renders the Become a Member link", () => {
      renderHomePage()
      expect(
        screen.getByRole("link", { name: /become a member for free/i })
      ).toBeInTheDocument()
    })

    it("renders all four Club JSX stats", () => {
      renderHomePage()
      expect(screen.getByText("5%")).toBeInTheDocument()
      expect(screen.getByText("2X")).toBeInTheDocument()
      expect(screen.getByText("$100")).toBeInTheDocument()
    })
  })

  describe("Footer", () => {
    it("renders the site footer landmark", () => {
      renderHomePage()
      expect(screen.getByRole("contentinfo")).toBeInTheDocument()
    })

    it("renders Fly JSX footer section", () => {
      renderHomePage()
      expect(screen.getByRole("heading", { name: "Fly JSX" })).toBeInTheDocument()
    })

    it("renders Legal footer section", () => {
      renderHomePage()
      expect(screen.getByRole("heading", { name: "Legal" })).toBeInTheDocument()
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
        const props = result.props as Awaited<typeof result.props>
        expect(props.destinations).toEqual(destinations)
        expect(props.destinations.length).toBeGreaterThan(0)
      }
    })
  })
})
