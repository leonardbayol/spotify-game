"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function InfoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
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

      {/* Popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md relative">
          <button
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <DialogHeader>
            <DialogTitle className="text-lg font-bold">À propos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-sm text-muted-foreground">
            <p>
              Cette application a été créée grâce à la collaboration de :
            </p>

            <div className="grid grid-cols-2 gap-4">

              {/* Leonard */}
              <Link
                href="https://www.linkedin.com/in/leonard-bayol"
                target="_blank"
                className="group flex flex-col items-center p-3 rounded-lg border hover:bg-muted transition"
              >
                <Image
                  src="/leonard.jpg"
                  alt="Léonard Bayol"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <span className="mt-2 font-medium text-foreground">Léonard Bayol</span>
                <span className="text-xs text-muted-foreground">Product Manager</span>
              </Link>

              {/* Nathan */}
              <Link
                href="https://www.linkedin.com/in/nathan-desbrosse"
                target="_blank"
                className="group flex flex-col items-center p-3 rounded-lg border hover:bg-muted transition"
              >
                <Image
                  src="/nathan.jpg"
                  alt="Nathan Desbrosse"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <span className="mt-2 font-medium text-foreground">Nathan Desbrosse</span>
                <span className="text-xs text-muted-foreground">Data Analyst</span>
              </Link>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
