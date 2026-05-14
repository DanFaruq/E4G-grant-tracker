"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormStatus } from "react-dom"
import type { GrantStage } from "@/types/database"

const STAGES: { value: GrantStage; label: string }[] = [
  { value: "discovered",  label: "Discovered" },
  { value: "researching", label: "Researching" },
  { value: "applying",    label: "Applying" },
  { value: "submitted",   label: "Submitted" },
  { value: "awarded",     label: "Awarded" },
  { value: "rejected",    label: "Rejected" },
]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

interface Profile { id: string; full_name: string }

interface GrantFormProps {
  profiles: Profile[]
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name?: string
    funder?: string
    stage?: GrantStage
    deadline?: string
    amount_min?: number | null
    amount_max?: number | null
    amount_exact?: number | null
    category?: string | null
    description?: string | null
    funder_website?: string | null
    application_url?: string | null
    assignee_ids?: string[]
  }
  submitLabel?: string
}

export function GrantForm({ profiles, action, defaultValues, submitLabel = "Create grant" }: GrantFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="name">Grant name *</Label>
            <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="e.g. Community Health Initiative" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="funder">Funder *</Label>
            <Input id="funder" name="funder" required defaultValue={defaultValues?.funder} placeholder="e.g. Gates Foundation" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              name="stage"
              defaultValue={defaultValues?.stage ?? "discovered"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="date" defaultValue={defaultValues?.deadline ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount_exact">Fixed amount ($)</Label>
            <Input id="amount_exact" name="amount_exact" type="number" min="0" defaultValue={defaultValues?.amount_exact ?? ""} placeholder="e.g. 50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_min">Min range ($)</Label>
            <Input id="amount_min" name="amount_min" type="number" min="0" defaultValue={defaultValues?.amount_min ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_max">Max range ($)</Label>
            <Input id="amount_max" name="amount_max" type="number" min="0" defaultValue={defaultValues?.amount_max ?? ""} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={defaultValues?.category ?? ""} placeholder="e.g. Health, Education, Environment" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ""} placeholder="Grant overview, eligibility, requirements…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="funder_website">Funder website</Label>
            <Input id="funder_website" name="funder_website" type="url" defaultValue={defaultValues?.funder_website ?? ""} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="application_url">Application URL</Label>
            <Input id="application_url" name="application_url" type="url" defaultValue={defaultValues?.application_url ?? ""} placeholder="https://…" />
          </div>
        </div>

        {profiles.length > 0 && (
          <div className="space-y-2">
            <Label>Assign team members</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {profiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="assignees"
                    value={p.id}
                    defaultChecked={defaultValues?.assignee_ids?.includes(p.id)}
                    className="rounded border-gray-300"
                  />
                  {p.full_name || "Unnamed"}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <SubmitButton label={submitLabel} />
        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
      </div>
    </form>
  )
}
