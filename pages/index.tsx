import type { GetServerSideProps } from "next"
import Head from "next/head"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { HeroSection } from "@/components/home/HeroSection"
import { ExperienceSection } from "@/components/home/ExperienceSection"
import { WhereWeFlySection } from "@/components/home/WhereWeFlySection"
import { ClubJsxSection } from "@/components/home/ClubJsxSection"
import { destinations as allDestinations, type Destination } from "@/data/destinations"

interface HomePageProps {
  destinations: Destination[]
}

export default function HomePage({ destinations }: HomePageProps) {
  return (
    <>
      <Head>
        <title>JSX — Semi-private flights</title>
        <meta
          name="description"
          content="JSX offers semi-private jet travel with no TSA lines, no hidden fees, and a premium experience from gate to gate. Book your next flight today."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="JSX — Semi-private flights" />
        <meta
          property="og:description"
          content="Semi-private flights that are efficient, effortless, and elevated."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JSX" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://jsx.com/" />
      </Head>

      <SiteHeader />
      <main>
        <HeroSection />
        <ExperienceSection />
        <WhereWeFlySection destinations={destinations} />
        <ClubJsxSection />
      </main>
      <SiteFooter />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  return {
    props: {
      destinations: allDestinations,
    },
  }
}
