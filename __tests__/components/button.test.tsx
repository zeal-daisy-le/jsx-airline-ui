import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Book a Flight</Button>)
    const btn = screen.getByRole("button", { name: "Book a Flight" })
    expect(btn).toBeInTheDocument()
  })

  it("renders with jsx variant", () => {
    render(<Button variant="jsx">Search Flights</Button>)
    const btn = screen.getByRole("button", { name: "Search Flights" })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveClass("bg-jsx-red")
  })

  it("renders as child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/booking">Book now</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Book now" })
    expect(link).toBeInTheDocument()
  })

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Unavailable</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("applies size variants correctly", () => {
    render(<Button size="lg">Large Button</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-12")
  })
})
