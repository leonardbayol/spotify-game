"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { TrackCard } from "@/components/track-card"
import { ScoreDisplay } from "@/components/score-display"
import { PlaylistModal } from "@/components/playlist-modal"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"

export function DuelGame() {
  const { tracks, duel, startNewDuel, selectDuel, nextDuelRound, isLoading, playlist } = useGame()
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  useEffect(() => {
    if (!playlist && !isLoading) setShowPlaylistModal(true)
  }, [playlist, isLoading])

  useEffect(() => {
    if (tracks.length > 0 && !duel.leftTrack) startNewDuel()
  }, [tracks, duel.leftTrack, startNewDuel])

  const leftWins =
    duel.revealed && duel.leftTrack && duel.rightTrack && duel.leftTrack.popularity >= duel.rightTrack.popularity
  const rightWins =
    duel.revealed && duel.leftTrack && duel.rightTrack && duel.rightTrack.popularity >= duel.leftTrack.popularity

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

  if (!duel.leftTrack || !duel.rightTrack) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-center">Chargement des morceaux...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center px-4 py-4 gap-4">
        {/* Header + Score */}
        <div className="flex flex-col gap-3 items-center">
          <h1 className="text-center text-3xl md:text-4xl font-black">
            Qui est le plus <span className="text-primary">populaire</span> ?
          </h1>
          <ScoreDisplay streak={duel.streak} bestStreak={duel.bestStreak} />
        </div>

        {/* Duel Board */}
        <div className="relative flex w-full max-w-md gap-4 justify-between items-center mt-3">
          {/* Left track */}
          <TrackCard
            track={duel.leftTrack}
            onClick={() => selectDuel("left")}
            selected={duel.selected === "left"}
            revealed={duel.revealed}
            isWinner={leftWins || false}
            isLoser={duel.revealed && !leftWins}
            showPopularity={duel.revealed}
            size="small"
            className="flex-1 flex flex-col justify-between min-h-[160px]" // même hauteur pour feat/non-feat
          />

          {/* Right track */}
          <TrackCard
            track={duel.rightTrack}
            onClick={() => selectDuel("right")}
            selected={duel.selected === "right"}
            revealed={duel.revealed}
            isWinner={rightWins || false}
            isLoser={duel.revealed && !rightWins}
            showPopularity={duel.revealed}
            size="small"
            className="flex-1 flex flex-col justify-between min-h-[160px]" // même hauteur
          />

          {/* VS badge centered vertically */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="bg-secondary px-3 py-1 rounded-full text-sm font-bold shadow">VS</span>
          </div>
        </div>

        {/* Next round button */}
        {duel.revealed && (
          <div className="w-full flex justify-center mt-2">
            <Button
              onClick={nextDuelRound}
              size="lg"
              className="max-w-md w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              Manche suivante
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </>
  )
}
