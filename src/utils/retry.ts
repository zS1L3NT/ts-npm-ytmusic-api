import { YTMusicAPIError, YTMusicError } from "../errors"

export interface RetryOptions {
	/** Maximum number of retry attempts after the first failure (default: 3). */
	maxRetries: number
	/** Delay before the first retry in milliseconds (default: 1 000). */
	initialDelay: number
	/** Upper bound for any single delay in milliseconds (default: 10 000). */
	maxDelay: number
	/**
	 * Multiplier applied to the delay on each successive retry (default: 2).
	 * Creates an exponential back-off curve.
	 */
	backoffMultiplier: number
	/**
	 * HTTP status codes that are considered transient and safe to retry.
	 * Defaults to [429, 502, 503, 504].
	 */
	retryableStatusCodes: number[]
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
	maxRetries: 3,
	initialDelay: 1_000,
	maxDelay: 10_000,
	backoffMultiplier: 2,
	retryableStatusCodes: [429, 502, 503, 504],
}

/**
 * Return a promise that resolves after `ms` milliseconds.
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Calculate the delay for a given retry `attempt` using exponential back-off
 * plus up to 20 % random jitter to avoid thundering-herd effects.
 */
function calculateDelay(
	attempt: number,
	initialDelay: number,
	maxDelay: number,
	backoffMultiplier: number,
): number {
	const exponential = initialDelay * backoffMultiplier ** attempt
	const capped = Math.min(exponential, maxDelay)
	const jitter = capped * 0.2 * Math.random()
	return Math.floor(capped + jitter)
}

/**
 * Determine whether an error should trigger a retry attempt.
 *
 * - Network errors (no `response` property on a `YTMusicError`) are retryable
 *   when `context.isRetryable` is `true`.
 * - `YTMusicAPIError` instances are retryable when their status code appears in
 *   the configured `retryableStatusCodes` list.
 * - All other unknown errors are treated as retryable (network layer issue).
 */
function isRetryable(error: unknown, retryableStatusCodes: number[]): boolean {
	if (error instanceof YTMusicAPIError) {
		const code = error.context.statusCode
		return code !== undefined && retryableStatusCodes.includes(code)
	}

	if (error instanceof YTMusicError) {
		return error.context.isRetryable === true
	}

	// Unknown/Axios error without a response → network issue, retry
	if (error instanceof Error && !("response" in error)) return true

	return false
}

/**
 * Run `fn`, retrying on transient failures with exponential back-off + jitter.
 *
 * @param fn          Async function to execute (and potentially retry).
 * @param options     Partial retry configuration merged with `DEFAULT_RETRY_OPTIONS`.
 * @returns           The resolved value of `fn` on success.
 * @throws            The last error if all attempts are exhausted.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: Partial<RetryOptions> = {},
): Promise<T> {
	const config: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }

	let lastError: unknown

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			return await fn()
		} catch (err) {
			lastError = err

			const shouldRetry = isRetryable(err, config.retryableStatusCodes)
			const hasAttemptsLeft = attempt < config.maxRetries

			if (!shouldRetry || !hasAttemptsLeft) throw err

			const delay = calculateDelay(
				attempt,
				config.initialDelay,
				config.maxDelay,
				config.backoffMultiplier,
			)

			const statusNote =
				err instanceof YTMusicAPIError
					? ` (HTTP ${err.context.statusCode})`
					: " (network error)"

			console.warn(
				`[YTMusic] Retry ${attempt + 1}/${config.maxRetries} in ${delay}ms${statusNote}`,
			)

			await sleep(delay)
		}
	}

	// Unreachable — kept for TypeScript's exhaustiveness check
	throw lastError
}
