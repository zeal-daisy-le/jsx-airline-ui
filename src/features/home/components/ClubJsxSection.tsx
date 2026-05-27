import Link from "next/link"

const stats = [
  {
    value: "5%",
    description: "back on base fare, seat fees, and pet fees. Every flight.",
  },
  {
    value: "2X",
    description: "rewards during your birthday month. Cake optional.",
  },
  {
    value: "5",
    description: "people pool rewards together. Family, friends, anyone.",
  },
  {
    value: "$100",
    description: "to a friend's first flight. $100 back to you. Both win.",
  },
]

export function ClubJsxSection() {
  return (
    <section className="px-6 py-12 md:py-16 lg:py-20" aria-labelledby="club-jsx-heading">
      <h2
        id="club-jsx-heading"
        className="text-[32px] font-semibold leading-tight text-black md:text-4xl lg:text-5xl"
      >
        Join Club JSX
      </h2>
      <p className="mt-2 text-base text-gray-500 md:text-lg">Earn 5% back on every flight.</p>

      <ul className="mt-8 space-y-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 lg:grid-cols-4" role="list">
        {stats.map((stat) => (
          <li key={stat.value} role="listitem">
            <p className="text-[3.5rem] font-bold leading-none tracking-tight text-black">
              {stat.value}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{stat.description}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex justify-center lg:mt-12">
        <Link
          href="/club"
          className="flex w-full items-center justify-center rounded-full bg-jsx-red py-4 text-base font-semibold text-white transition-colors hover:bg-jsx-red-dark md:w-auto md:px-12"
        >
          Become a Member for Free
        </Link>
      </div>
    </section>
  )
}
