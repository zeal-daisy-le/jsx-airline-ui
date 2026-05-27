import { create } from "zustand"

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean

  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (v) => set({ isLoading: v }),
}))
