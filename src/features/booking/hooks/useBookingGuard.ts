import { useEffect } from "react"
import { useRouter } from "next/router"
import { useBookingStore } from "@/features/booking/stores/bookingStore"
import {
  BookingStep,
  canAccessStep,
  getEarliestIncompleteStep,
} from "@/features/booking/utils/steps"

interface BookingGuardResult {
  /** True once hydration is complete and the step is accessible. */
  canAccess: boolean
  /** True while waiting for sessionStorage to rehydrate. */
  isHydrating: boolean
}

/**
 * Enforces booking step order. If the requested step is not yet accessible
 * (because earlier steps haven't been completed), the user is redirected to
 * the earliest incomplete step. While sessionStorage is rehydrating on first
 * mount, `canAccess` is false so pages render nothing until the guard settles.
 */
export function useBookingGuard(step: BookingStep): BookingGuardResult {
  const router = useRouter()
  const stepValidity = useBookingStore((s) => s.stepValidity)
  const hasHydrated = useBookingStore((s) => s.hasHydrated)
  const setCurrentStep = useBookingStore((s) => s.setCurrentStep)

  const accessible = canAccessStep(step, stepValidity)
  const earliest = getEarliestIncompleteStep(stepValidity)

  useEffect(() => {
    if (!hasHydrated) return

    if (!accessible) {
      router.replace(`/booking/${earliest}`)
      return
    }

    setCurrentStep(step)
  }, [hasHydrated, accessible, earliest, step, router, setCurrentStep])

  return {
    canAccess: hasHydrated && accessible,
    isHydrating: !hasHydrated,
  }
}
