-- Migration 004: Hub Enhancements v2
-- Run with: wrangler d1 execute puppypad-resolution-analytics --file=./migrations/004_hub_enhancements_v2.sql

-- ============================================
-- EMAIL TEMPLATES TABLE
-- Stores email templates with dynamic variables
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT UNIQUE NOT NULL,       -- e.g., 'refund_partial_20', 'shipping_reship'
  template_name TEXT NOT NULL,             -- Human readable name
  category TEXT NOT NULL,                  -- 'refund', 'return', 'shipping', 'subscription', 'manual'
  subject TEXT NOT NULL,                   -- Email subject line with {{variables}}
  body TEXT NOT NULL,                      -- HTML body with {{variables}}
  variables TEXT,                          -- JSON array of variable names used
  description TEXT,                        -- Brief description of when to use
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin_users(id),
  FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- ============================================
-- ADD NEW COLUMNS TO CASES TABLE
-- For enrichment and tracking
-- ============================================
-- Shopify order status for real-time display
ALTER TABLE cases ADD COLUMN shopify_order_status TEXT;

-- Delivery date from tracking
ALTER TABLE cases ADD COLUMN delivery_date DATETIME;

-- CheckoutChamp subscription URL
ALTER TABLE cases ADD COLUMN checkout_champ_url TEXT;

-- Due date for case completion (24h from creation)
ALTER TABLE cases ADD COLUMN due_date DATETIME;

-- Issue type description (what the customer reported)
ALTER TABLE cases ADD COLUMN issue_description TEXT;

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_cases_due_date ON cases(due_date);

-- ============================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================
INSERT OR IGNORE INTO email_templates (template_key, template_name, category, subject, body, variables, description) VALUES
-- Refund Templates
('refund_partial_20', 'Partial Refund 20%', 'refund', 
 'Your {{refund_percent}}% Refund Has Been Processed - Order {{order_number}}',
 'Hi {{first_name}},

Great news! We''ve processed your {{refund_percent}}% refund of {{refund_amount}} for your order {{order_number}}.

You should see this reflected in your account within 5-10 business days, depending on your bank.

If you have any questions, just reply to this email and we''ll be happy to help!

Best,
The PuppyPad Team 🐾',
 '["first_name", "refund_percent", "refund_amount", "order_number"]',
 'Send after processing a 20% partial refund'),

('refund_partial_50', 'Partial Refund 50%', 'refund',
 'Your {{refund_percent}}% Refund Has Been Processed - Order {{order_number}}',
 'Hi {{first_name}},

Great news! We''ve processed your {{refund_percent}}% refund of {{refund_amount}} for your order {{order_number}}.

You should see this reflected in your account within 5-10 business days, depending on your bank.

If you have any questions, just reply to this email and we''ll be happy to help!

Best,
The PuppyPad Team 🐾',
 '["first_name", "refund_percent", "refund_amount", "order_number"]',
 'Send after processing a 50% partial refund'),

('refund_full', 'Full Refund Processed', 'refund',
 'Your Full Refund Has Been Processed - Order {{order_number}}',
 'Hi {{first_name}},

We''ve processed a full refund of {{refund_amount}} for your order {{order_number}}.

You should see this reflected in your account within 5-10 business days, depending on your bank.

We''re sorry things didn''t work out this time, but we hope you''ll give us another try in the future!

Best,
The PuppyPad Team 🐾',
 '["first_name", "refund_amount", "order_number"]',
 'Send after processing a full refund'),

-- Return Templates
('return_instructions', 'Return Instructions', 'return',
 'Return Instructions for Order {{order_number}}',
 'Hi {{first_name}},

Here are the return instructions for your order {{order_number}}:

Please ship your return to:
PuppyPad Returns
1007 S 12th St.
Watertown, WI 53094
USA

Once we receive and inspect your return, we''ll process your refund within 3-5 business days.

Please note: We recommend using a trackable shipping method so you can confirm delivery.

Let us know if you have any questions!

Best,
The PuppyPad Team 🐾',
 '["first_name", "order_number"]',
 'Send when customer needs return shipping instructions'),

('return_received', 'Return Received & Refund Processed', 'return',
 'We''ve Received Your Return - Order {{order_number}}',
 'Hi {{first_name}},

Good news! We''ve received your return for order {{order_number}} and have processed your refund of {{refund_amount}}.

You should see this reflected in your account within 5-10 business days, depending on your bank.

Thank you for giving PuppyPad a try. We hope to see you again!

Best,
The PuppyPad Team 🐾',
 '["first_name", "order_number", "refund_amount"]',
 'Send after receiving return and processing refund'),

-- Shipping Templates
('shipping_reship', 'Replacement Order Shipped', 'shipping',
 'Your Replacement is On Its Way! - Order {{order_number}}',
 'Hi {{first_name}},

Great news! We''ve shipped out your replacement order.

Here''s your tracking number: {{tracking_number}}

You should receive it within 5-7 business days. We''ll send you updates as your package makes its way to you.

Thank you for your patience, and sorry again for the inconvenience!

Best,
The PuppyPad Team 🐾',
 '["first_name", "order_number", "tracking_number"]',
 'Send when shipping a replacement order'),

('shipping_delay', 'Shipping Delay Update', 'shipping',
 'Update on Your Order {{order_number}}',
 'Hi {{first_name}},

We wanted to give you an update on your order {{order_number}}.

We''ve noticed your package has been in transit longer than expected. We''re actively monitoring it and working with the carrier to get it to you as quickly as possible.

Current tracking: {{tracking_number}}

If your package doesn''t arrive within the next few days, please let us know and we''ll take care of you.

Best,
The PuppyPad Team 🐾',
 '["first_name", "order_number", "tracking_number"]',
 'Send when package is delayed in transit'),

('shipping_lost', 'Lost Package Resolution', 'shipping',
 'Resolution for Your Lost Package - Order {{order_number}}',
 'Hi {{first_name}},

We''re so sorry about the trouble with your order {{order_number}}. After investigating with the carrier, we''ve determined the package was lost in transit.

We''ve [shipped a replacement / processed a full refund] for you.

{{#if tracking_number}}Your new tracking number is: {{tracking_number}}{{/if}}

Again, we apologize for this inconvenience and appreciate your patience!

Best,
The PuppyPad Team 🐾',
 '["first_name", "order_number", "tracking_number"]',
 'Send when package is confirmed lost'),

-- Subscription Templates  
('subscription_paused', 'Subscription Paused Confirmation', 'subscription',
 'Your PuppyPad Subscription Has Been Paused',
 'Hi {{first_name}},

Your subscription has been paused as requested.

Your next delivery will resume on {{pause_resume_date}}.

If you need to make any changes or have questions, just reply to this email!

Best,
The PuppyPad Team 🐾',
 '["first_name", "pause_resume_date"]',
 'Send after pausing a subscription'),

('subscription_cancelled', 'Subscription Cancelled Confirmation', 'subscription',
 'Your PuppyPad Subscription Has Been Cancelled',
 'Hi {{first_name}},

We''ve cancelled your subscription as requested.

We''re sorry to see you go! If you ever want to restart, you can do so anytime from your account or just reach out to us.

If there''s anything we could have done better, we''d love to hear your feedback.

Best,
The PuppyPad Team 🐾',
 '["first_name"]',
 'Send after cancelling a subscription'),

('subscription_updated', 'Subscription Updated', 'subscription',
 'Your Subscription Has Been Updated',
 'Hi {{first_name}},

We''ve updated your subscription as requested.

Your new delivery schedule is now set. You''ll receive your next shipment according to the new frequency.

If you have any questions about this change, just let us know!

Best,
The PuppyPad Team 🐾',
 '["first_name"]',
 'Send after updating subscription schedule or address'),

-- Manual/General Templates
('manual_followup', 'General Follow-up', 'manual',
 'Following Up on Your Request - Case {{case_id}}',
 'Hi {{first_name}},

Just following up on your recent request (Case: {{case_id}}).

[Add your personalized follow-up message here]

Let us know if you have any other questions!

Best,
The PuppyPad Team 🐾',
 '["first_name", "case_id"]',
 'General follow-up template for manual cases'),

('manual_escalation', 'Escalation Response', 'manual',
 'Update on Your Case {{case_id}}',
 'Hi {{first_name}},

Thank you for your patience while we looked into this further.

[Add resolution details here]

We apologize for any inconvenience this may have caused. If you have any other concerns, please don''t hesitate to reach out.

Best,
The PuppyPad Team 🐾',
 '["first_name", "case_id"]',
 'Template for escalated cases');

-- ============================================
-- ADD MORE SOP LINKS
-- Extend the existing sop_links table
-- ============================================
INSERT OR IGNORE INTO sop_links (scenario_key, scenario_name, case_type, sop_url, description) VALUES
('refund_preshipment', 'Pre-Shipment Cancellation', 'refund', 'https://docs.puppypad.com/sop/refunds#preshipment', 'Handling cancellations before order ships'),
('shipping_reship', 'Reship Order', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#reship', 'How to create and send replacement orders'),
('shipping_investigation', 'Carrier Investigation', 'shipping', 'https://docs.puppypad.com/sop/shipping-issues#investigation', 'Opening carrier investigations for lost/damaged'),
('subscription_skip', 'Skip Shipment', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#skip', 'Skipping next subscription shipment'),
('subscription_reactivate', 'Reactivate Subscription', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#reactivate', 'Reactivating paused or cancelled subscriptions'),
('subscription_billing', 'Billing Issues', 'subscription', 'https://docs.puppypad.com/sop/subscriptions#billing', 'Handling failed payments and billing disputes'),
('manual_vip', 'VIP Customer Handling', 'manual', 'https://docs.puppypad.com/sop/vip-customers', 'Special handling for VIP/influencer customers'),
('return_damaged_received', 'Damaged Return Processing', 'return', 'https://docs.puppypad.com/sop/returns#damaged', 'Processing returns that arrive damaged');
