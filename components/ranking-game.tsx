"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { SortableTrackList } from "@/components/sortable-track-list"
import { PlaylistModal } from "@/components/playlist-modal"
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

  const isValidated = ranking.tracks.length > 0 && ranking.validated

  return (
    <>
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl flex flex-col items-center">

          {/* Header */}
          {!isValidated && (
            <h1 className="text-3xl md:text-4xl font-black text-center mb-4">
              Classe le <span className="text-primary">Top 10</span>
            </h1>
          )}

          {isValidated && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/20">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-3xl font-black">{ranking.score}/10</p>
                </div>
              </div>
            </div>
          )}

          {ranking.tracks.length > 0 ? (
            isValidated ? (
              <>
                {/* RESULTS GRID */}
                <div className="w-full flex flex-wrap justify-between gap-4 mt-2">
                  {/* Correct */}
                  <div className="w-[48%] flex flex-col items-center">
                    <h3 className="text-sm md:text-lg font-bold text-center text-primary mb-2 whitespace-nowrap">
                      Classement correct
                    </h3>
                    <div className="w-full flex flex-wrap justify-center gap-2">
                      {correctTracks.map((track, index) => (
                        <div key={track.id} className="flex flex-col items-center w-[45px] md:w-full">
                          <div className="w-10 h-10 rounded-lg overflow-hidden mb-1">
                            <img
                              src={track.cover}
                              alt={track.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center truncate w-12 md:w-full">{track.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User */}
                  <div className="w-[48%] flex flex-col items-center">
                    <h3 className="text-sm md:text-lg font-bold text-center mb-2 whitespace-nowrap">
                      Ton classement
                    </h3>
                    <div className="w-full flex flex-wrap justify-center gap-2">
                      {userTracks.map((track, index) => (
                        <div key={track.id} className="flex flex-col items-center w-[45px] md:w-full">
                          <div className="w-10 h-10 rounded-lg overflow-hidden mb-1">
                            <img
                              src={track.cover}
                              alt={track.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center truncate w-12 md:w-full">{track.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* NEW GAME BUTTON */}
                <div className="flex justify-center mt-6 w-full">
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
                {/* TRACKLIST (sortable) */}
                <div className="flex justify-center w-full">
                  <div className="w-full max-w-2xl">
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

                {/* BUTTON BELOW LIST */}
                <div className="flex justify-center mt-6 w-full">
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
