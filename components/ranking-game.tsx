"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { SortableTrackList } from "@/components/sortable-track-list"
import { PlaylistModal } from "@/components/playlist-modal"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Track } from "@/lib/spotify-types"

export function RankingGame() {
  const { tracks, ranking, startNewRanking, updateRankingOrder, validateRanking, isLoading, playlist } = useGame()
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!playlist && !isLoading) setShowPlaylistModal(true)
  }, [playlist, isLoading])

  useEffect(() => {
    if (tracks.length > 0 && ranking.tracks.length === 0) startNewRanking()
  }, [tracks, ranking.tracks.length, startNewRanking])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const correctOrder = [...ranking.tracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)
  const correctTracks = correctOrder.map((id) => ranking.tracks.find((t) => t.id === id)).filter(Boolean) as Track[]
  const userTracks = ranking.userOrder.map((id) => ranking.tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const renderTrackItem = (track: Track, index: number, isCorrect: boolean) => {
    const bgClass = isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"

    return (
      <div key={track.id} className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors", bgClass)}>
        <div className={cn("w-16 h-16 sm:w-10 sm:h-10")}>
          <img src={track.cover || "/placeholder.svg"} alt={track.name} className="w-full h-full object-cover rounded-lg" />
        </div>

        {isMobile ? (
          <p className="text-xs font-bold truncate max-w-[64px] text-center">{track.name}</p>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium truncate max-w-[150px] text-center">{track.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px] text-center">{track.artist}</p>
            {track.featuring.length > 0 && (
              <p className="text-xs text-muted-foreground truncate max-w-[150px] text-center">
                feat. {track.featuring.join(", ")}
              </p>
            )}
            <p className="text-sm font-bold">{track.popularity}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* HEADER */}
          {ranking.validated ? (
            <div className="flex justify-center mb-6">
              <div className={cn(
                "px-6 py-4 rounded-2xl flex items-center gap-4",
                ranking.score >= 7 ? "bg-primary/20" : ranking.score >= 4 ? "bg-yellow-500/20" : "bg-destructive/20"
              )}>
                <span className="text-4xl font-black">{ranking.score}/10</span>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl md:text-4xl font-black text-center mb-4">
              Classe le <span className="text-primary">Top 10</span>
            </h1>
          )}

          {ranking.tracks.length === 0 ? (
            <div className="text-center py-12">
              <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
            </div>
          ) : ranking.validated ? (
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              {/* Correct order */}
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-center text-primary mb-3 sm:mb-4">
                  Classement correct
                </h3>
                <div className={cn(
                  "grid gap-2",
                  isMobile ? "grid-cols-2" : "space-y-2"
                )}>
                  {correctTracks.map((track, idx) => renderTrackItem(track, idx, true))}
                </div>
              </div>

              {/* User order */}
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-center mb-3 sm:mb-4">Ton classement</h3>
                <div className={cn(
                  "grid gap-2",
                  isMobile ? "grid-cols-2" : "space-y-2"
                )}>
                  {userTracks.map((track, idx) => {
                    const isCorrect = correctOrder[idx] === track.id
                    return renderTrackItem(track, idx, isCorrect)
                  })}
                </div>
              </div>

              {/* BUTTON BELOW */}
              <div className="flex justify-center mt-6 w-full sm:w-auto">
                <Button variant="outline" onClick={startNewRanking} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Nouvelle partie
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* TRACKLIST SORTABLE */}
              <div className="w-full max-w-2xl flex justify-center">
                <SortableTrackList
                  tracks={ranking.tracks}
                  order={ranking.userOrder}
                  onOrderChange={updateRankingOrder}
                  revealed={false}
                  correctOrder={correctOrder}
                  disabled={false}
                />
              </div>

              <div className="flex justify-center mt-6 w-full max-w-[400px]">
                <Button size="lg" onClick={validateRanking} className="w-full">
                  Valider mon classement
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}
