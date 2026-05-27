import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { GuestAccountPrompt } from "@/features/auth/components/GuestAccountPrompt"

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

describe("GuestAccountPrompt", () => {
  it("renders the heading", () => {
    render(<GuestAccountPrompt />)
    expect(
      screen.getByRole("heading", { name: "Save your booking to an account" }),
    ).toBeInTheDocument()
  })

  it("renders create account and sign in links", () => {
    render(<GuestAccountPrompt />)
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/signup",
    )
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
  })

  it("shows the booking reference when provided", () => {
    render(<GuestAccountPrompt bookingReference="ABC123" />)
    expect(screen.getByText("ABC123")).toBeInTheDocument()
  })

  it("does not show a booking reference when none is provided", () => {
    render(<GuestAccountPrompt />)
    expect(screen.queryByText(/Booking reference/)).not.toBeInTheDocument()
  })

  it("is a labelled section for screen readers", () => {
    render(<GuestAccountPrompt />)
    expect(
      screen.getByRole("region", { name: "Save your booking to an account" }),
    ).toBeInTheDocument()
  })
})
