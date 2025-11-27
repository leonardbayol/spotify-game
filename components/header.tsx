"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music, Swords, Trophy, Users, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlaylistModal } from "@/components/playlist-modal"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/duel", label: "Duel", icon: Swords },
  { href: "/ranking", label: "Classement", icon: Trophy },
  { href: "/battle", label: "En ligne", icon: Users },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block group-hover:text-primary transition-colors">
            Spotifyght
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* New playlist button */}
          <Button
            onClick={() => setShowPlaylistModal(true)}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Music className="h-4 w-4" />
            Playlist
          </Button>

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
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container flex flex-col gap-1 p-4">
            <Button
              onClick={() => {
                setShowPlaylistModal(true)
                setMobileMenuOpen(false)
              }}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              variant="ghost"
            >
              <Music className="h-4 w-4" />
              Playlist
            </Button>

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
