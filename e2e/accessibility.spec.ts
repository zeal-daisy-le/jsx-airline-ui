import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { seedBookingStateUpTo } from "./helpers/booking"

/**
 * axe-core accessibility scan on every booking step and the homepage.
 * Any WCAG violation causes the CI pipeline to fail.
 */
test.describe("Accessibility — WCAG 2.1 AA", () => {
  test("homepage passes axe-core", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/flights passes axe-core", async ({ page }) => {
    await page.goto("/booking/flights")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/passengers passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "passengers")
    await page.goto("/booking/passengers")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/details passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "details")
    await page.goto("/booking/details")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/bags passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "bags")
    await page.goto("/booking/bags")
    // Wait for bag options to load
    await page.waitForSelector("[data-testid='bag-section-0']", {
      timeout: 8_000,
    })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/seats passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "seats")
    await page.goto("/booking/seats")
    // Wait for seat map to load
    await page.waitForSelector("[data-testid='seat-1A']", { timeout: 8_000 })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/review passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "review")
    await page.goto("/booking/review")
    // Wait for flight section to render
    await page.waitForSelector("[data-testid='flight-section']", {
      timeout: 8_000,
    })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("booking/payment passes axe-core", async ({ page }) => {
    await seedBookingStateUpTo(page, "payment")
    await page.goto("/booking/payment")
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
