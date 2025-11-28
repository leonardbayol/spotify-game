"use client"

import { useState } from "react"
import { TrackCard } from "@/components/track-card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface InfoDuelPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoDuelPopup({ isOpen, onClose }: InfoDuelPopupProps) {
  const [selected, setSelected] = useState<"leonard" | "nathan" | null>(null)
  const [revealed, setRevealed] = useState(false)

  // Définition des tracks "Nathan vs Léonard"
  const leonard = {
    id: "leonard",
    name: "Léonard",
    artist: "Product Manager",
    featuring: [],
    popularity: 100,
    cover: "/leonard.jpg",
    releaseDate: "2003-09-13",
  }

  const nathan = {
    id: "nathan",
    name: "Nathan",
    artist: "Data Analyst",
    featuring: [],
    popularity: 100,
    cover: "/nathan.jpg",
    releaseDate: "2003-04-24",
  }

  const handleSelect = (who: "leonard" | "nathan") => {
    if (!revealed) {
      setSelected(who)
      setRevealed(true)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Pop-up */}
      <div className="relative z-10 bg-black text-white rounded-xl shadow-xl max-w-3xl w-full p-6 md:p-10 flex flex-col gap-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:text-primary"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black text-center">
          Qui est le plus populaire ?
        </h2>

        {/* Duel cards */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <div className="flex-1">
            <TrackCard
              track={leonard}
              onClick={() => handleSelect("leonard")}
              selected={selected === "leonard"}
              revealed={revealed}
              isWinner={true}
              isLoser={false}
              showPopularity={revealed}
              size="small"
              className="flex-1"
            />
            <div className="flex justify-center mt-2">
            <a
                href="https://www.linkedin.com/in/leonard-bayol"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white gap-1"
            >
                LinkedIn
            </a>
            </div>
          </div>

          <div className="flex-1">
            <TrackCard
              track={nathan}
              onClick={() => handleSelect("nathan")}
              selected={selected === "nathan"}
              revealed={revealed}
              isWinner={true}
              isLoser={false}
              showPopularity={revealed}
              size="small"
              className="flex-1"
            />
            <div className="flex justify-center mt-2">
            <a
                href="https://www.linkedin.com/in/ndesbrosse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white gap-1"
            >
                LinkedIn
            </a>
            </div>
          </div>
        </div>

        {/* Score / message égalité */}
        {revealed && (
          <div className="text-center mt-4">
            <p className="text-xl font-bold">Égalité : 100 vs 100</p>
            <p className="text-sm mt-2">
              Ils ont développé l'application à deux !
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
