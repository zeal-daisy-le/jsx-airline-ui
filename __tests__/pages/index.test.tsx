import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import HomePage from "@/pages/index"

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe("HomePage", () => {
  it("renders the hero heading", () => {
    render(<HomePage />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Fly like you mean it.")
  })

  it("renders the primary CTA button", () => {
    render(<HomePage />)
    expect(screen.getByRole("button", { name: "Search Flights" })).toBeInTheDocument()
  })

  it("renders the navigation", () => {
    render(<HomePage />)
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument()
  })

  it("renders the Book a Flight nav button", () => {
    render(<HomePage />)
    expect(screen.getByRole("button", { name: "Book a Flight" })).toBeInTheDocument()
  })

  it("renders feature highlights", () => {
    render(<HomePage />)
    expect(screen.getByText("30-seat jets")).toBeInTheDocument()
    expect(screen.getByText("No hidden fees")).toBeInTheDocument()
    expect(screen.getByText("Terminal-to-terminal")).toBeInTheDocument()
  })
})
