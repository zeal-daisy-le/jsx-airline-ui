export interface RetryOptions {
  maxRetries?: number
  onRetrying?: (attempt: number) => void
  /** Override backoff delays in ms — primarily for testing. Defaults to [1000, 2000]. */
  delays?: number[]
}

// Exponential backoff delays in ms: 1s for first retry, 2s for second
export const DEFAULT_BACKOFF_DELAYS_MS = [1000, 2000]

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    onRetrying,
    delays = DEFAULT_BACKOFF_DELAYS_MS,
  } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        onRetrying?.(attempt + 1)
        await sleep(delays[attempt] ?? 2000)
      }
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
