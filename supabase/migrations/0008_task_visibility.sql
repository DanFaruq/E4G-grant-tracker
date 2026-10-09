-- ============================================================
-- 0008_task_visibility.sql
-- Per-task visibility driven by a job-level ladder.
--
-- Rules (enforced here in RLS, not just in the UI):
--   * You always see a task you created or are assigned to.
--   * Admins and Directors see every task.
--   * Otherwise it depends on the task's visibility:
--       team       everyone (default; same as before)
--       directors  nobody else
--       min_level  people at or above min_level on the ladder
--       custom     the listed levels and/or the listed people
--   * Only admins and directors may create or set a non-'team' visibility.
-- ============================================================

CREATE TYPE job_level AS ENUM (
  'intern',
  'junior_analyst_1',
  'junior_analyst_2',
  'senior_analyst_1',
  'senior_analyst_2',
  'associate',
  'senior_associate_1',
  'senior_associate_2',
  'director'
);
-- Enum order IS the ladder: comparing two job_level values compares seniority.

CREATE TYPE task_visibility AS ENUM ('team', 'directors', 'min_level', 'custom');

-- NULL = level not set yet. Such people only see 'team' tasks and their own.
ALTER TABLE profiles ADD COLUMN job_level job_level;

ALTER TABLE team_tasks
  ADD COLUMN visibility          task_visibility NOT NULL DEFAULT 'team',
  ADD COLUMN min_level           job_level,
  ADD COLUMN allowed_levels      job_level[]     NOT NULL DEFAULT '{}',
  ADD COLUMN allowed_profile_ids uuid[]          NOT NULL DEFAULT '{}',
  ADD CONSTRAINT team_tasks_min_level_required
    CHECK (visibility <> 'min_level' OR min_level IS NOT NULL);

-- ── Helpers ──────────────────────────────────────────────────

-- Admin or Director: may see everything and may restrict tasks.
CREATE OR REPLACE FUNCTION is_task_privileged()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (role = 'admin' OR job_level = 'director')
  )
$$;

CREATE OR REPLACE FUNCTION can_view_task(p_task_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_tasks t
    JOIN profiles me ON me.id = auth.uid()
    WHERE t.id = p_task_id
      AND (
        t.created_by = me.id
        OR me.role = 'admin'
        OR me.job_level = 'director'
        OR EXISTS (
          SELECT 1 FROM task_assignments a
          WHERE a.task_id = t.id AND a.profile_id = me.id
        )
        OR CASE t.visibility
             WHEN 'team'      THEN true
             WHEN 'directors' THEN false
             WHEN 'min_level' THEN me.job_level IS NOT NULL AND me.job_level >= t.min_level
             WHEN 'custom'    THEN me.id = ANY (t.allowed_profile_ids)
                                   OR (me.job_level IS NOT NULL AND me.job_level = ANY (t.allowed_levels))
           END
      )
  )
$$;

-- ── Lock down who can change job levels ──────────────────────
-- The old policy let users edit their own row as long as role was unchanged;
-- that would let anyone promote themselves. Admins can still edit any row
-- through "profiles: admin updates any row".

DROP POLICY "profiles: users update own row" ON profiles;
CREATE POLICY "profiles: users update own row"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND job_level IS NOT DISTINCT FROM (SELECT job_level FROM profiles WHERE id = auth.uid())
  );

-- ── team_tasks ───────────────────────────────────────────────
-- "created_by = auth.uid() OR ..." short-circuits so INSERT ... RETURNING
-- works for the creator (the function can't see a row from its own statement).

DROP POLICY "team_tasks_read"   ON team_tasks;
DROP POLICY "team_tasks_insert" ON team_tasks;
DROP POLICY "team_tasks_update" ON team_tasks;

CREATE POLICY "team_tasks_read" ON team_tasks FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR can_view_task(id));

CREATE POLICY "team_tasks_insert" ON team_tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (visibility = 'team' OR is_task_privileged())
  );

CREATE POLICY "team_tasks_update" ON team_tasks FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (visibility = 'team' OR is_task_privileged());

-- ── task_assignments / task_comments follow the task ─────────

DROP POLICY "task_assignments_read"   ON task_assignments;
DROP POLICY "task_assignments_insert" ON task_assignments;
DROP POLICY "task_assignments_delete" ON task_assignments;

CREATE POLICY "task_assignments_read" ON task_assignments FOR SELECT TO authenticated
  USING (can_view_task(task_id));
CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT TO authenticated
  WITH CHECK (can_view_task(task_id));
CREATE POLICY "task_assignments_delete" ON task_assignments FOR DELETE TO authenticated
  USING (can_view_task(task_id));

DROP POLICY "task_comments_read"   ON task_comments;
DROP POLICY "task_comments_insert" ON task_comments;

CREATE POLICY "task_comments_read" ON task_comments FOR SELECT TO authenticated
  USING (can_view_task(task_id));
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND can_view_task(task_id));
