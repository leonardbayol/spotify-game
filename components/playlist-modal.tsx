"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Music, Sparkles, AlertCircle } from "lucide-react"
import { useGame } from "@/lib/game-context"
import { parsePlaylistId } from "@/lib/spotify-utils"

interface PlaylistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlaylistModal({ open, onOpenChange }: PlaylistModalProps) {
  const [url, setUrl] = useState("")
  const [localError, setLocalError] = useState("")
  const { loadPlaylist, isLoading, error, playlist } = useGame()

  useEffect(() => {
    if (playlist && !isLoading && !error) {
      onOpenChange(false)
    }
  }, [playlist, isLoading, error, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError("")

    const playlistId = parsePlaylistId(url)
    if (!playlistId) {
      setLocalError("URL ou ID de playlist invalide")
      return
    }

    await loadPlaylist(playlistId)
  }

  const handleDefault = async () => {
    setLocalError("")
    // Top 50 France
    await loadPlaylist("37i9dQZF1DXcBWIGoYBM5M")
  }

  const isCredentialsError =
    error?.toLowerCase().includes("credentials") || error?.toLowerCase().includes("spotify_client")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Music className="h-5 w-5 text-primary" />
            Charger une playlist
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Entre l'URL d'une playlist Spotify pour commencer à jouer.
          </DialogDescription>
        </DialogHeader>

        {isCredentialsError && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Configuration requise</p>
              <p className="text-muted-foreground mt-1">
                Ajoute les variables d'environnement{" "}
                <code className="bg-secondary px-1 rounded">SPOTIFY_CLIENT_ID</code> et{" "}
                <code className="bg-secondary px-1 rounded">SPOTIFY_CLIENT_SECRET</code> dans l'onglet "Vars" pour
                utiliser l'API Spotify.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://open.spotify.com/playlist/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            {(localError || (error && !isCredentialsError)) && (
              <p className="text-sm text-destructive">{localError || error}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isLoading || !url}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Charger la playlist"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDefault}
              disabled={isLoading}
              className="w-full border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Top 50 Monde (démo)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
