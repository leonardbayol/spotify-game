import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import type { Track } from "@/lib/spotify-types"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface RoomPlayer {
  id: string
  name: string
  order: string[]
  score: number
  validated: boolean
  joinedAt: number // Add join timestamp for host transfer
}

export interface Room {
  id: string
  hostId: string
  playlistId: string
  playlistName: string
  playlistImage: string
  allTracks: Track[]
  tracks: Track[]
  players: RoomPlayer[]
  status: "waiting" | "playing" | "results"
  startedAt: number | null
  endsAt: number | null
  correctOrder: string[]
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Helper pour mélanger un tableau
function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5)
}

// Sélectionne 10 tracks avec popularité unique
function select10UniquePopularity(tracks: Track[]): Track[] {
  const byPopularity: Record<number, Track[]> = {}

  tracks.forEach((t) => {
    if (!byPopularity[t.popularity]) byPopularity[t.popularity] = []
    byPopularity[t.popularity].push(t)
  })

  const uniquePopularities = Object.keys(byPopularity).map(Number)
  const shuffledPopularities = shuffleArray(uniquePopularities)
  const selected: Track[] = []

  for (const pop of shuffledPopularities) {
    if (selected.length >= 10) break
    const pool = byPopularity[pop]
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    selected.push(chosen)
  }

  // Si moins de 10 tracks, compléter avec les restantes
  if (selected.length < 10) {
    const remaining = tracks.filter((t) => !selected.includes(t))
    const shuffledRemaining = shuffleArray(remaining)
    while (selected.length < 10 && shuffledRemaining.length > 0) {
      selected.push(shuffledRemaining.pop()!)
    }
  }

  return selected
}

// POST - Create a new room
export async function POST(request: Request) {
  try {
    const { hostName, playlistId, playlistName, playlistImage, tracks } = await request.json()

    if (!hostName || !playlistId || !tracks || tracks.length < 10) {
      return NextResponse.json(
        { error: "Missing required fields or not enough tracks" },
        { status: 400 }
      )
    }

    const roomCode = generateRoomCode()
    const hostId = crypto.randomUUID()

    const roundTracks = select10UniquePopularity(tracks)
    const correctOrder = [...roundTracks]
      .sort((a, b) => b.popularity - a.popularity)
      .map((t) => t.id)
    const initialOrder = roundTracks.map((t) => t.id)

    const room: Room = {
      id: roomCode,
      hostId,
      playlistId,
      playlistName,
      playlistImage,
      allTracks: tracks,
      tracks: roundTracks,
      players: [
        {
          id: hostId,
          name: hostName,
          order: initialOrder,
          score: 0,
          validated: false,
          joinedAt: Date.now(),
        },
      ],
      status: "waiting",
      startedAt: null,
      endsAt: null,
      correctOrder,
    }

    await redis.set(`room:${roomCode}`, JSON.stringify(room), { ex: 3600 })

    return NextResponse.json({ roomCode, hostId, room })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
