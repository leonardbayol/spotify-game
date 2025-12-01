"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

interface InfoDuelPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoDuelPopup({ isOpen, onClose }: InfoDuelPopupProps) {
  const [revealed, setRevealed] = useState(false)

  if (!isOpen) return null

  const creators = [
    {
      name: "Léonard",
      role: "Product Manager",
      img: "/leonard.jpg",
      popularity: 100,
      linkedin: "https://www.linkedin.com/in/leonard-bayol/"
    },
    {
      name: "Nathan",
      role: "Data Analyst",
      img: "/nathan.jpg",
      popularity: 100,
      linkedin: "https://www.linkedin.com/in/nathan-desbrosse/"
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      {/* POPUP */}
      <div className="relative bg-black rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-white hover:text-primary transition p-2"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6">
          Qui est le plus populaire ?
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4 relative">

          {/* ÉGALITÉ badge */}
          {revealed && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <span className="bg-primary px-3 py-1 rounded-full font-bold shadow-lg">
                ÉGALITÉ
              </span>
            </div>
          )}

          {creators.map((c) => (
            <button
              key={c.name}
              onClick={() => setRevealed(true)}
              className={`
                relative rounded-xl overflow-hidden transition-all duration-300 bg-zinc-900 p-3 
                flex flex-col items-center
                ${!revealed ? "cursor-pointer hover:scale-[1.02]" : ""}
                ${revealed ? "ring-4 ring-primary shadow-lg" : ""}
              `}
            >
              <div className="relative w-full aspect-square mb-3">
                <Image
                  src={c.img}
                  alt={c.name}
                  fill
                  className="rounded-xl object-cover"
                />

                {/* Green overlay like duel mode */}
                {revealed && (
                  <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-5xl font-black text-white drop-shadow-xl">
                        100
                      </p>
                      <p className="text-xs text-white/90 mt-1">popularité</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text */}
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{c.role}</p>

              {/* Hide popularity number if not revealed */}
              {!revealed && <p className="text-2xl font-black">?</p>}

              {/* LinkedIn button */}
              {revealed && (
                <a
                  href={c.linkedin}
                  target="_blank"
                  className="mt-3 flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 
                             text-white py-2 px-3 rounded-lg transition text-sm font-medium"
                >
                  <Image src="/linkedin.png" alt="LinkedIn" width={16} height={16} />
                  LinkedIn
                </a>
              )}
            </button>
          ))}
        </div>

        {/* Reveal text */}
        {revealed && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Ils ont développé l'application à deux.
          </p>
        )}
      </div>
    </div>
  )
}
