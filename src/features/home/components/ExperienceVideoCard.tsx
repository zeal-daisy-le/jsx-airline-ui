"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useReducedMotion } from "framer-motion"
import { Pause, Play } from "lucide-react"

interface ExperienceVideoCardProps {
  title: string
  subtitle: string
  posterSrc: string
  videoWebm: string
  videoMp4: string
  alt: string
}

export function ExperienceVideoCard({
  title,
  subtitle,
  posterSrc,
  videoWebm,
  videoMp4,
  alt,
}: ExperienceVideoCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <article
      role="listitem"
      className="flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
    >
      <div className="relative aspect-[5/6] w-full overflow-hidden">
        <Image
          src={posterSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 82vw, (max-width: 900px) 60vw, 25vw"
          className="object-cover"
        />
        {!shouldReduceMotion && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={videoWebm} type="video/webm" />
            <source src={videoMp4} type="video/mp4" />
          </video>
        )}
        {!shouldReduceMotion && (
          <button
            onClick={togglePlayback}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        <p className="text-lg font-semibold leading-tight text-[#2D3233]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#4A4A4A]">{subtitle}</p>
      </div>
    </article>
  )
}
