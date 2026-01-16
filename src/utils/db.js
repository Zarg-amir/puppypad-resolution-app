/**
 * Database Utilities
 * D1 database helpers for the PuppyPad Resolution Worker
 */

// Track if migrations have run (in-memory flag)
let migrationsRun = false;

/**
 * Run database migrations
 */
export async function runMigrations(env) {
  if (migrationsRun || !env.ANALYTICS_DB) return;
  migrationsRun = true;

  const migrations = [
    'ALTER TABLE cases ADD COLUMN extra_data TEXT',
    'ALTER TABLE cases ADD COLUMN issue_type TEXT',
  ];

  for (const sql of migrations) {
    try {
      await env.ANALYTICS_DB.prepare(sql).run();
      console.log('Migration success:', sql.substring(0, 50));
    } catch (e) {
      // Column likely already exists - ignore
      if (!e.message.includes('duplicate column')) {
        console.log('Migration skipped:', e.message.substring(0, 50));
      }
    }
  }
}

/**
 * Generate a unique case ID
 */
export function generateCaseId(prefix = 'HLP') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Log an event to the database
 */
export async function logEvent(env, eventData) {
  if (!env.ANALYTICS_DB) return;

  const {
    sessionId,
    eventType,
    eventName,
    eventData: data,
    flowType,
    orderNumber,
    timestamp
  } = eventData;

  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO events (session_id, event_type, event_name, event_data, flow_type, order_number, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId || null,
      eventType || 'general',
      eventName || 'unknown',
      typeof data === 'object' ? JSON.stringify(data) : data,
      flowType || null,
      orderNumber || null,
      timestamp || new Date().toISOString()
    ).run();
  } catch (e) {
    console.error('Failed to log event:', e);
  }
}

/**
 * Log a case to the database
 */
export async function logCase(env, caseData) {
  if (!env.ANALYTICS_DB) return;

  const {
    caseId,
    sessionId,
    caseType,
    customerEmail,
    customerName,
    orderNumber,
    resolution,
    refundAmount,
    selectedItems,
    clickupTaskId,
    issueType,
    extraData
  } = caseData;

  try {
    // Try with extra_data first, fall back to basic insert
    try {
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO cases (
          case_id, session_id, case_type, customer_email, customer_name,
          order_number, resolution, refund_amount, selected_items,
          clickup_task_id, status, issue_type, extra_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'))
      `).bind(
        caseId,
        sessionId || null,
        caseType || 'manual',
        customerEmail || null,
        customerName || null,
        orderNumber || null,
        resolution || null,
        refundAmount || null,
        selectedItems ? JSON.stringify(selectedItems) : null,
        clickupTaskId || null,
        issueType || null,
        extraData ? JSON.stringify(extraData) : null
      ).run();
    } catch (e) {
      // Fallback without extra columns
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO cases (
          case_id, session_id, case_type, customer_email, customer_name,
          order_number, resolution, refund_amount, selected_items,
          clickup_task_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(
        caseId,
        sessionId || null,
        caseType || 'manual',
        customerEmail || null,
        customerName || null,
        orderNumber || null,
        resolution || null,
        refundAmount || null,
        selectedItems ? JSON.stringify(selectedItems) : null,
        clickupTaskId || null
      ).run();
    }
  } catch (e) {
    console.error('Failed to log case:', e);
  }
}

/**
 * Update case status
 */
export async function updateCaseStatus(env, caseId, status, actor = null) {
  if (!env.ANALYTICS_DB) return;

  try {
    await env.ANALYTICS_DB.prepare(`
      UPDATE cases SET status = ?, updated_at = datetime('now') WHERE case_id = ?
    `).bind(status, caseId).run();

    // Log activity
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO case_activity (case_id, activity_type, field_name, old_value, new_value, actor, timestamp)
      VALUES (?, 'status_change', 'status', NULL, ?, ?, datetime('now'))
    `).bind(caseId, status, actor || 'system').run();
  } catch (e) {
    console.error('Failed to update case status:', e);
  }
}

/**
 * Get case by ID
 */
export async function getCaseById(env, caseId) {
  if (!env.ANALYTICS_DB) return null;

  try {
    const result = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM cases WHERE case_id = ?
    `).bind(caseId).first();
    return result;
  } catch (e) {
    console.error('Failed to get case:', e);
    return null;
  }
}

/**
 * Check if a case already exists for this customer/order/type
 */
export async function checkExistingCase(env, customerEmail, orderNumber, caseType) {
  if (!env.ANALYTICS_DB) return null;

  try {
    const result = await env.ANALYTICS_DB.prepare(`
      SELECT case_id, clickup_task_id, status, created_at
      FROM cases
      WHERE customer_email = ? AND order_number = ? AND case_type = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(customerEmail, orderNumber, caseType).first();
    return result;
  } catch (e) {
    console.error('Failed to check existing case:', e);
    return null;
  }
}
