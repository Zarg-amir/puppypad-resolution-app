/**
 * ClickUp Service
 * Unified API client for ClickUp task management
 */

import { CLICKUP_CONFIG, getClickUpListId, getCasePrefix } from '../config/clickup.js';
import { SOP_URLS } from '../config/constants.js';
import { formatDate, formatDollarAmount, toTitleCase } from '../utils/formatters.js';

/**
 * ClickUp API client class
 * Centralizes all ClickUp API interactions
 */
export class ClickUpClient {
  constructor(env) {
    this.apiKey = env.CLICKUP_API_KEY;
    this.baseUrl = 'https://api.clickup.com/api/v2';
  }

  /**
   * Make an API request to ClickUp
   */
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      console.error(`ClickUp API error: ${response.status} for ${endpoint}`);
      return null;
    }

    return response.json();
  }

  /**
   * Create a task in a list
   */
  async createTask(listId, taskData) {
    return this.request(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  /**
   * Add a comment to a task
   */
  async addComment(taskId, comment) {
    return this.request(`/task/${taskId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }

  /**
   * Update a custom field on a task
   */
  async updateField(taskId, fieldId, value) {
    return this.request(`/task/${taskId}/field/${fieldId}`, {
      method: 'POST',
      body: JSON.stringify({ value })
    });
  }

  /**
   * Get a task by ID
   */
  async getTask(taskId) {
    return this.request(`/task/${taskId}`);
  }
}

/**
 * Format resolution to human-readable text
 */
function formatResolutionText(resolution, caseData = null) {
  const resolutionMap = {
    'partial_refund_20': 'Give 20% partial refund',
    'partial_refund_30': 'Give 30% partial refund',
    'partial_refund_40': 'Give 40% partial refund',
    'partial_refund_50': 'Give 50% partial refund',
    'full_refund': 'Full refund',
    'full_refund_keep': 'Full refund - customer keeps product',
    'replacement': 'Send replacement',
    'replacement_free': 'Send free replacement',
    'store_credit': 'Store credit',
    'contact_carrier': 'Contact carrier',
    'wait_for_delivery': 'Wait for delivery',
    'reship': 'Reship order',
    'escalate': 'Escalate to supervisor'
  };

  let text = resolutionMap[resolution] || toTitleCase(resolution || 'No resolution');

  if (caseData?.refundAmount && resolution?.includes('refund')) {
    text += ` (${formatDollarAmount(caseData.refundAmount)})`;
  }

  return text;
}

/**
 * Format order issue for display
 */
function formatOrderIssue(caseData) {
  const { issueType, caseType, reason, selectedItems } = caseData;

  // Use explicit issue type if provided
  if (issueType) {
    const issueMap = {
      'quality_difference': 'Quality difference from pictures',
      'arrived_damaged': 'Product arrived damaged',
      'wrong_item': 'Wrong item received',
      'missing_item': 'Missing item',
      'not_as_described': 'Not as described',
      'defective': 'Product defective'
    };
    return issueMap[issueType] || toTitleCase(issueType);
  }

  // Build from case type
  if (caseType === 'refund') {
    return reason ? `Refund request: ${toTitleCase(reason)}` : 'Refund request';
  }
  if (caseType === 'return') {
    return reason ? `Return request: ${toTitleCase(reason)}` : 'Return request';
  }
  if (caseType === 'shipping') {
    return reason ? `Shipping issue: ${toTitleCase(reason)}` : 'Shipping issue';
  }
  if (caseType === 'subscription') {
    return reason ? `Subscription: ${toTitleCase(reason)}` : 'Subscription inquiry';
  }

  return reason ? toTitleCase(reason) : 'Customer inquiry';
}

/**
 * Build custom fields array for ClickUp task
 */
function buildCustomFields(caseData, formattedResolution, orderIssue) {
  const fields = [
    { id: CLICKUP_CONFIG.fields.caseId, value: caseData.caseId },
    { id: CLICKUP_CONFIG.fields.emailAddress, value: caseData.email || '' },
    { id: CLICKUP_CONFIG.fields.resolution, value: formattedResolution },
    { id: CLICKUP_CONFIG.fields.orderIssue, value: orderIssue },
  ];

  if (caseData.orderNumber) {
    fields.push({ id: CLICKUP_CONFIG.fields.orderNumber, value: caseData.orderNumber });
  }

  if (caseData.orderUrl) {
    fields.push({ id: CLICKUP_CONFIG.fields.orderUrl, value: caseData.orderUrl });
  }

  if (caseData.refundAmount) {
    fields.push({ id: CLICKUP_CONFIG.fields.refundAmount, value: String(caseData.refundAmount) });
  }

  if (caseData.selectedItems) {
    const itemsText = Array.isArray(caseData.selectedItems)
      ? caseData.selectedItems.map(i => `${i.title} (${i.sku})`).join(', ')
      : caseData.selectedItems;
    fields.push({ id: CLICKUP_CONFIG.fields.selectedItems, value: itemsText });
  }

  // Carrier issue dropdown for shipping cases
  if (caseData.caseType === 'shipping' && caseData.carrierIssue) {
    const optionId = CLICKUP_CONFIG.options.carrierIssue[caseData.carrierIssue];
    if (optionId) {
      fields.push({ id: CLICKUP_CONFIG.fields.carrierIssue, value: optionId });
    }
  }

  // Return status for return cases
  if (caseData.caseType === 'return') {
    fields.push({
      id: CLICKUP_CONFIG.fields.returnStatus,
      value: CLICKUP_CONFIG.options.returnStatus.awaitingReturn
    });
  }

  // Subscription fields
  if (caseData.caseType === 'subscription') {
    if (caseData.actionType) {
      const actionId = CLICKUP_CONFIG.options.actionType[caseData.actionType];
      if (actionId) {
        fields.push({ id: CLICKUP_CONFIG.fields.actionType, value: actionId });
      }
    }
    if (caseData.subscriptionStatus) {
      const statusId = CLICKUP_CONFIG.options.subscriptionStatus[caseData.subscriptionStatus];
      if (statusId) {
        fields.push({ id: CLICKUP_CONFIG.fields.subscriptionStatus, value: statusId });
      }
    }
  }

  return fields;
}

/**
 * Build ClickUp comment with rich text formatting
 */
function buildComment(caseData, orderIssue, formattedResolution, sopUrl) {
  const comment = [];

  const addBoldLine = (label, value) => {
    comment.push({ text: label, attributes: { bold: true } });
    comment.push({ text: ` ${value}\n` });
  };

  // Header
  comment.push({ text: '📋 CASE DETAILS\n\n', attributes: { bold: true } });

  // Core info
  addBoldLine('Issue:', orderIssue);
  addBoldLine('Resolution:', formattedResolution);
  comment.push({ text: '\n' });
  addBoldLine('Customer Email:', caseData.email || 'Not provided');
  addBoldLine('Order Number:', caseData.orderNumber || 'N/A');
  addBoldLine('Order Date:', formatDate(caseData.orderDate));
  addBoldLine('Order Value:', caseData.refundAmount ? formatDollarAmount(caseData.refundAmount) : 'N/A');

  // Selected items
  if (caseData.selectedItems?.length > 0) {
    comment.push({ text: '\n' });
    comment.push({ text: '📦 ITEMS:\n', attributes: { bold: true } });
    caseData.selectedItems.forEach(item => {
      comment.push({ text: `• ${item.title} (${item.sku})\n` });
    });
  }

  // Links
  comment.push({ text: '\n' });
  comment.push({ text: '🔗 LINKS:\n', attributes: { bold: true } });
  if (caseData.orderUrl) {
    comment.push({ text: `• Shopify Order: ${caseData.orderUrl}\n` });
  }
  if (caseData.sessionReplayUrl) {
    comment.push({ text: `• Session Replay: ${caseData.sessionReplayUrl}\n` });
  }
  comment.push({ text: `• SOP Guide: ${sopUrl}\n` });

  return comment;
}

/**
 * Create a case task in ClickUp
 */
export async function createCaseTask(env, caseData) {
  const client = new ClickUpClient(env);
  const listId = getClickUpListId(caseData.caseType);

  const formattedResolution = formatResolutionText(caseData.resolution, caseData);
  const orderIssue = formatOrderIssue(caseData);
  const customFields = buildCustomFields(caseData, formattedResolution, orderIssue);

  // Due date: 24 hours from now
  const dueDate = Date.now() + (24 * 60 * 60 * 1000);

  // Create task
  const task = await client.createTask(listId, {
    name: caseData.customerName || 'Unknown Customer',
    description: '',
    custom_fields: customFields,
    due_date: dueDate,
    due_date_time: true
  });

  if (!task) return null;

  // Add detailed comment
  const sopUrl = caseData.issueType === 'quality_difference'
    ? SOP_URLS.quality_difference
    : (SOP_URLS[caseData.caseType] || SOP_URLS.manual);

  const comment = buildComment(caseData, orderIssue, formattedResolution, sopUrl);
  await client.addComment(task.id, comment);

  return task;
}

/**
 * Update task with conversation URL
 */
export async function updateConversationUrl(env, taskId, conversationNo) {
  const client = new ClickUpClient(env);
  const conversationUrl = `https://app.richpanel.com/agent/inbox/conversation/${conversationNo}`;
  return client.updateField(taskId, CLICKUP_CONFIG.fields.conversationUrl, conversationUrl);
}

/**
 * Add a comment to an existing task
 */
export async function addTaskComment(env, taskId, commentText) {
  const client = new ClickUpClient(env);
  const comment = [{ text: commentText }];
  return client.addComment(taskId, comment);
}
