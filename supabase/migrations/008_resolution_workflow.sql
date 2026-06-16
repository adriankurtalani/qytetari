-- Step 2 of 2: Timeline table, RLS, and backfill.
-- Prerequisite: 007_resolution_workflow.sql must be run and committed first.

CREATE TYPE timeline_actor_role AS ENUM (
  'citizen',
  'admin',
  'municipality',
  'business',
  'system'
);

CREATE TABLE IF NOT EXISTS report_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status report_status,
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role timeline_actor_role NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_timeline_report_id
  ON report_timeline_events(report_id, created_at ASC);

ALTER TABLE report_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Timeline visible for accessible reports" ON report_timeline_events;
CREATE POLICY "Timeline visible for accessible reports"
  ON report_timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_id
      AND (
        r.status IN ('approved', 'in_progress', 'waiting_for_response', 'resolved')
        OR r.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'municipality')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Moderators can insert timeline events" ON report_timeline_events;
CREATE POLICY "Moderators can insert timeline events"
  ON report_timeline_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'municipality', 'business', 'citizen')
    )
    OR actor_role = 'system'
  );

-- Include waiting_for_response in public report visibility
DROP POLICY IF EXISTS "Approved reports are public" ON reports;

CREATE POLICY "Approved reports are public"
  ON reports FOR SELECT
  USING (
    status IN ('approved', 'in_progress', 'waiting_for_response', 'resolved')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'municipality')
    )
  );

-- Backfill timeline: one "created" event per existing report
INSERT INTO report_timeline_events (report_id, event_type, status, title, actor_id, actor_role, created_at)
SELECT
  r.id,
  'created',
  r.status,
  'Qytetari krijoi raportimin',
  r.user_id,
  'citizen',
  r.created_at
FROM reports r
WHERE NOT EXISTS (
  SELECT 1 FROM report_timeline_events e
  WHERE e.report_id = r.id AND e.event_type = 'created'
);

GRANT SELECT ON report_timeline_events TO anon, authenticated;
GRANT INSERT ON report_timeline_events TO authenticated;
