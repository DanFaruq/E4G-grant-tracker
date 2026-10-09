import type { SupabaseClient } from "@supabase/supabase-js"
import type { Viewer } from "@/lib/job-levels"

/** The signed-in user's id, permission role and job level, or null if signed out. */
export async function getViewer(supabase: SupabaseClient): Promise<Viewer | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("role, job_level")
    .eq("id", user.id)
    .single()
  const profile = data as { role: Viewer["role"]; job_level: Viewer["job_level"] } | null
  return profile ? { id: user.id, role: profile.role, job_level: profile.job_level } : null
}
