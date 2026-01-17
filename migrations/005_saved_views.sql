-- Migration: Saved Views for Filter System
-- This allows users to save filter combinations as named views

-- Drop and recreate the table with correct schema
DROP TABLE IF EXISTS saved_views;

CREATE TABLE saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  filters TEXT NOT NULL, -- JSON string containing filter state
  user_id TEXT, -- NULL for global views (visible to all)
  is_global INTEGER DEFAULT 0, -- 1 if shared with all users (admin only)
  created_by TEXT NOT NULL, -- Email/name of creator
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  use_count INTEGER DEFAULT 0 -- Track popularity
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_global ON saved_views(is_global);
