"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-context"
import { TrackCard } from "@/components/track-card"
import { ScoreDisplay } from "@/components/score-display"
import { PlaylistModal } from "@/components/playlist-modal"
import { PlaylistBanner } from "@/components/playlist-banner"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, HelpCircle } from "lucide-react"

export function DuelGame() {
  const { tracks, duel, startNewDuel, selectDuel, nextDuelRound, isLoading, playlist } = useGame()

  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  useEffect(() => {
    if (!playlist && !isLoading) {
      setShowPlaylistModal(true)
    }
  }, [playlist, isLoading])

  useEffect(() => {
    if (tracks.length > 0 && !duel.leftTrack) {
      startNewDuel()
    }
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

  return (
    <>
      {playlist && <PlaylistBanner onChangePlaylist={() => setShowPlaylistModal(true)} />}

      <div className="container flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              Qui est le plus <span className="text-primary">populaire</span> ?
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0" />
              Clique sur le titre que tu penses être le plus écouté sur Spotify.
            </p>
          </div>

          {/* Score */}
          <ScoreDisplay streak={duel.streak} bestStreak={duel.bestStreak} className="mb-8" />

          {/* Duel Board */}
          {duel.leftTrack && duel.rightTrack ? (
            <>
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 mb-8">
                  <TrackCard
                    track={duel.leftTrack}
                    onClick={() => selectDuel("left")}
                    selected={duel.selected === "left"}
                    revealed={duel.revealed}
                    isWinner={leftWins || false}
                    isLoser={duel.revealed && !leftWins}
                    showPopularity={duel.revealed}
                  />

                  <TrackCard
                    track={duel.rightTrack}
                    onClick={() => selectDuel("right")}
                    selected={duel.selected === "right"}
                    revealed={duel.revealed}
                    isWinner={rightWins || false}
                    isLoser={duel.revealed && !rightWins}
                    showPopularity={duel.revealed}
                  />
                </div>

                {/* VS badge - centered between cards on desktop */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-14 h-14 rounded-full bg-secondary border-4 border-background flex items-center justify-center font-bold text-lg shadow-lg">
                    VS
                  </div>
                </div>
              </div>

              {/* VS mobile */}
              <div className="md:hidden flex justify-center -mt-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                  VS
                </div>
              </div>

              {/* Next round button */}
              {duel.revealed && (
                <div className="text-center">
                  <Button
                    onClick={nextDuelRound}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    Manche suivante
                    <ArrowRight className="h-4 w-4" />
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
