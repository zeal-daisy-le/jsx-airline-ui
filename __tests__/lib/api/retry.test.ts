import { describe, it, expect, vi } from "vitest"
import { withRetry } from "@/lib/api/retry"

// Pass delays:[0,0] to skip the real 1s/2s waits while still exercising
// the retry logic. Timing itself is a one-liner (setTimeout) — no value
// in testing it here.
const NO_DELAY = { delays: [0, 0] }

describe("withRetry", () => {
  it("resolves on first attempt without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok")

    const result = await withRetry(fn, NO_DELAY)

    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries after first failure and succeeds on second attempt", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("transient error"))
      .mockResolvedValueOnce("recovered")

    const onRetrying = vi.fn()
    const result = await withRetry(fn, { ...NO_DELAY, onRetrying })

    expect(result).toBe("recovered")
    expect(fn).toHaveBeenCalledTimes(2)
    expect(onRetrying).toHaveBeenCalledTimes(1)
    expect(onRetrying).toHaveBeenCalledWith(1)
  })

  it("throws after all retries are exhausted — 3 total attempts", async () => {
    const error = new Error("permanent failure")
    const fn = vi.fn().mockRejectedValue(error)

    await expect(withRetry(fn, NO_DELAY)).rejects.toThrow("permanent failure")
    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it("calls onRetrying with incrementing attempt numbers on each retry", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"))
    const onRetrying = vi.fn()

    await expect(withRetry(fn, { ...NO_DELAY, onRetrying })).rejects.toThrow()

    expect(onRetrying).toHaveBeenCalledTimes(2)
    expect(onRetrying).toHaveBeenNthCalledWith(1, 1)
    expect(onRetrying).toHaveBeenNthCalledWith(2, 2)
  })

  it("respects a custom maxRetries value", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"))

    await expect(withRetry(fn, { delays: [0], maxRetries: 1 })).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(2) // 1 initial + 1 retry
  })

  it("succeeds on third attempt after two failures", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValueOnce("final success")

    const result = await withRetry(fn, NO_DELAY)

    expect(result).toBe("final success")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("re-throws the last error when all attempts fail", async () => {
    const errors = [new Error("err1"), new Error("err2"), new Error("err3")]
    let call = 0
    const fn = vi.fn().mockImplementation(() => Promise.reject(errors[call++]))

    await expect(withRetry(fn, NO_DELAY)).rejects.toBe(errors[2])
  })
})
