import { test, expect } from "@playwright/test"
import { futureDateIso, MOCK_TRAVELER, MOCK_CONTACT } from "./helpers/booking"

/**
 * Guest booking critical path:
 * search → flight selection → passengers → traveller details →
 * bags → seats (skip) → review → payment (mocked) → confirmation
 */
test.describe("Guest booking critical path", () => {
  test("completes full booking flow from search to confirmation", async ({
    page,
  }) => {
    // ── Step 1: Flight search ───────────────────────────────────────────────
    await page.goto("/booking/flights")
    await expect(page).toHaveURL(/\/booking\/flights/)

    // Fill search form
    await page.selectOption("#origin", "DAL")
    await page.selectOption("#destination", "LAS")
    await page.fill("#date", futureDateIso())
    // adults defaults to 1, no change needed

    await page.click('button[type="submit"]:has-text("Search flights")')

    // Wait for results
    await expect(
      page.getByRole("region", { name: "Available flights" })
    ).toBeVisible({ timeout: 10_000 })

    // Select first flight
    await page.getByRole("button", { name: /Select/ }).first().click()

    // ── Step 2: Passenger selection ─────────────────────────────────────────
    await page.waitForURL(/\/booking\/passengers/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Passengers/i })
    ).toBeVisible()

    // Keep defaults (1 adult), click Continue
    await page.getByRole("button", { name: "Continue" }).click()

    // ── Step 3: Traveller details ────────────────────────────────────────────
    await page.waitForURL(/\/booking\/details/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Traveller details/i })
    ).toBeVisible()

    await page.fill("#passengers\\.0\\.firstName", MOCK_TRAVELER.firstName)
    await page.fill("#passengers\\.0\\.lastName", MOCK_TRAVELER.lastName)
    await page.fill("#passengers\\.0\\.dateOfBirth", MOCK_TRAVELER.dateOfBirth)
    await page.fill("#passengers\\.0\\.nationality", MOCK_TRAVELER.nationality)
    await page.check('input[type="radio"][value="passport"]')
    await page.fill(
      "#passengers\\.0\\.documentNumber",
      MOCK_TRAVELER.documentNumber
    )
    await page.fill("#contact\\.email", MOCK_CONTACT.email)
    await page.fill("#contact\\.phone", MOCK_CONTACT.phone)

    await page.getByRole("button", { name: "Continue" }).click()

    // ── Step 4: Bags selection ───────────────────────────────────────────────
    await page.waitForURL(/\/booking\/bags/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Bag allowances/i })
    ).toBeVisible()

    // Select 1 checked bag for passenger 0
    await page.check("#passenger-0-bags-1")
    await page.getByRole("button", { name: "Continue" }).click()

    // ── Step 5: Seat selection (skip) ────────────────────────────────────────
    await page.waitForURL(/\/booking\/seats/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Seat selection/i })
    ).toBeVisible()

    await page.getByTestId("skip-link").click()

    // ── Step 6: Review ───────────────────────────────────────────────────────
    await page.waitForURL(/\/booking\/review/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Review your booking/i })
    ).toBeVisible()

    // Wait for price breakdown to load
    await expect(page.getByTestId("price-breakdown")).toBeVisible({
      timeout: 10_000,
    })

    await page.getByTestId("confirm-pay-button").click()

    // ── Step 7: Payment ──────────────────────────────────────────────────────
    await page.waitForURL(/\/booking\/payment/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /Payment/i })
    ).toBeVisible()

    await page.getByTestId("pay-button").click()

    // ── Step 8: Confirmation ─────────────────────────────────────────────────
    await page.waitForURL(/\/booking\/confirmation/, { timeout: 15_000 })
    await expect(
      page.getByRole("heading", { name: /Booking confirmed/i })
    ).toBeVisible()

    // PNR is shown
    await expect(
      page.locator('[aria-label^="Booking reference:"]')
    ).toBeVisible()

    // Passenger name shown
    await expect(
      page.getByText(`${MOCK_TRAVELER.firstName} ${MOCK_TRAVELER.lastName}`)
    ).toBeVisible()
  })
})
