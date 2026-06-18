-- Admin pin: vetëm një raport për qytet mund të jetë "Raporti i javës"

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS is_weekly_spotlight BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS reports_weekly_spotlight_per_city
  ON reports (city)
  WHERE is_weekly_spotlight = true;
