import { cn } from "@/lib/utils"

interface PassengerStepperProps {
  id: string
  label: string
  sublabel: string
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
  error?: string
}

export function PassengerStepper({
  id,
  label,
  sublabel,
  value,
  min = 0,
  max = 9,
  onChange,
  error,
}: PassengerStepperProps) {
  const decreaseLabel = `Decrease number of ${label.toLowerCase()}`
  const increaseLabel = `Increase number of ${label.toLowerCase()}`
  const errorId = error ? `${id}-error` : undefined

  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-sublabel`}>
      <div className="flex items-center justify-between">
        <div>
          <p id={`${id}-label`} className="text-sm font-medium text-jsx-black">
            {label}
          </p>
          <p id={`${id}-sublabel`} className="text-xs text-jsx-gray-500">
            {sublabel}
          </p>
        </div>

        <div className="flex items-center gap-3" aria-describedby={errorId}>
          <button
            type="button"
            aria-label={decreaseLabel}
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jsx-red focus-visible:ring-offset-2",
              value <= min
                ? "border-jsx-gray-200 text-jsx-gray-300 cursor-not-allowed"
                : "border-jsx-gray-400 text-jsx-black hover:border-jsx-red hover:text-jsx-red"
            )}
          >
            <span aria-hidden="true">−</span>
          </button>

          <output
            id={`${id}-value`}
            htmlFor={`${id}-decrease ${id}-increase`}
            aria-live="polite"
            aria-atomic="true"
            className="w-6 text-center text-base font-semibold text-jsx-black tabular-nums"
          >
            {value}
          </output>

          <button
            type="button"
            aria-label={increaseLabel}
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jsx-red focus-visible:ring-offset-2",
              value >= max
                ? "border-jsx-gray-200 text-jsx-gray-300 cursor-not-allowed"
                : "border-jsx-gray-400 text-jsx-black hover:border-jsx-red hover:text-jsx-red"
            )}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-jsx-red">
          {error}
        </p>
      )}
    </div>
  )
}
