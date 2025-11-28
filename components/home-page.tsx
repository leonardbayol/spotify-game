"use client"

import { GameCard } from "@/components/game-card"
import { Swords, Trophy, Users } from "lucide-react"
import { InfoButton } from "@/components/info-button"  // ⬅️ On importe le bouton info

export function HomePage() {
  return (
    <div className="container flex-1 px-4 py-12 md:py-20 relative">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            Spoti<span className="text-primary">fyght</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
            Découvrez 3 modes de jeu différents basés sur la popularité* des sons Spotify
          </p>
        </div>

        {/* Game modes */}
        <div className="grid gap-6 md:grid-cols-3">
          <GameCard
            href="/duel"
            title="Mode Duel"
            description="Deux titres : devine lequel est le plus populaire sur Spotify."
            icon={Swords}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            delay={0}
          />

          <GameCard
            href="/ranking"
            title="Mode Classement"
            description="Classe 10 titres du plus au moins populaire !"
            icon={Trophy}
            gradient="bg-gradient-to-br from-primary to-emerald-600"
            delay={100}
          />

          <GameCard
            href="/battle"
            title="Mode En ligne"
            description="Affrontez vos amis : qui classera le mieux les titres par popularité ?"
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-purple-600"
            delay={200}
          />
        </div>

        {/* Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            *La popularité d'un titre (0-100) est calculée par Spotify selon le nombre d'écoutes et leur récence.
          </p>
        </div>
      </div>

      {/* Floating Info Button */}
      <InfoButton />
    </div>
  )
}
