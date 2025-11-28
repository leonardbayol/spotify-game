"use client"

import { useState } from "react"
import { X, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function InfoDuelPopup() {
  const [open, setOpen] = useState(false)
  const [duelResult, setDuelResult] = useState<null | "finished">(null)

  const handleSelect = () => setDuelResult("finished")

  return (
    <>
      {/* Floating Info Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg border border-white/10 hover:bg-green-600 transition"
      >
        i
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Popup */}
          <div className="relative z-50 max-w-3xl w-full mx-4 bg-black rounded-xl shadow-xl p-6 text-white">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white hover:text-green-500"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">Qui est le plus populaire ?</h2>

            {/* Duel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Léonard",
                  role: "Product Manager",
                  photo: "/leonard.jpg",
                  linkedin: "https://www.linkedin.com/in/leonard-bayol",
                },
                {
                  name: "Nathan",
                  role: "Data Analyst",
                  photo: "/nathan.jpg",
                  linkedin: "https://www.linkedin.com/in/nathan-desbrosse",
                },
              ].map((person) => (
                <div
                  key={person.name}
                  onClick={handleSelect}
                  className={cn(
                    "cursor-pointer rounded-xl overflow-hidden shadow-lg transform transition hover:scale-105",
                    "bg-gradient-to-br from-gray-800 to-gray-900"
                  )}
                >
                  <div className="w-full h-48 relative">
                    <Image
                      src={person.photo}
                      alt={person.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold">{person.name}</h3>
                    <p className="text-sm text-gray-300">{person.role}</p>
                  </div>
                  {/* LinkedIn Button */}
                  {duelResult && (
                    <div className="flex justify-center pb-4">
                      <Link
                        href={person.linkedin}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-full text-white font-medium text-sm transition"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Result */}
            {duelResult && (
              <div className="mt-6 text-center space-y-2">
                <p className="text-xl font-bold">100 vs 100</p>
                <p className="text-gray-300">
                  Ils ont développé l'application à deux !
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
