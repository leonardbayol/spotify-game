"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useGame } from "@/lib/game-context"
import { PlaylistModal } from "@/components/playlist-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SortableTrackList } from "@/components/sortable-track-list"
import {
  Loader2,
  Trophy,
  RefreshCw,
  Users,
  Crown,
  Copy,
  Check,
  Clock,
  Play,
  LogIn,
  GripVertical,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Track } from "@/lib/spotify-types"

interface RoomPlayer {
  id: string
  name: string
  order: string[]
  score: number
  validated: boolean
  joinedAt: number
}

interface Room {
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
  const [hostTransferred, setHostTransferred] = useState(false)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (room?.id && playerId) {
        // Use sendBeacon for reliable delivery on page close
        const data = JSON.stringify({ action: "leave", playerId })
        navigator.sendBeacon(`/api/rooms/${room.id}`, data)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [room?.id, playerId])

  // Polling for room updates
  const pollRoom = useCallback(
    async (code: string) => {
      try {
        const res = await fetch(`/api/rooms/${code}`)
        if (res.ok) {
          const data = await res.json()
          setRoom(data.room)

          if (data.room.hostId === playerId && !hostTransferred) {
            const wasHost = room?.hostId === playerId
            if (!wasHost && room?.hostId !== data.room.hostId) {
              setHostTransferred(true)
            }
          }

          if (data.room.status === "waiting") {
            setPhase("lobby")
            setLocalOrder([])
            setTimeLeft(60)
          } else if (data.room.status === "playing") {
            setPhase("playing")
          } else if (data.room.status === "results") {
            setPhase("results")
          }
        } else if (res.status === 404) {
          // Room was deleted
          setError("Le salon a été fermé")
          setPhase("menu")
          setRoom(null)
          setPlayerId(null)
        }
      } catch (e) {
        console.error("Polling error:", e)
      }
    },
    [playerId, room?.hostId, hostTransferred],
  )

  useEffect(() => {
    if ((phase === "lobby" || phase === "playing" || phase === "results") && room?.id) {
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
          fetch(`/api/rooms/${room.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "force_end", playerId }),
          })
        }
      }

      updateTimer()
      timerIntervalRef.current = setInterval(updateTimer, 1000)

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }
    }
  }, [phase, room?.endsAt, room?.id, playerId])

  // Initialize local order when game starts
  useEffect(() => {
    if (phase === "playing" && room && playerId) {
      const player = room.players.find((p) => p.id === playerId)
      if (player && localOrder.length === 0) {
        setLocalOrder(room.tracks.map((t) => t.id))
      }
    }
  }, [phase, room, playerId, localOrder.length])

  const leaveRoom = async () => {
    if (!room || !playerId) return

    try {
      await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", playerId }),
      })
    } catch (e) {
      console.error("Leave error:", e)
    }

    // Reset state
    setRoom(null)
    setPlayerId(null)
    setRoomCode("")
    setPhase("menu")
    setHostTransferred(false)
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
  }

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
    navigator.clipboard.writeText(roomCode || room?.id || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentPlayer = room?.players.find((p) => p.id === playerId)
  const isHost = playerId === room?.hostId
  const isValidated = currentPlayer?.validated

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Menu */}
          {phase === "menu" && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Mode en ligne
                </h2>
                <p className="text-muted-foreground">Créez un salon et affrontez vos amis en temps réel !</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setPhase("creating")}
                  size="lg"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Créer un salon
                </Button>
                <Button
                  onClick={() => setPhase("joining")}
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent"
                >
                  <LogIn className="w-4 h-4" />
                  Rejoindre
                </Button>
              </div>
            </div>
          )}

          {/* Creating room */}
          {phase === "creating" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Créer un salon</h2>

              {!playlist ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">Chargez d'abord une playlist pour créer un salon</p>
                  <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <img
                      src={playlist.image || "/placeholder.svg"}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
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

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPhase("menu")} className="bg-transparent">
                      Retour
                    </Button>
                    <Button onClick={createRoom} disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le salon"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Joining room */}
          {phase === "joining" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Rejoindre un salon</h2>

              <div className="space-y-3">
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

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPhase("menu")} className="bg-transparent">
                    Retour
                  </Button>
                  <Button onClick={joinRoom} disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rejoindre"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lobby */}
          {phase === "lobby" && room && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Salon de jeu</h2>

              {hostTransferred && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/40 text-center">
                  <p className="text-sm font-medium text-primary">Vous êtes maintenant l'hôte du salon !</p>
                </div>
              )}

              {/* Room code */}
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Code du salon</p>
                <button onClick={copyCode} className="flex items-center justify-center gap-2 mx-auto">
                  <span className="text-3xl font-mono font-bold tracking-widest">{room.id}</span>
                  {copied ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>

              {/* Playlist info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <img
                  src={room.playlistImage || "/placeholder.svg"}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{room.playlistName}</p>
                  <p className="text-sm text-muted-foreground">10 titres à classer</p>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Joueurs ({room.players.length})</p>
                <div className="space-y-2">
                  {room.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <span className="font-medium">{player.name}</span>
                      {player.id === room.hostId && <Crown className="w-4 h-4 text-yellow-500" />}
                      {player.id === playerId && <span className="text-xs text-muted-foreground">(vous)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start button (host only) or leave button */}
              <div className="space-y-2">
                {isHost ? (
                  <Button onClick={startGame} disabled={room.players.length < 2} className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    {room.players.length < 2 ? "En attente de joueurs..." : "Lancer la partie"}
                  </Button>
                ) : (
                  <div className="text-center p-4 rounded-xl bg-secondary/30">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">En attente du lancement par l'hôte...</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={leaveRoom}
                  className="w-full gap-2 text-destructive hover:text-destructive bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  Quitter le salon
                </Button>
              </div>
            </div>
          )}

          {/* Playing */}
          {phase === "playing" && room && (
            <>
              {/* Timer */}
              <div className="text-center mb-4">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                    timeLeft <= 10 ? "bg-destructive/20 text-destructive" : "bg-secondary",
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              {isValidated ? (
                <div className="text-center space-y-4">
                  <div className="p-6 rounded-2xl bg-primary/10 border border-primary/40">
                    <Check className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="font-medium">Classement validé !</p>
                    <p className="text-sm text-muted-foreground">En attente des autres joueurs...</p>
                  </div>
                  <div className="space-y-1">
                    {room.players.map((p) => (
                      <div key={p.id} className="text-sm">
                        {p.name} {p.validated ? "✓" : "..."}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold">Classez du plus au moins populaire</h2>
                  </div>

                  {/* Sortable list */}
                  <SortableTrackList
                    tracks={room.tracks}
                    order={localOrder}
                    onOrderChange={updateOrder}
                    revealed={false}          // pas de couleurs correct/incorrect pendant la partie
                    correctOrder={[]}         // ignoré tant que revealed=false
                    disabled={false}
                  />
                  <div className="pt-4">
                    <Button onClick={validateRanking} disabled={isSubmitting} className="w-full">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider mon classement"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Results */}
          {phase === "results" && room && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center">Résultats</h2>

              {/* Winner */}
              {(() => {
                const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
                const winner = sortedPlayers[0]
                const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score

                return (
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-yellow-500/20 to-transparent">
                    {isTie ? (
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <span className="text-2xl font-bold">Égalité !</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <span className="text-2xl font-bold">{winner.name} gagne !</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Player scores sorted */}
              <div className="space-y-4">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.id} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 ? "bg-yellow-500 text-yellow-950" : "bg-secondary",
                          )}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium flex-1">{player.name}</span>
                        <span className="font-bold text-primary">{player.score}/10</span>
                      </div>

                      {/* Player's ranking */}
                      <div className="flex gap-1 overflow-x-auto pb-1 px-1">
                        {player.order.map((trackId, i) => {
                          const track = room.tracks.find((t) => t.id === trackId)
                          const isCorrect = room.correctOrder[i] === trackId
                          return (
                            <div
                              key={trackId}
                              className={cn(
                                "w-8 h-8 rounded-lg flex-shrink-0 border-2 overflow-hidden",
                                isCorrect ? "border-primary" : "border-destructive/50",
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
              <div className="space-y-2">
                <p className="font-medium text-center">Classement correct</p>
                <div className="space-y-2">
                  {room.correctOrder.map((trackId, index) => {
                    const track = room.tracks.find((t) => t.id === trackId)
                    if (!track) return null
                    return (
                      <div key={trackId} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30">
                        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <img
                          src={track.cover || "/placeholder.svg"}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{track.popularity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Restart (host only) or leave */}
              <div className="space-y-2">
                {isHost && (
                  <Button onClick={restartGame} className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Nouvelle manche
                  </Button>
                )}
                <Button variant="outline" onClick={leaveRoom} className="w-full gap-2 bg-transparent">
                  <LogOut className="w-4 h-4" />
                  Quitter le salon
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}

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
  const [dropZoneIndex, setDropZoneIndex] = useState<number | null>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  const handleDragStart = (e: React.DragEvent, trackId: string, index: number) => {
    setDraggedId(trackId)
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndexRef.current === null) return

    if (index !== draggedIndexRef.current && index !== draggedIndexRef.current + 1) {
      setDropZoneIndex(index)
    } else {
      setDropZoneIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedId || draggedIndexRef.current === null) return

    const draggedIndex = draggedIndexRef.current

    if (targetIndex === draggedIndex || targetIndex === draggedIndex + 1) {
      setDraggedId(null)
      setDropZoneIndex(null)
      draggedIndexRef.current = null
      return
    }

    const newOrder = [...order]
    newOrder.splice(draggedIndex, 1)
    const newInsertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
    newOrder.splice(newInsertIndex, 0, draggedId)

    onOrderChange(newOrder)
    setDraggedId(null)
    setDropZoneIndex(null)
    draggedIndexRef.current = null
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDropZoneIndex(null)
    draggedIndexRef.current = null
  }

  const handleContainerDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropZoneIndex(null)
    }
  }

  const DropZone = ({ index, isActive }: { index: number; isActive: boolean }) => (
    <div
      onDragOver={(e) => handleDropZoneDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      className={cn("relative h-3 -my-1.5 z-10 transition-all duration-150", draggedId && "h-4 -my-2")}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-150",
          isActive
            ? "bg-primary h-2 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            : draggedId
              ? "bg-border/50 hover:bg-primary/50"
              : "bg-transparent",
        )}
      />
      {isActive && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg" />
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-0" onDragLeave={handleContainerDragLeave}>
      {orderedTracks.map((track, index) => (
        <div key={track.id}>
          <DropZone index={index} isActive={dropZoneIndex === index} />

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, track.id, index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
              "cursor-grab active:cursor-grabbing hover:bg-secondary/50 transition-all",
              draggedId === track.id && "opacity-40 scale-[0.98]",
            )}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
            <img
              src={track.cover || "/placeholder.svg"}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.name}</p>
              <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
            </div>
          </div>

          {index === orderedTracks.length - 1 && (
            <DropZone index={orderedTracks.length} isActive={dropZoneIndex === orderedTracks.length} />
          )}
        </div>
      ))}
    </div>
  )
}
