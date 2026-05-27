import { test, expect } from "@playwright/test"
import { seedBookingStateUpTo, MOCK_TRAVELER, MOCK_CONTACT } from "./helpers/booking"

/**
 * Back navigation: navigate forward 4 steps, go back 2, verify data retained.
 */
test.describe("Back navigation + data retention", () => {
  test("retains entered data when navigating backward and forward", async ({
    page,
  }) => {
    // Seed state with flights + passengers steps complete
    await seedBookingStateUpTo(page, "details")

    // ── Traveller details ────────────────────────────────────────────────────
    await page.goto("/booking/details")
    await page.waitForSelector("[data-testid='passenger-section-0']")

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

    // ── Bags ─────────────────────────────────────────────────────────────────
    await page.waitForURL(/\/booking\/bags/, { timeout: 10_000 })
    await page.check("#passenger-0-bags-0")
    await page.getByRole("button", { name: "Continue" }).click()

    // ── Seats ─────────────────────────────────────────────────────────────────
    await page.waitForURL(/\/booking\/seats/, { timeout: 10_000 })

    // Go back 2 steps to traveller details
    await page.goto("/booking/bags")
    await page.waitForURL(/\/booking\/bags/)

    await page.goto("/booking/details")
    await page.waitForURL(/\/booking\/details/)
    await page.waitForSelector("[data-testid='passenger-section-0']")

    // Verify data was retained in sessionStorage
    await expect(page.locator("#passengers\\.0\\.firstName")).toHaveValue(
      MOCK_TRAVELER.firstName
    )
    await expect(page.locator("#passengers\\.0\\.lastName")).toHaveValue(
      MOCK_TRAVELER.lastName
    )
    // Note: contactDetails is intentionally not persisted to sessionStorage
    // (not in bookingStore's partialize list), so we don't assert on it here

    // Navigate forward again to bags — previously selected option is pre-filled
    await page.getByRole("button", { name: "Continue" }).click()
    await page.waitForURL(/\/booking\/bags/, { timeout: 10_000 })

    // The "No checked bag" option should be selected (stored value)
    await expect(page.locator("#passenger-0-bags-0")).toBeChecked()
  })
})
