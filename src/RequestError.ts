export default class RequestError extends Error {
	public readonly endpoint: string
	public readonly status: number | null
	public readonly reason: string

	/**
	 * @param status HTTP status, or null when YouTube Music could not be reached
	 */
	public constructor(endpoint: string, status: number | null, reason: string, cause: unknown) {
		super(`Request to ${endpoint} failed: ${status ?? "no response"}: ${reason}`, { cause })
		this.name = "RequestError"
		this.endpoint = endpoint
		this.status = status
		this.reason = reason
	}
}
