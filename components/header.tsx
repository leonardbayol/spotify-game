"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music, Swords, Trophy, Users, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlaylistModal } from "@/components/playlist-modal"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useGame } from "@/lib/game-context"

const navItems = [
  { href: "/duel", label: "Duel", icon: Swords },
  { href: "/ranking", label: "Classement", icon: Trophy },
  { href: "/battle", label: "En ligne", icon: Users },
]

export function Header() {
  const pathname = usePathname()
  const { playlist } = useGame()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">

        {/* LOGO MOBILE + DESKTOP */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
            Spoti<span className="text-primary">fyght</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-3">

          {/* PLAYLIST DESKTOP */}
          {!playlist ? (
            <Button
              onClick={() => setShowPlaylistModal(true)}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Music className="h-4 w-4" />
              Choisir une playlist
            </Button>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary border border-secondary/50">
              <img
                src={playlist.image || "/placeholder.svg"}
                alt={playlist.name}
                className="w-10 h-10 rounded-md object-cover"
              />

              <span className="font-medium flex-1 truncate">
                {playlist.name}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaylistModal(true)}
                className="text-muted-foreground hover:text-foreground px-2"
              >
                Changer
              </Button>
            </div>
          )}

          {/* NAV ITEMS */}
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* MOBILE NAV */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container flex flex-col gap-3 p-4">

            {/* PLAYLIST MOBILE — VERSION PROPRE */}
            {!playlist ? (
              <Button
                onClick={() => {
                  setShowPlaylistModal(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Music className="h-4 w-4" />
                Choisir une playlist
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-secondary/50">
                <img
                  src={playlist.image || "/placeholder.svg"}
                  alt={playlist.name}
                  className="w-10 h-10 rounded-md object-cover"
                />

                {/* NO FLEX-COL ANYMORE */}
                <span className="font-medium flex-1 truncate">
                  {playlist.name}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPlaylistModal(true)
                    setMobileMenuOpen(false)
                  }}
                  className="text-muted-foreground hover:text-foreground px-0"
                >
                  Changer
                </Button>
              </div>
            )}

            {/* NAV ITEMS MOBILE */}
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname === href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    pathname === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* PLAYLIST MODAL */}
      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </header>
  )
}
