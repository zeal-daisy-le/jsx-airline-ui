import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PassengerStepper } from "@/features/booking/components/PassengerStepper"

function renderStepper(overrides: Partial<Parameters<typeof PassengerStepper>[0]> = {}) {
  const onChange = vi.fn()
  const props = {
    id: "adults",
    label: "Adults",
    sublabel: "Age 18+",
    value: 1,
    min: 1,
    max: 9,
    onChange,
    ...overrides,
  }
  render(<PassengerStepper {...props} />)
  return { onChange }
}

describe("PassengerStepper", () => {
  it("renders the label, sublabel, and current count", () => {
    renderStepper({ value: 2 })
    expect(screen.getByText("Adults")).toBeInTheDocument()
    expect(screen.getByText("Age 18+")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("increment button has an accessible aria-label", () => {
    renderStepper()
    expect(
      screen.getByRole("button", { name: "Increase number of adults" })
    ).toBeInTheDocument()
  })

  it("decrement button has an accessible aria-label", () => {
    renderStepper()
    expect(
      screen.getByRole("button", { name: "Decrease number of adults" })
    ).toBeInTheDocument()
  })

  it("calls onChange with incremented value when increment is clicked", () => {
    const { onChange } = renderStepper({ value: 2 })
    fireEvent.click(screen.getByRole("button", { name: "Increase number of adults" }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it("calls onChange with decremented value when decrement is clicked", () => {
    const { onChange } = renderStepper({ value: 3 })
    fireEvent.click(screen.getByRole("button", { name: "Decrease number of adults" }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it("disables the decrement button when value equals min", () => {
    renderStepper({ value: 1, min: 1 })
    expect(screen.getByRole("button", { name: "Decrease number of adults" })).toBeDisabled()
  })

  it("disables the increment button when value equals max", () => {
    renderStepper({ value: 9, max: 9 })
    expect(screen.getByRole("button", { name: "Increase number of adults" })).toBeDisabled()
  })

  it("does not call onChange below min when decrement is clicked while disabled", () => {
    const { onChange } = renderStepper({ value: 1, min: 1 })
    fireEvent.click(screen.getByRole("button", { name: "Decrease number of adults" }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("does not call onChange above max when increment is clicked while disabled", () => {
    const { onChange } = renderStepper({ value: 9, max: 9 })
    fireEvent.click(screen.getByRole("button", { name: "Increase number of adults" }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("renders error message with role=alert when error is provided", () => {
    renderStepper({ error: "At least 1 adult is required" })
    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent("At least 1 adult is required")
  })

  it("does not render an error element when error is undefined", () => {
    renderStepper({ error: undefined })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("output element has aria-live=polite for screen reader announcements", () => {
    renderStepper({ value: 3 })
    const output = screen.getByText("3")
    expect(output.tagName.toLowerCase()).toBe("output")
    expect(output).toHaveAttribute("aria-live", "polite")
    expect(output).toHaveAttribute("aria-atomic", "true")
  })

  it("renders with value=0 and min=0 — decrement is disabled", () => {
    renderStepper({ id: "infants", label: "Infants", sublabel: "Under 2", value: 0, min: 0 })
    expect(screen.getByRole("button", { name: "Decrease number of infants" })).toBeDisabled()
  })
})
