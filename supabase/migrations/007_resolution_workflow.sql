-- Step 1 of 2: Add new report status enum value.
-- PostgreSQL requires this to be committed BEFORE the value is used elsewhere.
-- Run this query first, then run 008_resolution_workflow.sql.

ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'waiting_for_response';
