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
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-xl tracking-tight hidden sm:block group-hover:text-primary transition-colors">
            Spotifyght
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3">
          {/* Playlist section */}
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
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-secondary border border-secondary/50">
              <img
                src={playlist.image || "/placeholder.svg"}
                alt={playlist.name}
                className="w-8 h-8 rounded-md object-cover"
              />
              <span className="font-medium max-w-[150px] truncate">{playlist.name}</span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaylistModal(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Changer
              </Button>
            </div>
          )}

          {/* Game modes */}
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container flex flex-col gap-3 p-4">

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
                <div className="flex flex-col flex-1">
                  <span className="font-medium truncate">{playlist.name}</span>
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
              </div>
            )}

            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname === href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    pathname === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
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

      {/* Playlist Modal */}
      <PlaylistModal open={showPlaylistModal} onOpenChange={setShowPlaylistModal} />
    </header>
  )
}
