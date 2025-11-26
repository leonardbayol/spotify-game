export interface Track {
  id: string
  name: string
  artist: string
  featuring: string[]
  cover: string
  releaseDate: string
  popularity: number
  previewUrl?: string
}

export interface PlaylistInfo {
  id: string
  name: string
  owner: string
  image: string
  totalTracks: number
}

export interface GameState {
  tracks: Track[]
  playlist: PlaylistInfo | null
  isLoading: boolean
  error: string | null
}

export interface DuelState {
  leftTrack: Track | null
  rightTrack: Track | null
  selected: "left" | "right" | null
  streak: number
  bestStreak: number
  round: number
  revealed: boolean
}

export interface RankingState {
  tracks: Track[]
  userOrder: string[]
  validated: boolean
  score: number
}

// BattlePlayer and BattleState interfaces have been removed as they are now handled by Redis room system
