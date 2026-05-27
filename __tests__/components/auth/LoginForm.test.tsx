import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { act } from "@testing-library/react"

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn(), query: {} }),
}))

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ user: null, isLoading: false })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function fillAndSubmit(email = "alice@jsx.com", password = "secret") {
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } })
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }))
}

describe("LoginForm", () => {
  it("renders email and password fields with a submit button", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Email address")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("shows inline validation error for an empty email on submit", async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it("shows inline validation error for an empty password on submit", async () => {
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alice@jsx.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it("shows a server error message when login returns 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email or password" }),
    } as Response)

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password")
    })
  })

  it("does not show a server error when login succeeds", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "u1", email: "alice@jsx.com", firstName: "Alice", lastName: "Smith" } }),
      } as Response)

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })
  })

  it("email input has type=email for native browser validation", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email")
  })

  it("password input has type=password so characters are masked", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
  })
})
