-- Migration: Add Resolution Hub tables and columns
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./migrations/001_resolution_hub.sql

-- ============================================
-- NEW TABLES
-- ============================================

-- Case comments table
CREATE TABLE IF NOT EXISTS case_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  source TEXT DEFAULT 'hub',
  clickup_comment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- Case activity/audit log table
CREATE TABLE IF NOT EXISTS case_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  actor TEXT,
  actor_email TEXT,
  source TEXT DEFAULT 'hub',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'agent',
  avatar_url TEXT,
  assigned_categories TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ClickUp webhooks tracking
CREATE TABLE IF NOT EXISTS clickup_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  events TEXT,
  list_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_received_at DATETIME
);

-- ============================================
-- ADD NEW COLUMNS TO EXISTING TABLES
-- (These will fail silently if column exists)
-- ============================================

-- Cases table new columns
ALTER TABLE cases ADD COLUMN category TEXT;
ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'normal';
ALTER TABLE cases ADD COLUMN customer_phone TEXT;
ALTER TABLE cases ADD COLUMN order_id TEXT;
ALTER TABLE cases ADD COLUMN order_url TEXT;
ALTER TABLE cases ADD COLUMN order_date DATETIME;
ALTER TABLE cases ADD COLUMN refund_percent INTEGER;
ALTER TABLE cases ADD COLUMN original_order_total REAL;
ALTER TABLE cases ADD COLUMN missing_item_order_list TEXT;
ALTER TABLE cases ADD COLUMN missing_item_description TEXT;
ALTER TABLE cases ADD COLUMN tracking_number TEXT;
ALTER TABLE cases ADD COLUMN carrier_name TEXT;
ALTER TABLE cases ADD COLUMN shipping_address TEXT;
ALTER TABLE cases ADD COLUMN photo_urls TEXT;
ALTER TABLE cases ADD COLUMN clickup_list_id TEXT;
ALTER TABLE cases ADD COLUMN last_sync_at DATETIME;
ALTER TABLE cases ADD COLUMN last_sync_source TEXT;
ALTER TABLE cases ADD COLUMN hub_url TEXT;
ALTER TABLE cases ADD COLUMN richpanel_ticket_id TEXT;
ALTER TABLE cases ADD COLUMN richpanel_conversation_id TEXT;
ALTER TABLE cases ADD COLUMN assigned_to TEXT;
ALTER TABLE cases ADD COLUMN assigned_at DATETIME;
ALTER TABLE cases ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cases ADD COLUMN first_response_at DATETIME;
ALTER TABLE cases ADD COLUMN resolved_at DATETIME;
ALTER TABLE cases ADD COLUMN internal_notes TEXT;

-- Sessions table new columns
ALTER TABLE sessions ADD COLUMN last_activity_at DATETIME;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN outcome TEXT;

-- Events table new columns
ALTER TABLE events ADD COLUMN case_id TEXT;
ALTER TABLE events ADD COLUMN actor TEXT;
ALTER TABLE events ADD COLUMN actor_email TEXT;

-- Admin users table new columns
ALTER TABLE admin_users ADD COLUMN email TEXT;
ALTER TABLE admin_users ADD COLUMN avatar_url TEXT;
ALTER TABLE admin_users ADD COLUMN permissions TEXT;

-- ============================================
-- NEW INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_clickup_task_id ON cases(clickup_task_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_case_id ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_case_id ON case_activity(case_id);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);
