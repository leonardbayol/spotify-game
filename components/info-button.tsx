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
          className="absolute top-4 right-4 text-white hover:text-primary transition"
        >
          <X size={26} />
        </button>

        {/* Title */}
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6">
          Qui est le plus populaire ?
        </h2>

        {/* CARDS */}
        <div className="grid grid-cols-2 gap-4">
          {creators.map((c) => (
            <button
              key={c.name}
              onClick={() => setRevealed(true)}
              className={`bg-zinc-900 rounded-xl p-3 shadow-lg transition 
                          flex flex-col items-center hover:scale-[1.02] ${
                            !revealed ? "cursor-pointer" : "cursor-default"
                          }`}
            >
              <Image
                src={c.img}
                alt={c.name}
                width={300}
                height={300}
                className="rounded-xl w-full aspect-square object-cover mb-3"
              />

              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{c.role}</p>

              {/* Popularity: hidden before click */}
              <div className="text-2xl font-black">
                {revealed ? c.popularity : "?"}
              </div>

              {/* LinkedIn only after reveal */}
              {revealed && (
                <a
                  href={c.linkedin}
                  target="_blank"
                  className="mt-3 flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0959A5]
                             text-white py-2 px-3 rounded-lg transition text-sm font-medium"
                >
                  <Image src="/linkedin.png" alt="LinkedIn" width={16} height={16} />
                  LinkedIn
                </a>
              )}
            </button>
          ))}
        </div>

        {/* Text after reveal */}
        {revealed && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Ils ont développé l'application à deux.
          </p>
        )}
      </div>
    </div>
  )
}
