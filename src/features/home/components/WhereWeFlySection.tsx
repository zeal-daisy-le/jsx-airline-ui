"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import type { Destination } from "@/data/destinations"
import { ScrollReveal } from "@/components/ScrollReveal"

interface WhereWeFlySectionProps {
  destinations: Destination[]
}

export function WhereWeFlySection({ destinations }: WhereWeFlySectionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="px-6 py-12 md:py-16 lg:py-20" aria-labelledby="where-we-fly-heading">
      <h2
        id="where-we-fly-heading"
        className="text-[32px] font-semibold leading-tight text-black md:text-4xl lg:text-5xl"
      >
        Where We Fly
      </h2>
      <p className="mt-2 text-base text-gray-500 md:text-lg">Discover your perfect getaway.</p>

      <ul className="mt-6 flex flex-col gap-4 md:grid md:grid-cols-2 lg:gap-6" role="list" aria-label="Flight destinations">
        {destinations.slice(0, 4).map((dest, index) => (
          <ScrollReveal key={dest.id} delay={index * 0.15}>
            <li role="listitem">
              <Link
                href={`/flights/${dest.id}`}
                className="block"
                aria-label={`Flights to ${dest.city}, ${dest.state}`}
              >
                <motion.div
                  className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-200"
                  whileHover={shouldReduceMotion ? undefined : "hover"}
                  initial="rest"
                  animate="rest"
                >
                  <motion.div
                    className="absolute inset-0"
                    variants={{
                      rest: { scale: 1 },
                      hover: { scale: 1.05 },
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Image
                      src={dest.imageUrl}
                      alt={dest.imageAlt}
                      fill
                      sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 48px), 580px"
                      className="object-cover"
                    />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                    variants={{
                      rest: { opacity: 1 },
                      hover: { opacity: 1.5 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <p className="absolute bottom-3 left-4 z-10 text-sm font-medium text-white md:text-base">
                    {dest.city}, {dest.state}
                  </p>
                </motion.div>
              </Link>
            </li>
          </ScrollReveal>
        ))}
      </ul>

      <div className="mt-6 flex justify-center lg:mt-8">
        <Link
          href="/flights"
          className="flex w-full items-center justify-center rounded-full bg-jsx-red py-4 text-base font-semibold text-white transition-colors hover:bg-jsx-red-dark md:w-auto md:px-12"
        >
          See All Routes
        </Link>
      </div>
    </section>
  )
}
