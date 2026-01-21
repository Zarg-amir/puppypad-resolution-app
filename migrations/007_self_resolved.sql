-- Migration: Add resolved_in_app column to track cases resolved within the app
-- These are cases where customers were satisfied with the information provided and didn't need manual resolution

ALTER TABLE cases ADD COLUMN resolved_in_app BOOLEAN DEFAULT 0;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_cases_resolved_in_app ON cases(resolved_in_app, created_at DESC);
