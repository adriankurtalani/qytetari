-- ============================================================
-- FIX: Report photo upload fails with 400 / RLS policy error
-- Run in Supabase → SQL Editor → Run
-- ============================================================

-- Allow anyone (including anonymous) to upload report photos
CREATE POLICY "Anyone can upload report photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'report-photos');

-- Allow public read access to report photos
CREATE POLICY "Public can view report photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-photos');

-- Allow service role full access (server-side uploads)
CREATE POLICY "Service role full access to report photos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'report-photos')
WITH CHECK (bucket_id = 'report-photos');

CREATE POLICY "Authenticated users can update report photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'report-photos');

-- Allow service role / admins to delete photos
CREATE POLICY "Authenticated users can delete report photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-photos');
