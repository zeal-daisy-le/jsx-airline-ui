import Head from "next/head"
import type { ReactNode } from "react"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { StepProgress } from "@/components/booking/StepProgress"
import { useBookingStore } from "@/stores/bookingStore"
import { BookingStep, STEP_META } from "@/lib/booking/steps"

interface BookingLayoutProps {
  currentStep: BookingStep
  children: ReactNode
}

export function BookingLayout({ currentStep, children }: BookingLayoutProps) {
  const stepValidity = useBookingStore((s) => s.stepValidity)
  const stepLabel = STEP_META[currentStep].label

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>{stepLabel} — JSX Booking</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <StepProgress currentStep={currentStep} stepValidity={stepValidity} />
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </>
  )
}
