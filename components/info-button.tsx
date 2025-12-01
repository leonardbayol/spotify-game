"use client"

import Image from "next/image"
import { X } from "lucide-react"

interface InfoDuelPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoDuelPopup({ isOpen, onClose }: InfoDuelPopupProps) {
  if (!isOpen) return null

  const creators = [
    {
      name: "Léonard Bayol",
      role: "Product Manager",
      img: "/leonard.jpg",
      popularity: 100,
      linkedin: "https://www.linkedin.com/in/leonard-bayol/"
    },
    {
      name: "Nathan Desbrosse",
      role: "Data Analyst",
      img: "/nathan.jpg",
      popularity: 100,
      linkedin: "https://www.linkedin.com/in/ndesbrosse/"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creators.map((c) => (
            <div
              key={c.name}
              className="bg-zinc-900 rounded-xl p-4 flex flex-col items-center shadow-lg"
            >
              <Image
                src={c.img}
                alt={c.name}
                width={200}
                height={200}
                className="rounded-xl w-40 h-40 object-cover mb-4"
              />

              <h3 className="text-xl font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{c.role}</p>

              <div className="text-3xl font-black">100</div>

              {/* LinkedIn Button */}
              <a
                href={c.linkedin}
                target="_blank"
                className="mt-4 flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0959A5] text-white py-2 px-4 rounded-lg transition"
              >
                <Image
                  src="/linkedin.png"
                  alt="LinkedIn"
                  width={18}
                  height={18}
                />
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
            </div>
          ))}
        </div>

        {/* Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Ils ont développé l'application à deux.
        </p>
      </div>
    </div>
  )
}
