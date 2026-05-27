import Image from "next/image"
import { Pause } from "lucide-react"

const cards = [
  {
    id: "airport-stress",
    image: "/images/experience/airport.jpg",
    title: "Skip the airport stress.",
    subtitle: "No TSA, no lines, no terminals",
    alt: "Traveller walking with a dog across the tarmac to a JSX jet",
  },
  {
    id: "private-terminal",
    image: "/images/experience/terminal.jpg",
    title: "Board in minutes.",
    subtitle: "Private lounges and direct boarding",
    alt: "JSX private terminal lounge",
  },
  {
    id: "pet-friendly",
    image: "/images/experience/pets.jpg",
    title: "Pets fly with you.",
    subtitle: "Dogs and cats welcome on board",
    alt: "Dog relaxing on a JSX flight",
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
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2"
        style={{ scrollbarWidth: "none" }}
        role="list"
        aria-label="JSX experience highlights"
        tabIndex={0}
      >
        {cards.map((card) => (
          <article
            key={card.id}
            className="w-[calc(100vw-48px)] shrink-0 snap-start"
            role="listitem"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={card.image}
                alt={card.alt}
                fill
                sizes="calc(100vw - 48px)"
                className="object-cover"
              />
              <button
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm"
                aria-label="Pause"
                tabIndex={-1}
              >
                <Pause className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="mt-3">
              <p className="text-base font-semibold text-black">{card.title}</p>
              <p className="mt-0.5 text-sm text-gray-500">{card.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
