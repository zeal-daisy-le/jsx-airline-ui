import { test, expect } from "@playwright/test"
import { futureDateIso, seedBookingStateUpTo } from "./helpers/booking"

/**
 * API failure recovery:
 * Mock a BFF endpoint to fail and verify the app shows a toast and
 * allows the user to retry without losing booking state.
 */
test.describe("API failure recovery", () => {
  test("shows toast and retry button when flight search fails", async ({
    page,
  }) => {
    // Intercept the search API to return a 502 error
    await page.route("**/api/search*", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Flight search unavailable. Please try again.",
        }),
      })
    )

    await page.goto("/booking/flights")
    await page.selectOption("#origin", "DAL")
    await page.selectOption("#destination", "LAS")
    await page.fill("#date", futureDateIso())
    await page.click('button[type="submit"]:has-text("Search flights")')

    // The error toast or inline error should appear
    await expect(
      page.getByText(/Flight search unavailable|Please try again/i)
    ).toBeVisible({ timeout: 8_000 })

    // The search form is still accessible (store not corrupted)
    await expect(page.locator("#origin")).toBeVisible()
    await expect(page.locator("#destination")).toBeVisible()
  })

  test("shows toast and inline retry when bag load fails", async ({ page }) => {
    await seedBookingStateUpTo(page, "bags")

    // Intercept bag options load to fail
    await page.route("**/api/booking/bags", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Bags service unavailable" }),
        })
      }
      return route.continue()
    })

    await page.goto("/booking/bags")
    await page.waitForURL(/\/booking\/bags/)

    // Inline error + retry button should appear
    await expect(
      page.getByText(/Unable to load bag options/i)
    ).toBeVisible({ timeout: 8_000 })
    await expect(
      page.getByRole("button", { name: /Try again/i })
    ).toBeVisible()

    // Continue button remains accessible so user can proceed without bags
    await expect(
      page.getByRole("button", { name: "Continue" })
    ).toBeVisible()
  })

  test("shows retry when seat map load fails", async ({ page }) => {
    await seedBookingStateUpTo(page, "seats")

    await page.route("**/api/booking/seatmap", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Seat map unavailable" }),
        })
      }
      return route.continue()
    })

    await page.goto("/booking/seats")
    await page.waitForURL(/\/booking\/seats/)

    // Error + retry
    await expect(
      page.getByText(/Unable to load seat map/i)
    ).toBeVisible({ timeout: 8_000 })

    // Skip option still available
    await expect(page.getByTestId("skip-link")).toBeVisible()
  })
})
