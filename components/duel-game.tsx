"use client"

import type { Track } from "@/lib/spotify-types"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { TrackCard } from "@/components/track-card"
import { ScoreDisplay } from "@/components/score-display"
import { Button } from "@/components/ui/button"

interface DuelGameProps {
  trackA: Track
  trackB: Track
  onPick: (choice: "A" | "B") => void
  onNext: () => void
  streak: number
  bestStreak: number
}

export function DuelGame({
  trackA,
  trackB,
  onPick,
  onNext,
  streak,
  bestStreak,
}: DuelGameProps) {
  const [selected, setSelected] = useState<"A" | "B" | null>(null)
  const [revealed, setRevealed] = useState(false)

  const choose = (choice: "A" | "B") => {
    if (revealed) return
    setSelected(choice)
    setTimeout(() => {
      setRevealed(true)
      onPick(choice)
    }, 300)
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between min-h-[calc(100vh-64px)] px-4 py-4 gap-4"
      )}
    >
      {/* Top section: title + score */}
      <div className="flex flex-col gap-3 items-center">
        <h1 className="text-center text-2xl md:text-3xl font-bold">
          Qui est le plus <span className="text-primary">populaire</span> ?
        </h1>
        <ScoreDisplay streak={streak} bestStreak={bestStreak} />
      </div>

      {/* Duel cards */}
      <div className="flex-1 flex flex-col justify-center items-center relative w-full gap-4">
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-md gap-4">
          {/* Track A */}
          <div className="flex-1">
            <TrackCard
              track={trackA}
              onClick={() => choose("A")}
              selected={selected === "A"}
              revealed={revealed}
              isWinner={revealed && trackA.popularity > trackB.popularity}
              isLoser={revealed && trackA.popularity < trackB.popularity}
              showPopularity={revealed}
              size="small"
            />
          </div>

          {/* Track B */}
          <div className="flex-1">
            <TrackCard
              track={trackB}
              onClick={() => choose("B")}
              selected={selected === "B"}
              revealed={revealed}
              isWinner={revealed && trackB.popularity > trackA.popularity}
              isLoser={revealed && trackB.popularity < trackA.popularity}
              showPopularity={revealed}
              size="small"
            />
          </div>
        </div>

        {/* VS badge */}
        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="bg-secondary px-3 py-1 rounded-full text-sm font-bold shadow">
            VS
          </span>
        </div>
      </div>

      {/* Bottom section: next button */}
      <div className="w-full pb-4">
        {revealed ? (
          <Button
            className="w-full text-lg py-4"
            onClick={() => {
              setRevealed(false)
              setSelected(null)
              onNext()
            }}
          >
            Manche suivante
          </Button>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            Clique sur une carte pour jouer
          </p>
        )}
      </div>
    </div>
  )
}
