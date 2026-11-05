-- 035 (05.11.2026, audit SEC-5 storage part, approved by Deen 05.11 14:31): uploads to the public bucket
-- atlas-files only under the caller's own org folder: <org_id>/... (the app writes <org_id>/uploads/...,
-- property-import writes <org_id>/import/...). Before: any signed-in user could upload to any path.
-- No UPDATE/DELETE/SELECT policy exists or is added (no overwrite, no listing). Public read by URL is unchanged.
-- The contact-form captcha part of SEC-5 is NOT here (needs new Turnstile keys).
-- Rollback: work/backup/2026-11-05-hardening-2/rollback_035.sql
BEGIN;
DROP POLICY IF EXISTS "atlas-files: members upload" ON storage.objects;
CREATE POLICY "atlas-files: members upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'atlas-files'
    AND (storage.foldername(name))[1] = (SELECT public.current_org_id())::text
  );
COMMIT;
