"use client"

import { cn } from "@/lib/utils"
import { Flame, Trophy } from "lucide-react"

interface ScoreDisplayProps {
  streak: number
  bestStreak: number
  className?: string
}

export function ScoreDisplay({ streak, bestStreak, className }: ScoreDisplayProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4 flex-wrap", className)}>
      <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
        <Flame className={cn("h-5 w-5 transition-colors", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
        <span className="text-sm text-muted-foreground">Streak</span>
        <span
          className={cn(
            "font-bold text-lg min-w-[2ch] text-center transition-colors",
            streak > 0 ? "text-primary" : "text-foreground",
          )}
        >
          {streak}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
        <Trophy className={cn("h-5 w-5", bestStreak > 0 ? "text-yellow-500" : "text-muted-foreground")} />
        <span className="text-sm text-muted-foreground">Record</span>
        <span className="font-bold text-lg text-primary min-w-[2ch] text-center">{bestStreak}</span>
      </div>
    </div>
  )
}
