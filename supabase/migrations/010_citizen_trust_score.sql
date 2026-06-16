-- Citizen Trust Score (Citizen Score)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS citizen_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS approved_reports_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_reports_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS citizen_activity_points INTEGER NOT NULL DEFAULT 0;

-- Backfill report counts from existing data
UPDATE profiles p
SET
  approved_reports_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM reports r
    WHERE r.user_id = p.id
    AND r.status IN ('approved', 'in_progress', 'waiting_for_response', 'resolved')
  ), 0),
  rejected_reports_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM reports r
    WHERE r.user_id = p.id AND r.status = 'rejected'
  ), 0);

-- Approximate score from report counts (activity synced on next login/action)
UPDATE profiles p
SET citizen_score = GREATEST(0, LEAST(100,
  45 + p.approved_reports_count * 10 - p.rejected_reports_count * 18
));
