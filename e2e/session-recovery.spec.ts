import { test } from "@playwright/test"

/**
 * Session expiry recovery tests.
 * Pending issue #13 (SessionRecovery — expiry timer, 10-min warning,
 * recovery screen). These tests are skipped until #13 is complete.
 */
test.describe("Session expiry recovery", () => {
  test("booking interrupted mid-flow — session expires — recovery screen shown — data pre-filled", async () => {
    test.skip(true, "TODO: Implement after #13 SessionRecovery is complete")
  })

  test("10-minute warning banner appears before session expires", async () => {
    test.skip(true, "TODO: Implement after #13 SessionRecovery is complete")
  })

  test("user dismisses warning and session is extended", async () => {
    test.skip(true, "TODO: Implement after #13 SessionRecovery is complete")
  })
})
