"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateOrgSettings } from "@/lib/actions/settings"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

function SubmitBtn() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
}

export function OrgSettingsForm({ settings }: { settings: Record<string, unknown> | null }) {
  async function action(formData: FormData) {
    try {
      await updateOrgSettings(formData)
      toast.success("Settings saved")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org_name">Organisation name</Label>
        <Input id="org_name" name="org_name" defaultValue={String(settings?.org_name ?? "E4G")} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission_statement">Mission statement</Label>
        <Textarea
          id="mission_statement"
          name="mission_statement"
          rows={4}
          defaultValue={String(settings?.mission_statement ?? "")}
          placeholder="Describe your organisation's mission — used by AI to score opportunities"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="focus_areas">Focus areas (comma-separated)</Label>
        <Input
          id="focus_areas"
          name="focus_areas"
          defaultValue={Array.isArray(settings?.focus_areas) ? (settings.focus_areas as string[]).join(", ") : ""}
          placeholder="e.g. Global health, Evidence synthesis, Policy"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="grants_gov_query">Grants.gov search keywords</Label>
        <Input
          id="grants_gov_query"
          name="grants_gov_query"
          defaultValue={String(settings?.grants_gov_query ?? "")}
          placeholder="e.g. global health evidence"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai_threshold">AI score threshold (0–100)</Label>
        <Input
          id="ai_threshold"
          name="ai_threshold"
          type="number"
          min="0"
          max="100"
          defaultValue={String(settings?.ai_threshold ?? 70)}
        />
        <p className="text-xs text-muted-foreground">Opportunities scoring above this threshold trigger notifications.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="slack_webhook_url">Slack webhook URL</Label>
        <Input
          id="slack_webhook_url"
          name="slack_webhook_url"
          type="url"
          defaultValue={String(settings?.slack_webhook_url ?? "")}
          placeholder="https://hooks.slack.com/services/…"
        />
        <p className="text-xs text-muted-foreground">
          High-scoring opportunities will be posted to this Slack channel.
        </p>
      </div>
      <SubmitBtn />
    </form>
  )
}
