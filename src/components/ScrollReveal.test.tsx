import { render, screen } from "@testing-library/react"
import { ScrollReveal } from "./ScrollReveal"

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion")
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  }
})

import { useReducedMotion } from "framer-motion"
const mockUseReducedMotion = vi.mocked(useReducedMotion)

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(
      <ScrollReveal>
        <p>Hello world</p>
      </ScrollReveal>
    )
    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("renders children in final state when reduced motion is preferred", () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { container } = render(
      <ScrollReveal>
        <p>Accessible content</p>
      </ScrollReveal>
    )
    expect(screen.getByText("Accessible content")).toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).not.toBe("0")
  })

  it("passes className to wrapper", () => {
    const { container } = render(
      <ScrollReveal className="mt-4">
        <p>Styled</p>
      </ScrollReveal>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("mt-4")
  })
})
