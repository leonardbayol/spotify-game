"use client"

import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, Music } from "lucide-react"

interface PlaylistBannerProps {
  onChangePlaylist: () => void
}

export function PlaylistBanner({ onChangePlaylist }: PlaylistBannerProps) {
  const { playlist } = useGame()

  if (!playlist) return null

  return (
    <div className="bg-secondary/50 border-b border-border/40">
      <div className="container flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          {playlist.image ? (
            <img
              src={playlist.image || "/placeholder.svg"}
              alt={playlist.name}
              className="w-10 h-10 rounded-md object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{playlist.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {playlist.owner} • {playlist.totalTracks} titres
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onChangePlaylist}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Changer</span>
        </Button>
      </div>
    </div>
  )
}
