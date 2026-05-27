import { test, expect } from "@playwright/test"
import { seedBookingStateUpTo } from "./helpers/booking"

/**
 * Logged-in user profile pre-fill:
 * When GET /api/auth/me returns a user, the traveller details form should
 * pre-fill the primary passenger's name and contact email.
 */
test.describe("Logged-in user profile pre-fill", () => {
  test("pre-fills name and email from authenticated user profile", async ({
    page,
  }) => {
    const LOGGED_IN_USER = {
      id: "user-001",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
    }

    // Seed booking state through passengers step
    await seedBookingStateUpTo(page, "details")

    // Mock the auth/me endpoint to return a logged-in user
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: LOGGED_IN_USER }),
      })
    )

    await page.goto("/booking/details")
    await page.waitForSelector("[data-testid='passenger-section-0']")

    // Auth/me is called on mount — wait for pre-fill
    await expect(page.locator("#passengers\\.0\\.firstName")).toHaveValue(
      LOGGED_IN_USER.firstName,
      { timeout: 5_000 }
    )
    await expect(page.locator("#passengers\\.0\\.lastName")).toHaveValue(
      LOGGED_IN_USER.lastName
    )
    await expect(page.locator("#contact\\.email")).toHaveValue(
      LOGGED_IN_USER.email
    )
  })

  test("does not overwrite data already entered in the session", async ({
    page,
  }) => {
    const LOGGED_IN_USER = {
      id: "user-001",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
    }

    // Seed state with existing traveler info already in the store
    await page.goto("/")
    await page.evaluate(() => {
      const state = {
        currentStep: "details",
        stepValidity: {
          flights: true,
          passengers: true,
          details: false,
          bags: false,
          seats: false,
          review: false,
          payment: false,
          confirmation: false,
        },
        selectedFlight: {
          flightId: "DAL-LAS-2026-06-15-0600",
          origin: "DAL",
          destination: "LAS",
        },
        passengers: { adults: 1, children: 0, infants: 0 },
        travelerInfo: [
          {
            firstName: "Existing",
            lastName: "User",
            dateOfBirth: "1985-06-15",
            documentType: "passport",
            documentNumber: "XY999999",
            nationality: "US",
          },
        ],
        bagSelections: [],
        seatAssignments: [],
        paymentToken: null,
        bookingReference: null,
        confirmedTotalPrice: null,
      }
      sessionStorage.setItem(
        "jsx-booking",
        JSON.stringify({ state, version: 0 })
      )
    })

    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: LOGGED_IN_USER }),
      })
    )

    await page.goto("/booking/details")
    await page.waitForSelector("[data-testid='passenger-section-0']")

    // Pre-fill must NOT overwrite the existing values
    await expect(page.locator("#passengers\\.0\\.firstName")).toHaveValue(
      "Existing"
    )
    await expect(page.locator("#passengers\\.0\\.lastName")).toHaveValue("User")
  })

  test("guest users see empty form (no pre-fill)", async ({ page }) => {
    await seedBookingStateUpTo(page, "details")

    // auth/me returns no user
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: null }),
      })
    )

    await page.goto("/booking/details")
    await page.waitForSelector("[data-testid='passenger-section-0']")

    await expect(page.locator("#passengers\\.0\\.firstName")).toHaveValue("")
    await expect(page.locator("#passengers\\.0\\.lastName")).toHaveValue("")
    await expect(page.locator("#contact\\.email")).toHaveValue("")
  })
})
