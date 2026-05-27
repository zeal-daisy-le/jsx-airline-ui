"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { useReducedMotion } from "framer-motion"
import { Pause, Play } from "lucide-react"

interface NetworkInformation {
  effectiveType: string
}

function isSlowConnection(): boolean {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (!conn) return false
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g"
}

interface HeroVideoProps {
  posterSrc: string
  posterAlt: string
  videoWebm: string
  videoMp4: string
}

export function HeroVideo({ posterSrc, posterAlt, videoWebm, videoMp4 }: HeroVideoProps) {
  const shouldReduceMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)

  useEffect(() => {
    if (shouldReduceMotion || isSlowConnection()) return
    setShouldLoadVideo(true)
  }, [shouldReduceMotion])

  function handleCanPlayThrough() {
    setVideoReady(true)
    videoRef.current?.play()
  }

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="absolute inset-0">
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {shouldLoadVideo && (
        <>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onCanPlayThrough={handleCanPlayThrough}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={videoWebm} type="video/webm" />
            <source src={videoMp4} type="video/mp4" />
          </video>
          <button
            onClick={togglePlayback}
            className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </button>
        </>
      )}
    </div>
  )
}
