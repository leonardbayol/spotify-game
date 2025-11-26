"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useGame } from "@/lib/game-context"
import { PlaylistModal } from "@/components/playlist-modal"
import { PlaylistBanner } from "@/components/playlist-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trophy, RefreshCw, Users, Crown, Copy, Check, Clock, Play, LogIn, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Track } from "@/lib/spotify-types"

interface RoomPlayer {
  id: string
  name: string
  order: string[]
  score: number
  validated: boolean
}

interface Room {
  id: string
  hostId: string
  playlistId: string
  playlistName: string
  playlistImage: string
  tracks: Track[]
  players: RoomPlayer[]
  status: "waiting" | "playing" | "results"
  startedAt: number | null
  endsAt: number | null
  correctOrder: string[]
}

type GamePhase = "menu" | "creating" | "joining" | "lobby" | "playing" | "results"

export function BattleGame() {
  const { tracks, playlist, isLoading } = useGame()

  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [phase, setPhase] = useState<GamePhase>("menu")
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [localOrder, setLocalOrder] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Polling for room updates
  const pollRoom = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/rooms/${code}`)
      if (res.ok) {
        const data = await res.json()
        setRoom(data.room)

        // Update phase based on room status
        if (data.room.status === "playing") {
          setPhase("playing")
        } else if (data.room.status === "results") {
          setPhase("results")
        }
      }
    } catch (e) {
      console.error("Polling error:", e)
    }
  }, [])

  // Start polling when in lobby or playing
  useEffect(() => {
    if ((phase === "lobby" || phase === "playing") && room?.id) {
      pollIntervalRef.current = setInterval(() => pollRoom(room.id), 1500)
      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      }
    }
  }, [phase, room?.id, pollRoom])

  // Timer countdown
  useEffect(() => {
    if (phase === "playing" && room?.endsAt) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000))
        setTimeLeft(remaining)

        if (remaining <= 0) {
          // Time's up - force end if we're the host
          if (playerId === room.hostId) {
            fetch(`/api/rooms/${room.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "force_end", playerId }),
            })
          }
        }
      }

      updateTimer()
      timerIntervalRef.current = setInterval(updateTimer, 1000)

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }
    }
  }, [phase, room?.endsAt, room?.id, room?.hostId, playerId])

  // Initialize local order when game starts
  useEffect(() => {
    if (phase === "playing" && room && playerId) {
      const player = room.players.find((p) => p.id === playerId)
      if (player && localOrder.length === 0) {
        setLocalOrder(player.order)
      }
    }
  }, [phase, room, playerId, localOrder.length])

  const createRoom = async () => {
    if (!playerName.trim() || !playlist || tracks.length < 10) {
      setError("Entrez votre nom et chargez une playlist avec au moins 10 titres")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: playerName,
          playlistId: playlist.id,
          playlistName: playlist.name,
          playlistImage: playlist.image,
          tracks,
        }),
      })

      if (!res.ok) {
        throw new Error("Impossible de créer le salon")
      }

      const data = await res.json()
      setRoom(data.room)
      setPlayerId(data.hostId)
      setRoomCode(data.roomCode)
      setPhase("lobby")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création")
    } finally {
      setIsSubmitting(false)
    }
  }

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError("Entrez votre nom et le code du salon")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/rooms/${roomCode.toUpperCase()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          playerName,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Impossible de rejoindre")
      }

      const data = await res.json()
      setRoom(data.room)
      setPlayerId(data.playerId)
      setPhase("lobby")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la connexion")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startGame = async () => {
    if (!room || !playerId) return

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", playerId }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoom(data.room)
        setLocalOrder(data.room.tracks.map((t: Track) => t.id))
        setPhase("playing")
      }
    } catch (e) {
      console.error("Start error:", e)
    }
  }

  const updateOrder = async (newOrder: string[]) => {
    setLocalOrder(newOrder)

    if (!room || !playerId) return

    try {
      await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_order", playerId, order: newOrder }),
      })
    } catch (e) {
      console.error("Update error:", e)
    }
  }

  const validateRanking = async () => {
    if (!room || !playerId) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", playerId }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoom(data.room)
        if (data.room.status === "results") {
          setPhase("results")
        }
      }
    } catch (e) {
      console.error("Validate error:", e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const restartGame = async () => {
    if (!room || !playerId) return

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart", playerId }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoom(data.room)
        setLocalOrder([])
        setTimeLeft(60)
        setPhase("lobby")
      }
    } catch (e) {
      console.error("Restart error:", e)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentPlayer = room?.players.find((p) => p.id === playerId)
  const isHost = playerId === room?.hostId
  const isValidated = currentPlayer?.validated

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {playlist && phase === "creating" && <PlaylistBanner onChangePlaylist={() => setShowPlaylistModal(true)} />}

      <div className="container flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Menu */}
          {phase === "menu" && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black mb-2">
                  Mode <span className="text-primary">1v1 en ligne</span>
                </h1>
                <p className="text-muted-foreground">Créez un salon et affrontez vos amis en temps réel !</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button
                  onClick={() => setPhase("creating")}
                  size="lg"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Play className="h-5 w-5" />
                  Créer un salon
                </Button>
                <Button
                  onClick={() => setPhase("joining")}
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent"
                >
                  <LogIn className="h-5 w-5" />
                  Rejoindre
                </Button>
              </div>
            </div>
          )}

          {/* Creating room */}
          {phase === "creating" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">Créer un salon</h2>

              {!playlist ? (
                <div>
                  <p className="text-muted-foreground mb-4">Chargez d'abord une playlist pour créer un salon</p>
                  <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
                </div>
              ) : (
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 flex items-center gap-3">
                    <img
                      src={playlist.image || "/placeholder.svg"}
                      alt={playlist.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium truncate">{playlist.name}</p>
                      <p className="text-sm text-muted-foreground">{tracks.length} titres</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowPlaylistModal(true)}>
                      Changer
                    </Button>
                  </div>

                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Votre pseudo"
                    className="bg-secondary border-border"
                  />

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPhase("menu")} className="bg-transparent">
                      Retour
                    </Button>
                    <Button
                      onClick={createRoom}
                      disabled={isSubmitting || tracks.length < 10}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer le salon"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Joining room */}
          {phase === "joining" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">Rejoindre un salon</h2>

              <div className="max-w-sm mx-auto space-y-4">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Votre pseudo"
                  className="bg-secondary border-border"
                />

                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Code du salon (ex: ABC123)"
                  className="bg-secondary border-border text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPhase("menu")} className="bg-transparent">
                    Retour
                  </Button>
                  <Button
                    onClick={joinRoom}
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejoindre"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lobby */}
          {phase === "lobby" && room && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Salon de jeu</h2>

              {/* Room code */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Code du salon</p>
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <span className="font-mono text-2xl font-bold tracking-widest">{room.id}</span>
                  {copied ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Playlist info */}
              <div className="p-4 rounded-xl bg-secondary/50 flex items-center gap-3 mb-6 max-w-sm mx-auto">
                <img
                  src={room.playlistImage || "/placeholder.svg"}
                  alt={room.playlistName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium truncate">{room.playlistName}</p>
                  <p className="text-sm text-muted-foreground">10 titres à classer</p>
                </div>
              </div>

              {/* Players */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Joueurs ({room.players.length})</p>
                <div className="space-y-2 max-w-sm mx-auto">
                  {room.players.map((player) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                        player.id === playerId ? "bg-primary/20 border border-primary/40" : "bg-secondary",
                      )}
                    >
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium flex-1 text-left">{player.name}</span>
                      {player.id === room.hostId && <Crown className="h-4 w-4 text-yellow-500" />}
                      {player.id === playerId && <span className="text-xs text-primary">(vous)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start button (host only) */}
              {isHost ? (
                <Button
                  onClick={startGame}
                  size="lg"
                  disabled={room.players.length < 2}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Play className="h-5 w-5" />
                  {room.players.length < 2 ? "En attente de joueurs..." : "Lancer la partie"}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>En attente du lancement par l'hôte...</span>
                </div>
              )}
            </div>
          )}

          {/* Playing */}
          {phase === "playing" && room && (
            <>
              {/* Timer */}
              <div className="text-center mb-6">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                    timeLeft <= 10 ? "bg-destructive/20 text-destructive" : "bg-secondary",
                  )}
                >
                  <Clock className={cn("h-5 w-5", timeLeft <= 10 && "animate-pulse")} />
                  <span className="font-mono text-2xl font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              {isValidated ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Classement validé !</h2>
                  <p className="text-muted-foreground mb-4">En attente des autres joueurs...</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {room.players.map((p) => (
                      <span
                        key={p.id}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm",
                          p.validated ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {p.name} {p.validated ? "✓" : "..."}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      Classez du plus au moins populaire
                    </p>
                  </div>

                  {/* Sortable list */}
                  <SortableList tracks={room.tracks} order={localOrder} onOrderChange={updateOrder} />

                  <div className="mt-6 text-center">
                    <Button
                      onClick={validateRanking}
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider mon classement"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Results */}
          {phase === "results" && room && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6">Résultats</h2>

              {/* Winner */}
              {(() => {
                const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
                const winner = sortedPlayers[0]
                const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score

                return (
                  <div className="text-center mb-8">
                    {isTie ? (
                      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="text-xl font-bold">Égalité !</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/20">
                        <Crown className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">{winner.name} gagne !</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Player scores sorted */}
              <div className="space-y-3 mb-8">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={cn(
                        "p-4 rounded-xl border",
                        index === 0 ? "bg-primary/10 border-primary/40" : "bg-card border-border",
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary",
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="font-bold flex-1">{player.name}</span>
                        <span className="text-xl font-black">{player.score}/10</span>
                      </div>

                      {/* Player's ranking */}
                      <div className="grid grid-cols-5 gap-1">
                        {player.order.map((trackId, i) => {
                          const track = room.tracks.find((t) => t.id === trackId)
                          const isCorrect = room.correctOrder[i] === trackId
                          return (
                            <div
                              key={trackId}
                              className={cn(
                                "aspect-square rounded-md overflow-hidden border-2",
                                isCorrect ? "border-primary" : "border-destructive",
                              )}
                              title={track?.name}
                            >
                              <img
                                src={track?.cover || "/placeholder.svg"}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Correct ranking */}
              <div className="p-4 rounded-xl bg-card border border-border mb-6">
                <h3 className="font-bold mb-3 text-primary">Classement correct</h3>
                <div className="space-y-2">
                  {room.correctOrder.map((trackId, index) => {
                    const track = room.tracks.find((t) => t.id === trackId)
                    if (!track) return null
                    return (
                      <div key={trackId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </span>
                        <img
                          src={track.cover || "/placeholder.svg"}
                          alt={track.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <span className="font-bold text-primary">{track.popularity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Restart (host only) */}
              {isHost && (
                <div className="text-center">
                  <Button
                    onClick={restartGame}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nouvelle manche
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}

// Simple inline sortable list for the game
function SortableList({
  tracks,
  order,
  onOrderChange,
}: {
  tracks: Track[]
  order: string[]
  onOrderChange: (order: string[]) => void
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  const handleDragStart = (e: React.DragEvent, trackId: string, index: number) => {
    setDraggedId(trackId)
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndexRef.current === null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const insertAt = e.clientY < midY ? index : index + 1

    if (insertAt !== draggedIndexRef.current && insertAt !== draggedIndexRef.current + 1) {
      setInsertIndex(insertAt)
    } else {
      setInsertIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedId || insertIndex === null || draggedIndexRef.current === null) return

    const newOrder = [...order]
    const draggedIndex = draggedIndexRef.current

    newOrder.splice(draggedIndex, 1)
    const newInsertIndex = insertIndex > draggedIndex ? insertIndex - 1 : insertIndex
    newOrder.splice(newInsertIndex, 0, draggedId)

    onOrderChange(newOrder)
    setDraggedId(null)
    setInsertIndex(null)
    draggedIndexRef.current = null
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setInsertIndex(null)
    draggedIndexRef.current = null
  }

  return (
    <div className="space-y-2" onDrop={handleDrop}>
      {orderedTracks.map((track, index) => (
        <div key={track.id}>
          {insertIndex === index && <div className="h-1 bg-primary rounded-full mb-2 mx-4 animate-pulse" />}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, track.id, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
              "cursor-grab active:cursor-grabbing hover:bg-secondary/50 transition-all",
              draggedId === track.id && "opacity-40 scale-[0.98]",
            )}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {index + 1}
            </span>
            <img
              src={track.cover || "/placeholder.svg"}
              alt={track.name}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.name}</p>
              <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
            </div>
          </div>
          {index === orderedTracks.length - 1 && insertIndex === orderedTracks.length && (
            <div className="h-1 bg-primary rounded-full mt-2 mx-4 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  )
}
