"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Track, PlaylistInfo, DuelState, RankingState } from "./spotify-types"
import { loadPlaylistTracks, getTwoDifferentTracks, getRandomTracks } from "./spotify-utils"

interface GameContextType {
  // Playlist state
  tracks: Track[]
  playlist: PlaylistInfo | null
  isLoading: boolean
  error: string | null
  loadPlaylist: (playlistId: string) => Promise<void>

  // Duel state
  duel: DuelState
  startNewDuel: () => void
  selectDuel: (side: "left" | "right") => void
  nextDuelRound: () => void

  // Ranking state
  ranking: RankingState
  startNewRanking: () => void
  updateRankingOrder: (newOrder: string[]) => void
  validateRanking: () => void
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [duel, setDuel] = useState<DuelState>({
    leftTrack: null,
    rightTrack: null,
    selected: null,
    streak: 0,
    bestStreak: 0,
    round: 0,
    revealed: false,
  })

  const [ranking, setRanking] = useState<RankingState>({
    tracks: [],
    userOrder: [],
    validated: false,
    score: 0,
  })

  useEffect(() => {
    try {
      const savedPlaylist = localStorage.getItem("spotify-game-playlist")
      const savedTracks = localStorage.getItem("spotify-game-tracks")

      if (savedPlaylist && savedTracks) {
        setPlaylist(JSON.parse(savedPlaylist))
        setTracks(JSON.parse(savedTracks))
      }
    } catch (e) {
      console.error("Failed to load saved playlist:", e)
    }
  }, [])

  const loadPlaylist = useCallback(async (playlistId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { tracks: newTracks, playlist: newPlaylist } = await loadPlaylistTracks(playlistId)
      setTracks(newTracks)
      setPlaylist(newPlaylist)

      localStorage.setItem("spotify-game-playlist", JSON.stringify(newPlaylist))
      localStorage.setItem("spotify-game-tracks", JSON.stringify(newTracks))
    } catch (e) {
      const message = e instanceof Error ? e.message : "Impossible de charger la playlist"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startNewDuel = useCallback(() => {
    const pair = getTwoDifferentTracks(tracks)
    if (pair) {
      setDuel((prev) => ({
        ...prev,
        leftTrack: pair[0],
        rightTrack: pair[1],
        selected: null,
        revealed: false,
        round: prev.round + 1,
      }))
    }
  }, [tracks])

  const selectDuel = useCallback(
    (side: "left" | "right") => {
      if (duel.revealed) return

      setDuel((prev) => {
        const leftPop = prev.leftTrack?.popularity ?? 0
        const rightPop = prev.rightTrack?.popularity ?? 0
        const isCorrect =
          (side === "left" && leftPop > rightPop) || (side === "right" && rightPop > leftPop) || leftPop === rightPop

        const newStreak = isCorrect ? prev.streak + 1 : 0
        const newBest = Math.max(prev.bestStreak, newStreak)

        return {
          ...prev,
          selected: side,
          revealed: true,
          streak: newStreak,
          bestStreak: newBest,
        }
      })
    },
    [duel.revealed],
  )

  const nextDuelRound = useCallback(() => {
    startNewDuel()
  }, [startNewDuel])

  const startNewRanking = useCallback(() => {
    const selectedTracks = getRandomTracks(tracks, Math.min(10, tracks.length))
    const shuffled = [...selectedTracks].sort(() => Math.random() - 0.5)
    setRanking({
      tracks: selectedTracks,
      userOrder: shuffled.map((t) => t.id),
      validated: false,
      score: 0,
    })
  }, [tracks])

  const updateRankingOrder = useCallback((newOrder: string[]) => {
    setRanking((prev) => ({ ...prev, userOrder: newOrder }))
  }, [])

  const validateRanking = useCallback(() => {
    const correctOrder = [...ranking.tracks].sort((a, b) => b.popularity - a.popularity).map((t) => t.id)
    let correctCount = 0
    ranking.userOrder.forEach((id, index) => {
      if (correctOrder[index] === id) {
        correctCount++
      }
    })
    setRanking((prev) => ({ ...prev, validated: true, score: correctCount }))
  }, [ranking.tracks, ranking.userOrder])

  return (
    <GameContext.Provider
      value={{
        tracks,
        playlist,
        isLoading,
        error,
        loadPlaylist,
        duel,
        startNewDuel,
        selectDuel,
        nextDuelRound,
        ranking,
        startNewRanking,
        updateRankingOrder,
        validateRanking,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
