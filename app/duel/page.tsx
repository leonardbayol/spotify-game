import { Header } from "@/components/header"
import { DuelGame } from "@/components/duel-game"
import { GameProvider } from "@/lib/game-context"

export const metadata = {
  title: "Mode Duel - Spotify Games",
  description: "Devine quel titre est le plus populaire entre deux morceaux",
}

export default function DuelPage() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <DuelGame />
      </div>
    </GameProvider>
  )
}
