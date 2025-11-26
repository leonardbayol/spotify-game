import { Header } from "@/components/header"
import { HomePage } from "@/components/home-page"
import { GameProvider } from "@/lib/game-context"

export default function Page() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <HomePage />
      </div>
    </GameProvider>
  )
}
