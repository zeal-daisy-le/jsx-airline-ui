import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type BookingStep =
  | "flights"
  | "passengers"
  | "details"
  | "bags"
  | "seats"
  | "review"
  | "payment"
  | "confirmation"

export type StepValidity = Record<BookingStep, boolean>

export interface PassengerCount {
  adults: number
  children: number
  infants: number
}

export interface SelectedFlight {
  flightId: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  pricePerPassenger: number
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

export interface BookingState {
  selectedFlight: SelectedFlight | null
  passengers: PassengerCount
  travelerInfo: TravelerInfo[]
  bagSelections: BagSelection[]
  seatAssignments: SeatAssignment[]
  /** Gateway token reference only — raw card data never enters this store */
  paymentToken: string | null
  currentStep: BookingStep
  stepValidity: StepValidity

  setSelectedFlight: (flight: SelectedFlight) => void
  setPassengers: (passengers: PassengerCount) => void
  setTravelerInfo: (info: TravelerInfo[]) => void
  setBagSelections: (bags: BagSelection[]) => void
  setSeatAssignments: (seats: SeatAssignment[]) => void
  setPaymentToken: (token: string) => void
  setCurrentStep: (step: BookingStep) => void
  setStepValid: (step: BookingStep, valid: boolean) => void
  resetBooking: () => void
}

const STEP_ORDER: BookingStep[] = [
  "flights",
  "passengers",
  "details",
  "bags",
  "seats",
  "review",
  "payment",
  "confirmation",
]

const DEFAULT_STEP_VALIDITY: StepValidity = {
  flights: false,
  passengers: false,
  details: false,
  bags: false,
  seats: false,
  review: false,
  payment: false,
  confirmation: false,
}

/** Returns a copy of `validity` with every step from `fromStep` onwards set to false. */
function invalidateFrom(validity: StepValidity, fromStep: BookingStep): StepValidity {
  const idx = STEP_ORDER.indexOf(fromStep)
  const next = { ...validity }
  for (let i = idx; i < STEP_ORDER.length; i++) {
    next[STEP_ORDER[i]] = false
  }
  return next
}

const makeInitialData = () => ({
  selectedFlight: null as SelectedFlight | null,
  passengers: { adults: 1, children: 0, infants: 0 } as PassengerCount,
  travelerInfo: [] as TravelerInfo[],
  bagSelections: [] as BagSelection[],
  seatAssignments: [] as SeatAssignment[],
  paymentToken: null as string | null,
  currentStep: "flights" as BookingStep,
  stepValidity: { ...DEFAULT_STEP_VALIDITY },
})

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...makeInitialData(),

      setSelectedFlight: (flight) =>
        set((state) => ({
          selectedFlight: flight,
          stepValidity: {
            ...invalidateFrom(state.stepValidity, "passengers"),
            flights: true,
          },
        })),

      // Passenger count change clears all per-passenger data and invalidates
      // every downstream step (details, bags, seats, review, payment, confirmation).
      setPassengers: (passengers) =>
        set((state) => ({
          passengers,
          travelerInfo: [],
          bagSelections: [],
          seatAssignments: [],
          stepValidity: {
            ...invalidateFrom(state.stepValidity, "details"),
            passengers: true,
          },
        })),

      setTravelerInfo: (info) =>
        set((state) => ({
          travelerInfo: info,
          stepValidity: {
            ...invalidateFrom(state.stepValidity, "bags"),
            details: true,
          },
        })),

      setBagSelections: (bags) =>
        set((state) => ({
          bagSelections: bags,
          stepValidity: {
            ...invalidateFrom(state.stepValidity, "seats"),
            bags: true,
          },
        })),

      setSeatAssignments: (seats) =>
        set((state) => ({
          seatAssignments: seats,
          stepValidity: {
            ...invalidateFrom(state.stepValidity, "review"),
            seats: true,
          },
        })),

      setPaymentToken: (token) =>
        set((state) => ({
          paymentToken: token,
          stepValidity: { ...state.stepValidity, payment: true },
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      setStepValid: (step, valid) =>
        set((state) => ({
          stepValidity: { ...state.stepValidity, [step]: valid },
        })),

      resetBooking: () => set(makeInitialData()),
    }),
    {
      name: "jsx-booking",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return sessionStorage
        // SSR no-op — the Navitaire session token lives in httpOnly cookies, not here
        return {
          getItem: (_name: string) => null,
          setItem: (_name: string, _value: string) => {},
          removeItem: (_name: string) => {},
        }
      }),
    }
  )
)
