/**
 * Shared Formatting Utilities
 * Consolidates all formatting functions to avoid duplication
 */

// ============================================
// DATE FORMATTING
// ============================================

const DATE_FORMATS = {
  SHORT: { month: 'short', day: 'numeric', year: 'numeric' },
  WITH_TIME: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  ISO: { year: 'numeric', month: '2-digit', day: '2-digit' }
};

/**
 * Format a date for display (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', DATE_FORMATS.SHORT);
  } catch {
    return '-';
  }
}

/**
 * Format a date with time (e.g., "Jan 15, 2024, 2:30 PM")
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', DATE_FORMATS.WITH_TIME);
  } catch {
    return '-';
  }
}

/**
 * Get relative time ago (e.g., "2 hours ago")
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '-';
  try {
    const now = Date.now();
    const date = new Date(timestamp).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(timestamp);
  } catch {
    return '-';
  }
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format a number as currency
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '-';
  const num = parseFloat(amount);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(num);
}

/**
 * Format a simple dollar amount (e.g., "$49.99")
 */
export function formatDollarAmount(amount) {
  if (amount === null || amount === undefined) return '-';
  const num = parseFloat(amount);
  if (isNaN(num)) return '-';
  return '$' + num.toFixed(2);
}

// ============================================
// STRING FORMATTING
// ============================================

/**
 * Convert snake_case or kebab-case to Title Case
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = { textContent: text };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Clean phone number to digits only
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Clean order number (remove # prefix)
 */
export function cleanOrderNumber(orderNumber) {
  if (!orderNumber) return '';
  return orderNumber.toString().replace('#', '').trim();
}

// ============================================
// RESOLUTION FORMATTING
// Unified function for formatting resolution for display
// ============================================

const RESOLUTION_MAP = {
  'partial_refund_20': 'Give 20% partial refund - customer keeps product',
  'partial_refund_30': 'Give 30% partial refund - customer keeps product',
  'partial_refund_40': 'Give 40% partial refund - customer keeps product',
  'partial_refund_50': 'Give 50% partial refund - customer keeps product',
  'full_refund': 'Full refund',
  'full_refund_keep': 'Full refund - customer keeps product',
  'replacement': 'Send replacement',
  'replacement_free': 'Send free replacement',
  'store_credit': 'Store credit',
  'contact_carrier': 'Contact carrier',
  'wait_for_delivery': 'Wait for delivery',
  'reship': 'Reship order',
  'address_correction': 'Correct address and reship',
  'pause_subscription': 'Pause subscription',
  'cancel_subscription': 'Cancel subscription',
  'change_schedule': 'Change delivery schedule',
  'change_address': 'Update shipping address',
  'escalate': 'Escalate to supervisor'
};

/**
 * Format resolution code to human-readable string
 */
export function formatResolution(resolutionCode, caseData = null) {
  if (!resolutionCode) return 'No resolution';

  // Check if it's a known code
  if (RESOLUTION_MAP[resolutionCode]) {
    let result = RESOLUTION_MAP[resolutionCode];

    // Add refund amount if available
    if (caseData?.refund_amount && resolutionCode.includes('refund')) {
      result += ` (${formatDollarAmount(caseData.refund_amount)})`;
    }

    return result;
  }

  // Fall back to title case conversion
  return toTitleCase(resolutionCode);
}

// ============================================
// TRACKING STATUS FORMATTING
// ============================================

const TRACKING_STATUS_MAP = {
  'pending': 'Pending',
  'info_received': 'Info Received',
  'in_transit': 'In Transit',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'available_for_pickup': 'Available for Pickup',
  'failed_attempt': 'Failed Attempt',
  'exception': 'Exception',
  'expired': 'Expired',
  'unknown': 'Unknown'
};

/**
 * Format tracking status for display
 */
export function formatTrackingStatus(status) {
  if (!status) return 'Unknown';
  return TRACKING_STATUS_MAP[status.toLowerCase()] || toTitleCase(status);
}
