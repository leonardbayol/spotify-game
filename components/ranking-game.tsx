"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { SortableTrackList } from "@/components/sortable-track-list"
import { PlaylistModal } from "@/components/playlist-modal"
import { PlaylistBanner } from "@/components/playlist-banner"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, RefreshCw } from "lucide-react"
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

  const correctOrder = [...ranking.tracks]
    .sort((a, b) => b.popularity - a.popularity)
    .map((t) => t.id)

  const correctTracks = correctOrder
    .map((id) => ranking.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[]

  const userTracks = ranking.userOrder
    .map((id) => ranking.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[]

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl">

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-black text-center mb-4">
            Classe le <span className="text-primary">Top 10</span>
          </h1>

          {ranking.tracks.length > 0 ? (
            ranking.validated ? (
              <>
                {/* RESULTS GRID */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {/* Correct */}
                  <div>
                    <h3 className="text-lg font-bold text-center text-primary mb-3">Classement correct</h3>
                    <div className="space-y-2">
                      {correctTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/30"
                        >
                          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>

                          <img
                            src={track.cover}
                            className="w-10 h-10 rounded-lg object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{track.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>

                          <span className="text-primary text-sm font-bold">{track.popularity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User */}
                  <div>
                    <h3 className="text-lg font-bold text-center mb-3">Ton classement</h3>
                    <div className="space-y-2">
                      {userTracks.map((track, index) => {
                        const isCorrect = correctOrder[index] === track.id

                        return (
                          <div
                            key={track.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border",
                              isCorrect
                                ? "bg-primary/10 border-primary/40"
                                : "bg-destructive/10 border-destructive/40"
                            )}
                          >
                            <span
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                isCorrect
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-destructive text-destructive-foreground"
                              )}
                            >
                              {index + 1}
                            </span>

                            <img
                              src={track.cover}
                              className="w-10 h-10 rounded-lg object-cover"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{track.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>

                            {isCorrect ? (
                              <span className="text-primary text-sm font-bold">✓</span>
                            ) : (
                              <span className="text-destructive text-xs">
                                #{correctOrder.indexOf(track.id) + 1}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* NEW GAME BUTTON */}
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={startNewRanking}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nouvelle partie
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-full max-w-2xl mx-auto">
                  <SortableTrackList
                    tracks={ranking.tracks}
                    order={ranking.userOrder}
                    onOrderChange={updateRankingOrder}
                    revealed={false}
                    correctOrder={correctOrder}
                    disabled={false}
                  />
                </div>
                {/* BUTTON BELOW LIST */}
                <div className="flex justify-center mt-6">
                  <Button
                    size="lg"
                    className="w-full max-w-[400px]"
                    onClick={validateRanking}
                  >
                    Valider mon classement
                  </Button>
                </div>
              </>
            )
          ) : (
            <div className="text-center py-12">
              <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
            </div>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}
