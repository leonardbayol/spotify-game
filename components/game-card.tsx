"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface GameCardProps {
  href: string
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  delay?: number
}

export function GameCard({ href, title, description, icon: Icon, gradient, delay = 0 }: GameCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300",
        "hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
        "active:scale-[0.98]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10", gradient)}
      />

      <div className="relative">
        <div
          className={cn(
            "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            gradient,
          )}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>

        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
