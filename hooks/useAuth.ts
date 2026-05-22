import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuthStore, type AuthUser } from "@/stores/authStore"

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: AuthUser | null }) => setUser(data.user))
      .catch(() => setUser(null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
  }

  return { user, isLoading, logout }
}
