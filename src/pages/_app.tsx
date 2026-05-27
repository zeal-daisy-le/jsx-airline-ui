import type { AppProps } from "next/app"
import { Inter } from "next/font/google"
import Script from "next/script"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import "@/styles/globals.css"
import { pageview, GA_MEASUREMENT_ID } from "@/features/booking/utils/analytics"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageview(url)
    }
    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      {GA_MEASUREMENT_ID && process.env.NODE_ENV !== "test" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `,
            }}
          />
        </>
      )}
      <main className={`${inter.variable} font-sans`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={router.asPath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </>
  )
}
