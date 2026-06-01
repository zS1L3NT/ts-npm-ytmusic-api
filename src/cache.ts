interface CacheEntry<T> {
	data: T
	expiresAt: number
}

export class CacheManager {
	private cache = new Map<string, CacheEntry<unknown>>()
	private cleanupTimer: ReturnType<typeof setInterval> | null = null

	/**
	 * @param defaultTTL Default time-to-live in milliseconds (default: 5 minutes)
	 */
	constructor(private readonly defaultTTL: number = 300_000) {
		this.startCleanup()
	}

	/**
	 * Return cached data if the entry exists and has not expired.
	 * Returns `null` on a miss or after evicting a stale entry.
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key)
		if (!entry) return null

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key)
			return null
		}

		return entry.data as T
	}

	/**
	 * Store `data` under `key` with an optional per-entry TTL.
	 * Falls back to the instance's default TTL when not specified.
	 */
	set<T>(key: string, data: T, ttl?: number): void {
		this.cache.set(key, {
			data,
			expiresAt: Date.now() + (ttl ?? this.defaultTTL),
		})
	}

	/** Returns `true` when a non-expired entry exists for `key`. */
	has(key: string): boolean {
		return this.get(key) !== null
	}

	/** Remove a single cache entry. */
	delete(key: string): void {
		this.cache.delete(key)
	}

	/** Evict all entries immediately. */
	clear(): void {
		this.cache.clear()
	}

	/** Number of entries currently stored (including not-yet-evicted stale ones). */
	get size(): number {
		return this.cache.size
	}

	/** Snapshot of all keys currently in the cache (including stale). */
	get keys(): string[] {
		return Array.from(this.cache.keys())
	}

	/**
	 * Summary statistics suitable for `getCacheStats()`.
	 * Reports the live count after purging expired entries.
	 */
	getStats(): { size: number; keys: string[] } {
		this.evictExpired()
		return { size: this.cache.size, keys: Array.from(this.cache.keys()) }
	}

	/**
	 * Stop the background eviction timer.
	 * Call this before destroying the instance to avoid keeping the event
	 * loop alive in Node/Bun environments.
	 */
	stopCleanup(): void {
		if (this.cleanupTimer !== null) {
			clearInterval(this.cleanupTimer)
			this.cleanupTimer = null
		}
	}

	/** Stop cleanup and evict all entries. */
	destroy(): void {
		this.stopCleanup()
		this.clear()
	}

	// ─── Private ────────────────────────────────────────────────────────────────

	private evictExpired(): void {
		const now = Date.now()
		for (const [key, entry] of this.cache) {
			if (now > entry.expiresAt) this.cache.delete(key)
		}
	}

	private startCleanup(): void {
		if (this.cleanupTimer !== null) return

		this.cleanupTimer = setInterval(() => this.evictExpired(), 60_000)

		// Don't keep Node/Bun alive just for cache housekeeping
		if (
			this.cleanupTimer !== null &&
			typeof this.cleanupTimer === "object" &&
			"unref" in this.cleanupTimer
		) {
			;(this.cleanupTimer as unknown as { unref(): void }).unref()
		}
	}
}
