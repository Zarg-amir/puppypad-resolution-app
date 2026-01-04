-- PuppyPad Resolution Hub - Database Schema
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./schema.sql

-- ============================================
-- SESSIONS TABLE
-- Track every user session in the Resolution App
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  last_activity_at DATETIME,
  flow_type TEXT, -- 'track', 'help', 'subscription'
  customer_email TEXT,
  customer_name TEXT,
  order_number TEXT,
  persona TEXT DEFAULT 'amy',
  device_type TEXT, -- 'mobile', 'desktop'
  user_agent TEXT,
  completed BOOLEAN DEFAULT FALSE,
  outcome TEXT, -- 'case_created', 'abandoned', 'policy_blocked', etc.
  session_replay_url TEXT,
  issue_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EVENTS TABLE
-- Detailed activity log for all actions
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  case_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', 'status_change', 'comment_added', 'case_created', etc.
  event_name TEXT NOT NULL,
  event_data TEXT, -- JSON string with additional data
  actor TEXT, -- 'customer', 'system', 'team_member', 'clickup_webhook'
  actor_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- ============================================
-- CASES TABLE
-- All customer cases with ClickUp sync
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT UNIQUE NOT NULL, -- e.g., 'REF-20250104-ABC123'
  session_id TEXT,

  -- Case classification
  case_type TEXT NOT NULL, -- 'refund', 'return', 'shipping', 'subscription', 'manual'
  category TEXT, -- More specific: 'missing_item', 'damaged', 'wrong_item', etc.
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'waiting_customer', 'completed', 'cancelled'
  resolution TEXT, -- What was resolved

  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,

  -- Order info
  order_number TEXT,
  order_id TEXT,
  order_url TEXT,
  order_date DATETIME,

  -- Financial
  refund_amount REAL,
  refund_percent INTEGER,
  original_order_total REAL,

  -- Items
  selected_items TEXT, -- JSON array

  -- Missing item specific
  missing_item_order_list TEXT,
  missing_item_description TEXT,

  -- Shipping specific
  tracking_number TEXT,
  carrier_name TEXT,
  shipping_address TEXT, -- JSON

  -- Evidence
  photo_urls TEXT, -- JSON array of uploaded photo URLs

  -- ClickUp sync
  clickup_task_id TEXT,
  clickup_task_url TEXT,
  clickup_list_id TEXT,
  last_sync_at DATETIME,
  last_sync_source TEXT, -- 'hub', 'clickup'

  -- Resolution Hub
  hub_url TEXT, -- Direct link to view in Resolution Hub

  -- Richpanel
  richpanel_ticket_id TEXT,
  richpanel_conversation_id TEXT,

  -- Team
  assigned_to TEXT,
  assigned_at DATETIME,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  first_response_at DATETIME,
  resolved_at DATETIME,

  -- Notes
  internal_notes TEXT,

  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- ============================================
-- CASE COMMENTS TABLE
-- Comments/notes on cases (synced with ClickUp)
-- ============================================
CREATE TABLE IF NOT EXISTS case_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,

  -- Comment content
  content TEXT NOT NULL,

  -- Author
  author_name TEXT,
  author_email TEXT,

  -- Source
  source TEXT DEFAULT 'hub', -- 'hub', 'clickup', 'richpanel'

  -- ClickUp sync
  clickup_comment_id TEXT,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,

  FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================
-- CASE ACTIVITY TABLE
-- Track all changes to cases (audit log)
-- ============================================
CREATE TABLE IF NOT EXISTS case_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,

  -- What changed
  activity_type TEXT NOT NULL, -- 'status_changed', 'assigned', 'comment_added', 'priority_changed', etc.
  field_name TEXT, -- Which field changed
  old_value TEXT,
  new_value TEXT,

  -- Who made the change
  actor TEXT, -- 'system', 'team_member', 'clickup_webhook'
  actor_email TEXT,

  -- Source
  source TEXT DEFAULT 'hub', -- 'hub', 'clickup'

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================
-- SURVEY RESPONSES TABLE
-- Customer feedback
-- ============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  case_id TEXT,
  rating INTEGER NOT NULL, -- 1-5
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id),
  FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================
-- POLICY BLOCKS TABLE
-- Track when policies block requests
-- ============================================
CREATE TABLE IF NOT EXISTS policy_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  block_type TEXT NOT NULL, -- '90_day_guarantee', 'existing_case', 'other'
  order_number TEXT,
  days_since INTEGER,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- ============================================
-- ADMIN USERS TABLE
-- Dashboard/Hub access
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer', -- 'viewer', 'agent', 'admin'
  permissions TEXT, -- JSON array of permissions
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TEAM MEMBERS TABLE
-- For assignment and tracking
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'agent', -- 'agent', 'lead', 'manager'
  avatar_url TEXT,
  assigned_categories TEXT, -- JSON array: ['shipping', 'refunds']
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CLICKUP WEBHOOKS TABLE
-- Track registered webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS clickup_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  events TEXT, -- JSON array of event types
  list_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_received_at DATETIME
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_flow_type ON sessions(flow_type);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);
CREATE INDEX IF NOT EXISTS idx_sessions_customer_email ON sessions(customer_email);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_session_id ON cases(session_id);
CREATE INDEX IF NOT EXISTS idx_cases_order_number ON cases(order_number);
CREATE INDEX IF NOT EXISTS idx_cases_customer_email ON cases(customer_email);
CREATE INDEX IF NOT EXISTS idx_cases_clickup_task_id ON cases(clickup_task_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_comments_case_id ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_case_id ON case_activity(case_id);

CREATE INDEX IF NOT EXISTS idx_survey_session_id ON survey_responses(session_id);

-- ============================================
-- DEFAULT DATA
-- ============================================
INSERT OR IGNORE INTO admin_users (username, password_hash, name, role)
VALUES ('admin', 'PLACEHOLDER_HASH', 'Administrator', 'admin');
