"use client"

import { useRef } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { HeroVideo } from "./HeroVideo"

const ADJECTIVES = ["EFFICIENT", "EFFORTLESS", "ELEVATED"]

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (shouldReduceMotion) return
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % ADJECTIVES.length)
    }, 2500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [shouldReduceMotion])

  return (
    <section
      className="relative flex min-h-[640px] flex-col justify-end overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <HeroVideo
        posterSrc="/images/hero-poster.jpg"
        posterAlt="JSX semi-private jet on the tarmac at golden hour"
        videoWebm="/videos/hero.webm"
        videoMp4="/videos/hero.mp4"
      />
      {/* gradient: transparent top → dark bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

      <div className="relative z-10 px-6 pb-10">
        <p className="mb-1 text-sm text-white/90">Semi-private flights that are</p>

        <h1
          id="hero-heading"
          className="mb-6 overflow-hidden text-[3.5rem] font-bold leading-none tracking-tight text-white"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={ADJECTIVES[index]}
              className="block"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {ADJECTIVES[index]}
            </motion.span>
          </AnimatePresence>
        </h1>

        <Link
          href="/booking/search"
          className="flex w-full items-center gap-3 rounded-full bg-white/20 px-5 py-4 backdrop-blur-sm transition-colors hover:bg-white/30"
          aria-label="Search flights"
        >
          <Search className="h-4 w-4 shrink-0 text-white" />
          <span className="text-sm text-white/80">Where would you like to go?</span>
        </Link>
      </div>
    </section>
  )
}
