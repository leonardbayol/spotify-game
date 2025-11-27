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
  joinedAt: number
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

// POST - Create a new room
export async function POST(request: Request) {
  try {
    const { hostName, playlistId, playlistName, playlistImage, tracks } = await request.json()

    if (!hostName || !playlistId || !tracks || tracks.length < 10) {
      return NextResponse.json({ error: "Missing required fields or not enough tracks" }, { status: 400 })
    }

    const roomCode = generateRoomCode()
    const hostId = crypto.randomUUID()

    const shuffledAll = [...tracks].sort(() => Math.random() - 0.5)
    const roundTracks = shuffledAll.slice(0, 10)
    const correctOrder = [...roundTracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)
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
          joinedAt: Date.now(), // Track join time
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
