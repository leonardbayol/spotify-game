"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { SortableTrackList } from "@/components/sortable-track-list"
import { PlaylistModal } from "@/components/playlist-modal"
import { PlaylistBanner } from "@/components/playlist-banner"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, RefreshCw, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Track } from "@/lib/spotify-types"

export function RankingGame() {
  const { tracks, ranking, startNewRanking, updateRankingOrder, validateRanking, isLoading, playlist } = useGame()

  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  useEffect(() => {
    if (!playlist && !isLoading) {
      setShowPlaylistModal(true)
    }
  }, [playlist, isLoading])

  useEffect(() => {
    if (tracks.length > 0 && ranking.tracks.length === 0) {
      startNewRanking()
    }
  }, [tracks, ranking.tracks.length, startNewRanking])

  const correctOrder = [...ranking.tracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)

  const correctTracks = correctOrder.map((id) => ranking.tracks.find((t) => t.id === id)).filter(Boolean) as Track[]
  const userTracks = ranking.userOrder.map((id) => ranking.tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la playlist...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {playlist && <PlaylistBanner onChangePlaylist={() => setShowPlaylistModal(true)} />}

      <div className="container flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              Classe le <span className="text-primary">Top 10</span>
            </h1>
            {!ranking.validated && (
              <p className="text-muted-foreground max-w-md mx-auto flex items-center justify-center gap-2">
                Glisse les titres pour les classer du plus au moins populaire.
              </p>
            )}
          </div>

          {ranking.tracks.length > 0 ? (
            <>
              {ranking.validated && (
                <div className="mb-8 text-center">
                  <div
                    className={cn(
                      "inline-flex items-center gap-3 px-6 py-4 rounded-2xl",
                      ranking.score >= 7
                        ? "bg-primary/20"
                        : ranking.score >= 4
                          ? "bg-yellow-500/20"
                          : "bg-destructive/20",
                    )}
                  >
                    <Trophy
                      className={cn(
                        "h-8 w-8",
                        ranking.score >= 7
                          ? "text-primary"
                          : ranking.score >= 4
                            ? "text-yellow-500"
                            : "text-destructive",
                      )}
                    />
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className="text-3xl font-black">{ranking.score}/10</p>
                    </div>
                  </div>
                </div>
              )}

              {ranking.validated ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Correct order */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-center text-primary">Classement correct</h3>
                    <div className="space-y-2">
                      {correctTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/30"
                        >
                          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                            {index + 1}
                          </span>
                          <img
                            src={track.cover || "/placeholder.svg"}
                            alt={track.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{track.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <span className="text-sm font-bold text-primary">{track.popularity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User order */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-center">Ton classement</h3>
                    <div className="space-y-2">
                      {userTracks.map((track, index) => {
                        const isCorrect = correctOrder[index] === track.id
                        return (
                          <div
                            key={track.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border",
                              isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40",
                            )}
                          >
                            <span
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                isCorrect
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-destructive text-destructive-foreground",
                              )}
                            >
                              {index + 1}
                            </span>
                            <img
                              src={track.cover || "/placeholder.svg"}
                              alt={track.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{track.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                            {isCorrect ? (
                              <span className="text-primary text-sm font-bold">✓</span>
                            ) : (
                              <span className="text-destructive text-xs">#{correctOrder.indexOf(track.id) + 1}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active game - sortable list */
                <div className="max-w-2xl mx-auto">
                  <SortableTrackList
                    tracks={ranking.tracks}
                    order={ranking.userOrder}
                    onOrderChange={updateRankingOrder}
                    revealed={false}
                    correctOrder={correctOrder}
                    disabled={false}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-center gap-4">
                {!ranking.validated ? (
                  <Button
                    onClick={validateRanking}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Valider mon classement
                  </Button>
                ) : (
                  <Button onClick={startNewRanking} size="lg" variant="outline" className="gap-2 bg-transparent">
                    <RefreshCw className="h-4 w-4" />
                    Nouvelle partie
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Charge une playlist pour commencer à jouer !</p>
              <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
            </div>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}
