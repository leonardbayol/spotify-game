import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import type { Room } from "../route"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

function transferHost(room: Room, leavingPlayerId: string): Room {
  if (room.hostId !== leavingPlayerId) return room

  const remainingPlayers = room.players
    .filter((p) => p.id !== leavingPlayerId)
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))

  if (remainingPlayers.length > 0) {
    room.hostId = remainingPlayers[0].id
  }

  return room
}

// Sélectionne 10 tracks avec popularité unique (identique à route.ts)
function select10UniquePopularity(tracks: Room["allTracks"]): Room["tracks"] {
  const popularityMap = new Map<number, typeof tracks>()
  for (const track of tracks) {
    if (!popularityMap.has(track.popularity)) {
      popularityMap.set(track.popularity, [])
    }
    popularityMap.get(track.popularity)!.push(track)
  }

  const uniqueTracks: typeof tracks = []
  const popularities = Array.from(popularityMap.keys()).sort(() => Math.random() - 0.5)

  for (const pop of popularities) {
    const candidates = popularityMap.get(pop)!
    uniqueTracks.push(candidates[Math.floor(Math.random() * candidates.length)])
    if (uniqueTracks.length === 10) break
  }

  if (uniqueTracks.length < 10) {
    throw new Error("Impossible de sélectionner 10 tracks avec popularités uniques")
  }

  return uniqueTracks
}

// GET et PUT (inchangés sauf restart)
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const roomData = await redis.get(`room:${code}`)

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const room: Room = typeof roomData === "string" ? JSON.parse(roomData) : roomData

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error getting room:", error)
    return NextResponse.json({ error: "Failed to get room" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const { action, playerId, playerName, order } = await request.json()

    const roomData = await redis.get(`room:${code}`)
    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    let room: Room = typeof roomData === "string" ? JSON.parse(roomData) : roomData

    switch (action) {
      // ... autres actions inchangées ...

      case "restart": {
        if (room.hostId !== playerId) {
          return NextResponse.json({ error: "Only host can restart" }, { status: 403 })
        }

        // Sélectionner 10 tracks avec popularités uniques
        const newRoundTracks = select10UniquePopularity(room.allTracks)
        const newCorrectOrder = [...newRoundTracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)
        const newInitialOrder = newRoundTracks.map((t) => t.id)

        room.tracks = newRoundTracks
        room.correctOrder = newCorrectOrder
        room.status = "waiting"
        room.startedAt = null
        room.endsAt = null
        room.players = room.players.map((p) => ({
          ...p,
          order: newInitialOrder,
          score: 0,
          validated: false,
        }))

        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}
