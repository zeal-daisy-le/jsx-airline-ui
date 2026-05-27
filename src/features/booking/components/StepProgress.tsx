import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PROGRESS_STEPS,
  STEP_META,
  getStepIndex,
  BookingStep,
} from "@/features/booking/utils/steps"

interface StepProgressProps {
  currentStep: BookingStep
  stepValidity: Record<BookingStep, boolean>
}

export function StepProgress({ currentStep, stepValidity }: StepProgressProps) {
  const currentIndex = getStepIndex(currentStep)

  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center">
        {PROGRESS_STEPS.map((step, index) => {
          const isCompleted = stepValidity[step]
          const isCurrent = step === currentStep
          const isPast = index < currentIndex
          const label = STEP_META[step].label
          const isLast = index === PROGRESS_STEPS.length - 1

          return (
            <li key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCurrent &&
                      "bg-jsx-red text-white ring-2 ring-jsx-red ring-offset-2",
                    isCompleted &&
                      !isCurrent &&
                      "bg-jsx-red text-white",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-jsx-gray-200 text-jsx-gray-500"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                  <span className="sr-only">
                    {label}
                    {isCurrent && " (current step)"}
                    {isCompleted && !isCurrent && " (completed)"}
                  </span>
                </div>
                <span
                  className={cn(
                    "hidden text-xs sm:block",
                    isCurrent && "font-semibold text-jsx-red",
                    isPast && !isCurrent && "text-jsx-gray-600",
                    !isCompleted && !isCurrent && "text-jsx-gray-500"
                  )}
                  aria-hidden="true"
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors",
                    isPast || (isCompleted && !isCurrent)
                      ? "bg-jsx-red"
                      : "bg-jsx-gray-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
