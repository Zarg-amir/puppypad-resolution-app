-- Resolution Hub Enhancements Migration
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./migrations/002_hub_enhancements.sql

-- ============================================
-- SAVED VIEWS TABLE
-- User-saved filter combinations
-- ============================================
CREATE TABLE IF NOT EXISTS saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  filters TEXT NOT NULL, -- JSON: {status, caseType, assignedTo, dateRange, priority, search}
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

-- ============================================
-- SOP LINKS TABLE
-- Configurable SOP links for different scenarios
-- ============================================
CREATE TABLE IF NOT EXISTS sop_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_key TEXT UNIQUE NOT NULL, -- e.g., 'refund_partial', 'shipping_lost', 'subscription_cancel'
  scenario_name TEXT NOT NULL, -- Human readable name
  case_type TEXT NOT NULL, -- 'refund', 'return', 'shipping', 'subscription', 'manual'
  sop_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id),
  FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- ============================================
-- AUDIT LOG TABLE
-- Granular activity logging (admin visible only)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_email TEXT,
  user_name TEXT,
  action_type TEXT NOT NULL, -- 'case_status_change', 'case_comment', 'view_created', 'sop_updated', 'user_created', 'bulk_action', 'assignment_change', 'login', 'logout', etc.
  action_category TEXT NOT NULL, -- 'cases', 'views', 'sop', 'users', 'system', 'auth'
  resource_type TEXT, -- 'case', 'view', 'sop_link', 'user', etc.
  resource_id TEXT, -- ID of the affected resource
  details TEXT, -- JSON with full context
  old_value TEXT, -- Previous value (for changes)
  new_value TEXT, -- New value (for changes)
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ASSIGNMENT QUEUE TABLE
-- Round robin assignment tracking
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  case_type TEXT, -- NULL means all types, or specific: 'refund', 'shipping', etc.
  is_active BOOLEAN DEFAULT TRUE,
  current_load INTEGER DEFAULT 0, -- Number of currently assigned open cases
  max_load INTEGER DEFAULT 10, -- Maximum cases at once
  last_assigned_at DATETIME,
  sort_order INTEGER DEFAULT 0, -- Position in round robin queue
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

-- ============================================
-- COMPLETION CHECKLISTS TABLE
-- Checklist items per case type/resolution
-- ============================================
CREATE TABLE IF NOT EXISTS completion_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_type TEXT NOT NULL,
  resolution_pattern TEXT, -- NULL for all, or pattern like 'partial_%', 'full_refund'
  checklist_item TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHECKLIST COMPLETIONS TABLE
-- Track which items were checked for each case
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  checklist_item_id INTEGER NOT NULL,
  completed_by INTEGER NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(case_id),
  FOREIGN KEY (checklist_item_id) REFERENCES completion_checklists(id),
  FOREIGN KEY (completed_by) REFERENCES admin_users(id)
);

-- ============================================
-- RESOLUTION TIME METRICS TABLE
-- Pre-computed metrics for faster dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS resolution_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT UNIQUE NOT NULL,
  time_to_first_response INTEGER, -- seconds
  time_to_resolution INTEGER, -- seconds
  time_in_pending INTEGER, -- seconds
  time_in_progress INTEGER, -- seconds
  time_in_waiting INTEGER, -- seconds
  status_changes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- ============================================
-- ROOT CAUSE CATEGORIES TABLE
-- For categorizing issues
-- ============================================
CREATE TABLE IF NOT EXISTS root_cause_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL,
  parent_category_id INTEGER,
  case_type TEXT, -- Which case types this applies to
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_category_id) REFERENCES root_cause_categories(id)
);

-- ============================================
-- CASE ROOT CAUSES TABLE
-- Link cases to root causes
-- ============================================
CREATE TABLE IF NOT EXISTS case_root_causes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  root_cause_id INTEGER NOT NULL,
  notes TEXT,
  assigned_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(case_id),
  FOREIGN KEY (root_cause_id) REFERENCES root_cause_categories(id),
  FOREIGN KEY (assigned_by) REFERENCES admin_users(id)
);

-- ============================================
-- CUSTOMER HISTORY TABLE
-- Aggregated customer data for quick lookup
-- ============================================
CREATE TABLE IF NOT EXISTS customer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_email TEXT UNIQUE NOT NULL,
  total_cases INTEGER DEFAULT 0,
  total_refunds REAL DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  return_count INTEGER DEFAULT 0,
  shipping_issue_count INTEGER DEFAULT 0,
  subscription_case_count INTEGER DEFAULT 0,
  first_case_at DATETIME,
  last_case_at DATETIME,
  avg_satisfaction_rating REAL,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- UPDATE ADMIN_USERS TABLE
-- Add fields for enhanced role management
-- ============================================
ALTER TABLE admin_users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN created_by INTEGER REFERENCES admin_users(id);
ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE admin_users ADD COLUMN last_activity_at DATETIME;

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_links_case_type ON sop_links(case_type);
CREATE INDEX IF NOT EXISTS idx_sop_links_scenario ON sop_links(scenario_key);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_queue_active ON assignment_queue(is_active, case_type);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_case ON checklist_completions(case_id);
CREATE INDEX IF NOT EXISTS idx_resolution_metrics_case ON resolution_metrics(case_id);
CREATE INDEX IF NOT EXISTS idx_customer_history_email ON customer_history(customer_email);
CREATE INDEX IF NOT EXISTS idx_case_root_causes_case ON case_root_causes(case_id);

-- ============================================
-- DEFAULT COMPLETION CHECKLIST ITEMS
-- ============================================
-- Refund checklists
INSERT OR IGNORE INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required) VALUES
  ('refund', 'partial_%', 'Refund processed in Shopify', 1, 1),
  ('refund', 'partial_%', 'Customer notified of refund', 2, 0),
  ('refund', 'full_refund', 'Full refund processed in Shopify', 1, 1),
  ('refund', 'full_refund', 'Customer notified of refund', 2, 0),
  ('refund', NULL, 'Case notes updated', 3, 0);

-- Return checklists
INSERT OR IGNORE INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required) VALUES
  ('return', NULL, 'Return received and inspected', 1, 1),
  ('return', NULL, 'Refund processed after inspection', 2, 1),
  ('return', NULL, 'Customer notified of completion', 3, 0);

-- Shipping checklists
INSERT OR IGNORE INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required) VALUES
  ('shipping', 'reship%', 'Replacement order created in Shopify', 1, 1),
  ('shipping', 'reship%', 'New tracking provided to customer', 2, 0),
  ('shipping', NULL, 'Carrier investigation completed', 1, 0),
  ('shipping', NULL, 'Resolution communicated to customer', 2, 0);

-- Subscription checklists
INSERT OR IGNORE INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required) VALUES
  ('subscription', 'pause%', 'Subscription paused in CheckoutChamp', 1, 1),
  ('subscription', 'cancel%', 'Subscription cancelled in CheckoutChamp', 1, 1),
  ('subscription', 'change_address%', 'Address updated in CheckoutChamp', 1, 1),
  ('subscription', 'change_schedule%', 'Schedule updated in CheckoutChamp', 1, 1),
  ('subscription', NULL, 'Customer notified of changes', 2, 0);

-- Manual checklists
INSERT OR IGNORE INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required) VALUES
  ('manual', NULL, 'Issue fully investigated', 1, 1),
  ('manual', NULL, 'Resolution actioned', 2, 1),
  ('manual', NULL, 'Customer notified', 3, 0);

-- ============================================
-- DEFAULT SOP LINKS
-- ============================================
INSERT OR IGNORE INTO sop_links (scenario_key, scenario_name, case_type, sop_url, description) VALUES
  ('refund_partial', 'Partial Refund', 'refund', 'https://docs.puppypad.com/sop/refunds#partial', 'Processing partial refunds'),
  ('refund_full', 'Full Refund', 'refund', 'https://docs.puppypad.com/sop/refunds#full', 'Processing full refunds'),
  ('refund_quality', 'Quality Difference', 'refund', 'https://docs.puppypad.com/sop/quality-difference', 'Handling quality difference cases'),
  ('return_standard', 'Standard Return', 'return', 'https://docs.puppypad.com/sop/returns', 'Processing standard returns'),
  ('return_international', 'International Return', 'return', 'https://docs.puppypad.com/sop/returns#international', 'Processing international returns'),
  ('shipping_lost', 'Lost Package', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#lost', 'Handling lost packages'),
  ('shipping_damaged', 'Damaged in Transit', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#damaged', 'Handling damaged shipments'),
  ('shipping_wrong', 'Wrong Item Shipped', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#wrong-item', 'Handling wrong item issues'),
  ('shipping_address', 'Address Change', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#address', 'Processing address changes'),
  ('subscription_pause', 'Pause Subscription', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#pause', 'Pausing subscriptions'),
  ('subscription_cancel', 'Cancel Subscription', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#cancel', 'Cancelling subscriptions'),
  ('subscription_schedule', 'Change Schedule', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#schedule', 'Changing delivery schedule'),
  ('subscription_address', 'Update Address', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#address', 'Updating subscription address'),
  ('manual_escalation', 'Escalation', 'manual', 'https://docs.puppypad.com/sop/escalations', 'Handling escalations'),
  ('manual_general', 'General Inquiry', 'manual', 'https://docs.puppypad.com/sop/general-inquiries', 'Handling general inquiries');

-- ============================================
-- DEFAULT ROOT CAUSE CATEGORIES
-- ============================================
INSERT OR IGNORE INTO root_cause_categories (category_name, case_type) VALUES
  ('Product Quality', 'refund'),
  ('Not as Expected', 'refund'),
  ('Changed Mind', 'refund'),
  ('Found Better Price', 'refund'),
  ('Duplicate Order', 'refund'),
  ('Carrier Lost Package', 'shipping'),
  ('Carrier Damaged Package', 'shipping'),
  ('Delivered to Wrong Address', 'shipping'),
  ('Customer Not Home', 'shipping'),
  ('Address Entry Error', 'shipping'),
  ('Warehouse Shipped Wrong Item', 'shipping'),
  ('Too Expensive', 'subscription'),
  ('Not Using Product', 'subscription'),
  ('Found Alternative', 'subscription'),
  ('Delivery Too Frequent', 'subscription'),
  ('Delivery Not Frequent Enough', 'subscription'),
  ('Moving/Relocation', 'subscription'),
  ('Financial Reasons', 'subscription');
