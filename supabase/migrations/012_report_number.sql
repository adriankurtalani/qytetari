-- Numër rendor publik për URL të shkurtra: /reports/142

CREATE SEQUENCE IF NOT EXISTS reports_report_number_seq;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS report_number INTEGER;

-- Raportet ekzistuese marrin numra sipas datës së krijimit
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS num
  FROM reports
  WHERE report_number IS NULL
)
UPDATE reports r
SET report_number = n.num
FROM numbered n
WHERE r.id = n.id;

SELECT setval(
  'reports_report_number_seq',
  COALESCE((SELECT MAX(report_number) FROM reports), 0) + 1,
  false
);

ALTER TABLE reports
  ALTER COLUMN report_number SET DEFAULT nextval('reports_report_number_seq');

ALTER TABLE reports
  ALTER COLUMN report_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reports_report_number_key ON reports (report_number);
