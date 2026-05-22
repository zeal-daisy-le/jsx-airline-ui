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
    <section className="px-6 py-12" aria-labelledby="club-jsx-heading">
      <h2
        id="club-jsx-heading"
        className="text-[32px] font-semibold leading-tight text-black"
      >
        Join Club JSX
      </h2>
      <p className="mt-2 text-base text-gray-500">Earn 5% back on every flight.</p>

      <ul className="mt-8 space-y-6" role="list">
        {stats.map((stat) => (
          <li key={stat.value} role="listitem">
            <p className="text-[3.5rem] font-bold leading-none tracking-tight text-black">
              {stat.value}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{stat.description}</p>
          </li>
        ))}
      </ul>

      <Link
        href="/club"
        className="mt-10 flex w-full items-center justify-center rounded-full bg-jsx-red py-4 text-base font-semibold text-white transition-colors hover:bg-jsx-red-dark"
      >
        Become a Member for Free
      </Link>
    </section>
  )
}
