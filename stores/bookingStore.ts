import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import {
  BOOKING_STEPS,
  BookingStep,
  canAccessStep,
  getEarliestIncompleteStep,
  getStepIndex,
} from "@/lib/booking/steps"

export type { BookingStep }

export type StepValidity = Record<BookingStep, boolean>

const INITIAL_VALIDITY: StepValidity = Object.fromEntries(
  BOOKING_STEPS.map((s) => [s, false])
) as StepValidity

// ── Data types ────────────────────────────────────────────────────────────────

export interface PassengerCount {
  adults: number
  children: number
  infants: number
}

export interface SelectedFlight {
  flightId: string
  flightNumber?: string
  origin: string
  destination: string
  departureTime?: string
  arrivalTime?: string
  departureDate?: string
  pricePerPassenger?: number
  price?: number
  [key: string]: unknown
}

export interface TravelerInfo {
  firstName: string
  lastName: string
  dateOfBirth: string
  documentType: "passport" | "id"
  documentNumber: string
}

export interface BagSelection {
  passengerIndex: number
  checkedBags: number
}

export interface SeatAssignment {
  passengerIndex: number
  seatNumber: string
}

// ── State shape ───────────────────────────────────────────────────────────────

interface BookingState {
  currentStep: BookingStep
  stepValidity: StepValidity
  /** True once sessionStorage has been rehydrated — guards use this to avoid premature redirects */
  hasHydrated: boolean

  selectedFlight: SelectedFlight | null
  passengers: PassengerCount
  travelerInfo: TravelerInfo[]
  bagSelections: BagSelection[]
  seatAssignments: SeatAssignment[]
  /** Gateway token reference only — raw card data never enters this store */
  paymentToken: string | null
  bookingReference: string | null

  // Step navigation
  setCurrentStep: (step: BookingStep) => void
  setStepValid: (step: BookingStep, valid: boolean) => void
  markStepValid: (step: BookingStep) => void
  invalidateStepsFrom: (step: BookingStep) => void
  canAccessStep: (step: BookingStep) => boolean
  getEarliestIncompleteStep: () => BookingStep

  // Data setters
  setSelectedFlight: (flight: SelectedFlight | null) => void
  setPassengers: (passengers: PassengerCount) => void
  setTravelerInfo: (info: TravelerInfo[]) => void
  setBagSelections: (bags: BagSelection[]) => void
  setSeatAssignments: (seats: SeatAssignment[]) => void
  setPaymentToken: (token: string) => void
  setBookingReference: (ref: string) => void

  resetBooking: () => void
  _setHasHydrated: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function invalidateFrom(validity: StepValidity, fromStep: BookingStep): StepValidity {
  const idx = getStepIndex(fromStep)
  const next = { ...validity }
  BOOKING_STEPS.slice(idx).forEach((s) => { next[s] = false })
  return next
}

const INITIAL_DATA = () => ({
  currentStep: "flights" as BookingStep,
  stepValidity: { ...INITIAL_VALIDITY },
  hasHydrated: false,
  selectedFlight: null as SelectedFlight | null,
  passengers: { adults: 1, children: 0, infants: 0 } as PassengerCount,
  travelerInfo: [] as TravelerInfo[],
  bagSelections: [] as BagSelection[],
  seatAssignments: [] as SeatAssignment[],
  paymentToken: null as string | null,
  bookingReference: null as string | null,
})

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DATA(),

      setCurrentStep: (step) => set({ currentStep: step }),

      setStepValid: (step, valid) =>
        set((state) => ({ stepValidity: { ...state.stepValidity, [step]: valid } })),

      markStepValid: (step) =>
        set((state) => ({ stepValidity: { ...state.stepValidity, [step]: true } })),

      invalidateStepsFrom: (step) =>
        set((state) => ({ stepValidity: invalidateFrom(state.stepValidity, step) })),

      canAccessStep: (step) => canAccessStep(step, get().stepValidity),

      getEarliestIncompleteStep: () => getEarliestIncompleteStep(get().stepValidity),

      setSelectedFlight: (flight) =>
        set((state) => ({
          selectedFlight: flight,
          stepValidity: { ...invalidateFrom(state.stepValidity, "passengers"), flights: true },
        })),

      setPassengers: (passengers) =>
        set((state) => ({
          passengers,
          travelerInfo: [],
          bagSelections: [],
          seatAssignments: [],
          stepValidity: { ...invalidateFrom(state.stepValidity, "details"), passengers: true },
        })),

      setTravelerInfo: (info) =>
        set((state) => ({
          travelerInfo: info,
          stepValidity: { ...invalidateFrom(state.stepValidity, "bags"), details: true },
        })),

      setBagSelections: (bags) =>
        set((state) => ({
          bagSelections: bags,
          stepValidity: { ...invalidateFrom(state.stepValidity, "seats"), bags: true },
        })),

      setSeatAssignments: (seats) =>
        set((state) => ({
          seatAssignments: seats,
          stepValidity: { ...invalidateFrom(state.stepValidity, "review"), seats: true },
        })),

      setPaymentToken: (token) =>
        set((state) => ({
          paymentToken: token,
          stepValidity: { ...state.stepValidity, payment: true },
        })),

      setBookingReference: (ref) => set({ bookingReference: ref }),

      resetBooking: () => set({ ...INITIAL_DATA(), hasHydrated: true }),

      _setHasHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "jsx-booking",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        currentStep: state.currentStep,
        stepValidity: state.stepValidity,
        selectedFlight: state.selectedFlight,
        passengers: state.passengers,
        travelerInfo: state.travelerInfo,
        bagSelections: state.bagSelections,
        seatAssignments: state.seatAssignments,
        paymentToken: state.paymentToken,
        bookingReference: state.bookingReference,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._setHasHydrated()
      },
    }
  )
)
