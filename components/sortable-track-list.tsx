"use client"

import { useState } from "react"
import type { Track } from "@/lib/spotify-types"
import { cn } from "@/lib/utils"
import { GripVertical, Check, X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableTrackListProps {
  tracks: Track[]
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  revealed?: boolean
  correctOrder?: string[]
  disabled?: boolean
}

interface SortableTrackItemProps {
  track: Track
  index: number
  revealed?: boolean
  isCorrectPosition?: boolean
  correctPosition?: number | null
  disabled?: boolean
}

function SortableTrackItem({
  track,
  index,
  revealed,
  isCorrectPosition,
  correctPosition,
  disabled,
}: SortableTrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    disabled: disabled || revealed,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-lg bg-card border transition-colors",
        !disabled && !revealed && "hover:bg-secondary/50",
        isDragging && "opacity-60 z-50",
        "border-border",
        revealed && isCorrectPosition && "bg-primary/10 border-primary/40",
        revealed && !isCorrectPosition && "bg-destructive/10 border-destructive/40",
      )}
      // keep attributes (a11y id/role) on the root, but DON'T attach listeners here
      {...attributes}
    >
      {/* HANDLE: seul élément qui activera le drag (desktop + mobile) */}
      {!disabled && !revealed && (
        <GripVertical
          className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab touch-none"
          {...listeners} // listeners uniquement ici
        />
      )}

      {/* index / badge */}
      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>

      {/* cover */}
      <img src={track.cover || "/placeholder.svg"} alt={track.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      {/* revealed info */}
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
}

function TrackOverlay({ track, index }: { track: Track; index: number }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-card border border-primary shadow-lg cursor-grabbing">
      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index}
      </div>
      <img src={track.cover || "/placeholder.svg"} alt={track.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
    </div>
  )
}

export function SortableTrackList({
  tracks,
  order,
  onOrderChange,
  revealed,
  correctOrder,
  disabled,
}: SortableTrackListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]
  const activeTrack = activeId ? tracks.find((t) => t.id === activeId) : null
  const activeIndex = activeId ? order.indexOf(activeId) : -1

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string)
      const newIndex = order.indexOf(over.id as string)
      onOrderChange(arrayMove(order, oldIndex, newIndex))
    }

    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {/* centered container for desktop */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex flex-col gap-2">
            {orderedTracks.map((track, index) => {
              const isCorrectPosition = revealed && correctOrder && correctOrder.indexOf(track.id) === index
              const correctPosition = correctOrder ? correctOrder.indexOf(track.id) + 1 : null

              return (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  revealed={revealed}
                  isCorrectPosition={isCorrectPosition}
                  correctPosition={correctPosition}
                  disabled={disabled}
                />
              )
            })}
          </div>
        </div>
      </SortableContext>

      <DragOverlay>{activeTrack ? <TrackOverlay track={activeTrack} index={activeIndex + 1} /> : null}</DragOverlay>
    </DndContext>
  )
}
