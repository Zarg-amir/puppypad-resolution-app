/**
 * Application Constants and Configuration
 * Centralized configuration for the PuppyPad Resolution Worker
 */

// ============================================
// POLICY SETTINGS
// ============================================
export const POLICY_CONFIG = {
  guaranteeDays: 90,              // Money-back guarantee period
  fulfillmentCutoffHours: 10,     // Hours before fulfillment check applies
};

// ============================================
// ADMIN SETTINGS
// ============================================
export const ADMIN_CONFIG = {
  tokenSecret: 'puppypad-admin-secret-2025',  // Change in production!
  setupKey: 'puppypad-setup-2025',            // One-time setup key
  tokenExpiryHours: 24,
};

// ============================================
// RICHPANEL INTEGRATION
// ============================================
export const RICHPANEL_CONFIG = {
  testEmail: 'zarg.business@gmail.com',        // Test mode routes all emails here
  supportEmail: 'help@teampuppypad.com',       // Production support email
};

// ============================================
// CHINA/INTERNATIONAL CARRIERS
// These carriers should be hidden from customers
// ============================================
export const CHINA_CARRIERS = [
  'yunexpress', 'yun express',
  'yanwen', 'yanwen express',
  '4px', '4px express', '4px worldwide express',
  'cne', 'cne express', 'cnexps',
  'cainiao', 'cainiao super economy',
  'china post', 'china ems', 'epacket',
  'sf express', 'sf international',
  'sto express', 'shentong',
  'yto express', 'yuantong',
  'zto express', 'zhongtong',
  'best express', 'best inc',
  'jd logistics', 'jingdong',
  'sunyou', 'sun you',
  'anjun', 'anjun logistics',
  'winit', 'wan b',
  'flyt express', 'flytexpress',
  'equick', 'equick china',
  'ubi logistics', 'ubi smart parcel',
  'toll', 'toll priority', 'toll ipec',
  'speedpak',
];

// ============================================
// SOP URLS
// ============================================
export const SOP_URLS = {
  refund: 'https://docs.puppypad.com/sop/refunds',
  return: 'https://docs.puppypad.com/sop/returns',
  shipping: 'https://docs.puppypad.com/sop/shipping-issues',
  subscription: 'https://docs.puppypad.com/sop/subscriptions',
  manual: 'https://docs.puppypad.com/sop/manual-assistance',
  quality_difference: 'https://docs.puppypad.com/sop/quality-difference',
  trouble_report: 'https://docs.puppypad.com/sop/trouble-reports'
};

// ============================================
// PRODUCT DOC MAPPING
// ============================================
export const PRODUCT_DOC_MAP = {
  'puppypad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
  'pee pad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
  'busypet': 'BusyPet.txt',
  'calmbuddy': 'CalmBuddy Premium Diffuser Kit.txt',
  'cozybed': 'CozyBed (1).txt',
  'laundry': 'Laundry-Detergent-Sheets.txt',
  'stain': 'Stain-and-Odor-Eliminator.txt',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the case ID prefix for a case type
 */
export function getCasePrefix(caseType) {
  const prefixMap = {
    'refund': 'REF',
    'return': 'RET',
    'shipping': 'SHP',
    'subscription': 'SUB',
    'manual': 'MAN',
    'help': 'HLP'
  };
  return prefixMap[caseType] || 'HLP';
}

/**
 * Check if a carrier is a China/international carrier
 */
export function isChinaCarrier(carrierName) {
  if (!carrierName) return false;
  const lowerName = carrierName.toLowerCase();
  return CHINA_CARRIERS.some(china => lowerName.includes(china));
}

/**
 * Check if we're in test mode
 */
export function isTestMode(env) {
  // Explicit RICHPANEL_TEST_MODE takes priority
  if (env.RICHPANEL_TEST_MODE !== undefined) {
    return env.RICHPANEL_TEST_MODE === 'true' || env.RICHPANEL_TEST_MODE === true;
  }
  // Otherwise check APP_ENV
  if (env.APP_ENV === 'production') {
    return false;
  }
  // Default to test mode for safety
  return true;
}
