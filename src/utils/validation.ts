import { YTMusicError } from "../errors"

/**
 * Assert that `playlistId` looks like a plausible YouTube playlist identifier.
 * This is a lightweight sanity-check — it does **not** make a network call.
 *
 * @throws {YTMusicError} when the value is empty or obviously malformed.
 */
export function validatePlaylistId(playlistId: string, methodName: string): void {
	if (!playlistId || typeof playlistId !== "string") {
		throw new YTMusicError("Invalid playlistId: must be a non-empty string", {
			method: methodName,
		})
	}
	if (playlistId.length < 10) {
		throw new YTMusicError(
			`Invalid playlistId: "${playlistId}" is too short (minimum 10 characters)`,
			{ method: methodName },
		)
	}
}

/**
 * Assert that `artistId` looks like a plausible YouTube artist/channel identifier.
 * YouTube channel IDs begin with "UC" and are 24 characters long.
 *
 * @throws {YTMusicError} when the value is empty or obviously malformed.
 */
export function validateArtistId(artistId: string, methodName: string): void {
	if (!artistId || typeof artistId !== "string") {
		throw new YTMusicError("Invalid artistId: must be a non-empty string", {
			method: methodName,
		})
	}
	if (!artistId.startsWith("UC") || artistId.length !== 24) {
		throw new YTMusicError(
			`Invalid artistId: "${artistId}" (expected format: "UC" followed by 22 characters)`,
			{ method: methodName },
		)
	}
}

/**
 * Assert that `albumId` looks like a plausible YouTube Music album identifier.
 *
 * @throws {YTMusicError} when the value is empty or obviously malformed.
 */
export function validateAlbumId(albumId: string, methodName: string): void {
	if (!albumId || typeof albumId !== "string") {
		throw new YTMusicError("Invalid albumId: must be a non-empty string", {
			method: methodName,
		})
	}
	if (albumId.length < 10) {
		throw new YTMusicError(
			`Invalid albumId: "${albumId}" is too short (minimum 10 characters)`,
			{ method: methodName },
		)
	}
}
