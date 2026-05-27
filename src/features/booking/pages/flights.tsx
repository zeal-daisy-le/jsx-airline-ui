import type { NextPage } from "next"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useBookingGuard } from "@/features/booking/hooks/useBookingGuard"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/features/booking/components/BookingLayout"
import { FlightResultCard } from "@/features/booking/components/FlightResultCard"
import { FlightResultSkeletonList } from "@/features/booking/components/FlightResultSkeleton"
import { Button } from "@/components/ui/button"
import { withRetry } from "@/lib/api/retry"
import { bookingEvents } from "@/features/booking/utils/analytics"
import { destinations } from "@/data/destinations"
import type { FlightResult, SearchResponse } from "@/pages/api/search"

// ── Form schema ───────────────────────────────────────────────────────────────

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const searchSchema = z
  .object({
    origin: z.string().min(1, "Select an origin"),
    destination: z.string().min(1, "Select a destination"),
    date: z
      .string()
      .min(1, "Select a date")
      .refine((v) => new Date(v) >= today(), "Date must be today or in the future"),
    adults: z.coerce.number().int().min(1, "At least 1 adult required").max(9),
    children: z.coerce.number().int().min(0).max(8),
    infants: z.coerce.number().int().min(0).max(8),
  })
  .refine((d) => d.origin !== d.destination, {
    message: "Origin and destination must be different",
    path: ["destination"],
  })
  .refine((d) => d.infants <= d.adults, {
    message: "Infants cannot exceed adults",
    path: ["infants"],
  })

type SearchFormValues = z.infer<typeof searchSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const AIRPORTS = destinations.map((d) => ({
  code: d.airport,
  label: `${d.city}, ${d.state} (${d.airport})`,
}))

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

async function fetchFlights(params: SearchFormValues): Promise<FlightResult[]> {
  const qs = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    adults: String(params.adults),
    children: String(params.children),
    infants: String(params.infants),
  })

  const res = await fetch(`/api/search?${qs.toString()}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "Flight search failed")
  }
  const data = (await res.json()) as SearchResponse
  return data.flights
}

// ── Page component ────────────────────────────────────────────────────────────

const BookingFlightsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("flights")
  const router = useRouter()

  const setSelectedFlight = useBookingStore((s) => s.setSelectedFlight)
  const passengers = useBookingStore((s) => s.passengers)
  const showToast = useErrorStore((s) => s.showToast)
  const setRetrying = useErrorStore((s) => s.setRetrying)
  const onAllRetriesExhausted = useErrorStore((s) => s.onAllRetriesExhausted)

  const [flights, setFlights] = useState<FlightResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [searchedParams, setSearchedParams] = useState<SearchFormValues | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: todayIso(),
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
    },
  })

  const selectedOrigin = watch("origin")

  // Fire step viewed event once on mount
  useEffect(() => {
    if (canAccess) {
      bookingEvents.stepViewed("flights")
    }
  }, [canAccess])

  const onSubmit = useCallback(
    async (values: SearchFormValues) => {
      setFlights(null)
      setIsLoading(true)
      setSearchedParams(values)

      try {
        const results = await withRetry(() => fetchFlights(values), {
          maxRetries: 2,
          onRetrying: (attempt) => {
            setRetrying(true)
            showToast(`Retrying flight search… (attempt ${attempt})`)
          },
        })
        setFlights(results)
        setRetrying(false)
      } catch (err) {
        setRetrying(false)
        const message = err instanceof Error ? err.message : "Flight search failed"
        onAllRetriesExhausted(message, () => onSubmit(values))
      } finally {
        setIsLoading(false)
      }
    },
    [showToast, setRetrying, onAllRetriesExhausted]
  )

  const handleSelectFlight = useCallback(
    async (flight: FlightResult) => {
      setSelectingId(flight.flightId)

      const stored: Parameters<typeof setSelectedFlight>[0] = {
        flightId: flight.flightId,
        flightNumber: flight.flightNumber,
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        pricePerPassenger: flight.pricePerPassenger,
      }
      setSelectedFlight(stored)

      bookingEvents.stepCompleted("flights", {
        flightNumber: flight.flightNumber,
        origin: flight.origin,
        destination: flight.destination,
        pricePerPassenger: flight.pricePerPassenger,
      })

      await router.push("/booking/passengers")
    },
    [setSelectedFlight, router]
  )

  if (!canAccess) return null

  const totalPassengers =
    (searchedParams?.adults ?? passengers.adults) +
    (searchedParams?.children ?? passengers.children)

  return (
    <BookingLayout currentStep="flights">
      <h1 className="text-display-sm font-semibold text-jsx-black">
        Search flights
      </h1>
      <p className="mt-1 text-jsx-gray-500">
        Find a flight and select your seats.
      </p>

      {/* ── Search form ─────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Flight search"
        className="mt-6 space-y-4 rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5"
      >
        {/* Origin / Destination */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="origin"
              className="block text-sm font-medium text-jsx-gray-700"
            >
              From
            </label>
            <select
              id="origin"
              {...register("origin")}
              className="mt-1 block w-full rounded-md border border-jsx-gray-300 bg-white px-3 py-2.5 text-sm text-jsx-black shadow-sm focus:border-jsx-red focus:outline-none focus:ring-1 focus:ring-jsx-red"
              aria-describedby={errors.origin ? "origin-error" : undefined}
              aria-invalid={!!errors.origin}
            >
              <option value="">Select origin</option>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
            {errors.origin && (
              <p id="origin-error" role="alert" className="mt-1 text-xs text-jsx-red">
                {errors.origin.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="destination"
              className="block text-sm font-medium text-jsx-gray-700"
            >
              To
            </label>
            <select
              id="destination"
              {...register("destination")}
              className="mt-1 block w-full rounded-md border border-jsx-gray-300 bg-white px-3 py-2.5 text-sm text-jsx-black shadow-sm focus:border-jsx-red focus:outline-none focus:ring-1 focus:ring-jsx-red"
              aria-describedby={errors.destination ? "destination-error" : undefined}
              aria-invalid={!!errors.destination}
            >
              <option value="">Select destination</option>
              {AIRPORTS.filter((a) => a.code !== selectedOrigin).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
            {errors.destination && (
              <p id="destination-error" role="alert" className="mt-1 text-xs text-jsx-red">
                {errors.destination.message}
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-jsx-gray-700"
          >
            Departure date
          </label>
          <input
            type="date"
            id="date"
            {...register("date")}
            min={todayIso()}
            className="mt-1 block w-full rounded-md border border-jsx-gray-300 bg-white px-3 py-2.5 text-sm text-jsx-black shadow-sm focus:border-jsx-red focus:outline-none focus:ring-1 focus:ring-jsx-red sm:w-56"
            aria-describedby={errors.date ? "date-error" : undefined}
            aria-invalid={!!errors.date}
          />
          {errors.date && (
            <p id="date-error" role="alert" className="mt-1 text-xs text-jsx-red">
              {errors.date.message}
            </p>
          )}
        </div>

        {/* Passenger counts */}
        <fieldset>
          <legend className="text-sm font-medium text-jsx-gray-700">
            Passengers
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <PassengerCountField
              id="adults"
              label="Adults"
              sublabel="Age 18+"
              {...register("adults", { valueAsNumber: true })}
              error={errors.adults?.message}
            />
            <PassengerCountField
              id="children"
              label="Children"
              sublabel="Ages 2–17"
              {...register("children", { valueAsNumber: true })}
              error={errors.children?.message}
            />
            <PassengerCountField
              id="infants"
              label="Infants"
              sublabel="Under 2"
              {...register("infants", { valueAsNumber: true })}
              error={errors.infants?.message}
            />
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="jsx"
          size="lg"
          disabled={isLoading}
          className="w-full sm:w-auto"
          aria-busy={isLoading}
        >
          {isLoading ? "Searching…" : "Search flights"}
        </Button>
      </form>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="mt-8">
          <FlightResultSkeletonList count={4} />
        </div>
      )}

      {!isLoading && flights !== null && (
        <section className="mt-8" aria-label="Available flights" aria-live="polite">
          {flights.length === 0 ? (
            <div className="rounded-xl border border-jsx-gray-200 bg-white px-6 py-12 text-center">
              <p className="text-jsx-gray-600">
                No flights found for this route and date. Try a different date or
                route.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold text-jsx-black">
                {flights.length} flight{flights.length !== 1 ? "s" : ""} available
              </h2>
              <div className="space-y-3">
                {flights.map((flight) => (
                  <FlightResultCard
                    key={flight.flightId}
                    flight={flight}
                    totalPassengers={totalPassengers}
                    onSelect={handleSelectFlight}
                    isSelecting={selectingId === flight.flightId}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </BookingLayout>
  )
}

// ── PassengerCountField ───────────────────────────────────────────────────────

interface PassengerCountFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  sublabel?: string
  error?: string
}

const PassengerCountField = ({
  id,
  label,
  sublabel,
  error,
  ...inputProps
}: PassengerCountFieldProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-jsx-gray-700">
      {label}
      {sublabel && (
        <span className="ml-1 text-xs font-normal text-jsx-gray-400">
          ({sublabel})
        </span>
      )}
    </label>
    <input
      type="number"
      id={id}
      min={0}
      max={9}
      className="mt-1 block w-full rounded-md border border-jsx-gray-300 bg-white px-3 py-2.5 text-sm text-jsx-black shadow-sm focus:border-jsx-red focus:outline-none focus:ring-1 focus:ring-jsx-red"
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
      {...inputProps}
    />
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-jsx-red">
        {error}
      </p>
    )}
  </div>
)

export default BookingFlightsPage
