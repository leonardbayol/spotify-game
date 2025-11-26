"use client"

import type { Track } from "@/lib/spotify-types"
import { cn } from "@/lib/utils"

interface TrackCardProps {
  track: Track
  onClick?: () => void
  selected?: boolean
  revealed?: boolean
  isWinner?: boolean
  isLoser?: boolean
  showPopularity?: boolean
  size?: "default" | "small"
}

export function TrackCard({
  track,
  onClick,
  selected,
  revealed,
  isWinner,
  isLoser,
  showPopularity,
  size = "default",
}: TrackCardProps) {
  const isClickable = onClick && !revealed

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "group relative rounded-xl overflow-hidden transition-all duration-300",
        isClickable && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        selected && !revealed && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        revealed && isWinner && "ring-4 ring-primary shadow-lg shadow-primary/20",
        revealed && isLoser && "ring-4 ring-destructive opacity-80",
        size === "small" ? "bg-card" : "bg-card",
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={track.cover || "/placeholder.svg"}
          alt={`Cover de ${track.name}`}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isClickable && "group-hover:scale-105",
          )}
        />

        {/* Overlay on reveal */}
        {revealed && showPopularity && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isWinner ? "bg-primary/60" : "bg-destructive/60",
            )}
          >
            <div className="text-center">
              <p className="text-5xl font-black text-white drop-shadow-lg">{track.popularity}</p>
              <p className="text-sm font-medium text-white/90 mt-1">popularité</p>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        {isClickable && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <div className={cn("p-4", size === "small" && "p-3")}>
        <h3 className={cn("font-bold truncate text-foreground", size === "small" ? "text-sm" : "text-lg")}>
          {track.name}
        </h3>
        <p className={cn("text-primary truncate", size === "small" ? "text-xs" : "text-sm")}>{track.artist}</p>
        {track.featuring.length > 0 && (
          <p className={cn("text-muted-foreground truncate", size === "small" ? "text-xs" : "text-sm")}>
            feat. {track.featuring.join(", ")}
          </p>
        )}
        {size === "default" && <p className="text-xs text-muted-foreground mt-1">{track.releaseDate}</p>}
      </div>
    </div>
  )
}
