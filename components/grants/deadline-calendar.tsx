"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { GrantStage } from "@/types/database"

export type CalendarGrant = {
  id: string
  name: string
  funder: string
  stage: GrantStage
  deadline: string
}

const STAGE_COLORS: Record<GrantStage, string> = {
  discovered:  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  researching: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  applying:    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  submitted:   "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  awarded:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  rejected:    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function DeadlineCalendar({ grants }: { grants: CalendarGrant[] }) {
  const [current, setCurrent] = useState(new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  })

  const byDate = grants.reduce<Record<string, CalendarGrant[]>>((acc, g) => {
    if (!acc[g.deadline]) acc[g.deadline] = []
    acc[g.deadline].push(g)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">{format(current, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrent(subMonths(current, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrent(addMonths(current, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(6,1fr)] border-l border-t">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const dayGrants = byDate[key] ?? []
          const inMonth = isSameMonth(day, current)

          return (
            <div
              key={key}
              className={`border-r border-b p-1 min-h-[100px] ${!inMonth ? "bg-muted/20" : ""}`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                  isToday(day)
                    ? "bg-primary text-primary-foreground"
                    : !inMonth
                    ? "text-muted-foreground"
                    : ""
                }`}
              >
                {format(day, "d")}
              </span>
              <div className="space-y-0.5">
                {dayGrants.slice(0, 3).map((g) => (
                  <Link
                    key={g.id}
                    href={`/grants/${g.id}`}
                    title={`${g.name} — ${g.funder}`}
                    className={`block text-[11px] truncate rounded px-1 py-0.5 leading-tight hover:opacity-80 transition-opacity ${STAGE_COLORS[g.stage]}`}
                  >
                    {g.name}
                  </Link>
                ))}
                {dayGrants.length > 3 && (
                  <p className="text-[11px] text-muted-foreground pl-1">
                    +{dayGrants.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
