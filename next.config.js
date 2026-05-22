// @ts-check
const { withSentryConfig } = require("@sentry/nextjs")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve AVIF first, then WebP, for maximum compression at equal quality
    formats: ["image/avif", "image/webp"],
    // No remote domains — all images are served from /public
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Suppress build output noise; actual errors still surface
  silent: true,
  // Keep source maps server-side only
  hideSourceMaps: true,
  webpack: {
    // Remove Sentry debug logging from production bundles
    treeshake: { removeDebugLogging: true },
    // Auto-instrument Vercel Cron monitors
    automaticVercelMonitors: true,
  },
})
