import type { NextPage } from "next"
import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/router"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useBookingGuard } from "@/hooks/useBookingGuard"
import { useBookingStore } from "@/stores/bookingStore"
import { useErrorStore } from "@/stores/errorStore"
import { BookingLayout } from "@/components/booking/BookingLayout"
import { Button } from "@/components/ui/button"
import { withRetry } from "@/lib/api/retry"
import { bookingEvents } from "@/lib/analytics"
import type { PassengerCount } from "@/stores/bookingStore"

// ── Zod schema ────────────────────────────────────────────────────────────────

const passengerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => {
      const d = new Date(v)
      return !isNaN(d.getTime()) && d < new Date()
    }, "Date of birth must be a valid past date"),
  documentType: z.enum(["passport", "id"]),
  documentNumber: z
    .string()
    .min(6, "Must be at least 6 characters")
    .max(20, "Must be at most 20 characters")
    .regex(/^[A-Z0-9]+$/i, "Letters and numbers only"),
  nationality: z.string().min(1, "Nationality is required"),
})

const detailsSchema = z.object({
  passengers: z.array(passengerSchema).min(1),
  contact: z.object({
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .min(6, "Phone number is required")
      .regex(/^[+\d\s()\-]+$/, "Enter a valid phone number"),
  }),
})

type DetailsFormValues = z.infer<typeof detailsSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

type PassengerEntry = { type: "adult" | "child" | "infant"; label: string }

function buildPassengerList(passengers: PassengerCount): PassengerEntry[] {
  const list: PassengerEntry[] = []
  for (let i = 0; i < passengers.adults; i++) {
    list.push({ type: "adult", label: passengers.adults === 1 ? "Adult" : `Adult ${i + 1}` })
  }
  for (let i = 0; i < passengers.children; i++) {
    list.push({ type: "child", label: passengers.children === 1 ? "Child" : `Child ${i + 1}` })
  }
  for (let i = 0; i < passengers.infants; i++) {
    list.push({ type: "infant", label: passengers.infants === 1 ? "Infant" : `Infant ${i + 1}` })
  }
  return list
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface FieldError {
  message?: string
}

interface LabelledFieldProps {
  id: string
  label: string
  error?: FieldError
  children: React.ReactNode
  required?: boolean
}

function LabelledField({ id, label, error, children, required = true }: LabelledFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-jsx-gray-700 mb-1">
        {label}
        {required && <span className="text-jsx-red ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error?.message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-sm text-jsx-red"
        >
          {error.message}
        </p>
      )}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return [
    "block w-full rounded-md border px-3 py-2 text-sm text-jsx-black",
    "focus:outline-none focus:ring-2 focus:ring-jsx-red focus:border-jsx-red",
    "disabled:opacity-50",
    hasError
      ? "border-jsx-red bg-red-50"
      : "border-jsx-gray-300 bg-white",
  ].join(" ")
}

// ── Page component ─────────────────────────────────────────────────────────────

const BookingDetailsPage: NextPage = () => {
  const { canAccess } = useBookingGuard("details")
  const router = useRouter()

  const passengers = useBookingStore((s) => s.passengers)
  const storedTravelerInfo = useBookingStore((s) => s.travelerInfo)
  const storedContactDetails = useBookingStore((s) => s.contactDetails)
  const setTravelerInfo = useBookingStore((s) => s.setTravelerInfo)
  const setContactDetails = useBookingStore((s) => s.setContactDetails)

  const setRetrying = useErrorStore((s) => s.setRetrying)
  const onAllRetriesExhausted = useErrorStore((s) => s.onAllRetriesExhausted)

  const passengerList = useMemo(() => buildPassengerList(passengers), [passengers])

  const defaultValues: DetailsFormValues = useMemo(
    () => ({
      passengers: passengerList.map((_, i) => ({
        firstName: storedTravelerInfo[i]?.firstName ?? "",
        lastName: storedTravelerInfo[i]?.lastName ?? "",
        dateOfBirth: storedTravelerInfo[i]?.dateOfBirth ?? "",
        documentType: (storedTravelerInfo[i]?.documentType ?? "passport") as "passport" | "id",
        documentNumber: storedTravelerInfo[i]?.documentNumber ?? "",
        nationality: storedTravelerInfo[i]?.nationality ?? "",
      })),
      contact: {
        email: storedContactDetails?.email ?? "",
        phone: storedContactDetails?.phone ?? "",
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // fixed at mount — pre-fill runs once
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    mode: "onBlur",
    defaultValues,
  })

  // useFieldArray requires a separate control import; use register directly since
  // the passenger count is fixed at mount.

  useEffect(() => {
    if (canAccess) bookingEvents.stepViewed("details")
  }, [canAccess])

  // Auth pre-fill: only populate empty fields so user data is never overwritten.
  useEffect(() => {
    if (!canAccess) return
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }: { user: { firstName: string; lastName: string; email: string } | null }) => {
        if (!user) return
        const current = getValues()
        if (!current.passengers[0]?.firstName) {
          setValue("passengers.0.firstName", user.firstName, { shouldValidate: false })
        }
        if (!current.passengers[0]?.lastName) {
          setValue("passengers.0.lastName", user.lastName, { shouldValidate: false })
        }
        if (!current.contact.email) {
          setValue("contact.email", user.email, { shouldValidate: false })
        }
      })
      .catch(() => {}) // auth fetch failure is non-blocking
  }, [canAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = useCallback(
    async (data: DetailsFormValues) => {
      try {
        await withRetry(
          async () => {
            const res = await fetch("/api/booking/details", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            })
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string }
              throw new Error(body.error ?? "Failed to save traveller details")
            }
            return res.json()
          },
          { onRetrying: () => setRetrying(true) }
        )
      } catch {
        onAllRetriesExhausted(
          "We couldn't save your details. Please try again or contact support."
        )
        return
      }

      setTravelerInfo(
        data.passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          documentType: p.documentType,
          documentNumber: p.documentNumber,
          nationality: p.nationality,
        }))
      )
      setContactDetails({ email: data.contact.email, phone: data.contact.phone })

      bookingEvents.stepCompleted("details", { passengerCount: data.passengers.length })

      router.push("/booking/bags")
    },
    [setTravelerInfo, setContactDetails, setRetrying, onAllRetriesExhausted, router]
  )

  if (!canAccess) return null

  return (
    <BookingLayout currentStep="details">
      <h1 className="text-display-sm font-semibold text-jsx-black">Traveller details</h1>
      <p className="mt-1 text-jsx-gray-500">
        Enter details exactly as they appear on each passenger&apos;s travel document.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Traveller details"
        className="mt-6 space-y-6"
      >
        {passengerList.map((pax, index) => (
          <fieldset
            key={index}
            className="rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5"
          >
            <legend className="text-base font-semibold text-jsx-black px-1">
              {`Passenger ${index + 1} — ${pax.label}`}
            </legend>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabelledField
                id={`passengers.${index}.firstName`}
                label="First name"
                error={errors.passengers?.[index]?.firstName}
              >
                <input
                  id={`passengers.${index}.firstName`}
                  type="text"
                  autoComplete="given-name"
                  aria-required="true"
                  aria-describedby={
                    errors.passengers?.[index]?.firstName
                      ? `passengers.${index}.firstName-error`
                      : undefined
                  }
                  className={inputCls(!!errors.passengers?.[index]?.firstName)}
                  {...register(`passengers.${index}.firstName`)}
                />
              </LabelledField>

              <LabelledField
                id={`passengers.${index}.lastName`}
                label="Last name"
                error={errors.passengers?.[index]?.lastName}
              >
                <input
                  id={`passengers.${index}.lastName`}
                  type="text"
                  autoComplete="family-name"
                  aria-required="true"
                  aria-describedby={
                    errors.passengers?.[index]?.lastName
                      ? `passengers.${index}.lastName-error`
                      : undefined
                  }
                  className={inputCls(!!errors.passengers?.[index]?.lastName)}
                  {...register(`passengers.${index}.lastName`)}
                />
              </LabelledField>

              <LabelledField
                id={`passengers.${index}.dateOfBirth`}
                label="Date of birth"
                error={errors.passengers?.[index]?.dateOfBirth}
              >
                <input
                  id={`passengers.${index}.dateOfBirth`}
                  type="date"
                  autoComplete="bday"
                  aria-required="true"
                  aria-describedby={
                    errors.passengers?.[index]?.dateOfBirth
                      ? `passengers.${index}.dateOfBirth-error`
                      : undefined
                  }
                  className={inputCls(!!errors.passengers?.[index]?.dateOfBirth)}
                  {...register(`passengers.${index}.dateOfBirth`)}
                />
              </LabelledField>

              <LabelledField
                id={`passengers.${index}.nationality`}
                label="Nationality"
                error={errors.passengers?.[index]?.nationality}
              >
                <input
                  id={`passengers.${index}.nationality`}
                  type="text"
                  autoComplete="country-name"
                  aria-required="true"
                  aria-describedby={
                    errors.passengers?.[index]?.nationality
                      ? `passengers.${index}.nationality-error`
                      : undefined
                  }
                  className={inputCls(!!errors.passengers?.[index]?.nationality)}
                  {...register(`passengers.${index}.nationality`)}
                />
              </LabelledField>
            </div>

            <div className="mt-4">
              <fieldset>
                <legend className="block text-sm font-medium text-jsx-gray-700 mb-2">
                  Document type
                  <span className="text-jsx-red ml-0.5" aria-hidden="true">*</span>
                </legend>
                <div className="flex gap-6">
                  {(["passport", "id"] as const).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm text-jsx-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={type}
                        aria-required="true"
                        className="text-jsx-red focus:ring-jsx-red"
                        {...register(`passengers.${index}.documentType`)}
                      />
                      {type === "passport" ? "Passport" : "National ID"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="mt-4">
              <LabelledField
                id={`passengers.${index}.documentNumber`}
                label="Document number"
                error={errors.passengers?.[index]?.documentNumber}
              >
                <input
                  id={`passengers.${index}.documentNumber`}
                  type="text"
                  autoComplete="off"
                  aria-required="true"
                  aria-describedby={
                    errors.passengers?.[index]?.documentNumber
                      ? `passengers.${index}.documentNumber-error`
                      : undefined
                  }
                  className={inputCls(!!errors.passengers?.[index]?.documentNumber)}
                  {...register(`passengers.${index}.documentNumber`)}
                />
              </LabelledField>
            </div>
          </fieldset>
        ))}

        {/* Shared contact details section */}
        <fieldset className="rounded-xl border border-jsx-gray-200 bg-jsx-gray-50 p-5">
          <legend className="text-base font-semibold text-jsx-black px-1">
            Contact details
          </legend>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LabelledField
              id="contact.email"
              label="Email address"
              error={errors.contact?.email}
            >
              <input
                id="contact.email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.contact?.email ? "contact.email-error" : undefined}
                className={inputCls(!!errors.contact?.email)}
                {...register("contact.email")}
              />
            </LabelledField>

            <LabelledField
              id="contact.phone"
              label="Phone number"
              error={errors.contact?.phone}
            >
              <input
                id="contact.phone"
                type="tel"
                autoComplete="tel"
                aria-required="true"
                aria-describedby={errors.contact?.phone ? "contact.phone-error" : undefined}
                className={inputCls(!!errors.contact?.phone)}
                {...register("contact.phone")}
              />
            </LabelledField>
          </div>
        </fieldset>

        <div>
          <Button
            type="submit"
            variant="jsx"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Continue"}
          </Button>
        </div>
      </form>
    </BookingLayout>
  )
}

export default BookingDetailsPage
