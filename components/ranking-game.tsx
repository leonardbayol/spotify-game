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

  const correctOrder = [...ranking.tracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)

  const correctTracks = correctOrder
    .map((id) => ranking.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[]
  const userTracks = ranking.userOrder
    .map((id) => ranking.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[]

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
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-black mb-2">Classe le <span className="text-primary">Top 10</span></h1>
          </div>

          {ranking.tracks.length > 0 ? (
            <>
              {/* If validated show results */}
              {ranking.validated ? (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {/* Left: correct */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-center text-primary">Classement correct</h3>
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

                  {/* Right: user */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-center">Ton classement</h3>
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
                /* Active game - sortable list
                   layout: header top, list (scrollable internally) center, actions bottom
                   we keep the page height fixed so main page doesn't scroll
                */
                <div className="mt-4 flex flex-col items-center">
                  {/* container that will contain the sortable list and scroll internally if needed */}
                  <div
                    className="w-full max-w-2xl bg-transparent"
                    // reserve height so header + footer remain visible; adjust calc if you change paddings/heights
                    style={{ maxHeight: "calc(100vh - 220px)" }}
                  >
                    <div className="h-full overflow-auto">
                      <SortableTrackList
                        tracks={ranking.tracks}
                        order={ranking.userOrder}
                        onOrderChange={updateRankingOrder}
                        revealed={false}
                        correctOrder={correctOrder}
                        disabled={false}
                      />
                    </div>
                  </div>

                  {/* Actions - footer fixed visually under the list */}
                  <div className="w-full max-w-2xl flex justify-center mt-4">
                    <Button
                      onClick={validateRanking}
                      size="lg"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 max-w-[420px]"
                    >
                      Valider mon classement
                    </Button>
                  </div>
                </div>
              )}

              {/* If validated show also the score + new game button */}
              {ranking.validated && (
                <div className="mt-6 flex justify-center gap-4">
                  <Button onClick={startNewRanking} size="lg" variant="outline" className="gap-2 bg-transparent max-w-[420px]">
                    <RefreshCw className="h-4 w-4" />
                    Nouvelle partie
                  </Button>
                </div>
              )}
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
