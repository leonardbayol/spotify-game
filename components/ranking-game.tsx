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
    // client-only check
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

  /* Desktop card: horizontal, reserve space for feat so all cards same height */
  const DesktopCard = ({ track, index, isCorrect }: { track: Track; index: number; isCorrect: boolean }) => {
    const bgClass = isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-xl border min-h-[72px]", bgClass)}>
        <span
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
            isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
          )}
        >
          {index + 1}
        </span>

        <img src={track.cover || "/placeholder.svg"} alt={track.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{track.name}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          {/* reserve line for feat (even if empty) so heights match */}
          <p className="text-xs text-muted-foreground truncate">{track.featuring.length > 0 ? `feat. ${track.featuring.join(", ")}` : "\u00A0"}</p>
        </div>

        <span className={cn("text-sm font-bold", isCorrect ? "text-primary" : "text-destructive")}>
          {track.popularity}
        </span>
      </div>
    )
  }

  /* Mobile tile: fixed-size rectangle, cover on top, title below left-aligned */
  const MobileTile = ({ track, isCorrect }: { track: Track; isCorrect: boolean }) => {
    const bgClass = isCorrect ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"
    const textClass = isCorrect ? "text-primary" : "text-destructive"

    return (
      <div className={cn("relative flex flex-col rounded-lg border overflow-hidden", bgClass)}>
        
        {/* Popularité en haut à droite */}
        <span
          className={cn(
            "absolute top-1 right-1 text-[10px] font-bold bg-background/80 backdrop-blur px-1 py-0.5 rounded",
            textClass
          )}
        >
          {track.popularity}
        </span>

        {/* Cover */}
        <div className="w-full flex justify-start p-2">
          <div className="w-12 h-12 rounded-md overflow-hidden">
            <img
              src={track.cover || "/placeholder.svg"}
              alt={track.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Titre */}
        <div className="px-2 pb-2">
          <p className="text-xs font-medium text-left truncate max-w-full">{track.name}</p>
        </div>
      </div>
    )
  }


  return (
    <>
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-4">
        <div className="w-full max-w-3xl">

          {/* Header: title when playing, score when validated */}
          {!ranking.validated ? (
            <h1 className="text-3xl md:text-4xl font-black text-center mb-4">
              Classe le <span className="text-primary">Top 10</span>
            </h1>
          ) : (
            <div className="flex items-center gap-3 justify-center mb-4">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div className="text-center">
                <p className="text-3xl font-black">{ranking.score}/10</p>
              </div>
            </div>
          )}

          {/* No playlist loaded */}
          {ranking.tracks.length === 0 && (
            <div className="text-center py-12">
              <Button onClick={() => setShowPlaylistModal(true)}>Charger une playlist</Button>
            </div>
          )}

          {/* Active game: sortable list centered */}
          {!ranking.validated && ranking.tracks.length > 0 && (
            <>
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

              <div className="flex justify-center mt-6">
                <Button size="lg" onClick={validateRanking} className="w-full max-w-[400px]">
                  Valider mon classement
                </Button>
              </div>
            </>
          )}

          {/* Validated: different render for mobile vs desktop */}
          {ranking.validated && ranking.tracks.length > 0 && (
            <>
              {isMobile ? (
                /* MOBILE: two columns side-by-side, each column stacks 10 tiles (same height) */
                <div className="w-full flex gap-4">
                  {/* Left: correct */}
                  <div className="w-1/2 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-primary mb-1">Classement correct</h3>
                    <div className="flex flex-col gap-2">
                      {correctTracks.map((t) => (
                        <MobileTile key={t.id} track={t} isCorrect={true} />
                      ))}
                    </div>
                  </div>

                  {/* Right: user */}
                  <div className="w-1/2 flex flex-col gap-2">
                    <h3 className="text-sm font-bold mb-1">Ton classement</h3>
                    <div className="flex flex-col gap-2">
                      {userTracks.map((t, i) => {
                        const isCorrect = correctOrder[i] === t.id
                        return <MobileTile key={t.id} track={t} isCorrect={!!isCorrect} />
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* DESKTOP: two vertical lists side-by-side, keep exact desktop style */
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-center text-primary mb-3">Classement correct</h3>
                    <div className="space-y-2">
                      {correctTracks.map((t, i) => (
                        <DesktopCard key={t.id} track={t} index={i} isCorrect={true} />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-center mb-3">Ton classement</h3>
                    <div className="space-y-2">
                      {userTracks.map((t, i) => {
                        const isCorrect = correctOrder[i] === t.id
                        return <DesktopCard key={t.id} track={t} index={i} isCorrect={!!isCorrect} />
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Rejouer button: placed after lists so it appears at bottom of content */}
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={startNewRanking} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Nouvelle partie
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
