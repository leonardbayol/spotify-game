"use client"

import { useState } from "react"
import { GameCard } from "@/components/game-card"
import { PlaylistModal } from "@/components/playlist-modal"
import { Button } from "@/components/ui/button"
import { useGame } from "@/lib/game-context"
import { Swords, Trophy, Users, Music, Sparkles } from "lucide-react"

export function HomePage() {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const { playlist } = useGame()

  return (
    <div className="container flex-1 px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Testez vos connaissances musicales
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="text-primary">Spotify</span> Games
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
            Devinez quel titre est le plus populaire, classez des morceaux par popularité et affrontez vos amis dans des
            duels épiques.
          </p>

          {!playlist ? (
            <Button
              onClick={() => setShowPlaylistModal(true)}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-lg px-8"
            >
              <Music className="h-5 w-5" />
              Charger une playlist
            </Button>
          ) : (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-secondary">
              <img
                src={playlist.image || "/placeholder.svg"}
                alt={playlist.name}
                className="w-8 h-8 rounded-md object-cover"
              />
              <span className="font-medium">{playlist.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaylistModal(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Changer
              </Button>
            </div>
          )}
        </div>

        {/* Game modes */}
        <div className="grid gap-6 md:grid-cols-3">
          <GameCard
            href="/duel"
            title="Mode Duel"
            description="Deux titres s'affrontent : devine lequel est le plus populaire sur Spotify."
            icon={Swords}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            delay={0}
          />

          <GameCard
            href="/ranking"
            title="Mode Classement"
            description="Classe 10 titres du plus au moins populaire. Chaque position compte !"
            icon={Trophy}
            gradient="bg-gradient-to-br from-primary to-emerald-600"
            delay={100}
          />

          <GameCard
            href="/battle"
            title="Mode 1v1"
            description="Affrontez un ami : qui classera le mieux les titres par popularité ?"
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-purple-600"
            delay={200}
          />
        </div>

        {/* Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            La popularité d'un titre (0-100) est calculée par Spotify selon le nombre d'écoutes et leur récence.
          </p>
        </div>
      </div>

      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </div>
  )
}
