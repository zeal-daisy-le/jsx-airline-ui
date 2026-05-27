import { cn } from "@/lib/utils"

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-jsx-gray-200", className)}
      aria-hidden="true"
    />
  )
}

export function FlightResultSkeleton() {
  return (
    <div
      className="rounded-xl border border-jsx-gray-200 bg-white p-5"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-6">
          <div className="space-y-2">
            <SkeletonLine className="h-7 w-16" />
            <SkeletonLine className="h-4 w-10" />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <SkeletonLine className="h-px flex-1 bg-jsx-gray-300" />
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-px flex-1 bg-jsx-gray-300" />
          </div>
          <div className="space-y-2 text-right">
            <SkeletonLine className="h-7 w-16" />
            <SkeletonLine className="h-4 w-10" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SkeletonLine className="h-7 w-20" />
          <SkeletonLine className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function FlightResultSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div
      className="space-y-3"
      aria-label="Loading flight results"
      aria-busy="true"
    >
      <span className="sr-only">Loading available flights…</span>
      {Array.from({ length: count }).map((_, i) => (
        <FlightResultSkeleton key={i} />
      ))}
    </div>
  )
}
