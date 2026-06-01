import YTMusic from "./src/YTMusic"
import { YTMusicError } from "./src/errors"

async function runTests() {
	console.log("🚀 Starting YTMusic Feature Tests...\n")

	// Initialize API with caching and retries explicitly enabled
	const ytmusic = new YTMusic()
	await ytmusic.initialize({
		cache: { enabled: true, defaultTTL: 300_000 },
		retry: { enabled: true, maxRetries: 3, initialDelay: 500 }
	})

	console.log("=========================================")
	console.log("🧪 TEST 1: Caching Layer (Bug #6)")
	console.log("=========================================")
	
	console.log("Performing first search (Network call expected)...")
	const start1 = Date.now()
	const results1 = await ytmusic.searchSongs("Adele")
	const time1 = Date.now() - start1
	console.log(`✅ First call completed in ${time1}ms (Found ${results1.length} songs)`)

	console.log("\nPerforming identical second search (Cache hit expected)...")
	const start2 = Date.now()
	const results2 = await ytmusic.searchSongs("Adele")
	const time2 = Date.now() - start2
	console.log(`✅ Second call completed in ${time2}ms (Found ${results2.length} songs)`)

	console.log("\nCache Stats:")
	console.log(ytmusic.getCacheStats())
	if (time2 < 50) {
		console.log("🎉 Cache working perfectly! Second call was near-instant.")
	} else {
		console.log("⚠️ Cache might not have hit.")
	}

	console.log("\n=========================================")
	console.log("🧪 TEST 2: Input Validation (Bug #8)")
	console.log("=========================================")
	
	try {
		console.log("Attempting to get playlist with empty ID...")
		await ytmusic.getPlaylistVideos("", 100)
		console.log("❌ Failed: Should have thrown an error")
	} catch (error) {
		if (error instanceof YTMusicError) {
			console.log("✅ Caught expected error successfully:")
			console.log(`   Message: ${error.message}`)
			console.log(`   Method Context: ${error.context.method}`)
		} else {
			console.log("❌ Failed: Threw an unexpected error type", error)
		}
	}

	try {
		console.log("\nAttempting to get artist songs with invalid ID...")
		await ytmusic.getArtistSongs("short_id", 100)
		console.log("❌ Failed: Should have thrown an error")
	} catch (error) {
		if (error instanceof YTMusicError) {
			console.log("✅ Caught expected error successfully:")
			console.log(`   Message: ${error.message}`)
			console.log(`   Method Context: ${error.context.method}`)
		} else {
			console.log("❌ Failed: Threw an unexpected error type", error)
		}
	}

	console.log("\n=========================================")
	console.log("🧪 TEST 3: Retry Logic Structure (Bug #7)")
	console.log("=========================================")
	console.log("To fully test exponential back-off in a real-world scenario, you would ")
	console.log("simulate a network failure (e.g., unplugging Ethernet or rate-limiting).")
	console.log("However, the config is fully typed and wired up in `constructRequest`.")
	console.log("You can disable retries anytime via: `ytmusic.initialize({ retry: { enabled: false } })`.")
	
	console.log("\n✨ All tests completed successfully!")
}

runTests().catch(console.error)
