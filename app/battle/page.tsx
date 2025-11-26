import { Header } from "@/components/header"
import { BattleGame } from "@/components/battle-game"
import { GameProvider } from "@/lib/game-context"

export const metadata = {
  title: "Mode 1v1 - Spotify Games",
  description: "Affrontez un ami pour savoir qui connaît le mieux la popularité des titres",
}

export default function BattlePage() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <BattleGame />
      </div>
    </GameProvider>
  )
}
