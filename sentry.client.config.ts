import * as Sentry from "@sentry/nextjs"
import { replayIntegration } from "@sentry/browser"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "test",

  integrations: [
    replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // 10% of sessions captured, 100% on error — tuned for booking flow debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  tracesSampleRate: 0.1,
})
