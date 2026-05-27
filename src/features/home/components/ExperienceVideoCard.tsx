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
    <article role="listitem" className="relative h-[480px] w-[343px] drop-shadow-lg">
      <div className="absolute inset-x-0 top-0 h-[440px] overflow-hidden rounded-[20px]">
        <Image
          src={posterSrc}
          alt={alt}
          fill
          sizes="343px"
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
            className="absolute right-[17px] top-[18px] flex h-[35px] w-[35px] items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/40"
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
      <div className="absolute inset-x-0 top-[376px] flex h-[104px] items-center rounded-b-[20px] bg-white px-5 py-[15px]">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold leading-tight text-[#2D3233]">{title}</p>
          <p className="text-sm font-medium text-[#4A4A4A]">{subtitle}</p>
        </div>
      </div>
    </article>
  )
}
