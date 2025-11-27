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

  const renderMobileTrack = (track: Track, isCorrect: boolean) => (
    <div
      key={track.id}
      className={cn(
        "flex flex-col items-center gap-1 p-1 rounded-xl border",
        isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"
      )}
    >
      <div className="w-16 h-16">
        <img src={track.cover || "/placeholder.svg"} alt={track.name} className="w-full h-full object-cover rounded-lg" />
      </div>
      <p className="text-xs font-bold truncate max-w-[64px] text-center">{track.name}</p>
    </div>
  )

  const renderDesktopTrack = (track: Track, index: number, isCorrect: boolean) => {
    const bgClass = isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"
    return (
      <div key={track.id} className={cn("flex items-center gap-3 p-3 rounded-xl border", bgClass)}>
        <span className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
          isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
        )}>{index + 1}</span>
        <img src={track.cover || "/placeholder.svg"} className="w-10 h-10 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{track.name}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          {track.featuring.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">feat. {track.featuring.join(", ")}</p>
          )}
        </div>
        <span className="text-sm font-bold text-primary">{track.popularity}</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl flex flex-col items-center">

          {/* HEADER */}
          {ranking.validated ? (
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <p className="text-xl font-black">{ranking.score}/10</p>
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
            // VALIDATED RESULTS
            <>
              {isMobile ? (
                // MOBILE: horizontal 2 lignes de 5 tracks
                <div className="w-full flex flex-col gap-4 items-center">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-center text-primary mb-2">Classement correct</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {correctTracks.map((track, idx) => renderMobileTrack(track, true))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-center mb-2">Ton classement</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {userTracks.map((track, idx) => {
                        const isCorrect = correctOrder[idx] === track.id
                        return renderMobileTrack(track, isCorrect)
                      })}
                    </div>
                  </div>

                  {/* BUTTON BELOW */}
                  <div className="flex justify-center mt-4 w-full">
                    <Button variant="outline" onClick={startNewRanking} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Nouvelle partie
                    </Button>
                  </div>
                </div>
              ) : (
                // DESKTOP: vertical columns side-by-side
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-center text-primary mb-3">Classement correct</h3>
                    <div className="space-y-2">
                      {correctTracks.map((track, idx) => renderDesktopTrack(track, idx, true))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-center mb-3">Ton classement</h3>
                    <div className="space-y-2">
                      {userTracks.map((track, idx) => {
                        const isCorrect = correctOrder[idx] === track.id
                        return renderDesktopTrack(track, idx, isCorrect)
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // ACTIVE GAME
            <>
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

          {/* DESKTOP BUTTON AT BOTTOM */}
          {!isMobile && ranking.validated && (
            <div className="flex justify-center mt-6 w-full">
              <Button variant="outline" onClick={startNewRanking} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Nouvelle partie
              </Button>
            </div>
          )}
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}
