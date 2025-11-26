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
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent, trackId: string, index: number) => {
      if (disabled) return
      setDraggedId(trackId)
      draggedIndexRef.current = index
      e.dataTransfer.effectAllowed = "move"
    },
    [disabled],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (disabled || draggedIndexRef.current === null) return
      setDropTargetIndex(index)
    },
    [disabled],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      if (disabled || !draggedId || draggedIndexRef.current === null) return

      const draggedIndex = draggedIndexRef.current

      if (targetIndex === draggedIndex) {
        setDraggedId(null)
        setDropTargetIndex(null)
        draggedIndexRef.current = null
        return
      }

      const newOrder = [...order]
      newOrder.splice(draggedIndex, 1)
      const insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
      newOrder.splice(insertIndex, 0, draggedId)

      onOrderChange(newOrder)
      setDraggedId(null)
      setDropTargetIndex(null)
      draggedIndexRef.current = null
    },
    [disabled, draggedId, order, onOrderChange],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropTargetIndex(null)
    draggedIndexRef.current = null
  }, [])

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  return (
    <div className="flex flex-col gap-3">
      {orderedTracks.map((track, index) => {
        const isCorrectPosition = revealed && correctOrder && correctOrder.indexOf(track.id) === index
        const correctPosition = correctOrder ? correctOrder.indexOf(track.id) + 1 : null
        const isDragged = draggedId === track.id
        const isDropTarget = dropTargetIndex === index && draggedId && !isDragged

        return (
          <div
            key={track.id}
            draggable={!disabled && !revealed}
            onDragStart={(e) => handleDragStart(e, track.id, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-card border transition-all",
              !disabled && !revealed && "cursor-grab active:cursor-grabbing hover:bg-secondary/50",
              isDragged && "opacity-30",
              isDropTarget && "border-t-2 border-t-primary",
              !isDropTarget && "border-border",
              revealed && isCorrectPosition && "bg-primary/10 border-primary/40",
              revealed && !isCorrectPosition && "bg-destructive/10 border-destructive/40",
            )}
          >
            {!disabled && !revealed && <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />}

            <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </div>

            <img
              src={track.cover || "/placeholder.svg"}
              alt=""
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{track.name}</p>
              <p className="text-xs text-muted-foreground truncate leading-tight">{track.artist}</p>
            </div>

            {revealed && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">{track.popularity}</span>
                {isCorrectPosition ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <div className="flex items-center gap-1 text-destructive">
                    <X className="w-4 h-4" />
                    <span className="text-xs">#{correctPosition}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
