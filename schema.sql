-- PuppyPad Resolution App - Analytics Database Schema
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./schema.sql

-- Sessions table - Track every user session
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  flow_type TEXT, -- 'track', 'help', 'subscription'
  customer_email TEXT,
  customer_name TEXT,
  order_number TEXT,
  persona TEXT DEFAULT 'amy',
  device_type TEXT, -- 'mobile', 'desktop'
  completed BOOLEAN DEFAULT FALSE,
  session_replay_url TEXT, -- PostHog recording URL
  issue_type TEXT, -- For incomplete sessions: what issue they selected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist (for existing databases)
-- Run these ALTER TABLEs separately if needed:
-- ALTER TABLE sessions ADD COLUMN session_replay_url TEXT;
-- ALTER TABLE sessions ADD COLUMN customer_name TEXT;
-- ALTER TABLE sessions ADD COLUMN issue_type TEXT;
-- ALTER TABLE cases ADD COLUMN issue_type TEXT;

-- Events table - Track all user actions
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', 'form_submit', 'flow_start', 'flow_complete', 'policy_block', 'error'
  event_name TEXT NOT NULL,
  event_data TEXT, -- JSON string with additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Cases table - Track all created cases
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT UNIQUE NOT NULL,
  session_id TEXT,
  case_type TEXT NOT NULL, -- 'refund', 'return', 'shipping', 'subscription', 'manual'
  resolution TEXT, -- What was resolved (e.g., '20% refund', 'reship', 'pause subscription')
  order_number TEXT,
  customer_email TEXT,
  customer_name TEXT,
  refund_amount REAL,
  selected_items TEXT, -- JSON array of item names
  clickup_task_id TEXT,
  clickup_task_url TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Survey responses table - Track customer feedback
CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  case_id TEXT,
  rating INTEGER NOT NULL, -- 1-5
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id),
  FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- Policy blocks table - Track when policies block requests
CREATE TABLE IF NOT EXISTS policy_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  block_type TEXT NOT NULL, -- '90_day_guarantee', 'existing_case', 'other'
  order_number TEXT,
  days_since INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Admin users table - For dashboard login
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Store hashed password
  name TEXT,
  role TEXT DEFAULT 'viewer', -- 'viewer', 'admin'
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_flow_type ON sessions(flow_type);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_session_id ON cases(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_session_id ON survey_responses(session_id);

-- Insert default admin user
-- NOTE: The password_hash below is a placeholder. After deployment, you should:
-- 1. Generate a proper hash using the hashPassword function in index.js
-- 2. Or update via the dashboard once logged in
-- Default: username='admin', password='puppypad2025' (hash with ADMIN_TOKEN_SECRET)
INSERT OR IGNORE INTO admin_users (username, password_hash, name, role)
VALUES ('admin', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'Administrator', 'admin');
