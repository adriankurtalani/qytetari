-- Business Claim System
-- Unclaimed businesses are auto-created when reports mention a business name.
-- Owners submit claims; admins approve to mark as Verified Business.

CREATE TYPE business_claim_status AS ENUM (
  'unclaimed',
  'pending_claim',
  'verified',
  'rejected'
);

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS claim_status business_claim_status NOT NULL DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS normalized_name TEXT,
  ADD COLUMN IF NOT EXISTS official_email TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_number TEXT,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS claim_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claim_rejection_reason TEXT;

-- One unclaimed/verified business record per name + city
CREATE UNIQUE INDEX IF NOT EXISTS businesses_normalized_name_city_key
  ON businesses (normalized_name, city)
  WHERE normalized_name IS NOT NULL AND city IS NOT NULL;

-- Backfill normalized names and claim status for existing rows
UPDATE businesses
SET normalized_name = lower(trim(regexp_replace(name, '\s+', ' ', 'g')))
WHERE normalized_name IS NULL AND name IS NOT NULL;

UPDATE businesses
SET claim_status = 'verified'
WHERE owner_id IS NOT NULL AND is_verified = true;

UPDATE businesses
SET claim_status = 'pending_claim'
WHERE owner_id IS NOT NULL AND is_verified = false AND claim_submitted_by IS NOT NULL;

-- Notification types for claim outcomes
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'business_claim_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'business_claim_rejected';

-- Allow authenticated users to submit claims on unclaimed businesses
CREATE POLICY "Authenticated users can submit business claims"
  ON businesses FOR UPDATE
  USING (
    claim_status IN ('unclaimed', 'rejected')
    AND owner_id IS NULL
  )
  WITH CHECK (
    claim_status = 'pending_claim'
    AND claim_submitted_by = auth.uid()
  );

CREATE POLICY "Admins manage business claims"
  ON businesses FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Storage: create bucket "business-documents" (PRIVATE) in dashboard,
-- then run the policies below.
-- ============================================================

CREATE POLICY "Authenticated users upload business documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-documents');

CREATE POLICY "Users read own business documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all business documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Service role full access to business documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'business-documents')
WITH CHECK (bucket_id = 'business-documents');

-- Optional: backfill unclaimed businesses from reports that already have business_name
-- (Run once after migration if you have existing data)
--
-- INSERT INTO businesses (name, normalized_name, city, claim_status, report_count)
-- SELECT DISTINCT ON (lower(trim(regexp_replace(business_name, '\s+', ' ', 'g'))), city)
--   trim(business_name),
--   lower(trim(regexp_replace(business_name, '\s+', ' ', 'g'))),
--   city,
--   'unclaimed',
--   0
-- FROM reports
-- WHERE business_name IS NOT NULL AND trim(business_name) <> ''
-- ON CONFLICT DO NOTHING;
