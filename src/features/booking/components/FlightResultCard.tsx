import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FlightResult } from "@/pages/api/search"

interface FlightResultCardProps {
  flight: FlightResult
  totalPassengers: number
  onSelect: (flight: FlightResult) => void
  isSelecting?: boolean
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents)
}

const LOW_SEAT_THRESHOLD = 5

export function FlightResultCard({
  flight,
  totalPassengers,
  onSelect,
  isSelecting = false,
}: FlightResultCardProps) {
  const totalPrice = flight.pricePerPassenger * totalPassengers
  const isLowAvailability = flight.seatsAvailable <= LOW_SEAT_THRESHOLD
  const hasEnoughSeats = flight.seatsAvailable >= totalPassengers

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-5 transition-shadow hover:shadow-md",
        hasEnoughSeats ? "border-jsx-gray-200" : "border-jsx-gray-200 opacity-60"
      )}
      aria-label={`${flight.flightNumber} departing at ${formatTime(flight.departureTime)}, ${formatPrice(totalPrice)} total`}
    >
      {/* Flight number header */}
      <p className="mb-3 text-xs font-medium text-jsx-gray-500">
        {flight.flightNumber}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Route timeline */}
        <div className="flex flex-1 items-center gap-3 sm:gap-6">
          {/* Departure */}
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-jsx-black sm:text-2xl">
              {formatTime(flight.departureTime)}
            </p>
            <p className="text-sm font-medium text-jsx-gray-500">{flight.origin}</p>
          </div>

          {/* Duration line */}
          <div className="flex flex-1 flex-col items-center gap-1">
            <p className="text-xs text-jsx-gray-500">{formatDuration(flight.durationMinutes)}</p>
            <div className="flex w-full items-center gap-1">
              <div className="h-px flex-1 bg-jsx-gray-200" />
              <Plane
                className="h-3.5 w-3.5 rotate-90 text-jsx-gray-500"
                aria-hidden="true"
              />
              <div className="h-px flex-1 bg-jsx-gray-200" />
            </div>
            <p className="text-xs text-jsx-gray-500">{flight.aircraft}</p>
          </div>

          {/* Arrival */}
          <div className="text-center sm:text-right">
            <p className="text-xl font-bold text-jsx-black sm:text-2xl">
              {formatTime(flight.arrivalTime)}
            </p>
            <p className="text-sm font-medium text-jsx-gray-500">{flight.destination}</p>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex w-full flex-row items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
          <div className="sm:text-right">
            <p className="text-xl font-bold text-jsx-black">
              {formatPrice(totalPrice)}
            </p>
            {totalPassengers > 1 && (
              <p className="text-xs text-jsx-gray-500">
                {formatPrice(flight.pricePerPassenger)} × {totalPassengers}
              </p>
            )}
            {isLowAvailability && hasEnoughSeats && (
              <p className="text-xs font-medium text-jsx-red" role="status">
                Only {flight.seatsAvailable} seat{flight.seatsAvailable !== 1 ? "s" : ""} left
              </p>
            )}
            {!hasEnoughSeats && (
              <p className="text-xs font-medium text-jsx-gray-500" role="status">
                Not enough seats available
              </p>
            )}
          </div>

          <Button
            variant="jsx"
            size="sm"
            onClick={() => onSelect(flight)}
            disabled={!hasEnoughSeats || isSelecting}
            aria-label={
              isSelecting
                ? `Selecting ${flight.flightNumber}…`
                : `Select ${flight.flightNumber} for ${formatPrice(totalPrice)}`
            }
          >
            {isSelecting ? "Selecting…" : "Select"}
          </Button>
        </div>
      </div>
    </article>
  )
}
