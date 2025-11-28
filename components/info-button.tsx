"use client"

import { useState } from "react"
import { X, Linkedin } from "lucide-react"

export function InfoDuelPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [winner, setWinner] = useState<null | string>(null)

  const handleCardClick = (name: string) => {
    setWinner(name)
  }

  return (
    <>
      {/* Bouton info */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-green-500 transition-colors z-50"
      >
        i
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-black text-white rounded-2xl shadow-lg max-w-2xl w-full p-6">
            {/* Croix pour fermer */}
            <button
              onClick={() => {
                setIsOpen(false)
                setWinner(null)
              }}
              className="absolute top-4 right-4 text-white hover:text-green-500"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">
              Qui est le plus populaire ?
            </h2>

            {/* Cards duel */}
            <div className="grid grid-cols-2 gap-4">
              {/* Léonard */}
              <div
                className="cursor-pointer bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 flex flex-col items-center hover:scale-105 transition-transform"
                onClick={() => handleCardClick("Leonard")}
              >
                <img
                  src="/leonard.jpg"
                  alt="Leonard"
                  className="w-24 h-24 rounded-full mb-2 object-cover"
                />
                <p className="font-bold text-lg">Léonard</p>
                <p className="text-sm text-gray-200 mb-2">Product Manager</p>
                <p className="font-bold text-xl">{winner ? "100" : "?"}</p>
                <a
                  href="https://www.linkedin.com/in/leonard-bayol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-blue-400 hover:text-blue-600"
                >
                  <Linkedin size={16} /> LinkedIn
                </a>
              </div>

              {/* Nathan */}
              <div
                className="cursor-pointer bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 flex flex-col items-center hover:scale-105 transition-transform"
                onClick={() => handleCardClick("Nathan")}
              >
                <img
                  src="/nathan.jpg"
                  alt="Nathan"
                  className="w-24 h-24 rounded-full mb-2 object-cover"
                />
                <p className="font-bold text-lg">Nathan</p>
                <p className="text-sm text-gray-200 mb-2">Data Analyst</p>
                <p className="font-bold text-xl">{winner ? "100" : "?"}</p>
                <a
                  href="https://www.linkedin.com/in/nathan-desbrosse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-blue-400 hover:text-blue-600"
                >
                  <Linkedin size={16} /> LinkedIn
                </a>
              </div>
            </div>

            {/* Message égalité */}
            {winner && (
              <p className="mt-6 text-center text-gray-300">
                {winner} et l'autre ont développé l'application à deux !
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
