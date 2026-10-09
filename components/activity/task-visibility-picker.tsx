"use client"

import { useState } from "react"
import { Lock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { JOB_LEVELS } from "@/lib/job-levels"
import type { JobLevel, TaskVisibility } from "@/types/database"

type Profile = { id: string; full_name: string }

export type VisibilityValue = {
  visibility: TaskVisibility
  min_level: JobLevel | null
  allowed_levels: JobLevel[]
  allowed_profile_ids: string[]
}

const OPTIONS: { value: TaskVisibility; title: string; hint: string }[] = [
  { value: "team", title: "Whole team", hint: "Everyone can see this task." },
  { value: "directors", title: "Directors only", hint: "Hidden from everyone except directors, admins, you, and anyone you assign." },
  { value: "min_level", title: "A level and above", hint: "Only people at or above the level you pick." },
  { value: "custom", title: "Specific levels or people", hint: "Pick exactly who can see it." },
]

/**
 * "Who can see this task" control. Renders form fields (visibility, min_level,
 * allowed_levels, allowed_profile_ids) so the parent form submits them as-is.
 * Only shown to admins and directors; the server and database enforce this too.
 */
export function TaskVisibilityPicker({
  profiles,
  defaultValue,
}: {
  profiles: Profile[]
  defaultValue?: VisibilityValue
}) {
  const [visibility, setVisibility] = useState<TaskVisibility>(defaultValue?.visibility ?? "team")
  const [minLevel, setMinLevel] = useState<JobLevel | "">(defaultValue?.min_level ?? "associate")
  const [levels, setLevels] = useState<JobLevel[]>(defaultValue?.allowed_levels ?? [])
  const [people, setPeople] = useState<string[]>(defaultValue?.allowed_profile_ids ?? [])

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-3">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium">
        <Lock className="size-3.5" />
        Who can see this task
      </legend>

      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="min_level" value={visibility === "min_level" ? minLevel : ""} />
      <input type="hidden" name="allowed_levels" value={JSON.stringify(visibility === "custom" ? levels : [])} />
      <input type="hidden" name="allowed_profile_ids" value={JSON.stringify(visibility === "custom" ? people : [])} />

      <div className="grid gap-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 hover:bg-muted/50 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="visibility-choice"
              checked={visibility === opt.value}
              onChange={() => setVisibility(opt.value)}
              className="mt-1 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block text-sm font-medium">{opt.title}</span>
              <span className="block text-xs text-muted-foreground">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      {visibility === "min_level" && (
        <div className="space-y-1.5">
          <Label htmlFor="task-min-level">Lowest level that can see it</Label>
          <select
            id="task-min-level"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value as JobLevel)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {JOB_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {visibility === "custom" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Levels</Label>
            <div className="flex flex-wrap gap-1.5">
              {JOB_LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  aria-pressed={levels.includes(l.value)}
                  onClick={() => setLevels((prev) => toggle(prev, l.value))}
                  className={`min-h-[36px] rounded-full border px-3 text-xs transition-colors ${
                    levels.includes(l.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>People</Label>
            <div className="flex flex-wrap gap-1.5">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={people.includes(p.id)}
                  onClick={() => setPeople((prev) => toggle(prev, p.id))}
                  className={`min-h-[36px] rounded-full border px-3 text-xs transition-colors ${
                    people.includes(p.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {p.full_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {visibility !== "team" && (
        <p className="text-xs text-muted-foreground">
          People you assign to this task can always see it, whatever you choose here.
        </p>
      )}
    </fieldset>
  )
}
