import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Homepage animations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.locator('[aria-labelledby="hero-heading"]').waitFor({ state: "attached" })
  })

  test("hero section renders with poster image and video", async ({
    page,
  }) => {
    const heroSection = page.locator('[aria-labelledby="hero-heading"]')
    await expect(heroSection).toBeVisible()

    const poster = heroSection.locator(
      'img[alt="JSX semi-private jet on the tarmac at golden hour"]'
    )
    await expect(poster).toBeAttached()
    expect(await poster.getAttribute("src")).toContain("hero-poster")

    const video = heroSection.locator("video")
    await expect(video).toBeAttached()
    expect(await video.getAttribute("aria-hidden")).toBe("true")
    expect(await video.getAttribute("preload")).toBe("auto")

    const webmSource = video.locator('source[type="video/webm"]')
    const mp4Source = video.locator('source[type="video/mp4"]')
    await expect(webmSource).toBeAttached()
    await expect(mp4Source).toBeAttached()
    expect(await webmSource.getAttribute("src")).toContain("hero.webm")
    expect(await mp4Source.getAttribute("src")).toContain("hero.mp4")
  })

  test("hero pause/play button toggles", async ({ page }) => {
    const pauseButton = page.getByRole("button", {
      name: "Pause background video",
    })
    await expect(pauseButton).toBeVisible()

    await pauseButton.click()
    const playButton = page.getByRole("button", {
      name: "Play background video",
    })
    await expect(playButton).toBeVisible()

    await playButton.click()
    await expect(
      page.getByRole("button", { name: "Pause background video" })
    ).toBeVisible()
  })

  test("experience section renders with video cards", async ({ page }) => {
    const experienceSection = page.locator(
      'section[aria-labelledby="experience-heading"]'
    )
    await expect(experienceSection).toBeVisible()

    await expect(
      experienceSection.getByText("Skip the airport stress.")
    ).toBeVisible()
    await expect(
      experienceSection.getByText("Bring the whole party.")
    ).toBeVisible()
    await expect(
      experienceSection.getByText("Vacation starts on the tarmac.")
    ).toBeVisible()
    await expect(
      experienceSection.getByText("Get there faster.")
    ).toBeVisible()

    const videos = experienceSection.locator("video")
    expect(await videos.count()).toBeGreaterThanOrEqual(1)
  })

  test("Where We Fly section renders destination cards", async ({ page }) => {
    const whereWeFly = page.locator(
      'section[aria-labelledby="where-we-fly-heading"]'
    )
    await whereWeFly.scrollIntoViewIfNeeded()
    await expect(whereWeFly).toBeVisible()

    const destinations = whereWeFly.locator('[role="listitem"]')
    expect(await destinations.count()).toBe(4)

    await expect(whereWeFly.getByText("See All Routes")).toBeVisible()
  })

  test("homepage with video passes axe-core accessibility scan", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()

    if (results.violations.length > 0) {
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`
      )
      console.log("axe violations:", summary)
    }
    expect(results.violations).toEqual([])
  })
})
