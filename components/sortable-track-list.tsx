"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import type { Track } from "@/lib/spotify-types"
import { cn } from "@/lib/utils"
import { GripVertical, Check, X } from "lucide-react"

interface SortableTrackListProps {
  tracks: Track[]
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  revealed?: boolean
  correctOrder?: string[]
  disabled?: boolean
}

export function SortableTrackList({
  tracks,
  order,
  onOrderChange,
  revealed,
  correctOrder,
  disabled,
}: SortableTrackListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent, trackId: string, index: number) => {
      if (disabled) return
      setDraggedId(trackId)
      draggedIndexRef.current = index
      e.dataTransfer.effectAllowed = "move"
      // Make drag image semi-transparent
      if (e.currentTarget instanceof HTMLElement) {
        e.dataTransfer.setDragImage(e.currentTarget, 0, 0)
      }
    },
    [disabled],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (disabled || draggedIndexRef.current === null) return

      const rect = e.currentTarget.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const insertAt = e.clientY < midY ? index : index + 1

      // Don't show insertion at the same position as dragged item
      if (insertAt !== draggedIndexRef.current && insertAt !== draggedIndexRef.current + 1) {
        setInsertIndex(insertAt)
      } else {
        setInsertIndex(null)
      }
    },
    [disabled],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled || !draggedId || insertIndex === null || draggedIndexRef.current === null) return

      const newOrder = [...order]
      const draggedIndex = draggedIndexRef.current

      // Remove from old position
      newOrder.splice(draggedIndex, 1)

      // Calculate new insert position (accounting for removal)
      const newInsertIndex = insertIndex > draggedIndex ? insertIndex - 1 : insertIndex

      // Insert at new position
      newOrder.splice(newInsertIndex, 0, draggedId)

      onOrderChange(newOrder)
      setDraggedId(null)
      setInsertIndex(null)
      draggedIndexRef.current = null
    },
    [disabled, draggedId, insertIndex, order, onOrderChange],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setInsertIndex(null)
    draggedIndexRef.current = null
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if leaving the container entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setInsertIndex(null)
    }
  }, [])

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  return (
    <div className="space-y-2" onDrop={handleDrop} onDragLeave={handleDragLeave}>
      {orderedTracks.map((track, index) => {
        const isCorrectPosition = revealed && correctOrder && correctOrder.indexOf(track.id) === index
        const correctPosition = correctOrder ? correctOrder.indexOf(track.id) + 1 : null
        const showInsertBefore = insertIndex === index

        return (
          <div key={track.id}>
            {showInsertBefore && <div className="h-1 bg-primary rounded-full mb-2 mx-4 animate-pulse" />}

            <div
              draggable={!disabled && !revealed}
              onDragStart={(e) => handleDragStart(e, track.id, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-all",
                !disabled && !revealed && "cursor-grab active:cursor-grabbing hover:bg-secondary/50",
                draggedId === track.id && "opacity-40 scale-[0.98]",
                revealed && isCorrectPosition && "bg-primary/10 border-primary/40",
                revealed && !isCorrectPosition && "bg-destructive/10 border-destructive/40",
              )}
            >
              {!disabled && !revealed && <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />}

              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                  revealed && isCorrectPosition && "bg-primary text-primary-foreground",
                  revealed && !isCorrectPosition && "bg-destructive text-destructive-foreground",
                  !revealed && "bg-secondary text-muted-foreground",
                )}
              >
                {index + 1}
              </span>

              <img
                src={track.cover || "/placeholder.svg"}
                alt={track.name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>

              {revealed && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-primary">{track.popularity}</span>
                  {isCorrectPosition ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="flex items-center gap-1 text-destructive">
                      <X className="h-5 w-5" />
                      <span className="text-xs">#{correctPosition}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show insertion line after last item if needed */}
            {index === orderedTracks.length - 1 && insertIndex === orderedTracks.length && (
              <div className="h-1 bg-primary rounded-full mt-2 mx-4 animate-pulse" />
            )}
          </div>
        )
      })}
    </div>
  )
}
