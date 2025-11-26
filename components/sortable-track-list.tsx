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
  const [dropZoneIndex, setDropZoneIndex] = useState<number | null>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent, trackId: string, index: number) => {
      if (disabled) return
      setDraggedId(trackId)
      draggedIndexRef.current = index
      e.dataTransfer.effectAllowed = "move"
      if (e.currentTarget instanceof HTMLElement) {
        e.dataTransfer.setDragImage(e.currentTarget, 0, 0)
      }
    },
    [disabled],
  )

  const handleDropZoneDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (disabled || draggedIndexRef.current === null) return

      // Don't show drop zone at current position or adjacent
      if (index !== draggedIndexRef.current && index !== draggedIndexRef.current + 1) {
        setDropZoneIndex(index)
      } else {
        setDropZoneIndex(null)
      }
    },
    [disabled],
  )

  const handleTrackDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      if (disabled || !draggedId || draggedIndexRef.current === null) return

      const draggedIndex = draggedIndexRef.current

      // Don't move if dropping at same position
      if (targetIndex === draggedIndex || targetIndex === draggedIndex + 1) {
        setDraggedId(null)
        setDropZoneIndex(null)
        draggedIndexRef.current = null
        return
      }

      const newOrder = [...order]
      // Remove from old position
      newOrder.splice(draggedIndex, 1)
      // Calculate new insert position (accounting for removal)
      const newInsertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
      // Insert at new position
      newOrder.splice(newInsertIndex, 0, draggedId)

      onOrderChange(newOrder)
      setDraggedId(null)
      setDropZoneIndex(null)
      draggedIndexRef.current = null
    },
    [disabled, draggedId, order, onOrderChange],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropZoneIndex(null)
    draggedIndexRef.current = null
  }, [])

  const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropZoneIndex(null)
    }
  }, [])

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]

  const DropZone = ({ index, isActive }: { index: number; isActive: boolean }) => (
    <div
      onDragOver={(e) => handleDropZoneDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      className={cn(
        "relative transition-all duration-200 rounded-lg",
        // Zone toujours présente et cliquable
        draggedId ? "h-8 my-1" : "h-2 my-0.5",
      )}
    >
      {/* Background de la zone de drop */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-200",
          isActive
            ? "bg-primary/20 border-primary"
            : draggedId
              ? "bg-muted/30 border-muted-foreground/30 hover:bg-primary/10 hover:border-primary/50"
              : "border-transparent",
        )}
      />
      {/* Ligne centrale */}
      {isActive && <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary rounded-full" />}
    </div>
  )

  return (
    <div className="space-y-0" onDragLeave={handleContainerDragLeave}>
      {!disabled && !revealed && <DropZone index={0} isActive={dropZoneIndex === 0} />}

      {orderedTracks.map((track, index) => {
        const isCorrectPosition = revealed && correctOrder && correctOrder.indexOf(track.id) === index
        const correctPosition = correctOrder ? correctOrder.indexOf(track.id) + 1 : null

        return (
          <div key={track.id}>
            <div
              draggable={!disabled && !revealed}
              onDragStart={(e) => handleDragStart(e, track.id, index)}
              onDragOver={handleTrackDragOver}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-card border border-border transition-all",
                !disabled && !revealed && "cursor-grab active:cursor-grabbing hover:bg-secondary/50",
                draggedId === track.id && "opacity-40 scale-[0.98]",
                revealed && isCorrectPosition && "bg-primary/10 border-primary/40",
                revealed && !isCorrectPosition && "bg-destructive/10 border-destructive/40",
              )}
            >
              {!disabled && !revealed && <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />}

              <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>

              <img
                src={track.cover || "/placeholder.svg"}
                alt=""
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.name}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
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

            {!disabled && !revealed && <DropZone index={index + 1} isActive={dropZoneIndex === index + 1} />}
          </div>
        )
      })}
    </div>
  )
}
