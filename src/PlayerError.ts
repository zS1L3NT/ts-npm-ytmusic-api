export default class PlayerError extends Error {
	public readonly videoId: string
	public readonly status: string
	public readonly reason: string

	public constructor(videoId: string, status: string, reason: string) {
		super(`Unable to get details for ${videoId}: ${status}: ${reason}`)
		this.name = "PlayerError"
		this.videoId = videoId
		this.status = status
		this.reason = reason
	}
}
