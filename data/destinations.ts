export interface Destination {
  id: string
  city: string
  state: string
  airport: string
  tagline: string
  imageUrl: string
  imageAlt: string
  featured?: boolean
}

export const destinations: Destination[] = [
  {
    id: "dallas",
    city: "Dallas",
    state: "TX",
    airport: "DAL",
    tagline: "Where every flight begins",
    imageUrl: "/images/destinations/dallas.jpg",
    imageAlt: "Dallas skyline glowing at dusk with the iconic Reunion Tower lit against a Texas sunset",
    featured: true,
  },
  {
    id: "burbank",
    city: "Burbank",
    state: "CA",
    airport: "BUR",
    tagline: "Hollywood at your doorstep",
    imageUrl: "/images/destinations/burbank.jpg",
    imageAlt: "Burbank hills bathed in warm California light with the city spread below",
    featured: true,
  },
  {
    id: "las-vegas",
    city: "Las Vegas",
    state: "NV",
    airport: "LAS",
    tagline: "The Strip, on your terms",
    imageUrl: "/images/destinations/las-vegas.jpg",
    imageAlt: "The Las Vegas Strip illuminated at night stretching toward the desert horizon",
  },
  {
    id: "oakland",
    city: "Oakland",
    state: "CA",
    airport: "OAK",
    tagline: "The Bay Area's best-kept secret",
    imageUrl: "/images/destinations/oakland.jpg",
    imageAlt: "San Francisco Bay Bridge and Oakland waterfront at golden hour",
  },
  {
    id: "phoenix",
    city: "Phoenix",
    state: "AZ",
    airport: "PHX",
    tagline: "Desert luxury, year-round sun",
    imageUrl: "/images/destinations/phoenix.jpg",
    imageAlt: "Sonoran Desert at sunset with saguaro cacti silhouetted against a vivid orange sky",
  },
  {
    id: "san-jose",
    city: "San Jose",
    state: "CA",
    airport: "SJC",
    tagline: "Silicon Valley, reachable",
    imageUrl: "/images/destinations/san-jose.jpg",
    imageAlt: "Silicon Valley skyline with rolling hills in the background under clear skies",
  },
  {
    id: "carlsbad",
    city: "Carlsbad",
    state: "CA",
    airport: "CLD",
    tagline: "San Diego, without the crowds",
    imageUrl: "/images/destinations/carlsbad.jpg",
    imageAlt: "Carlsbad coastline with waves breaking on the Pacific shore under clear blue skies",
  },
  {
    id: "monterey",
    city: "Monterey",
    state: "CA",
    airport: "MRY",
    tagline: "Where the Pacific meets wonder",
    imageUrl: "/images/destinations/monterey.jpg",
    imageAlt: "Monterey Bay coastline with rugged cliffs and the Pacific Ocean stretching to the horizon",
  },
]
