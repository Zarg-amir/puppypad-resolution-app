-- Migration 003: Add columns needed for Phase 3 Analytics
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./migrations/003_analytics_columns.sql

-- ============================================
-- CASES TABLE - Add resolved_by column
-- Tracks who resolved/completed the case
-- ============================================
ALTER TABLE cases ADD COLUMN resolved_by TEXT;

-- ============================================
-- INDEX FOR ANALYTICS QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cases_resolved_by ON cases(resolved_by);
CREATE INDEX IF NOT EXISTS idx_cases_resolved_at ON cases(resolved_at);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
