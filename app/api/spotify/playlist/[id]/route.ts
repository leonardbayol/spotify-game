import { NextResponse } from "next/server"
import type { Track, PlaylistInfo } from "@/lib/spotify-types"
import { getCachedTrackPopularities, cacheTrackPopularities } from "@/lib/track-cache"

// Normalise un nom pour comparer
function normalizeName(s: string): string {
  if (!s) return ""
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

// Cherche la meilleure popularité pour un titre
async function getBestTrackPopularity(
  token: string,
  trackName: string,
  artistName: string,
  market = "FR",
): Promise<number | null> {
  const baseTrackNorm = normalizeName(trackName)
  const baseArtistNorm = normalizeName(artistName)

  if (!baseTrackNorm || !baseArtistNorm) return null

  const searchOnce = async (query: string) => {
    const url = new URL("https://api.spotify.com/v1/search")
    url.searchParams.set("q", query)
    url.searchParams.set("type", "track")
    url.searchParams.set("limit", "20")
    url.searchParams.set("market", market)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.tracks?.items || []
  }

  try {
    let items = await searchOnce(`track:"${trackName}" artist:"${artistName}"`)

    if (items.length === 0) {
      items = await searchOnce(`${trackName} ${artistName}`)
    }

    if (items.length === 0) return null

    let best: number | null = null

    for (const item of items) {
      const tName = item.name || ""
      const artists = item.artists || []
      const mainArtistName = artists[0]?.name || ""

      const tNorm = normalizeName(tName)
      const aNorm = normalizeName(mainArtistName)

      if (!tNorm || !aNorm) continue

      const sameTrack = tNorm === baseTrackNorm || tNorm.startsWith(baseTrackNorm) || baseTrackNorm.startsWith(tNorm)
      const sameArtist = aNorm === baseArtistNorm

      if (sameTrack && sameArtist) {
        const pop = item.popularity || 0
        if (best === null || pop > best) {
          best = pop
        }
      }
    }

    return best
  } catch (error) {
    console.error("[v0] Error fetching best popularity:", error)
    return null
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: playlistId } = await params

  const tokenRes = await fetch(new URL("/api/spotify/token", request.url).toString())
  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Failed to get Spotify token" }, { status: 500 })
  }
  const { access_token: token, error: tokenError } = await tokenRes.json()

  if (tokenError) {
    return NextResponse.json({ error: tokenError }, { status: 500 })
  }

  try {
    // Récupérer les infos de la playlist
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!playlistRes.ok) {
      if (playlistRes.status === 404) {
        return NextResponse.json({ error: "Playlist introuvable" }, { status: 404 })
      }
      return NextResponse.json({ error: "Erreur Spotify API" }, { status: playlistRes.status })
    }

    const playlistData = await playlistRes.json()

    const playlist: PlaylistInfo = {
      id: playlistId,
      name: playlistData.name || "Playlist inconnue",
      owner: playlistData.owner?.display_name || "Inconnu",
      image: playlistData.images?.[0]?.url || "",
      totalTracks: playlistData.tracks?.total || 0,
    }

    // Récupérer les tracks
    const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&market=FR`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!tracksRes.ok) {
      return NextResponse.json({ error: "Erreur lors de la récupération des tracks" }, { status: tracksRes.status })
    }

    const tracksData = await tracksRes.json()
    const items = tracksData.items || []

    const trackIds = items
      .filter((item: { track: { id: string } | null }) => item.track?.id)
      .map((item: { track: { id: string } }) => item.track.id)

    const cachedPopularities = await getCachedTrackPopularities(trackIds)

    // Build tracks with cache-first approach
    const tracks: Track[] = []
    const tracksToCache: Array<{ id: string; name: string; artist: string; popularity: number }> = []

    for (const item of items) {
      const track = item.track
      if (!track) continue

      const artists = track.artists || []
      const mainArtist = artists[0]?.name || "Inconnu"
      const featuring = artists.slice(1).map((a: { name: string }) => a.name)
      const images = track.album?.images || []
      const cover = images[0]?.url || ""
      const rawPop = track.popularity || 0

      const cachedPop = cachedPopularities.get(track.id)
      let bestPop: number

      if (cachedPop !== undefined) {
        // Use cached popularity (less than 7 days old)
        bestPop = cachedPop
      } else {
        // Not in cache or cache expired - fetch from Spotify
        bestPop = rawPop
        if (mainArtist !== "Inconnu") {
          const altPop = await getBestTrackPopularity(token, track.name, mainArtist)
          if (altPop !== null) {
            bestPop = Math.max(bestPop, altPop)
          }
        }
        // Add to list of tracks to cache
        tracksToCache.push({
          id: track.id,
          name: track.name,
          artist: mainArtist,
          popularity: bestPop,
        })
      }

      tracks.push({
        id: track.id,
        name: track.name,
        artist: mainArtist,
        featuring,
        cover,
        releaseDate: track.album?.release_date || "",
        popularity: bestPop,
        previewUrl: track.preview_url || undefined,
      })
    }

    if (tracksToCache.length > 0) {
      await cacheTrackPopularities(tracksToCache)
    }

    return NextResponse.json({ playlist, tracks })
  } catch (error) {
    console.error("[v0] Playlist fetch error:", error)
    return NextResponse.json({ error: "Erreur lors du chargement de la playlist" }, { status: 500 })
  }
}
