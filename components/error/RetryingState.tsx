import * as React from "react"
import { useErrorStore } from "@/stores/errorStore"
import { cn } from "@/lib/utils"

interface RetryingStateProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wraps content with a loading overlay while automated retries are in progress.
 * Reads isRetrying from errorStore — no props needed for state wiring.
 */
export function RetryingState({ children, className }: RetryingStateProps) {
  const isRetrying = useErrorStore((s) => s.isRetrying)

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-opacity",
          isRetrying && "pointer-events-none select-none opacity-40"
        )}
        aria-hidden={isRetrying}
      >
        {children}
      </div>
      {isRetrying && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-live="polite"
          aria-label="Reconnecting, please wait"
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-jsx-red border-t-transparent"
              role="status"
              aria-label="Loading"
            />
            <p className="text-sm text-muted-foreground">Reconnecting…</p>
          </div>
        </div>
      )}
    </div>
  )
}
