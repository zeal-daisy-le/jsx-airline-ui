import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "@testing-library/react"
import { useErrorStore } from "@/stores/errorStore"

describe("useErrorStore", () => {
  beforeEach(() => {
    act(() => {
      useErrorStore.setState({
        toast: null,
        isRetrying: false,
        showSupportContact: false,
      })
    })
  })

  it("starts with empty state", () => {
    const { toast, isRetrying, showSupportContact } = useErrorStore.getState()
    expect(toast).toBeNull()
    expect(isRetrying).toBe(false)
    expect(showSupportContact).toBe(false)
  })

  it("showToast stores message and optional retry callback", () => {
    const onRetry = vi.fn()

    act(() => {
      useErrorStore.getState().showToast("Something went wrong.", onRetry)
    })

    const { toast } = useErrorStore.getState()
    expect(toast?.message).toBe("Something went wrong.")
    expect(toast?.onRetry).toBe(onRetry)
  })

  it("showToast works without a retry callback", () => {
    act(() => {
      useErrorStore.getState().showToast("Error occurred.")
    })

    const { toast } = useErrorStore.getState()
    expect(toast?.message).toBe("Error occurred.")
    expect(toast?.onRetry).toBeUndefined()
  })

  it("dismissToast clears the toast", () => {
    act(() => {
      useErrorStore.getState().showToast("Error")
      useErrorStore.getState().dismissToast()
    })

    expect(useErrorStore.getState().toast).toBeNull()
  })

  it("onAllRetriesExhausted sets toast and showSupportContact", () => {
    const onRetry = vi.fn()

    act(() => {
      useErrorStore.getState().onAllRetriesExhausted(
        "We couldn't connect. Please try again.",
        onRetry
      )
    })

    const { toast, showSupportContact, isRetrying } = useErrorStore.getState()
    expect(toast?.message).toBe("We couldn't connect. Please try again.")
    expect(toast?.onRetry).toBe(onRetry)
    expect(showSupportContact).toBe(true)
    expect(isRetrying).toBe(false)
  })

  it("onAllRetriesExhausted clears isRetrying", () => {
    act(() => {
      useErrorStore.getState().setRetrying(true)
      useErrorStore.getState().onAllRetriesExhausted("Failed")
    })

    expect(useErrorStore.getState().isRetrying).toBe(false)
  })

  it("setRetrying updates isRetrying flag", () => {
    act(() => {
      useErrorStore.getState().setRetrying(true)
    })
    expect(useErrorStore.getState().isRetrying).toBe(true)

    act(() => {
      useErrorStore.getState().setRetrying(false)
    })
    expect(useErrorStore.getState().isRetrying).toBe(false)
  })

  it("resetErrors clears all error state", () => {
    act(() => {
      useErrorStore.getState().onAllRetriesExhausted("Failed")
      useErrorStore.getState().setRetrying(true)
    })

    act(() => {
      useErrorStore.getState().resetErrors()
    })

    const { toast, isRetrying, showSupportContact } = useErrorStore.getState()
    expect(toast).toBeNull()
    expect(isRetrying).toBe(false)
    expect(showSupportContact).toBe(false)
  })
})
