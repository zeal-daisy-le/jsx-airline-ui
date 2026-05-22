import { create } from "zustand"

interface ToastData {
  message: string
  onRetry?: () => void
}

interface ErrorState {
  toast: ToastData | null
  isRetrying: boolean
  showSupportContact: boolean

  setRetrying: (v: boolean) => void
  showToast: (message: string, onRetry?: () => void) => void
  dismissToast: () => void
  /**
   * Called when all automated retries are exhausted. Sets the toast and
   * surfaces the inline support contact prompt within the booking step.
   */
  onAllRetriesExhausted: (message: string, onRetry?: () => void) => void
  resetErrors: () => void
}

export const useErrorStore = create<ErrorState>((set) => ({
  toast: null,
  isRetrying: false,
  showSupportContact: false,

  setRetrying: (v) => set({ isRetrying: v }),

  showToast: (message, onRetry) => set({ toast: { message, onRetry } }),

  dismissToast: () => set({ toast: null }),

  onAllRetriesExhausted: (message, onRetry) =>
    set({
      toast: { message, onRetry },
      isRetrying: false,
      showSupportContact: true,
    }),

  resetErrors: () =>
    set({ toast: null, isRetrying: false, showSupportContact: false }),
}))
