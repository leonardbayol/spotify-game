import { Header } from "@/components/header"
import { RankingGame } from "@/components/ranking-game"
import { GameProvider } from "@/lib/game-context"

export const metadata = {
  title: "Mode Classement - Spotify Games",
  description: "Classe 10 titres par ordre de popularité",
}

export default function RankingPage() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <RankingGame />
      </div>
    </GameProvider>
  )
}
