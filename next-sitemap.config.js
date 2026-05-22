// @ts-check

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://jsx.com",
  generateRobotsTxt: true,
  // Exclude all booking routes — they must not be indexed
  exclude: ["/booking/*", "/booking"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/booking"],
      },
    ],
    additionalSitemaps: [],
  },
}
