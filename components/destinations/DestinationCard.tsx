import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import type { Destination } from "@/data/destinations"

const cardVariants = {
  rest: {},
  hover: { y: -4 },
  tap: { scale: 0.98 },
}

interface DestinationCardProps {
  destination: Destination
  priority?: boolean
  /** When true, card spans 2 columns in the editorial grid */
  featured?: boolean
}

export function DestinationCard({ destination, priority = false }: DestinationCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.article
      className="group relative overflow-hidden rounded-lg bg-jsx-black"
      aria-label={`${destination.city}, ${destination.state}`}
      variants={cardVariants}
      initial="rest"
      whileHover={shouldReduceMotion ? undefined : "hover"}
      whileTap={shouldReduceMotion ? undefined : "tap"}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Image
        src={destination.imageUrl}
        alt={destination.imageAlt}
        width={800}
        height={533}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={priority}
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* Dark gradient overlay — decorative */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-jsx-red">
          {destination.airport}
        </p>
        <h3 className="mt-0.5 text-lg font-bold text-white sm:text-xl">
          {destination.city}, {destination.state}
        </h3>
        <p className="mt-0.5 text-sm text-gray-300">{destination.tagline}</p>
      </div>
    </motion.article>
  )
}
