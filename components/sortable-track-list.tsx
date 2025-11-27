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

function SortableTrackItem({
  track,
  index,
  revealed,
  isCorrectPosition,
  correctPosition,
  disabled,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    disabled: disabled || revealed,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-card border transition-colors",
        !disabled && !revealed && "cursor-grab active:cursor-grabbing hover:bg-secondary/50",
        isDragging && "opacity-50 z-50",
        "border-border",
        revealed && isCorrectPosition && "bg-primary/10 border-primary/40",
        revealed && !isCorrectPosition && "bg-destructive/10 border-destructive/40"
      )}
      {...attributes}
      {...listeners}
    >
      {!disabled && !revealed && <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />}

      <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>

      <img src={track.cover || "/placeholder.svg"} className="w-8 h-8 rounded object-cover shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      {revealed && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs">{track.popularity}</span>
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

function TrackOverlay({ track, index }: any) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-card border border-primary shadow-lg cursor-grabbing">
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <img src={track.cover || "/placeholder.svg"} className="w-8 h-8 rounded object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
    </div>
  )
}

export function SortableTrackList(props: SortableTrackListProps) {
  const { tracks, order, onOrderChange, revealed, correctOrder, disabled } = props
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120, // empêche le scroll de prendre le dessus
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const orderedTracks = order.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean)
  const activeTrack = activeId ? tracks.find((t) => t.id === activeId) : null

  function onStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function onEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string)
      const newIndex = order.indexOf(over.id as string)
      onOrderChange(arrayMove(order, oldIndex, newIndex))
    }
    setActiveId(null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onStart} onDragEnd={onEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {orderedTracks.map((track, index) => {
            const isCorrect = revealed && correctOrder?.indexOf(track.id) === index
            return (
              <SortableTrackItem
                key={track.id}
                track={track}
                index={index}
                revealed={revealed}
                isCorrectPosition={isCorrect}
                correctPosition={correctOrder?.indexOf(track.id)! + 1}
                disabled={disabled}
              />
            )
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTrack ? <TrackOverlay track={activeTrack} index={order.indexOf(activeTrack.id)} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
