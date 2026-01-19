-- Migration: Flow Positions for Global Node Layout Saving
-- This allows users to save and share node positions across all users

CREATE TABLE IF NOT EXISTS flow_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_id TEXT NOT NULL, -- e.g., 'entry', 'changed_mind', etc.
  positions TEXT NOT NULL, -- JSON string: { nodeId: { x, y }, ... }
  updated_by TEXT, -- Email/name of last person who updated
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(flow_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_flow_positions_flow_id ON flow_positions(flow_id);
