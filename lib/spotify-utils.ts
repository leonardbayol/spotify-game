import type { Track, PlaylistInfo } from "./spotify-types"

// Mock data pour la démo - en production, utiliser l'API Spotify
const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    name: "Blinding Lights",
    artist: "The Weeknd",
    featuring: [],
    cover: "/album-cover-neon-city-lights.jpg",
    releaseDate: "2020-03-20",
    popularity: 94,
  },
  {
    id: "2",
    name: "Shape of You",
    artist: "Ed Sheeran",
    featuring: [],
    cover: "/album-cover-colorful-abstract.jpg",
    releaseDate: "2017-01-06",
    popularity: 91,
  },
  {
    id: "3",
    name: "Dance Monkey",
    artist: "Tones and I",
    featuring: [],
    cover: "/album-cover-monkey-illustration.jpg",
    releaseDate: "2019-05-10",
    popularity: 88,
  },
  {
    id: "4",
    name: "Someone You Loved",
    artist: "Lewis Capaldi",
    featuring: [],
    cover: "/album-cover-emotional-portrait.jpg",
    releaseDate: "2018-11-08",
    popularity: 85,
  },
  {
    id: "5",
    name: "Rockstar",
    artist: "Post Malone",
    featuring: ["21 Savage"],
    cover: "/album-cover-dark-aesthetic.jpg",
    releaseDate: "2017-09-15",
    popularity: 83,
  },
  {
    id: "6",
    name: "One Dance",
    artist: "Drake",
    featuring: ["Wizkid", "Kyla"],
    cover: "/album-cover-summer-vibes.jpg",
    releaseDate: "2016-04-05",
    popularity: 80,
  },
  {
    id: "7",
    name: "Closer",
    artist: "The Chainsmokers",
    featuring: ["Halsey"],
    cover: "/album-cover-gradient-purple.jpg",
    releaseDate: "2016-07-29",
    popularity: 78,
  },
  {
    id: "8",
    name: "Thinking Out Loud",
    artist: "Ed Sheeran",
    featuring: [],
    cover: "/album-cover-romantic-orange.jpg",
    releaseDate: "2014-06-23",
    popularity: 76,
  },
  {
    id: "9",
    name: "Uptown Funk",
    artist: "Mark Ronson",
    featuring: ["Bruno Mars"],
    cover: "/album-cover-retro-funk.jpg",
    releaseDate: "2014-11-10",
    popularity: 74,
  },
  {
    id: "10",
    name: "Despacito",
    artist: "Luis Fonsi",
    featuring: ["Daddy Yankee"],
    cover: "/album-cover-tropical-latin.jpg",
    releaseDate: "2017-01-12",
    popularity: 72,
  },
  {
    id: "11",
    name: "Bad Guy",
    artist: "Billie Eilish",
    featuring: [],
    cover: "/album-cover-green-neon.jpg",
    releaseDate: "2019-03-29",
    popularity: 89,
  },
  {
    id: "12",
    name: "Sunflower",
    artist: "Post Malone",
    featuring: ["Swae Lee"],
    cover: "/album-cover-sunflower-yellow.jpg",
    releaseDate: "2018-10-18",
    popularity: 87,
  },
]

export function parsePlaylistId(url: string): string | null {
  if (!url) return null
  const trimmed = url.trim()

  // URL format: https://open.spotify.com/playlist/xxxxx
  if (trimmed.includes("open.spotify.com/playlist/")) {
    const parts = trimmed.split("open.spotify.com/playlist/")[1]
    return parts?.split("?")[0]?.split("/")[0] || null
  }

  // URI format: spotify:playlist:xxxxx
  if (trimmed.startsWith("spotify:playlist:")) {
    return trimmed.split("spotify:playlist:")[1]?.split(":")[0] || null
  }

  // Assume it's already an ID
  return trimmed.split("?")[0]?.split("/")[0] || null
}

export function getRandomTracks(tracks: Track[], count: number): Track[] {
  const shuffled = [...tracks].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getTwoDifferentTracks(tracks: Track[]): [Track, Track] | null {
  if (tracks.length < 2) return null

  // Get tracks with different popularity
  const uniquePopularities = [...new Set(tracks.map((t) => t.popularity))]
  if (uniquePopularities.length < 2) return null

  const shuffled = [...tracks].sort(() => Math.random() - 0.5)
  const first = shuffled[0]
  const second = shuffled.find((t) => t.popularity !== first.popularity)

  if (!second) return null
  return [first, second]
}

export function calculateRankingScore(userOrder: string[], correctOrder: string[]): number {
  let score = 0
  const maxScore = correctOrder.length * 100

  userOrder.forEach((trackId, userIndex) => {
    const correctIndex = correctOrder.indexOf(trackId)
    const distance = Math.abs(userIndex - correctIndex)
    const trackScore = Math.max(0, 100 - distance * 25)
    score += trackScore
  })

  return Math.round((score / maxScore) * 100)
}

export async function loadPlaylistTracks(playlistId: string): Promise<{ tracks: Track[]; playlist: PlaylistInfo }> {
  const response = await fetch(`/api/spotify/playlist/${playlistId}`)

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || "Erreur lors du chargement de la playlist")
  }

  const data = await response.json()
  return { tracks: data.tracks, playlist: data.playlist }
}
