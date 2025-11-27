import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import type { Room } from "../route"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

function transferHost(room: Room, leavingPlayerId: string): Room {
  if (room.hostId !== leavingPlayerId) return room

  // Find the player who joined earliest (excluding the leaving player)
  const remainingPlayers = room.players
    .filter((p) => p.id !== leavingPlayerId)
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))

  if (remainingPlayers.length > 0) {
    room.hostId = remainingPlayers[0].id
  }

  return room
}

// GET - Get room data
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

// PUT - Update room (join, start, update order, validate, leave)
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
      case "join": {
        if (room.status !== "waiting") {
          return NextResponse.json({ error: "Game already started" }, { status: 400 })
        }

        const existingPlayer = room.players.find((p) => p.name === playerName)
        if (existingPlayer) {
          return NextResponse.json({ error: "Name already taken" }, { status: 400 })
        }

        const newPlayerId = crypto.randomUUID()
        const initialOrder = room.tracks.map((t) => t.id)

        room.players.push({
          id: newPlayerId,
          name: playerName,
          order: initialOrder,
          score: 0,
          validated: false,
          joinedAt: Date.now(), // Track join time
        })

        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ playerId: newPlayerId, room })
      }

      case "leave": {
        const leavingPlayer = room.players.find((p) => p.id === playerId)
        if (!leavingPlayer) {
          return NextResponse.json({ error: "Player not found" }, { status: 404 })
        }

        // Transfer host if needed before removing player
        room = transferHost(room, playerId)

        // Remove player from room
        room.players = room.players.filter((p) => p.id !== playerId)

        // If no players left, delete the room
        if (room.players.length === 0) {
          await redis.del(`room:${code}`)
          return NextResponse.json({ message: "Room deleted" })
        }

        // If game was in progress and all remaining players have validated, show results
        if (room.status === "playing") {
          const allValidated = room.players.every((p) => p.validated)
          if (allValidated) {
            room.status = "results"
          }
        }

        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room, newHostId: room.hostId })
      }

      case "start": {
        if (room.hostId !== playerId) {
          return NextResponse.json({ error: "Only host can start" }, { status: 403 })
        }

        const now = Date.now()
        room.status = "playing"
        room.startedAt = now
        room.endsAt = now + 60000

        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room })
      }

      case "update_order": {
        if (room.status !== "playing") {
          return NextResponse.json({ error: "Game not in progress" }, { status: 400 })
        }

        const player = room.players.find((p) => p.id === playerId)
        if (!player) {
          return NextResponse.json({ error: "Player not found" }, { status: 404 })
        }

        if (player.validated) {
          return NextResponse.json({ error: "Already validated" }, { status: 400 })
        }

        player.order = order
        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room })
      }

      case "validate": {
        if (room.status !== "playing") {
          return NextResponse.json({ error: "Game not in progress" }, { status: 400 })
        }

        const playerToValidate = room.players.find((p) => p.id === playerId)
        if (!playerToValidate) {
          return NextResponse.json({ error: "Player not found" }, { status: 404 })
        }

        let correctCount = 0
        playerToValidate.order.forEach((id, index) => {
          if (room.correctOrder[index] === id) {
            correctCount++
          }
        })

        playerToValidate.score = correctCount
        playerToValidate.validated = true

        const allValidated = room.players.every((p) => p.validated)
        if (allValidated) {
          room.status = "results"
        }

        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room })
      }

      case "force_end": {
        room.players.forEach((player) => {
          if (!player.validated) {
            let correctCount = 0
            player.order.forEach((id, index) => {
              if (room.correctOrder[index] === id) {
                correctCount++
              }
            })
            player.score = correctCount
            player.validated = true
          }
        })

        room.status = "results"
        await redis.set(`room:${code}`, JSON.stringify(room), { ex: 3600 })
        return NextResponse.json({ room })
      }

      case "restart": {
        if (room.hostId !== playerId) {
          return NextResponse.json({ error: "Only host can restart" }, { status: 403 })
        }

        // 1. Regrouper par popularité
        const uniqueByPopularity = new Map();

        for (const track of room.allTracks) {
          if (!uniqueByPopularity.has(track.popularity)) {
            uniqueByPopularity.set(track.popularity, track);
          }
        }

        // 2. Récupérer la liste des tracks uniques
        const uniques = Array.from(uniqueByPopularity.values());

        // 3. Mélanger
        const shuffled = uniques.sort(() => Math.random() - 0.5);

        // 4. Garder 10
        const newRoundTracks = shuffled.slice(0, 10);
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
