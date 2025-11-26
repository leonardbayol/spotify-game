import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

interface CachedTrack {
  id: string
  name: string
  artist: string
  popularity: number
  cachedAt: number
}

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const CACHE_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days in seconds for Redis TTL

// Generate a cache key for a track
function getTrackCacheKey(trackId: string): string {
  return `track:popularity:${trackId}`
}

// Get cached popularity for a track
export async function getCachedTrackPopularity(trackId: string): Promise<number | null> {
  try {
    const cached = await redis.get<CachedTrack>(getTrackCacheKey(trackId))

    if (!cached) return null

    // Check if cache is still valid (less than 7 days old)
    const now = Date.now()
    if (now - cached.cachedAt > CACHE_EXPIRY_MS) {
      // Cache expired, delete it
      await redis.del(getTrackCacheKey(trackId))
      return null
    }

    return cached.popularity
  } catch (error) {
    console.error("[v0] Error getting cached track:", error)
    return null
  }
}

// Cache a track's popularity
export async function cacheTrackPopularity(
  trackId: string,
  name: string,
  artist: string,
  popularity: number,
): Promise<void> {
  try {
    const cached: CachedTrack = {
      id: trackId,
      name,
      artist,
      popularity,
      cachedAt: Date.now(),
    }

    await redis.set(getTrackCacheKey(trackId), cached, { ex: CACHE_EXPIRY_SECONDS })
  } catch (error) {
    console.error("[v0] Error caching track:", error)
  }
}

// Get multiple cached popularities at once (batch operation)
export async function getCachedTrackPopularities(trackIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>()

  try {
    // Use pipeline for better performance
    const pipeline = redis.pipeline()
    trackIds.forEach((id) => pipeline.get(getTrackCacheKey(id)))

    const responses = await pipeline.exec()
    const now = Date.now()

    responses.forEach((response, index) => {
      const cached = response as CachedTrack | null
      if (cached && now - cached.cachedAt <= CACHE_EXPIRY_MS) {
        result.set(trackIds[index], cached.popularity)
      }
    })
  } catch (error) {
    console.error("[v0] Error getting cached tracks batch:", error)
  }

  return result
}

// Cache multiple tracks at once (batch operation)
export async function cacheTrackPopularities(
  tracks: Array<{ id: string; name: string; artist: string; popularity: number }>,
): Promise<void> {
  try {
    const pipeline = redis.pipeline()
    const now = Date.now()

    tracks.forEach((track) => {
      const cached: CachedTrack = {
        id: track.id,
        name: track.name,
        artist: track.artist,
        popularity: track.popularity,
        cachedAt: now,
      }
      pipeline.set(getTrackCacheKey(track.id), cached, { ex: CACHE_EXPIRY_SECONDS })
    })

    await pipeline.exec()
  } catch (error) {
    console.error("[v0] Error caching tracks batch:", error)
  }
}
