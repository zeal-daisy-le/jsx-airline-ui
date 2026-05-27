"use client"

import { ScrollReveal } from "@/components/ScrollReveal"
import { ExperienceVideoCard } from "./ExperienceVideoCard"

const cards = [
  {
    id: "skip-airport-stress",
    title: "Skip the airport stress.",
    subtitle: "No TSA, no lines, no terminals",
    posterSrc: "/images/experience/skip-airport-stress-poster.jpg",
    videoWebm: "/videos/experience/skip-airport-stress.webm",
    videoMp4: "/videos/experience/skip-airport-stress.mp4",
    alt: "Woman walking with golden retriever past JSX jet on the tarmac",
  },
  {
    id: "bring-the-whole-party",
    title: "Bring the whole party.",
    subtitle: "Group-friendly seating, pets included",
    posterSrc: "/images/experience/bring-the-whole-party-poster.jpg",
    videoWebm: "/videos/experience/bring-the-whole-party.webm",
    videoMp4: "/videos/experience/bring-the-whole-party.mp4",
    alt: "Family with kids and dog boarding a JSX jet at golden hour",
  },
  {
    id: "vacation-starts-on-tarmac",
    title: "Vacation starts on the tarmac.",
    subtitle: "Walk on, drink in hand",
    posterSrc: "/images/experience/vacation-starts-on-tarmac-poster.jpg",
    videoWebm: "/videos/experience/vacation-starts-on-tarmac.webm",
    videoMp4: "/videos/experience/vacation-starts-on-tarmac.mp4",
    alt: "Aerial view of JSX jet flying over the ocean",
  },
  {
    id: "get-there-faster",
    title: "Get there faster.",
    subtitle: "Quickly deplane, straight to your ride",
    posterSrc: "/images/experience/get-there-faster-poster.jpg",
    videoWebm: "/videos/experience/get-there-faster.webm",
    videoMp4: "/videos/experience/get-there-faster.mp4",
    alt: "Family with dog disembarking from JSX jet",
  },
]

export function ExperienceSection() {
  return (
    <section className="py-12" aria-labelledby="experience-heading">
      <div className="px-6">
        <h2 id="experience-heading" className="text-[32px] font-semibold leading-tight text-black">
          The JSX Experience
        </h2>
        <p className="mt-2 text-base text-gray-500">Start your trip sooner.</p>
      </div>

      <div
        className="mt-6 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-6 pb-2"
        style={{ scrollbarWidth: "none" }}
        role="list"
        aria-label="JSX experience highlights"
        tabIndex={0}
      >
        <div className="shrink-0 w-3.5" aria-hidden="true" />
        {cards.map((card, index) => (
          <ScrollReveal
            key={card.id}
            delay={index * 0.15}
            className="shrink-0 snap-start"
          >
            <ExperienceVideoCard
              title={card.title}
              subtitle={card.subtitle}
              posterSrc={card.posterSrc}
              videoWebm={card.videoWebm}
              videoMp4={card.videoMp4}
              alt={card.alt}
            />
          </ScrollReveal>
        ))}
        <div className="shrink-0 w-3.5" aria-hidden="true" />
      </div>
    </section>
  )
}
