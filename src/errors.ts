/**
 * Base error class for all YTMusic API errors.
 * Wraps the underlying error with rich context for easier debugging.
 */
export class YTMusicError extends Error {
	constructor(
		message: string,
		public readonly context: {
			method?: string | undefined
			endpoint?: string | undefined
			statusCode?: number | undefined
			isRetryable?: boolean | undefined
			originalError?: Error | undefined
		} = {},
	) {
		super(message)
		this.name = "YTMusicError"
		// Maintain proper prototype chain for instanceof checks
		Object.setPrototypeOf(this, new.target.prototype)
	}
}

/**
 * Thrown when the YouTube Music API returns an HTTP error response.
 * The `context.isRetryable` flag indicates whether the caller should retry.
 */
export class YTMusicAPIError extends YTMusicError {
	constructor(
		message: string,
		statusCode: number,
		method?: string | undefined,
		endpoint?: string | undefined,
		originalError?: Error | undefined,
	) {
		super(message, {
			method,
			endpoint,
			statusCode,
			isRetryable: [408, 429, 500, 502, 503, 504].includes(statusCode),
			originalError,
		})
		this.name = "YTMusicAPIError"
		Object.setPrototypeOf(this, new.target.prototype)
	}
}
