"use client"

import { useState, useTransition } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import Link from "next/link"
import { updateGrantStage } from "@/lib/actions/grants"
import { formatCurrency, daysUntil } from "@/lib/utils"
import type { GrantStage } from "@/types/database"

const STAGES: { value: GrantStage; label: string; color: string }[] = [
  { value: "discovered",  label: "Discovered",  color: "bg-slate-50 dark:bg-slate-900/50" },
  { value: "researching", label: "Researching", color: "bg-blue-50/80 dark:bg-blue-950/40" },
  { value: "applying",    label: "Applying",    color: "bg-amber-50/80 dark:bg-amber-950/40" },
  { value: "submitted",   label: "Submitted",   color: "bg-violet-50/80 dark:bg-violet-950/40" },
  { value: "awarded",     label: "Awarded",     color: "bg-emerald-50/80 dark:bg-emerald-950/40" },
  { value: "rejected",    label: "Rejected",    color: "bg-red-50/80 dark:bg-red-950/40" },
]

export type KanbanGrant = {
  id: string
  name: string
  funder: string
  stage: GrantStage
  deadline: string | null
  amount_min: number | null
  amount_max: number | null
  amount_exact: number | null
}

function DraggableCard({ grant }: { grant: KanbanGrant }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: grant.id,
    data: { grant },
  })

  const days = grant.deadline ? daysUntil(grant.deadline) : null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <Link
        href={`/grants/${grant.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
        draggable={false}
      >
        <p className="text-sm font-medium line-clamp-2 mb-1 pointer-events-none">{grant.name}</p>
        <p className="text-xs text-muted-foreground mb-2 pointer-events-none">{grant.funder}</p>
        <div className="flex items-center justify-between gap-1 flex-wrap pointer-events-none">
          {(grant.amount_exact ?? grant.amount_min) ? (
            <span className="text-xs text-muted-foreground">
              {grant.amount_exact
                ? formatCurrency(grant.amount_exact)
                : `${formatCurrency(grant.amount_min!)}${grant.amount_max ? `–${formatCurrency(grant.amount_max)}` : "+"}`}
            </span>
          ) : <span />}
          {days !== null && (
            <span className={`text-xs font-medium ${days < 0 ? "text-destructive" : days <= 7 ? "text-orange-600" : "text-muted-foreground"}`}>
              {days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d`}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

function DroppableColumn({
  stage,
  grants,
  isOver,
}: {
  stage: (typeof STAGES)[number]
  grants: KanbanGrant[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage.value })

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {stage.label}
        </span>
        <span className="text-xs bg-muted rounded-full px-2 py-0.5">{grants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[480px] rounded-xl p-2 space-y-2 transition-all ${
          isOver
            ? "ring-2 ring-primary bg-primary/5"
            : stage.color
        }`}
      >
        {grants.map((grant) => (
          <DraggableCard key={grant.id} grant={grant} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialGrants }: { initialGrants: KanbanGrant[] }) {
  const [grants, setGrants] = useState(initialGrants)
  const [activeGrant, setActiveGrant] = useState<KanbanGrant | null>(null)
  const [overColumn, setOverColumn] = useState<GrantStage | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveGrant(event.active.data.current?.grant ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverColumn((event.over?.id as GrantStage) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveGrant(null)
    setOverColumn(null)
    if (!over) return

    const grantId = active.id as string
    const newStage = over.id as GrantStage
    const grant = grants.find((g) => g.id === grantId)
    if (!grant || grant.stage === newStage) return

    setGrants((prev) =>
      prev.map((g) => (g.id === grantId ? { ...g, stage: newStage } : g))
    )

    startTransition(async () => {
      try {
        await updateGrantStage(grantId, newStage)
      } catch {
        setGrants((prev) =>
          prev.map((g) => (g.id === grantId ? { ...g, stage: grant.stage } : g))
        )
      }
    })
  }

  const grantsByStage = STAGES.reduce(
    (acc, s) => {
      acc[s.value] = grants.filter((g) => g.stage === s.value)
      return acc
    },
    {} as Record<GrantStage, KanbanGrant[]>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {STAGES.map((stage) => (
          <DroppableColumn
            key={stage.value}
            stage={stage}
            grants={grantsByStage[stage.value]}
            isOver={overColumn === stage.value}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeGrant && (
          <div className="rounded-lg border bg-card p-3 shadow-xl cursor-grabbing w-[220px] rotate-1">
            <p className="text-sm font-medium line-clamp-2 mb-1">{activeGrant.name}</p>
            <p className="text-xs text-muted-foreground">{activeGrant.funder}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
