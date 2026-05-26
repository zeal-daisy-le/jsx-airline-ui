import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { FlightResultCard } from "@/components/booking/FlightResultCard"
import type { FlightResult } from "@/pages/api/search"

const mockFlight: FlightResult = {
  flightId: "DAL-LAS-2099-06-01-0600",
  flightNumber: "JSX101",
  origin: "DAL",
  destination: "LAS",
  departureTime: "2099-06-01T11:00:00Z",
  arrivalTime: "2099-06-01T13:45:00Z",
  durationMinutes: 165,
  pricePerPassenger: 299,
  seatsAvailable: 18,
  aircraft: "Embraer E135",
}

describe("FlightResultCard", () => {
  it("renders the flight number", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("JSX101")).toBeInTheDocument()
  })

  it("renders origin and destination codes", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("DAL")).toBeInTheDocument()
    expect(screen.getByText("LAS")).toBeInTheDocument()
  })

  it("renders the aircraft type", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("Embraer E135")).toBeInTheDocument()
  })

  it("shows total price for a single passenger", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("$299")).toBeInTheDocument()
  })

  it("shows total price for multiple passengers", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={3}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("$897")).toBeInTheDocument()
  })

  it("shows per-passenger breakdown when there are multiple passengers", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={2}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("$299 × 2")).toBeInTheDocument()
  })

  it("calls onSelect with the flight when Select is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /select/i }))
    expect(onSelect).toHaveBeenCalledWith(mockFlight)
  })

  it("disables the Select button when isSelecting is true", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
        isSelecting
      />
    )
    expect(screen.getByRole("button", { name: /selecting/i })).toBeDisabled()
  })

  it("disables the button when there are not enough seats for all passengers", () => {
    const lowSeatFlight = { ...mockFlight, seatsAvailable: 1 }
    render(
      <FlightResultCard
        flight={lowSeatFlight}
        totalPassengers={3}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("shows a low availability warning when seats are 5 or fewer", () => {
    const lowSeatFlight = { ...mockFlight, seatsAvailable: 3 }
    render(
      <FlightResultCard
        flight={lowSeatFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText(/only 3 seats? left/i)).toBeInTheDocument()
  })

  it("has an accessible article landmark", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByRole("article")).toBeInTheDocument()
  })

  it("duration is rendered", () => {
    render(
      <FlightResultCard
        flight={mockFlight}
        totalPassengers={1}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText("2h 45m")).toBeInTheDocument()
  })
})
