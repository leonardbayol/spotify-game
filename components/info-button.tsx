"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function InfoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating Info Button */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-12 h-12 rounded-full
          bg-black text-white flex items-center justify-center
          shadow-lg border border-white/10
          hover:bg-green-600 transition
        "
      >
        <Info className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal content */}
          <div className="relative z-50 max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">À propos</h2>

            <p className="text-sm text-gray-600 mb-6 text-center">
              Cette application a été créée par la collaboration :
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Léonard */}
              <Link
                href="https://www.linkedin.com/in/leonard-bayol"
                target="_blank"
                className="flex flex-col items-center p-2 rounded-lg border hover:bg-gray-100 transition"
              >
                <Image
                  src="/leonard.jpg"
                  alt="Léonard Bayol"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <span className="mt-2 font-medium text-gray-900">Léonard Bayol</span>
                <span className="text-xs text-gray-500">Product Manager</span>
              </Link>

              {/* Nathan */}
              <Link
                href="https://www.linkedin.com/in/nathan-desbrosse"
                target="_blank"
                className="flex flex-col items-center p-2 rounded-lg border hover:bg-gray-100 transition"
              >
                <Image
                  src="/nathan.jpg"
                  alt="Nathan Desbrosse"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <span className="mt-2 font-medium text-gray-900">Nathan Desbrosse</span>
                <span className="text-xs text-gray-500">Data Analyst</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
