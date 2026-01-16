/**
 * Policy Configuration - Business rules and limits
 */

export const POLICY_CONFIG = {
  // Guarantee period in days
  GUARANTEE_DAYS: 90,

  // Fulfillment cutoff in hours (for order cancellation)
  FULFILLMENT_CUTOFF_HOURS: 10,

  // In-transit voice escalation after X days
  IN_TRANSIT_VOICE_DAYS: 6,

  // In-transit automatic escalation after X days
  IN_TRANSIT_ESCALATE_DAYS: 15,

  // Refund ladder percentages
  REFUND_LADDER: [20, 30, 40, 50],

  // Shipping ladder: [refund%, includes reship]
  SHIPPING_LADDER: [
    { refund: 10, reship: true },
    { refund: 20, reship: true },
  ],

  // Subscription discount ladder
  SUBSCRIPTION_LADDER: [10, 15, 20],

  // Maximum bulk selection
  MAX_BULK_SELECT: 100,

  // Items per page
  ITEMS_PER_PAGE: 50,

  // Session refresh interval (ms)
  REFRESH_INTERVAL: 30000,
} as const;

export const SLA_CONFIG = {
  // Target resolution time in hours
  TARGET_HOURS: 24,

  // Warning threshold in hours
  WARNING_HOURS: 16,

  // Escalation threshold in hours
  ESCALATION_HOURS: 48,
} as const;

export const CHINA_CARRIERS = [
  'yanwen',
  'china-post',
  '4px',
  'cainiao',
  'yun-express',
  'sfb2c',
  'china-ems',
] as const;

export function isChinaCarrier(carrier: string): boolean {
  const normalized = carrier.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CHINA_CARRIERS.some(
    (c) => normalized.includes(c.replace('-', '')) || c.replace('-', '').includes(normalized)
  );
}
