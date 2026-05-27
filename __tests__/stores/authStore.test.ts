import { describe, it, expect, beforeEach } from "vitest"
import { act } from "@testing-library/react"
import { useAuthStore } from "@/features/auth/stores/authStore"

const ALICE = { id: "u1", email: "alice@jsx.com", firstName: "Alice", lastName: "Smith" }

beforeEach(() => {
  act(() => { useAuthStore.setState({ user: null, isLoading: true }) })
})

describe("useAuthStore", () => {
  it("starts with user null and isLoading true", () => {
    const { user, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isLoading).toBe(true)
  })

  it("setUser stores the user and sets isLoading false", () => {
    act(() => { useAuthStore.getState().setUser(ALICE) })
    const { user, isLoading } = useAuthStore.getState()
    expect(user).toEqual(ALICE)
    expect(isLoading).toBe(false)
  })

  it("setUser with null clears the user and sets isLoading false", () => {
    act(() => { useAuthStore.getState().setUser(ALICE); useAuthStore.getState().setUser(null) })
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it("setLoading updates the isLoading flag independently", () => {
    act(() => { useAuthStore.getState().setLoading(false) })
    expect(useAuthStore.getState().isLoading).toBe(false)
    act(() => { useAuthStore.getState().setLoading(true) })
    expect(useAuthStore.getState().isLoading).toBe(true)
  })
})
