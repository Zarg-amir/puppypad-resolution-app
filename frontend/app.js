/**
 * PuppyPad Resolution App
 * Main Application Logic with Edit Functionality
 *
 * CONFIGURATION GUIDE:
 * - All easy-to-modify settings are at the TOP of this file
 * - Search for "EASY CONFIG" to find customizable sections
 * - See CODING_GUIDELINES.md for modification rules
 */

// ============================================
// EASY CONFIG: APP SETTINGS
// ============================================
const CONFIG = {
  API_URL: 'https://puppypad-resolution-worker.gulfam.workers.dev',
  GUARANTEE_DAYS: 90,
  FULFILLMENT_CUTOFF_HOURS: 10,
  IN_TRANSIT_VOICE_DAYS: 6,
  IN_TRANSIT_ESCALATE_DAYS: 15,
};

// ============================================
// EASY CONFIG: PERSONA SETTINGS
// Modify names, titles, avatars, colors here
// ============================================
const PERSONAS = {
  amy: {
    name: 'Amy',
    title: 'Customer Support',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    color: '#FF6B6B',
  },
  sarah: {
    name: 'Sarah',
    title: 'CX Lead',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    color: '#FFE66D',
  },
  claudia: {
    name: 'Claudia',
    title: 'Veterinarian',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
    color: '#A78BFA',
  },
};

// ============================================
// EASY CONFIG: BOT MESSAGES
// Modify greetings, responses, error messages here
// ============================================
const MESSAGES = {
  // Welcome messages per flow type
  welcome: {
    track: "Hi! I'm Amy. Let me help you track your order — just enter your details below and I'll pull it right up. 📦",
    subscription: "Hi! I'm Amy. I'll help you manage your subscription — just enter your details below to get started. 🔄",
    help: "Hi! I'm Amy from PuppyPad. I can sort this out with you right here so you don't have to go back and forth over email. Just enter your details below. 🙂",
  },
  // Survey messages
  survey: {
    prompt: "Before you go — how was your experience today?",
    thankYouHigh: "Thank you so much! We're thrilled we could help. 💜",
    thankYouMedium: "Thanks for your feedback! We're always working to improve. 🙏",
    thankYouLow: "We're sorry we didn't meet your expectations. Your feedback helps us do better. 💙",
  },
  // Common messages
  common: {
    lookingUp: "Looking up your order... 🔍",
    homeMenu: "What can I help you with today?",
    selectItems: "Which item(s) do you need help with? Tap to select:",
    whatHappened: "Got it! What's going on with your order?",
  },
  // Error/validation messages
  errors: {
    orderNotFound: "I couldn't find an order with those details. Let's try a deeper search with more information.",
    stillNotFound: "I still couldn't find your order, but don't worry — I'll make sure our team helps you personally. Please fill in these details:",
    fillBothFields: "Please fill in both fields to continue.",
    selectItem: "Please select at least one item to continue.",
    separateRequests: "Free items and paid items need separate requests. Please select only one type.",
  },
  // Policy block messages
  policy: {
    guaranteeExpiredIntro: "I really wish I could help with a refund, but I need to be upfront with you. 💔",
    existingCase: "I see we already have an open case for this order! 📋",
  },
};

// Legacy CONFIG.AVATARS for backward compatibility
CONFIG.AVATARS = {
  amy: PERSONAS.amy.avatar,
  sarah: PERSONAS.sarah.avatar,
  claudia: PERSONAS.claudia.avatar,
};

// ============================================
// SHIPPING HELPERS
// ============================================

// Detect international carriers (China-based) - use "international warehouse" messaging
function isInternationalCarrier(tracking) {
  if (!tracking) return false;

  const carrier = (tracking.carrier || '').toLowerCase();
  const trackingNum = (tracking.trackingNumber || '').toUpperCase();

  // Known China-based carriers
  const chinaCarriers = ['yunexpress', 'yanwen', '4px', 'cne', 'cainiao', 'china post', 'chinapost', 'epacket'];
  if (chinaCarriers.some(c => carrier.includes(c))) return true;

  // YunExpress tracking patterns: starts with YT or ends with CN
  if (trackingNum.startsWith('YT') || trackingNum.endsWith('CN')) return true;

  // Yanwen patterns: VP, UV, LP, ABC prefixes or YP/CN suffix
  if (/^(VP|UV|LP|ABC)/i.test(trackingNum)) return true;
  if (/YP$/i.test(trackingNum)) return true;

  return false;
}

// Get carrier contact info for failed delivery attempts
function getCarrierContactInfo(carrier) {
  const carrierUpper = (carrier || '').toUpperCase();
  const contacts = {
    'USPS': { name: 'USPS', phone: '1-800-275-8777', website: 'usps.com' },
    'UPS': { name: 'UPS', phone: '1-800-742-5877', website: 'ups.com' },
    'FEDEX': { name: 'FedEx', phone: '1-800-463-3339', website: 'fedex.com' },
    'DHL': { name: 'DHL', phone: '1-800-225-5345', website: 'dhl.com' },
  };
  return contacts[carrierUpper] || { name: carrier || 'the carrier', phone: null, website: null };
}

// ============================================
// ANALYTICS MODULE
// ============================================
const Analytics = {
  // Log session start
  async logSession(data) {
    try {
      await fetch(`${CONFIG.API_URL}/api/analytics/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          flowType: data.flowType || state.flowType,
          customerEmail: state.customerData.email,
          orderNumber: state.customerData.orderNumber,
          persona: state.currentPersona,
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          ...data
        })
      });
    } catch (e) {
      console.warn('Analytics session log failed:', e);
    }
  },

  // Log user event
  async logEvent(eventType, eventName, eventData = {}) {
    try {
      await fetch(`${CONFIG.API_URL}/api/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          eventType,
          eventName,
          eventData
        })
      });
    } catch (e) {
      console.warn('Analytics event log failed:', e);
    }
  },

  // Log survey response
  async logSurvey(rating) {
    try {
      await fetch(`${CONFIG.API_URL}/api/analytics/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          caseId: state.caseId,
          rating
        })
      });
    } catch (e) {
      console.warn('Analytics survey log failed:', e);
    }
  },

  // Log policy block
  async logPolicyBlock(blockType, data = {}) {
    try {
      await fetch(`${CONFIG.API_URL}/api/analytics/policy-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          blockType,
          orderNumber: state.selectedOrder?.orderNumber,
          ...data
        })
      });
    } catch (e) {
      console.warn('Analytics policy block log failed:', e);
    }
  },

  // Mark session as ended/completed
  async endSession(completed = false) {
    await this.logSession({ ended: true, completed });
  }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  sessionId: generateSessionId(),
  currentPersona: 'amy',
  currentStep: 'welcome',
  identifyMethod: 'email',
  selectedCountryCode: 'US',
  customerData: {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    orderNumber: '',
    address1: '',
    country: 'US'
  },
  orders: [],
  selectedOrder: null,
  selectedItems: [],
  subscriptions: [],
  selectedSubscription: null,
  tracking: null,
  intent: null,
  intentDetails: '',
  ladderStep: 0,
  ladderType: null,
  uploadedFiles: [],
  evidenceType: null,
  caseId: null,
  flowType: null,
  allTracking: null,
  lookupAttempts: [],
  // Store references for edit functionality
  editHistory: [],
  // Store existing case info for append flow (dedupe)
  existingCaseInfo: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  app: document.getElementById('app'),
  homeScreen: document.getElementById('homeScreen'),
  chatContainer: document.getElementById('chatContainer'),
  chatArea: document.getElementById('chatArea'),
  inputArea: document.getElementById('inputArea'),
  textInput: document.getElementById('textInput'),
  currentAvatar: document.getElementById('currentAvatar'),
  currentName: document.getElementById('currentName'),
  avatarRing: document.getElementById('avatarRing'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  networkBanner: document.getElementById('networkBanner'),
  srAnnouncer: document.getElementById('srAnnouncer')
};

// ============================================
// HOME SCREEN CONTROLLER
// ============================================
const HomeScreen = {
  handleAction(action) {
    // Hide home screen and show chat
    elements.homeScreen.classList.remove('active');
    elements.chatContainer.classList.add('active');

    // Announce to screen readers
    announceToScreenReader(`Starting ${action} flow`);

    // Route to appropriate flow
    switch (action) {
      case 'track':
        startTrackOrder();
        break;
      case 'subscription':
        startManageSubscription();
        break;
      case 'help':
        startHelpWithOrder();
        break;
      default:
        showWelcomeMessage();
    }
  },

  show() {
    elements.chatContainer.classList.remove('active');
    elements.homeScreen.classList.add('active');
    announceToScreenReader('Returned to home screen');
  }
};

// Make HomeScreen available globally for onclick handlers
window.HomeScreen = HomeScreen;

// ============================================
// NETWORK STATUS HANDLER
// ============================================
const NetworkStatus = {
  isOnline: navigator.onLine,

  init() {
    window.addEventListener('online', () => this.handleStatusChange(true));
    window.addEventListener('offline', () => this.handleStatusChange(false));
    this.updateUI(this.isOnline);
  },

  handleStatusChange(online) {
    this.isOnline = online;
    this.updateUI(online);
    announceToScreenReader(online ? 'Connection restored' : 'You are offline');
  },

  updateUI(online) {
    if (elements.networkBanner) {
      if (online) {
        elements.networkBanner.classList.remove('visible');
        elements.networkBanner.textContent = '';
      } else {
        elements.networkBanner.classList.add('visible');
        elements.networkBanner.innerHTML = `
          <span class="network-icon">📡</span>
          <span>You're offline. Some features may be unavailable.</span>
        `;
      }
    }
  }
};

// ============================================
// ACCESSIBILITY HELPERS
// ============================================
function announceToScreenReader(message) {
  if (elements.srAnnouncer) {
    elements.srAnnouncer.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      elements.srAnnouncer.textContent = '';
    }, 1000);
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  // Initialize network status handler
  NetworkStatus.init();

  // Always clear session on page load - start fresh at home screen
  SessionManager.clear();

  // Home screen is shown by default via HTML (has .active class)
}

function setupEventListeners() {
  elements.textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if ('visualViewport' in window) {
    window.visualViewport.addEventListener('resize', () => {
      elements.chatArea.scrollTop = elements.chatArea.scrollHeight;
    });
  }

  // Save session before page unload
  window.addEventListener('beforeunload', () => {
    SessionManager.save();
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateCaseId(type) {
  const now = new Date();
  const prefixes = { refund: 'REF', return: 'RET', shipping: 'SHP', subscription: 'SUB', manual: 'MAN' };
  const prefix = prefixes[type] || 'CAS';
  return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(amount));
}

// Format phone number as user types
function formatPhoneInput(input) {
  // Get just the digits
  let digits = input.value.replace(/\D/g, '');

  // Limit to 11 digits (1 + 10 for US)
  if (digits.length > 11) {
    digits = digits.substring(0, 11);
  }

  // Format based on length
  let formatted = '';

  if (digits.length === 0) {
    formatted = '';
  } else if (digits.length <= 3) {
    // Just area code starting
    if (digits.startsWith('1')) {
      formatted = `+1 (${digits.substring(1)}`;
    } else {
      formatted = `(${digits}`;
    }
  } else if (digits.length <= 6) {
    if (digits.startsWith('1')) {
      formatted = `+1 (${digits.substring(1, 4)}) ${digits.substring(4)}`;
    } else {
      formatted = `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
    }
  } else {
    if (digits.startsWith('1')) {
      formatted = `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    } else {
      formatted = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
  }

  input.value = formatted;
}

// Clean phone number for API (just digits)
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// ============================================
// DYNAMIC ADDRESS FIELDS BY COUNTRY
// ============================================

// Get address field configuration by country
function getAddressFieldsConfig(country) {
  const configs = {
    'United States': {
      stateLabel: 'State *',
      statePlaceholder: 'CA',
      zipLabel: 'ZIP Code *',
      zipPlaceholder: '12345',
      phonePlaceholder: '+1 (555) 000-0000',
      states: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
    },
    'Canada': {
      stateLabel: 'Province *',
      statePlaceholder: 'ON',
      zipLabel: 'Postal Code *',
      zipPlaceholder: 'A1A 1A1',
      phonePlaceholder: '+1 (555) 000-0000',
      states: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']
    },
    'United Kingdom': {
      stateLabel: 'County',
      statePlaceholder: 'County (optional)',
      zipLabel: 'Postcode *',
      zipPlaceholder: 'SW1A 1AA',
      phonePlaceholder: '+44 20 7123 4567',
      states: [] // UK doesn't use state dropdown
    },
    'Australia': {
      stateLabel: 'State/Territory *',
      statePlaceholder: 'NSW',
      zipLabel: 'Postcode *',
      zipPlaceholder: '2000',
      phonePlaceholder: '+61 2 1234 5678',
      states: ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
    }
  };

  return configs[country] || configs['United States'];
}

// Update address form fields when country changes
// formPrefix: 'new' for subscription form, '' for reship form
function updateAddressFields(formPrefix = '') {
  // Handle both naming conventions
  const countryId = formPrefix ? formPrefix + 'Country' : 'country';
  const provinceId = formPrefix ? formPrefix + 'Province' : 'province';
  const zipId = formPrefix ? formPrefix + 'Zip' : 'zip';
  const phoneId = formPrefix ? formPrefix + 'Phone' : null;

  const countrySelect = document.getElementById(countryId);
  if (!countrySelect) return;

  const country = countrySelect.value;
  const config = getAddressFieldsConfig(country);

  // Update State/Province label and placeholder
  const stateInput = document.getElementById(provinceId);
  if (stateInput) {
    const stateLabel = stateInput.closest('.form-group')?.querySelector('label');
    if (stateLabel) stateLabel.textContent = config.stateLabel;
    stateInput.placeholder = config.statePlaceholder;
  }

  // Update ZIP/Postal Code label and placeholder
  const zipInput = document.getElementById(zipId);
  if (zipInput) {
    const zipLabel = zipInput.closest('.form-group')?.querySelector('label');
    if (zipLabel) zipLabel.textContent = config.zipLabel;
    zipInput.placeholder = config.zipPlaceholder;
  }

  // Update phone placeholder if phone field exists
  if (phoneId) {
    const phoneInput = document.getElementById(phoneId);
    if (phoneInput) {
      phoneInput.placeholder = config.phonePlaceholder;
    }
  }
}

function scrollToBottom() {
  if (!elements.chatArea) return;
  // Scroll to show the last element at the TOP of viewport (with space below)
  // This gives the user a top-down reading experience
  const lastElement = elements.chatArea.lastElementChild;
  if (lastElement) {
    lastElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
async function copyToClipboard(text, buttonElement) {
  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copied!
    `;
    buttonElement.classList.add('copied');

    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.classList.remove('copied');
    }, 2000);

    announceToScreenReader('Case ID copied to clipboard');
  } catch (err) {
    console.error('Failed to copy:', err);
    announceToScreenReader('Failed to copy case ID');
  }
}

// Generate copyable case ID HTML
function getCaseIdHtml(caseId) {
  return `
    <div class="case-id-container">
      <span class="case-id-label">Case ID:</span>
      <span class="case-id-value">${caseId}</span>
      <button class="case-id-copy-btn" onclick="copyToClipboard('${caseId}', this)" title="Copy to clipboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy
      </button>
    </div>
  `;
}

// Make copyToClipboard available globally
window.copyToClipboard = copyToClipboard;

// ============================================
// CONFIRMATION DIALOG
// ============================================
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-icon">⚠️</div>
        <h3 class="confirm-dialog-title">${title}</h3>
        <p class="confirm-dialog-message">${message}</p>
        <div class="confirm-dialog-buttons">
          <button class="confirm-dialog-btn cancel">${cancelText}</button>
          <button class="confirm-dialog-btn confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Handle button clicks
    const cancelBtn = overlay.querySelector('.cancel');
    const confirmBtn = overlay.querySelector('.confirm');

    const closeDialog = (result) => {
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    cancelBtn.onclick = () => closeDialog(false);
    confirmBtn.onclick = () => closeDialog(true);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) closeDialog(false);
    };

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        closeDialog(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// ============================================
// SESSION MANAGER
// ============================================
const SessionManager = {
  STORAGE_KEY: 'puppypad_session',
  SESSION_EXPIRY: 30 * 60 * 1000, // 30 minutes

  save() {
    try {
      const sessionData = {
        timestamp: Date.now(),
        sessionId: state.sessionId,
        currentPersona: state.currentPersona,
        currentStep: state.currentStep,
        flowType: state.flowType,
        customerData: state.customerData,
        selectedOrder: state.selectedOrder,
        intent: state.intent
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  },

  restore() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;

      const sessionData = JSON.parse(saved);
      const age = Date.now() - sessionData.timestamp;

      // Check if session is still valid
      if (age > this.SESSION_EXPIRY) {
        this.clear();
        return null;
      }

      return sessionData;
    } catch (e) {
      console.warn('Failed to restore session:', e);
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  }
};

// ============================================
// PERSONA MANAGEMENT
// ============================================
const PERSONA_INFO = {
  amy: {
    name: 'Amy',
    role: 'Customer Support',
    avatar: CONFIG.AVATARS.amy
  },
  sarah: {
    name: 'Sarah',
    role: 'Customer Experience Lead',
    avatar: CONFIG.AVATARS.sarah
  },
  claudia: {
    name: 'Claudia',
    role: 'In-House Veterinarian',
    avatar: CONFIG.AVATARS.claudia
  }
};

function setPersona(persona) {
  state.currentPersona = persona;
  const info = PERSONA_INFO[persona] || PERSONA_INFO.amy;

  elements.currentAvatar.src = info.avatar;
  elements.currentName.textContent = info.name;

  // Update avatar ring data attribute for gradient styling
  if (elements.avatarRing) {
    elements.avatarRing.dataset.persona = persona;
  }
}

function setTyping(isTyping) {
  elements.statusDot.classList.toggle('typing', isTyping);
  elements.statusText.textContent = isTyping ? 'Typing...' : 'Online';
}

// ============================================
// MESSAGE RENDERING
// ============================================

// Character-by-character typing animation
async function typeText(element, text, speed = 55, isBot = true) {
  // Create a stable structure: text container + cursor
  const textSpan = document.createElement('span');
  textSpan.className = 'typing-text';
  const cursorSpan = document.createElement('span');
  cursorSpan.className = 'typing-cursor';
  cursorSpan.textContent = '|';

  element.innerHTML = '';
  element.appendChild(textSpan);
  element.appendChild(cursorSpan);

  // Split by HTML tags vs plain text
  const parts = text.split(/(<[^>]+>)/);
  let displayText = '';
  let charCount = 0;

  for (const part of parts) {
    if (part.startsWith('<')) {
      // It's an HTML tag, add it immediately
      displayText += part;
      textSpan.innerHTML = displayText;
    } else {
      // It's plain text, type character by character
      for (const char of part) {
        displayText += char;
        textSpan.innerHTML = displayText;
        charCount++;
        // Only scroll every 15 characters to reduce jumpiness
        if (charCount % 15 === 0) {
          scrollToBottom();
        }
        // Add slight variation to typing speed for realism
        const variance = Math.random() * 15 - 7;
        await delay(Math.max(speed + variance, 20));
      }
    }
  }

  // Final scroll to ensure message is visible
  scrollToBottom();

  // Remove cursor when done
  cursorSpan.remove();

  // Only update typing status for bot messages
  if (isBot) {
    setTyping(false);
  }
}

async function addBotMessage(text, persona = state.currentPersona) {
  const info = PERSONA_INFO[persona] || PERSONA_INFO.amy;

  setTyping(true);

  // Create message container that will hold both typing indicator and final message
  const messageDiv = document.createElement('div');
  messageDiv.className = `message bot ${persona}`;
  messageDiv.innerHTML = `
    <img src="${info.avatar}" alt="${info.name}" class="message-avatar">
    <div class="message-content">
      <div class="message-sender">
        <span class="sender-name">${info.name}</span>
        <span class="sender-role">${info.role}</span>
      </div>
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  elements.chatArea.appendChild(messageDiv);
  scrollToBottom();

  // Wait for "thinking" delay (shorter, between 400-800ms)
  const thinkingDelay = Math.min(400 + text.length * 3, 800);
  await delay(thinkingDelay);

  // Replace typing indicator with message bubble (no removal/re-add, smooth transition)
  const contentDiv = messageDiv.querySelector('.message-content');
  const typingIndicator = messageDiv.querySelector('.typing-indicator');

  // Create the bubble
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Remove typing indicator and add bubble
  typingIndicator.remove();
  contentDiv.appendChild(bubble);

  // Type out the message character by character
  await typeText(bubble, text);

  return messageDiv;
}

async function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-sender">
        <span class="sender-name">You</span>
      </div>
      <div class="message-bubble"></div>
    </div>
  `;
  elements.chatArea.appendChild(messageDiv);
  scrollToBottom();

  // Type out user message quickly (faster than bot, no typing indicator change)
  const bubble = messageDiv.querySelector('.message-bubble');
  await typeText(bubble, text, 15, false);

  return messageDiv;
}

// ============================================
// EDITABLE USER MESSAGE (Key Feature!)
// ============================================
function addEditableUserMessage(summaryHtml, editCallback, editLabel = 'Edit') {
  const containerDiv = document.createElement('div');
  containerDiv.className = 'message user editable-message';
  containerDiv.innerHTML = `
    <div class="message-content">
      <div class="message-bubble editable-bubble">
        <div class="editable-content">${summaryHtml}</div>
        <button class="edit-btn" onclick="this.closest('.editable-message').editCallback()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          ${editLabel}
        </button>
      </div>
    </div>
  `;
  
  // Store edit callback on the element
  containerDiv.editCallback = () => {
    // Remove this message and everything after it
    const allMessages = Array.from(elements.chatArea.children);
    const index = allMessages.indexOf(containerDiv);
    for (let i = allMessages.length - 1; i >= index; i--) {
      allMessages[i].remove();
    }
    // Call the edit callback to re-show the form
    editCallback();
  };
  
  elements.chatArea.appendChild(containerDiv);
  scrollToBottom();
  return containerDiv;
}

// ============================================
// OPTIONS & BUTTONS (with staggered animations)
// ============================================

// Configuration for staggered animations
// These values control how long users have to read before seeing options
const ANIMATION_CONFIG = {
  delayBeforeOptions: 1500,   // Wait 1.5s after Amy's message before showing options
  staggerDelay: 400,          // 400ms between each option appearing (clearly one-by-one)
  delayBeforeCards: 1200,     // Wait 1.2s before showing interactive cards
  cardStaggerDelay: 350       // 350ms between each card appearing
};

async function addOptions(options) {
  // Wait for user to read Amy's message before showing options
  await delay(ANIMATION_CONFIG.delayBeforeOptions);

  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'options-container';
  elements.chatArea.appendChild(optionsDiv);

  // Add each button one-by-one with staggered timing
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const btn = document.createElement('button');
    btn.className = `option-btn ${option.primary ? 'primary' : ''} ${option.secondary ? 'secondary' : ''}`;
    btn.innerHTML = option.icon ? `<span class="icon">${option.icon}</span>${option.text}` : option.text;
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px)';
    btn.onclick = () => {
      optionsDiv.remove();
      if (option.showAsMessage !== false) {
        addUserMessage(option.text);
      }
      option.action();
    };
    optionsDiv.appendChild(btn);

    // Animate this button in
    requestAnimationFrame(() => {
      btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    });

    // Wait before adding next button
    if (i < options.length - 1) {
      await delay(ANIMATION_CONFIG.staggerDelay);
    }
  }
}

async function addOptionsRow(options) {
  // Wait for user to read Amy's message
  await delay(ANIMATION_CONFIG.delayBeforeOptions);

  const rowDiv = document.createElement('div');
  rowDiv.className = 'options-container';

  const innerRow = document.createElement('div');
  innerRow.className = 'options-row';
  rowDiv.appendChild(innerRow);
  elements.chatArea.appendChild(rowDiv);

  // Add each button one-by-one
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const btn = document.createElement('button');
    btn.className = `option-btn ${option.primary ? 'primary' : ''} ${option.class || ''}`;
    btn.textContent = option.text;
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px)';
    btn.onclick = () => {
      rowDiv.remove();
      if (option.showAsMessage !== false) {
        addUserMessage(option.text);
      }
      option.action();
    };
    innerRow.appendChild(btn);

    // Animate this button in
    requestAnimationFrame(() => {
      btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    });

    // Wait before adding next button
    if (i < options.length - 1) {
      await delay(ANIMATION_CONFIG.staggerDelay);
    }
  }
}

async function addInteractiveContent(html, delayMs = ANIMATION_CONFIG.delayBeforeCards) {
  // Give customer time to read Amy's message before showing interactive content
  await delay(delayMs);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'interactive-content';
  contentDiv.innerHTML = html;

  // Find all child cards/items that should animate
  const animatableItems = contentDiv.querySelectorAll('.order-card, .product-card, .form-container, .editable-summary');

  if (animatableItems.length > 0) {
    // Hide all items initially
    animatableItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
    });
  }

  elements.chatArea.appendChild(contentDiv);

  // Animate items one-by-one
  if (animatableItems.length > 0) {
    for (let i = 0; i < animatableItems.length; i++) {
      const item = animatableItems[i];
      requestAnimationFrame(() => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });

      if (i < animatableItems.length - 1) {
        await delay(ANIMATION_CONFIG.cardStaggerDelay);
      }
    }
  }

  return contentDiv;
}

// ============================================
// INPUT HANDLING
// ============================================
function showTextInput(placeholder = 'Type your message...', onSubmit) {
  elements.inputArea.classList.add('active');
  elements.textInput.placeholder = placeholder;
  elements.textInput.value = '';
  elements.textInput.focus();
  window.currentInputHandler = onSubmit;
}

function hideTextInput() {
  elements.inputArea.classList.remove('active');
  window.currentInputHandler = null;
}

function sendMessage() {
  const text = elements.textInput.value.trim();
  if (!text) return;
  addUserMessage(text);
  elements.textInput.value = '';
  if (window.currentInputHandler) window.currentInputHandler(text);
}

// ============================================
// PROGRESS & STATUS DISPLAYS
// ============================================
function showProgress(message, subMessage = '') {
  const progressDiv = document.createElement('div');
  progressDiv.className = 'interactive-content progress-wrapper';
  progressDiv.id = 'progressIndicator';
  progressDiv.innerHTML = `
    <div class="progress-container">
      <div class="spinner"></div>
      <div class="progress-text">${message}</div>
      ${subMessage ? `<div class="progress-subtext">${subMessage}</div>` : ''}
    </div>
  `;
  elements.chatArea.appendChild(progressDiv);
  scrollToBottom();
}

function hideProgress() {
  const progress = document.getElementById('progressIndicator');
  if (progress) progress.remove();
}

async function showSuccess(title, message) {
  // Log session completed successfully
  Analytics.endSession(true);
  Analytics.logEvent('flow_complete', 'resolution_success', {
    flowType: state.flowType,
    caseId: state.caseId
  });

  const successHtml = `
    <div class="success-card">
      <div class="success-icon">✓</div>
      <div class="success-title">${title}</div>
      <div class="success-message">${message}</div>
    </div>
  `;
  await addInteractiveContent(successHtml, 300);

  await delay(1000);

  // Show end-of-session survey
  await showEndOfSessionSurvey();
}

async function showEndOfSessionSurvey() {
  await addBotMessage(MESSAGES.survey.prompt);

  const surveyHtml = `
    <div class="survey-container">
      <div class="survey-ratings">
        <button class="survey-rating" data-rating="1" onclick="submitSurveyRating(1, this)">
          <span class="survey-emoji">😞</span>
          <span class="survey-label">Poor</span>
        </button>
        <button class="survey-rating" data-rating="2" onclick="submitSurveyRating(2, this)">
          <span class="survey-emoji">😐</span>
          <span class="survey-label">Okay</span>
        </button>
        <button class="survey-rating" data-rating="3" onclick="submitSurveyRating(3, this)">
          <span class="survey-emoji">🙂</span>
          <span class="survey-label">Good</span>
        </button>
        <button class="survey-rating" data-rating="4" onclick="submitSurveyRating(4, this)">
          <span class="survey-emoji">😊</span>
          <span class="survey-label">Great</span>
        </button>
        <button class="survey-rating" data-rating="5" onclick="submitSurveyRating(5, this)">
          <span class="survey-emoji">🤩</span>
          <span class="survey-label">Amazing</span>
        </button>
      </div>
      <button class="survey-skip" onclick="skipSurvey()">Skip</button>
    </div>
  `;

  await addInteractiveContent(surveyHtml, 400);
}

async function submitSurveyRating(rating, buttonElement) {
  // Highlight selected rating
  document.querySelectorAll('.survey-rating').forEach(btn => {
    btn.classList.remove('selected');
  });
  buttonElement.classList.add('selected');

  // Remove survey container after short delay
  await delay(300);
  document.querySelector('.survey-container')?.closest('.interactive-content').remove();

  // Log the rating to analytics
  Analytics.logSurvey(rating);
  Analytics.logEvent('survey', 'rating_submitted', { rating, caseId: state.caseId });

  // Thank the user - uses MESSAGES.survey from config
  if (rating >= 4) {
    await addBotMessage(MESSAGES.survey.thankYouHigh);
  } else if (rating >= 3) {
    await addBotMessage(MESSAGES.survey.thankYouMedium);
  } else {
    await addBotMessage(MESSAGES.survey.thankYouLow);
  }

  await delay(800);

  addOptions([
    { text: 'Back to Home', primary: true, action: () => restartChat() }
  ]);
}

async function skipSurvey() {
  document.querySelector('.survey-container')?.closest('.interactive-content').remove();

  addOptions([
    { text: 'Back to Home', primary: true, action: () => restartChat() }
  ]);
}

// Make survey functions available globally
window.submitSurveyRating = submitSurveyRating;
window.skipSurvey = skipSurvey;

async function showError(title, message) {
  const errorHtml = `
    <div class="error-card">
      <div class="error-icon">✕</div>
      <div class="error-title">${title}</div>
      <div class="error-message">${message}</div>
    </div>
  `;
  await addInteractiveContent(errorHtml, 300);
}

// ============================================
// WELCOME & HOME
// ============================================

// Welcome message shown when entering chat from home screen
async function showWelcomeMessage(flowType) {
  setPersona('amy');
  state.currentStep = 'welcome';

  // Uses MESSAGES.welcome from config at top of file
  await addBotMessage(MESSAGES.welcome[flowType] || MESSAGES.welcome.help, 'amy');
}

// Legacy function - kept for backward compatibility
async function showWelcomeScreen() {
  // Just show home screen via the HomeScreen controller
  HomeScreen.show();
}

async function showHomeMenu() {
  state.currentStep = 'home';
  await addBotMessage("What can I help you with today?");

  addOptions([
    { icon: '📦', text: 'Manage My Subscription', action: startManageSubscription },
    { icon: '🛍️', text: 'Help With An Order', action: startHelpWithOrder },
    { icon: '📍', text: 'Track My Order', action: startTrackOrder }
  ]);
}

async function restartChat() {
  // Show confirmation dialog
  const confirmed = await showConfirmDialog(
    'Start Over?',
    'This will clear your current conversation and take you back to the home screen.',
    'Yes, Start Over',
    'Cancel'
  );

  if (!confirmed) return;

  // Log session end
  Analytics.endSession(false);
  Analytics.logEvent('flow_end', 'user_restart');

  // Reset state
  Object.assign(state, {
    currentStep: 'welcome',
    customerData: { email: '', phone: '', firstName: '', lastName: '', orderNumber: '', address1: '' },
    orders: [],
    selectedOrder: null,
    selectedItems: [],
    subscriptions: [],
    selectedSubscription: null,
    tracking: null,
    intent: null,
    intentDetails: '',
    ladderStep: 0,
    ladderType: null,
    uploadedFiles: [],
    caseId: null,
    flowType: null,
    editHistory: [],
    existingCaseInfo: null
  });

  // Clear session
  SessionManager.clear();

  // Clear chat area
  elements.chatArea.innerHTML = '';
  hideTextInput();

  // Show home screen
  HomeScreen.show();
}

// ============================================
// IDENTIFY CUSTOMER FORM (with Edit support)
// ============================================
async function showIdentifyForm(flowType) {
  state.flowType = flowType;
  // Message is shown by the calling function, just render the form
  await renderIdentifyForm(flowType);
}

async function renderIdentifyForm(flowType) {
  // Track Order flow: simplified form (email/phone + order number)
  // Help/Subscription flows: full form (email/phone + name + order number)
  const isTrackFlow = flowType === 'track';

  const formHtml = `
    <div class="form-container" id="identifyForm">
      <div class="toggle-container">
        <div class="toggle-option ${state.identifyMethod === 'email' ? 'active' : ''}" data-method="email" onclick="toggleIdentifyMethod('email')">Email</div>
        <div class="toggle-option ${state.identifyMethod === 'phone' ? 'active' : ''}" data-method="phone" onclick="toggleIdentifyMethod('phone')">Phone</div>
      </div>

      <div class="form-group ${state.identifyMethod !== 'email' ? 'hidden' : ''}" id="emailGroup">
        <label>Email Address *</label>
        <input type="email" class="form-input" id="inputEmail" placeholder="you@example.com" value="${state.customerData.email || ''}">
        <div class="error-text">Please enter the email used at checkout.</div>
      </div>

      <div class="form-group ${state.identifyMethod !== 'phone' ? 'hidden' : ''}" id="phoneGroup">
        <label>Phone Number *</label>
        <div class="phone-input-wrapper">
          ${generateCountryCodeSelector(state.selectedCountryCode || 'US')}
          <input type="tel" class="form-input" id="inputPhone" placeholder="(555) 000-0000" value="${state.customerData.phone || ''}" oninput="formatPhoneInput(this)">
        </div>
        <div class="error-text">Please enter the phone number used at checkout.</div>
      </div>

      ${!isTrackFlow ? `
      <div class="form-group">
        <label>First Name *</label>
        <input type="text" class="form-input" id="inputFirstName" placeholder="Your first name" value="${state.customerData.firstName || ''}">
        <div class="error-text">Please enter the first name used at checkout.</div>
      </div>
      ` : ''}

      <div class="form-group">
        <label>Order Number${isTrackFlow ? ' (recommended)' : ' (optional)'}</label>
        <input type="text" class="form-input" id="inputOrderNumber" placeholder="#12345P" value="${state.customerData.orderNumber || ''}">
        <div class="error-text">Order number must look like #12345P.</div>
      </div>

      <button class="option-btn primary" onclick="submitIdentifyForm('${flowType}')" style="margin-top: 8px; width: 100%;">
        ${isTrackFlow ? 'Track My Order' : 'Find My Order'}
      </button>
    </div>
  `;

  await addInteractiveContent(formHtml);
}

function toggleIdentifyMethod(method) {
  state.identifyMethod = method;

  // Update toggle container class for CSS animation
  const container = document.querySelector('.toggle-container');
  if (container) {
    container.classList.toggle('phone', method === 'phone');
  }

  // Update active states
  document.querySelectorAll('.toggle-option').forEach(el => {
    el.classList.toggle('active', el.dataset.method === method);
  });

  // Show/hide relevant form groups
  document.getElementById('emailGroup')?.classList.toggle('hidden', method !== 'email');
  document.getElementById('phoneGroup')?.classList.toggle('hidden', method !== 'phone');
}

async function submitIdentifyForm(flowType) {
  const email = document.getElementById('inputEmail')?.value.trim();
  const phone = document.getElementById('inputPhone')?.value.trim();
  const firstName = document.getElementById('inputFirstName')?.value.trim() || '';
  const orderNumber = document.getElementById('inputOrderNumber')?.value.trim();

  // Track flow only requires email/phone (firstName not required)
  const isTrackFlow = flowType === 'track';

  // Validation
  let hasError = false;

  if (state.identifyMethod === 'email') {
    const emailInput = document.getElementById('inputEmail');
    if (!email || !email.includes('@') || !email.includes('.')) {
      emailInput.classList.add('error');
      hasError = true;
    } else {
      emailInput.classList.remove('error');
      state.customerData.email = email;
    }
  } else {
    const phoneInput = document.getElementById('inputPhone');
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 7) {
      phoneInput.classList.add('error');
      hasError = true;
    } else {
      phoneInput.classList.remove('error');
      // Combine country code with phone number
      const countryCode = getSelectedCountryCode();
      state.selectedCountryCode = document.getElementById('countryCodeSelect')?.value || 'US';
      state.customerData.phone = countryCode + phoneDigits;
    }
  }

  // First name validation - only required for non-track flows
  const firstNameInput = document.getElementById('inputFirstName');
  if (!isTrackFlow) {
    if (!firstName) {
      firstNameInput?.classList.add('error');
      hasError = true;
    } else {
      firstNameInput?.classList.remove('error');
      state.customerData.firstName = firstName;
    }
  } else {
    // For track flow, just store whatever was provided (optional)
    state.customerData.firstName = firstName;
  }

  const orderInput = document.getElementById('inputOrderNumber');
  if (orderNumber && !orderNumber.match(/^#?\d+P?$/i)) {
    orderInput.classList.add('error');
    hasError = true;
  } else {
    orderInput?.classList.remove('error');
    state.customerData.orderNumber = orderNumber;
  }

  if (hasError) return;

  // Remove form
  document.getElementById('identifyForm')?.closest('.interactive-content').remove();

  // Create editable summary (conditionally show name for non-track flows)
  const summaryRows = [
    `<div class="summary-row"><span class="summary-label">${state.identifyMethod === 'email' ? 'Email' : 'Phone'}:</span> ${state.identifyMethod === 'email' ? email : phone}</div>`
  ];
  if (!isTrackFlow && firstName) {
    summaryRows.push(`<div class="summary-row"><span class="summary-label">Name:</span> ${firstName}</div>`);
  }
  if (orderNumber) {
    summaryRows.push(`<div class="summary-row"><span class="summary-label">Order:</span> ${orderNumber}</div>`);
  }

  const summaryHtml = `<div class="editable-summary">${summaryRows.join('')}</div>`;

  addEditableUserMessage(summaryHtml, () => {
    // Re-show the form for editing
    renderIdentifyForm(flowType);
  }, 'Edit Details');

  await lookupOrder(flowType);
}

// ============================================
// ORDER LOOKUP
// ============================================
async function lookupOrder(flowType) {
  showProgress("Locating your order...", "Searching our database");

  try {
    // Try API call
    if (CONFIG.API_URL) {
      const response = await fetch(`${CONFIG.API_URL}/api/lookup-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.customerData)
      });
      const data = await response.json();

      hideProgress();

      if (data.orders && data.orders.length > 0) {
        state.orders = data.orders;
        await handleOrdersFound(flowType);
        return;
      }
    } else {
      hideProgress();
    }

    // No orders found - go to deep search
    await handleOrderNotFound(flowType);

  } catch (error) {
    console.error('Lookup error:', error);
    hideProgress();
    // API error - go to deep search
    await handleOrderNotFound(flowType);
  }
}

async function handleOrdersFound(flowType) {
  if (state.orders.length === 0) {
    await handleOrderNotFound(flowType);
    return;
  }

  // Show "Found your order" message first
  const orderCount = state.orders.length;
  const foundMessage = orderCount === 1
    ? `Found your order! Let me pull up the details. ✨`
    : `Found ${orderCount} orders! Let me show you what I found. ✨`;
  await addBotMessage(foundMessage);

  if (flowType === 'subscription') {
    await handleSubscriptionFlow();
  } else if (flowType === 'help') {
    await handleHelpFlow();
  } else if (flowType === 'track') {
    await handleTrackFlow();
  }
}

async function handleOrderNotFound(flowType) {
  await addBotMessage("I couldn't find an order with those details. Let's try a deeper search with your shipping information.");
  await renderDeepSearchForm(flowType);
}

async function renderDeepSearchForm(flowType) {
  const formHtml = `
    <div class="form-container" id="deepSearchForm">
      <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">
        Please provide your shipping address details to help me find your order:
      </p>

      <div class="form-group">
        <label>First Name *</label>
        <input type="text" class="form-input" id="inputDeepFirstName" placeholder="Your first name" value="${state.customerData.firstName || ''}">
      </div>

      <div class="form-group">
        <label>Last Name *</label>
        <input type="text" class="form-input" id="inputDeepLastName" placeholder="Your last name" value="${state.customerData.lastName || ''}">
      </div>

      <div class="form-group">
        <label>Street Address *</label>
        <input type="text" class="form-input" id="inputDeepAddress1" placeholder="123 Main Street" value="${state.customerData.address1 || ''}">
      </div>

      <div class="form-group">
        <label>Country *</label>
        ${generateCountryDropdown(state.customerData.country || 'US', 'inputDeepCountry')}
      </div>

      <button class="option-btn primary" onclick="submitDeepSearch('${flowType}')" style="margin-top: 8px; width: 100%;">
        Search Again
      </button>
    </div>
  `;

  await addInteractiveContent(formHtml);
}

async function submitDeepSearch(flowType) {
  const firstName = document.getElementById('inputDeepFirstName')?.value.trim();
  const lastName = document.getElementById('inputDeepLastName')?.value.trim();
  const address1 = document.getElementById('inputDeepAddress1')?.value.trim();
  const country = document.getElementById('inputDeepCountry')?.value;

  // Require at least firstName + lastName + address
  if (!firstName || !lastName || !address1) {
    await addBotMessage("Please fill in your first name, last name, and street address to continue.");
    return;
  }

  state.customerData.firstName = firstName;
  state.customerData.lastName = lastName;
  state.customerData.address1 = address1;
  state.customerData.country = country || 'US';

  document.getElementById('deepSearchForm')?.closest('.interactive-content').remove();

  addUserMessage(`Searching with: ${firstName} ${lastName}, ${address1}`);
  showProgress("Searching deeper...", "Looking for orders matching your address");

  try {
    // Call the API with deep search parameters
    const response = await fetch(`${CONFIG.API_URL}/api/lookup-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.customerData.email,
        phone: state.customerData.phone,
        firstName: state.customerData.firstName,
        lastName: state.customerData.lastName,
        orderNumber: state.customerData.orderNumber,
        address1: state.customerData.address1,
        country: state.customerData.country,
        deepSearch: true // Flag for backend to use fuzzy matching
      })
    });

    hideProgress();

    const data = await response.json();

    if (data.orders && data.orders.length > 0) {
      state.orders = data.orders;
      await handleOrdersFound(flowType);
      return;
    }
  } catch (error) {
    console.error('Deep search error:', error);
    hideProgress();
  }

  // Still not found - show manual help form
  // Store lookup attempts for the manual form
  state.lookupAttempts = [
    { method: state.identifyMethod === 'email' ? 'Email lookup' : 'Phone lookup', value: state.customerData.email || state.customerData.phone, result: 'no results' },
    { method: 'Deep lookup', value: `${state.customerData.firstName} ${state.customerData.lastName}, ${state.customerData.address1}`, result: 'no results' }
  ];
  await showManualHelpForm();
}

async function showManualHelpForm() {
  await addBotMessage("I'm really sorry - I still couldn't find your order in our system. But don't worry, I'll connect you with our team who can dig deeper!");

  const fullName = `${state.customerData.firstName || ''} ${state.customerData.lastName || ''}`.trim();

  const formHtml = `
    <div class="form-container" id="manualHelpForm">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-primary);">Tell Us More</h3>

      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" class="form-input" id="manualEmail" placeholder="you@example.com" value="${state.customerData.email || ''}">
      </div>

      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" class="form-input" id="manualFullName" placeholder="Your full name" value="${fullName}">
      </div>

      <div class="form-group">
        <label>Phone (optional)</label>
        <input type="tel" class="form-input" id="manualPhone" placeholder="+1 (555) 000-0000" value="${state.customerData.phone || ''}" oninput="formatPhoneInput(this)">
      </div>

      <div class="form-group">
        <label>Order # if you have it</label>
        <input type="text" class="form-input" id="manualOrderNumber" placeholder="#12345P" value="${state.customerData.orderNumber || ''}">
      </div>

      <div class="form-group">
        <label>What happened? *</label>
        <textarea class="form-input" id="manualIssue" rows="4" placeholder="I ordered 3 weeks ago, was charged $49.99 but never got confirmation..."></textarea>
      </div>

      <div class="form-group">
        <label>How should we reach you?</label>
        <div class="contact-method-toggle">
          <div class="contact-method-option active" onclick="selectContactMethod('email', this)">
            <span class="checkmark">✓</span>
            <span>Email</span>
          </div>
          <div class="contact-method-option" onclick="selectContactMethod('phone', this)">
            <span class="checkmark">✓</span>
            <span>Phone</span>
          </div>
        </div>
        <input type="hidden" id="preferredContact" value="email">
      </div>

      <button class="option-btn primary" onclick="submitManualHelp()" style="margin-top: 8px; width: 100%;">
        Submit Request
      </button>
    </div>
  `;

  addInteractiveContent(formHtml);
}

function selectContactMethod(method, element) {
  // Update hidden input
  document.getElementById('preferredContact').value = method;

  // Update UI
  document.querySelectorAll('.contact-method-option').forEach(el => {
    el.classList.remove('active');
  });
  element.classList.add('active');
}

async function submitManualHelp() {
  const email = document.getElementById('manualEmail')?.value.trim();
  const fullName = document.getElementById('manualFullName')?.value.trim();
  const phone = document.getElementById('manualPhone')?.value.trim();
  const orderNumber = document.getElementById('manualOrderNumber')?.value.trim();
  const issue = document.getElementById('manualIssue')?.value.trim();
  const preferredContact = document.getElementById('preferredContact')?.value || 'email';

  if (!email || !fullName || !issue) {
    await addBotMessage("Please enter your email, full name, and describe what happened so we can help you.");
    return;
  }

  document.getElementById('manualHelpForm')?.closest('.interactive-content').remove();
  addUserMessage("Request submitted");

  showProgress("Creating your support case...", "Our team will be notified");

  // Build case data for backend
  const caseData = {
    email,
    fullName,
    phone,
    orderNumber,
    issue,
    preferredContact,
    lookupAttempts: state.lookupAttempts || [],
    sessionId: state.sessionId
  };

  try {
    // Call backend to create manual help case
    const response = await fetch(`${CONFIG.API_URL}/api/create-manual-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });

    const result = await response.json();
    hideProgress();

    if (result.success && result.caseId) {
      state.caseId = result.caseId;
    } else {
      state.caseId = generateCaseId('manual');
    }
  } catch (error) {
    console.error('Manual help submission error:', error);
    hideProgress();
    state.caseId = generateCaseId('manual');
  }

  const contactMethod = preferredContact === 'email' ? `email you at ${email}` : `call you at ${phone || email}`;

  await showSuccess(
    "Request Submitted!",
    `Got it, ${fullName.split(' ')[0]}! I've sent your request to our support team. Someone will ${contactMethod} within 24 hours to help track this down.<br><br>${getCaseIdHtml(state.caseId)}<br><br>Save this in case you need to reference it!`
  );
}

// ============================================
// ORDER SELECTION (with Edit support)
// ============================================
async function showOrderSelection(flowType) {
  await addBotMessage(`I found ${state.orders.length} order${state.orders.length > 1 ? 's' : ''}. Which one do you need help with?`);
  renderOrderCards(flowType);
}

function renderOrderCards(flowType) {
  const ordersHtml = state.orders.map((order, index) => {
    const statusClass = order.fulfillmentStatus === 'fulfilled' ? 'delivered' : 
                       order.fulfillmentStatus === 'partial' ? 'in-transit' : 'pending';
    const statusLabel = order.fulfillmentStatus === 'fulfilled' ? 'Shipped' : 
                       order.fulfillmentStatus === 'partial' ? 'Partially Shipped' : 'Processing';
    
    const itemThumbs = order.lineItems.slice(0, 4).map(item => 
      `<img src="${item.image || 'https://via.placeholder.com/48'}" alt="${item.title}" class="order-item-thumb">`
    ).join('');
    
    return `
      <div class="order-card" onclick="selectOrder(${index}, '${flowType}')">
        <div class="order-header">
          <div>
            <div class="order-number">${order.orderNumber}</div>
            <div class="order-date">${formatDate(order.createdAt)}</div>
          </div>
          <span class="order-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="order-items">${itemThumbs}</div>
        <div class="order-total">Total: ${formatCurrency(order.totalPrice, order.currency)}</div>
      </div>
    `;
  }).join('');
  
  addInteractiveContent(`<div class="orders-list">${ordersHtml}</div>`);
}

async function selectOrder(index, flowType) {
  state.selectedOrder = state.orders[index];
  
  // Remove order cards
  document.querySelector('.orders-list')?.closest('.interactive-content').remove();
  
  // Show editable selection
  const summaryHtml = `
    <div class="editable-summary">
      <div class="summary-row"><span class="summary-label">Order:</span> ${state.selectedOrder.orderNumber}</div>
      <div class="summary-row"><span class="summary-label">Date:</span> ${formatDate(state.selectedOrder.createdAt)}</div>
      <div class="summary-row"><span class="summary-label">Items:</span> ${state.selectedOrder.lineItems.length} item(s)</div>
    </div>
  `;
  
  addEditableUserMessage(summaryHtml, () => {
    state.selectedOrder = null;
    renderOrderCards(flowType);
  }, 'Change Order');
  
  // Continue based on flow
  if (flowType === 'track') {
    await getTrackingInfo();
  } else if (flowType === 'help') {
    await showItemSelection();
  } else if (flowType === 'subscription') {
    await fetchSubscriptionDetails();
  }
}

// ============================================
// ITEM SELECTION (with Edit support)
// ============================================
async function showItemSelection() {
  const paidItems = state.selectedOrder.lineItems.filter(item => !item.isDigital);
  
  if (paidItems.length === 0) {
    await addBotMessage("This order only contains digital items which are delivered instantly. Is there something else I can help with?");
    addOptions([
      { text: 'Go Back', action: showHomeMenu }
    ]);
    return;
  }
  
  await addBotMessage("Which item(s) do you need help with? Tap to select:");
  renderItemCards();
}

function renderItemCards() {
  state.selectedItems = []; // Reset selection
  
  const itemsHtml = state.selectedOrder.lineItems.map((item, index) => {
    // Determine badges
    let badges = '';
    if (item.productType === 'OFFER') badges += '<span class="product-badge initial">Initial Order</span>';
    if (item.productType === 'UPSALE') badges += '<span class="product-badge upsell">Upsell</span>';
    if (item.isFree && !item.isDigital) badges += '<span class="product-badge free">Free Gift</span>';
    if (item.isDigital) badges += '<span class="product-badge digital">Digital</span>';
    
    const disabled = item.isDigital ? 'disabled' : '';
    const disabledNote = item.isDigital ? '<div class="product-disabled-note">Digital items are delivered instantly</div>' : '';
    
    return `
      <div class="product-card ${disabled}" data-index="${index}" onclick="${item.isDigital ? '' : `toggleItemSelection(${index})`}">
        <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.title}" class="product-image">
        <div class="product-info">
          <div class="product-name">${item.title}</div>
          <div class="product-variant">${item.variantTitle || ''} ${item.sku ? `• ${item.sku}` : ''}</div>
          <div class="product-meta">
            <span class="product-price">${item.isFree ? 'FREE' : formatCurrency(item.price)}</span>
            ${badges}
          </div>
          ${disabledNote}
        </div>
        <div class="checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    `;
  }).join('');
  
  const selectableItems = state.selectedOrder.lineItems.filter(i => !i.isDigital);
  
  const containerHtml = `
    <div class="items-selection" id="itemsSelection">
      ${selectableItems.length > 1 ? `<button class="select-all-btn" onclick="selectAllItems()">Select All</button>` : ''}
      ${itemsHtml}
      <button class="option-btn primary" onclick="confirmItemSelection()" style="margin-top: 12px; width: 100%;">
        Continue
      </button>
    </div>
  `;
  
  addInteractiveContent(containerHtml);
}

function toggleItemSelection(index) {
  const item = state.selectedOrder.lineItems[index];
  if (item.isDigital) return;
  
  const card = document.querySelector(`.product-card[data-index="${index}"]`);
  const isSelected = card.classList.toggle('selected');
  
  if (isSelected) {
    if (!state.selectedItems.find(i => i.id === item.id)) {
      state.selectedItems.push(item);
    }
  } else {
    state.selectedItems = state.selectedItems.filter(i => i.id !== item.id);
  }
}

function selectAllItems() {
  state.selectedItems = state.selectedOrder.lineItems.filter(i => !i.isDigital);
  document.querySelectorAll('.product-card:not(.disabled)').forEach(card => {
    card.classList.add('selected');
  });
}

async function confirmItemSelection() {
  if (state.selectedItems.length === 0) {
    await addBotMessage("Please select at least one item to continue.");
    return;
  }
  
  // Check for mixed free/paid selection
  const hasFree = state.selectedItems.some(i => i.isFree);
  const hasPaid = state.selectedItems.some(i => !i.isFree);
  
  if (hasFree && hasPaid) {
    await addBotMessage("Free items and paid items need separate requests. Please select only one type.");
    return;
  }
  
  // Remove item selection UI
  document.getElementById('itemsSelection')?.closest('.interactive-content').remove();
  
  // Create editable summary
  const itemsList = state.selectedItems.map(i => i.title).join(', ');
  const summaryHtml = `
    <div class="editable-summary">
      <div class="summary-row"><span class="summary-label">Selected:</span> ${state.selectedItems.length} item(s)</div>
      <div class="summary-row summary-items">${itemsList}</div>
    </div>
  `;
  
  addEditableUserMessage(summaryHtml, () => {
    state.selectedItems = [];
    renderItemCards();
  }, 'Change Items');
  
  // Show intent options
  await showIntentOptions();
}

// ============================================
// INTENT OPTIONS
// ============================================
async function showIntentOptions() {
  await addBotMessage("Got it! What's going on with your order?");
  
  // Build dynamic intent options based on selected items
  const hasPuppyPad = state.selectedItems.some(i => i.isPuppyPad);
  const isFreeItem = state.selectedItems.every(i => i.isFree);
  
  let options = [];
  
  if (hasPuppyPad) {
    options.push({ icon: '🐕', text: "My dog isn't using it", action: () => handleIntent('dog_not_using') });
  }
  
  if (!isFreeItem) {
    options.push(
      { icon: '💭', text: "I changed my mind", action: () => handleIntent('changed_mind') },
      { icon: '😕', text: "It didn't meet expectations", action: () => handleIntent('not_met_expectations') },
      { icon: '🔄', text: "Ordered by mistake / Change order", action: () => handleIntent('ordered_mistake') },
      { icon: '📦', text: "Something was missing", action: () => handleIntent('missing_item') },
      { icon: '🔀', text: "I received the wrong item", action: () => handleIntent('wrong_item') },
      { icon: '💔', text: "My order arrived damaged", action: () => handleIntent('damaged') },
      { icon: '💳', text: "I was charged unexpectedly", action: () => handleIntent('charged_unexpectedly') }
    );
  }
  
  options.push(
    { icon: '🚚', text: "I haven't received my order", action: () => handleIntent('not_received') }
  );
  
  if (hasPuppyPad && !isFreeItem) {
    options.push({ icon: '🔍', text: "Quality difference in my products", action: () => handleIntent('quality_difference') });
  }
  
  options.push({ icon: '❓', text: "Other reason", action: () => handleIntent('other') });
  
  addOptions(options);
}

async function handleIntent(intent) {
  state.intent = intent;
  
  switch (intent) {
    case 'dog_not_using':
      await handleDogNotUsing();
      break;
    case 'changed_mind':
      await handleChangedMind();
      break;
    case 'not_met_expectations':
      await handleNotMetExpectations();
      break;
    case 'ordered_mistake':
      await handleOrderedMistake();
      break;
    case 'missing_item':
      await handleMissingItem();
      break;
    case 'wrong_item':
      await handleWrongItem();
      break;
    case 'damaged':
      await handleDamaged();
      break;
    case 'charged_unexpectedly':
      await handleChargedUnexpectedly();
      break;
    case 'not_received':
      await handleNotReceived();
      break;
    case 'quality_difference':
      await handleQualityDifference();
      break;
    case 'other':
      await handleOtherReason();
      break;
    default:
      await handleOtherReason();
  }
}

// ============================================
// DOG NOT USING FLOW (Claudia)
// ============================================
async function handleDogNotUsing() {
  await addBotMessage("I understand — the main reason you purchased this was to solve your problem, and we want to make sure it works for you! 🐕<br><br>Let me get some details about your pup so we can help.");
  
  renderDogInfoForm();
}

function renderDogInfoForm() {
  const formHtml = `
    <div class="form-container" id="dogInfoForm">
      <div class="form-group">
        <label>Dog's Name *</label>
        <input type="text" class="form-input" id="dogName" placeholder="e.g., Max">
      </div>
      
      <div class="form-group">
        <label>Breed *</label>
        <input type="text" class="form-input" id="dogBreed" placeholder="e.g., Golden Retriever">
      </div>
      
      <div class="form-group">
        <label>Age *</label>
        <input type="text" class="form-input" id="dogAge" placeholder="e.g., 2 years">
      </div>
      
      <div class="form-group">
        <label>What have you tried so far?</label>
        <textarea class="form-input" id="methodsTried" rows="3" placeholder="Tell us what methods you've already attempted..."></textarea>
      </div>
      
      <button class="option-btn primary" onclick="submitDogInfo()" style="margin-top: 8px; width: 100%;">
        Get Personalized Tips
      </button>
    </div>
  `;
  
  addInteractiveContent(formHtml);
}

async function submitDogInfo() {
  const dogName = document.getElementById('dogName')?.value.trim();
  const dogBreed = document.getElementById('dogBreed')?.value.trim();
  const dogAge = document.getElementById('dogAge')?.value.trim();
  const methodsTried = document.getElementById('methodsTried')?.value.trim();
  
  if (!dogName || !dogBreed || !dogAge) {
    await addBotMessage("Please fill in your dog's name, breed, and age so Claudia can help.");
    return;
  }
  
  document.getElementById('dogInfoForm')?.closest('.interactive-content').remove();
  
  const summaryHtml = `
    <div class="editable-summary">
      <div class="summary-row"><span class="summary-label">Dog:</span> ${dogName} (${dogBreed}, ${dogAge})</div>
      ${methodsTried ? `<div class="summary-row"><span class="summary-label">Tried:</span> ${methodsTried.substring(0, 50)}${methodsTried.length > 50 ? '...' : ''}</div>` : ''}
    </div>
  `;
  
  addEditableUserMessage(summaryHtml, () => renderDogInfoForm(), 'Edit Info');
  
  await addBotMessage("Thanks for sharing! I'm connecting you with our in-house veterinarian, Claudia. She's amazing at this! 🩺❤️");
  
  setPersona('claudia');
  
  await addBotMessage("Hi there! Thanks for the info about " + dogName + ". Let me review everything and give you some personalized tips...", 'claudia');
  
  // Simulate AI response
  await delay(1500);
  
  await addBotMessage(`Great news! Based on ${dogName}'s profile (${dogBreed}, ${dogAge}), here are my top recommendations:

<strong>1. Scent Association</strong> 🐾
Place a small amount of ${dogName}'s urine on the PuppyPad. Dogs naturally want to go where they smell their scent.

<strong>2. Positive Reinforcement</strong> 🎉
Every time ${dogName} even sniffs the pad, give praise and a small treat. Build positive associations!

<strong>3. Consistent Placement</strong> 📍
Keep the pad in the same spot. Dogs thrive on routine, and moving it can confuse them.

<strong>4. Timing is Key</strong> ⏰
Take ${dogName} to the pad right after meals, naps, and play sessions — these are peak potty times!

Give these a try for 5-7 days and you should see improvement! 🙂`, 'claudia');
  
  setPersona('amy');
  
  await addBotMessage("Did Claudia's tips help? Are you happy to give these a try?");
  
  showSatisfactionButtons();
}

// ============================================
// CLICKUP DEDUPLICATION
// ============================================
async function checkExistingCase() {
  if (!state.selectedOrder && !state.customerData?.email) {
    return { existingCase: false };
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/check-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: state.selectedOrder?.orderNumber,
        email: state.customerData?.email || state.selectedOrder?.email
      })
    });

    if (!response.ok) {
      console.warn('Case check API failed, continuing flow');
      return { existingCase: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Case check error:', error);
    return { existingCase: false };
  }
}

async function showExistingCaseMessage(caseInfo) {
  // Store existing case info in state for potential append flow
  state.existingCaseInfo = caseInfo;

  await addBotMessage(
    `I see we already have an open case for this order! 📋<br><br>` +
    `Your case ID is <strong>${caseInfo.caseId || 'N/A'}</strong> and it's currently being worked on.<br><br>` +
    `Would you like to add new information to this existing case, or do you have a different issue?`
  );

  // Log to analytics
  Analytics.logEvent('existing_case_found', {
    existingCaseId: caseInfo.caseId,
    orderNumber: state.selectedOrder?.orderNumber
  });

  addOptions([
    { icon: '📝', text: "Add info to this case", action: showAppendToExistingCase },
    { icon: '🔄', text: "I have a different issue", action: showItemSelection },
    { text: "Back to Home", action: () => restartChat() }
  ]);
}

async function showAppendToExistingCase() {
  await addBotMessage("What additional information would you like to add to your existing case?");

  const html = `
    <div class="form-container" id="appendCaseForm">
      <div class="form-group">
        <label>Additional Information</label>
        <textarea class="form-input" id="additionalInfo" rows="4" placeholder="Please describe any new details about your issue..."></textarea>
      </div>
      <button class="option-btn primary" onclick="submitAppendToCase()" style="width: 100%;">
        Add to My Case
      </button>
    </div>
  `;

  addInteractiveContent(html);
}

async function submitAppendToCase() {
  const additionalInfo = document.getElementById('additionalInfo')?.value.trim();

  if (!additionalInfo) {
    await addBotMessage("Please enter some information to add to your case.");
    return;
  }

  document.getElementById('appendCaseForm')?.closest('.interactive-content').remove();
  addUserMessage(additionalInfo);

  showProgress("Updating your case...", "Adding new information");

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/append-to-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: state.existingCaseInfo?.taskId,
        caseData: {
          sessionId: Analytics.sessionId,
          email: state.customerData?.email || state.selectedOrder?.email,
          orderNumber: state.selectedOrder?.orderNumber,
          selectedItems: state.selectedItems,
          intentDetails: additionalInfo
        },
        additionalInfo: additionalInfo,
        newIntent: state.currentIntent || 'Additional information'
      })
    });

    hideProgress();

    if (response.ok) {
      await showSuccess(
        "Case Updated!",
        `Your additional information has been added to case <strong>${state.existingCaseInfo?.caseId || 'N/A'}</strong>.<br><br>Our team will review this and get back to you soon.`
      );
      Analytics.logEvent('case_appended', { caseId: state.existingCaseInfo?.caseId });
    } else {
      throw new Error('Failed to update case');
    }
  } catch (error) {
    hideProgress();
    console.error('Error appending to case:', error);
    await addBotMessage("I'm sorry, there was an issue updating your case. Let me connect you with our team directly.");
    await showManualHelpForm();
  }
}

// Expose functions to window for onclick handlers
window.submitAppendToCase = submitAppendToCase;

// ============================================
// 90-DAY GUARANTEE VALIDATION
// ============================================
async function validateGuarantee() {
  if (!state.selectedOrder) {
    return { eligible: true, usedFallback: true };
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/validate-guarantee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: state.selectedOrder.orderNumber,
        orderCreatedAt: state.selectedOrder.createdAt
      })
    });

    if (!response.ok) {
      // If API fails, allow the flow to continue (fail open)
      console.warn('Guarantee validation API failed, allowing flow');
      return { eligible: true, usedFallback: true };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Guarantee validation error:', error);
    // Fail open - allow flow to continue
    return { eligible: true, usedFallback: true };
  }
}

async function showGuaranteeExpired(guarantee) {
  const daysSince = guarantee.daysSince || 0;

  await addBotMessage(
    `I really wish I could help with a refund, but I need to be upfront with you. 💔<br><br>` +
    `Our 90-day money-back guarantee has expired — it's been <strong>${daysSince} days</strong> since your order ` +
    `${guarantee.usedFallback ? 'was placed' : 'was delivered'}.<br><br>` +
    `I know that's not what you wanted to hear, and I'm genuinely sorry. Is there anything else I can help you with?`
  );

  // Log policy block to analytics
  Analytics.logPolicyBlock('90_day_guarantee', { daysSince: guarantee.daysSince });
  Analytics.logEvent('policy_block', '90_day_guarantee_expired', {
    orderNumber: state.selectedOrder?.orderNumber,
    daysSince: guarantee.daysSince,
    usedFallback: guarantee.usedFallback
  });

  addOptions([
    { text: "Help with something else", action: showHomeMenu },
    { text: "Contact support", action: () => showManualHelpForm() }
  ]);
}

// ============================================
// SATISFACTION & LADDER FLOWS
// ============================================
function showSatisfactionButtons() {
  const html = `
    <div class="satisfaction-container">
      <button class="satisfaction-btn yes" onclick="handleSatisfied(true)">
        <div class="satisfaction-emoji">😊</div>
        <div class="satisfaction-text">Yes, I'll try these!</div>
      </button>
      <button class="satisfaction-btn no" onclick="handleSatisfied(false)">
        <div class="satisfaction-emoji">😔</div>
        <div class="satisfaction-text">No, I need more help</div>
      </button>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function handleSatisfied(satisfied) {
  document.querySelector('.satisfaction-container')?.closest('.interactive-content').remove();
  
  addUserMessage(satisfied ? "Yes, I'll try these!" : "No, I need more help");
  
  if (satisfied) {
    await addBotMessage("That's great to hear! 🎉 Give it a go and remember — consistency is key. You've got this!<br><br>Is there anything else I can help you with?");
    
    addOptions([
      { text: "No, I'm all set!", action: () => showSuccess("Thanks for chatting!", "We're here whenever you need us. Have a great day! 🐕") },
      { text: "Yes, something else", action: showHomeMenu }
    ]);
  } else {
    // Start refund ladder
    state.ladderType = 'order_refund';
    state.ladderStep = 0;
    await startRefundLadder();
  }
}

async function startRefundLadder() {
  // Check 90-day guarantee on first step only
  if (state.ladderStep === 0) {
    const guarantee = await validateGuarantee();
    if (!guarantee.eligible) {
      await showGuaranteeExpired(guarantee);
      return;
    }
  }

  const ladderSteps = [
    { percent: 20, message: "I understand. As a valued customer, I'd like to offer you a <strong>20% partial refund</strong> while you keep the product and continue trying." },
    { percent: 30, message: "I really want to make this right. Let me offer you a <strong>30% refund</strong> — that's a significant amount back while you keep everything." },
    { percent: 40, message: "You're clearly not satisfied, and I get it. How about <strong>40% back</strong>? That way you've got nearly half your money back and can keep trying." },
    { percent: 50, message: "Let me do something special. I can offer you a <strong>50% refund</strong> — half your money back, no return needed." }
  ];

  if (state.ladderStep >= ladderSteps.length) {
    await handleFullRefund();
    return;
  }

  const step = ladderSteps[state.ladderStep];
  const totalPrice = parseFloat(state.selectedOrder?.totalPrice || 0);
  const refundAmount = (totalPrice * step.percent / 100).toFixed(2);

  await addBotMessage(step.message);
  
  showOfferCard(step.percent, refundAmount);
}

function showOfferCard(percent, amount) {
  const html = `
    <div class="offer-card">
      <div class="offer-icon">💰</div>
      <div class="offer-amount">${percent}%</div>
      <div class="offer-value">${formatCurrency(amount)} back to you</div>
      <div class="offer-label">Partial refund — keep your products</div>
      <div class="offer-buttons">
        <button class="offer-btn accept" onclick="acceptOffer(${percent}, ${amount})">Accept Offer</button>
        <button class="offer-btn decline" onclick="declineOffer()">No thanks</button>
      </div>
      <div class="offer-note">Refund processed within 3-5 business days</div>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function acceptOffer(percent, amount) {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage(`I'll accept the ${percent}% refund`);

  showProgress("Processing your refund...", "Creating your case");

  // Submit to backend (ClickUp + Richpanel)
  const result = await submitCase('refund', `partial_${percent}`, {
    refundAmount: amount,
    refundPercent: percent,
    keepProduct: true,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Refund Approved!",
    `Your ${percent}% refund of ${formatCurrency(amount)} will be processed within 3-5 business days.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function declineOffer() {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage("No thanks, I need more help");
  
  state.ladderStep++;
  
  if (state.ladderStep >= 4) {
    await handleFullRefund();
  } else {
    await startRefundLadder();
  }
}

async function handleFullRefund() {
  await addBotMessage("I completely understand. Let's proceed with a full refund. First, I need to know — has the product been used?");
  
  addOptionsRow([
    { text: "Yes, it's been used", action: () => handleUsedProduct(true) },
    { text: "No, it's unused", action: () => handleUsedProduct(false) }
  ]);
}

async function handleUsedProduct(isUsed) {
  const address = state.selectedOrder?.shippingAddress;
  const country = address?.country || '';
  const isUSorCanada = country.toLowerCase().includes('united states') || 
                       country.toLowerCase().includes('canada') || 
                       country.toLowerCase().includes('usa');
  
  if (isUsed) {
    // Used product - full refund, keep product
    await addBotMessage("We usually don't provide full refunds for used products, but because we genuinely value you as a customer, I'd like to make an exception. ❤️<br><br>We'll process a <strong>full refund</strong> and you can keep the product — maybe give it to a friend or neighbor with a pup!");
    
    await createRefundCase('full', true);
  } else {
    // Unused product
    if (isUSorCanada) {
      // Can return
      await addBotMessage("Perfect! Since the product is unused, we'll process a <strong>full refund</strong> once we receive it back.<br><br>Please return it to our warehouse:");
      
      showReturnInstructions();
    } else {
      // International - can't return economically
      await addBotMessage("Because you're valued as a customer, we'll process a <strong>full refund</strong> and you can keep the product. Consider giving it to someone who might find it useful! 🙂");
      
      await createRefundCase('full', true);
    }
  }
}

function showReturnInstructions() {
  const items = state.selectedItems.map(i => `• ${i.title} (SKU: ${i.sku})`).join('<br>');

  const html = `
    <div class="form-container">
      <h3 style="margin-bottom: 12px; color: var(--navy);">📦 Return Instructions</h3>

      <div style="background: var(--coral-soft); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
        <strong>⚠️ Important: We cannot provide return shipping labels</strong><br><br>
        Our system does not generate return labels, and our policy requires customers to ship returns using a carrier of their choice. We recommend USPS, UPS, or FedEx.
      </div>

      <div style="background: var(--navy-soft); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
        <strong>Ship to:</strong><br>
        PuppyPad Returns<br>
        1007 S 12th St.<br>
        Watertown, WI 53094<br>
        USA
      </div>

      <div style="margin-bottom: 16px;">
        <strong>Include in package:</strong><br>
        ${items}<br><br>
        <strong>Order Number:</strong> ${state.selectedOrder?.orderNumber}<br>
        <strong>Your Name:</strong> ${state.customerData.firstName}<br>
        <strong>Reason:</strong> Return for refund
      </div>

      <div style="background: var(--yellow); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
        <strong>📧 After shipping:</strong> Please reply to your confirmation email with your tracking number so we can monitor the return and process your refund promptly.
      </div>

      <button class="option-btn primary" onclick="confirmReturn()" style="width: 100%;">
        I Understand — Create My Case
      </button>
    </div>
  `;

  addInteractiveContent(html);
}

async function confirmReturn() {
  document.querySelector('.form-container')?.closest('.interactive-content').remove();
  addUserMessage("I understand the return process");

  await createRefundCase('full', false);
}

// ============================================
// SUBMIT CASE TO BACKEND (ClickUp + Richpanel)
// ============================================
async function submitCase(caseType, resolution, options = {}) {
  const order = state.selectedOrder;
  const items = state.selectedItems || [];

  const caseData = {
    // Session info
    sessionId: Analytics.sessionId,

    // Case type
    caseType: caseType,           // 'refund', 'return', 'shipping', 'subscription', 'manual'
    resolution: resolution,        // 'partial_20', 'partial_50', 'full_refund', etc.

    // Customer info
    email: state.customerData?.email || order?.email || '',
    phone: state.customerData?.phone || order?.phone || '',
    customerName: `${state.customerData?.firstName || order?.customerFirstName || ''} ${state.customerData?.lastName || order?.customerLastName || ''}`.trim(),
    customerFirstName: state.customerData?.firstName || order?.customerFirstName || '',
    customerLastName: state.customerData?.lastName || order?.customerLastName || '',

    // Order info
    orderNumber: order?.orderNumber || '',
    orderId: order?.id || '',
    orderUrl: order?.orderUrl || '',
    orderDate: order?.createdAt || '',

    // Items
    selectedItems: items.map(item => ({
      id: item.id,
      title: item.title,
      sku: item.sku || '',
      price: item.price,
      quantity: item.quantity || 1,
    })),

    // Refund details
    refundAmount: options.refundAmount || null,
    refundPercent: options.refundPercent || null,
    keepProduct: options.keepProduct ?? true,

    // Additional context
    intentDetails: state.intentDetails || '',
    notes: options.notes || '',

    // Subscription-specific fields (for subscription cases)
    purchaseId: options.purchaseId || state.selectedSubscription?.purchaseId || '',
    clientOrderId: options.clientOrderId || state.selectedSubscription?.clientOrderId || '',
    subscriptionProductName: options.subscriptionProductName || state.selectedSubscription?.productName || '',
    actionType: options.actionType || '',
    discountPercent: options.discountPercent || null,
    subscriptionStatus: options.subscriptionStatus || state.selectedSubscription?.status || '',
    cancelReason: options.cancelReason || state.cancelReason || '',

    // Shipping-specific fields (for shipping cases)
    trackingNumber: options.trackingNumber || '',
    carrierName: options.carrierName || '',
    trackingStatus: options.trackingStatus || '',
    daysInTransit: options.daysInTransit || null,
    shippingAddress: options.shippingAddress || order?.shippingAddress || null,
    carrierIssue: options.carrierIssue || '',
    addressChanged: options.addressChanged || false,
    pickupReason: options.pickupReason || '',

    // Timestamps
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/create-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Log success event
    Analytics.logEvent('case_created', {
      caseId: result.caseId,
      caseType,
      resolution,
      clickupTaskId: result.clickupTaskId,
    });

    return result;
  } catch (error) {
    console.error('Error creating case:', error);
    Analytics.logEvent('case_creation_error', { error: error.message });

    // Return a fallback case ID so user flow isn't broken
    return {
      success: false,
      caseId: generateCaseId(caseType),
      error: error.message,
    };
  }
}

async function createRefundCase(type, keepProduct) {
  showProgress("Creating your case...", "Notifying our team");

  // Calculate refund amount for full refunds
  const totalAmount = state.selectedItems?.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) || 0;

  // Submit to backend (ClickUp + Richpanel)
  const caseType = keepProduct ? 'refund' : 'return';
  const result = await submitCase(caseType, 'full_refund', {
    refundAmount: totalAmount,
    refundPercent: 100,
    keepProduct: keepProduct,
  });

  hideProgress();

  state.caseId = result.caseId;

  const message = keepProduct
    ? `Your refund will be processed within 3-5 business days.`
    : `Once we receive your return, we'll process your refund within 3-5 business days. Don't forget to send us the tracking number!`;

  await showSuccess(
    "Case Created!",
    `${message}<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

// ============================================
// OTHER INTENT HANDLERS (simplified for length)
// ============================================
async function handleChangedMind() {
  await addBotMessage("No problem! Can you tell me a bit more about why you changed your mind? This helps me understand how to best help you.");
  
  showTextInput("Tell me more...", async (text) => {
    hideTextInput();
    state.intentDetails = text;
    
    await addBotMessage("I appreciate you sharing that. Let me see what I can do for you...");
    await delay(1000);
    
    state.ladderType = 'order_refund';
    state.ladderStep = 0;
    await startRefundLadder();
  });
}

async function handleNotMetExpectations() {
  await addBotMessage("I'm really sorry to hear that 😔 We always want our products to exceed expectations. Could you share what specifically didn't meet your expectations?");
  
  showTextInput("What disappointed you?", async (text) => {
    hideTextInput();
    state.intentDetails = text;
    
    await addBotMessage("Thank you for that feedback — I've noted it down. This really helps us improve. Now let me make this right for you.");
    
    state.ladderType = 'order_refund';
    state.ladderStep = 0;
    await startRefundLadder();
  });
}

async function handleOrderedMistake() {
  await addBotMessage("No worries! Would you like to change your order to something else, or would you prefer a refund?");
  
  addOptions([
    { text: "Change my order", action: handleChangeOrder },
    { text: "I want a refund", action: async () => {
      state.ladderType = 'order_refund';
      state.ladderStep = 0;
      await startRefundLadder();
    }}
  ]);
}

async function handleChangeOrder() {
  await addBotMessage("Sure! What would you like instead? Tell me what product, size, or color you'd prefer:");
  
  showTextInput("What would you like instead?", async (text) => {
    hideTextInput();
    state.intentDetails = text;
    
    await addBotMessage("Got it! I'll create a case for our team to swap your order. Has your current product been used?");
    
    addOptionsRow([
      { text: "Yes, used", action: () => handleOrderSwap(true) },
      { text: "No, unused", action: () => handleOrderSwap(false) }
    ]);
  });
}

async function handleOrderSwap(isUsed) {
  if (isUsed) {
    await addBotMessage("Since it's been used, we'll send you the new item and give you a <strong>20% refund</strong> as well. You can keep the used one!");
  } else {
    await addBotMessage("Great! Once you ship back the item using a carrier of your choice, we'll send out your new order. Just reply to your confirmation email with the tracking number so we can monitor the return. Free of charge!");
  }

  showProgress("Creating your order change request...");

  // Create case in ClickUp + Richpanel with change order details
  const resolution = isUsed ? 'order_change_used_20_percent' : 'order_change_return_swap';
  const result = await submitCase('shipping', resolution, {
    issueType: 'order_change',
    changeOrderDetails: state.intentDetails,   // What they want instead
    productUsed: isUsed,
  });

  hideProgress();

  if (result.success) {
    await showSuccess(
      "Order Change Requested!",
      `We'll process your change to: <strong>${state.intentDetails}</strong><br><br>${getCaseIdHtml(result.caseId)}`
    );
  } else {
    await showSuccess(
      "Request Submitted",
      `We've noted your change request for: <strong>${state.intentDetails}</strong>. Our team will reach out shortly.`
    );
  }
}

async function handleMissingItem() {
  await addBotMessage("Oh no! I'm really sorry something was missing. To help investigate, could you please upload a photo of what you received (including any packaging)?");

  showUploadArea('missing_item');
}

function showUploadArea(evidenceType = 'general') {
  // Store the evidence type for later use
  state.evidenceType = evidenceType;

  const html = `
    <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
      <input type="file" id="fileInput" accept="image/*" multiple style="display: none" onchange="handleFileUpload(event)">
      <div class="upload-icon">📷</div>
      <div class="upload-text">Tap to upload photos</div>
      <div class="upload-hint">JPG or PNG, max 5MB each</div>
      <div class="upload-preview" id="uploadPreview"></div>
    </div>
    <button class="option-btn primary" onclick="submitEvidence()" style="margin-top: 12px; width: 100%;" id="submitEvidenceBtn" disabled>
      Submit Photos
    </button>
  `;

  addInteractiveContent(html);
}

function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  const preview = document.getElementById('uploadPreview');
  const submitBtn = document.getElementById('submitEvidenceBtn');
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Please upload images under 5MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files (JPG, PNG).');
      return;
    }
    
    state.uploadedFiles.push(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'upload-thumb-container';
      thumbContainer.innerHTML = `
        <img src="${e.target.result}" class="upload-thumb" alt="Upload">
        <button class="upload-remove" onclick="removeUpload(${state.uploadedFiles.length - 1}, this)">×</button>
      `;
      preview.appendChild(thumbContainer);
    };
    reader.readAsDataURL(file);
  });
  
  submitBtn.disabled = state.uploadedFiles.length === 0;
}

function removeUpload(index, btn) {
  state.uploadedFiles.splice(index, 1);
  btn.parentElement.remove();
  document.getElementById('submitEvidenceBtn').disabled = state.uploadedFiles.length === 0;
}

async function submitEvidence() {
  if (state.uploadedFiles.length === 0) {
    await addBotMessage("Please upload at least one photo so we can help.");
    return;
  }

  document.getElementById('uploadArea')?.closest('.interactive-content').remove();
  addUserMessage(`Uploaded ${state.uploadedFiles.length} photo(s)`);

  // Handle different evidence types with specific flows
  switch (state.evidenceType) {
    case 'damaged':
      await handleDamagedEvidence();
      break;
    case 'wrong_item':
      await handleWrongItemEvidence();
      break;
    case 'missing_item':
      await handleMissingItemEvidence();
      break;
    default:
      await handleGenericEvidence();
  }
}

// Damaged item evidence flow
async function handleDamagedEvidence() {
  await addBotMessage("Thank you for the photos. I can see the damage and I'm very sorry this happened.<br><br>I'd like to make this right. Would you prefer a replacement or a refund?");

  addOptions([
    { text: "Send me a replacement", action: async () => {
      showProgress("Creating replacement order...");
      await delay(1500);
      hideProgress();

      await addBotMessage("Perfect! I'll ship out a replacement right away. You can keep or dispose of the damaged item - no need to return it.");

      state.caseId = generateCaseId('shipping');
      state.resolution = 'replacement_damaged';

      await submitCase();

      await showSuccess(
        "Replacement Ordered!",
        `Your replacement will ship within 1-2 business days. We'll email you the tracking info.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "I'd prefer a refund", action: async () => {
      await addBotMessage("No problem. Since you received a damaged item, you're entitled to a full refund. Do you want to return the damaged item or keep it?");

      addOptionsRow([
        { text: "Keep it, just refund", primary: true, action: async () => {
          state.resolution = 'full_refund';
          state.keepProduct = true;
          await createRefundCase('full', true);
        }},
        { text: "Return it for refund", action: async () => {
          state.resolution = 'full_refund';
          state.keepProduct = false;
          await showReturnInstructions();
        }}
      ]);
    }}
  ]);
}

// Wrong item evidence flow
async function handleWrongItemEvidence() {
  await addBotMessage("Thank you for the photos. I've confirmed you received the wrong item and I sincerely apologize for this error.<br><br>I'll ship the correct item right away. You can keep or donate the wrong item - no need to return it.");

  addOptionsRow([
    { text: "Ship correct item", primary: true, action: async () => {
      showProgress("Creating correction order...");
      await delay(1500);
      hideProgress();

      state.caseId = generateCaseId('shipping');
      state.resolution = 'reship_wrong_item';

      await submitCase();

      await showSuccess(
        "Correct Item Shipping!",
        `The correct item will ship within 1-2 business days. We'll email you the tracking info. Thanks for your patience!<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "I'd prefer a refund", action: async () => {
      state.resolution = 'full_refund';
      state.keepProduct = true;
      await createRefundCase('full', true);
    }}
  ]);
}

// Missing item evidence flow
async function handleMissingItemEvidence() {
  await addBotMessage("Thank you for the photos. I've noted the missing item and we'll investigate with our fulfillment center.<br><br>Would you like us to ship the missing item, or would you prefer a refund for it?");

  addOptions([
    { text: "Ship the missing item", action: async () => {
      showProgress("Creating shipment for missing item...");
      await delay(1500);
      hideProgress();

      state.caseId = generateCaseId('shipping');
      state.resolution = 'reship_missing_item';

      await submitCase();

      await showSuccess(
        "Missing Item Shipping!",
        `The missing item will ship within 1-2 business days. We'll email you the tracking info.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "Refund for missing item", action: async () => {
      // Partial refund for just the missing item
      const missingValue = state.selectedItems?.[0]?.price || state.selectedOrder?.totalPrice || 0;
      state.refundAmount = missingValue;
      state.resolution = 'partial_missing';

      showProgress("Processing refund for missing item...");
      await delay(1500);
      hideProgress();

      state.caseId = generateCaseId('refund');

      await submitCase();

      await showSuccess(
        "Refund Processed!",
        `We've issued a refund of ${formatCurrency(missingValue)} for the missing item. It will appear in your account within 3-5 business days.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }}
  ]);
}

// Generic evidence flow (fallback)
async function handleGenericEvidence() {
  await addBotMessage("Thank you for the photos. I've noted this issue and we'll investigate. Should I proceed with creating this case?");

  addOptionsRow([
    { text: "Yes, create case", primary: true, action: async () => {
      showProgress("Creating case and uploading evidence...");
      await delay(2000);
      hideProgress();

      state.caseId = generateCaseId('shipping');

      await submitCase();

      await showSuccess(
        "Investigation Started!",
        `We'll look into this and get back to you within 24-48 hours.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "Cancel", action: showHomeMenu }
  ]);
}

async function handleDamaged() {
  await addBotMessage("I'm so sorry your order arrived damaged. To help process this quickly, please upload photos of the damage (including packaging if relevant):");
  showUploadArea('damaged');
}

async function handleWrongItem() {
  await addBotMessage("I'm sorry to hear you received the wrong item! To help us investigate, please upload photos of what you received:");
  showUploadArea('wrong_item');
}

async function handleChargedUnexpectedly() {
  const order = state.selectedOrder;
  
  await addBotMessage(`Let me confirm your order details:<br><br>
<strong>Order:</strong> ${order?.orderNumber}<br>
<strong>Total Charged:</strong> ${formatCurrency(order?.totalPrice)}<br>
<strong>Date:</strong> ${formatDate(order?.createdAt)}<br><br>
Is this the charge you're referring to?`);
  
  addOptionsRow([
    { text: "Yes, this one", action: async () => {
      await addBotMessage("Was there something unexpected about this charge? Please tell me what you expected to pay:");
      showTextInput("What did you expect?", async (text) => {
        hideTextInput();
        state.intentDetails = text;
        
        await addBotMessage("I understand. Let me create a case for our team to investigate this charge discrepancy.");
        
        showProgress("Creating investigation case...");
        await delay(1500);
        hideProgress();
        
        state.caseId = generateCaseId('refund');
        
        await showSuccess(
          "Investigation Started",
          `We'll review the charge and get back to you within 24 hours.<br><br>${getCaseIdHtml(state.caseId)}`
        );
      });
    }},
    { text: "No, different charge", action: () => {
      showTextInput("Tell me about the charge", async (text) => {
        hideTextInput();
        
        showProgress("Creating investigation...");
        await delay(1500);
        hideProgress();
        
        state.caseId = generateCaseId('manual');
        
        await showSuccess(
          "Investigation Started",
          `We'll look into this and contact you soon.<br><br>${getCaseIdHtml(state.caseId)}`
        );
      });
    }}
  ]);
}

async function handleQualityDifference() {
  await addBotMessage("I understand you've noticed a quality difference in your PuppyPads. Here's what's happening:<br><br>We recently <strong>upgraded</strong> our PuppyPads to a premium version! 🎉<br><br>The higher quality pads you received are actually our new and improved version — thicker, more absorbent, and more durable. They normally cost $20-30 more, but we're giving them to our valued customers at the same price!");
  
  addOptions([
    { text: "Oh great! I love them actually", action: async () => {
      await addBotMessage("That's wonderful to hear! 🎉 Enjoy your premium PuppyPads. Is there anything else I can help with?");
      addOptions([
        { text: "No, I'm all set!", action: () => showSuccess("Thanks for chatting!", "Enjoy your PuppyPads! 🐕") },
        { text: "Yes, something else", action: showHomeMenu }
      ]);
    }},
    { text: "I prefer the original quality", action: async () => {
      await addBotMessage("I completely understand — everyone has preferences! As a one-time courtesy, I can ship you a set of our original PuppyPads free of charge. You can keep the premium ones too!");
      
      addOptionsRow([
        { text: "Yes please!", primary: true, action: async () => {
          showProgress("Creating free reship order...");
          await delay(1500);
          hideProgress();
          
          state.caseId = generateCaseId('shipping');
          
          await showSuccess(
            "Free Reship Created!",
            `We'll ship out the original PuppyPads within 1-2 business days. Keep the premium ones too! 🎁<br><br>${getCaseIdHtml(state.caseId)}`
          );
        }},
        { text: "No thanks", action: showHomeMenu }
      ]);
    }}
  ]);
}

async function handleOtherReason() {
  await addBotMessage("No problem — tell me what's going on and I'll do my best to help:");
  
  showTextInput("Describe your issue...", async (text) => {
    hideTextInput();
    state.intentDetails = text;
    
    await addBotMessage("Thank you for explaining. Let me see what options I have for you.");
    
    state.ladderType = 'order_refund';
    state.ladderStep = 0;
    await startRefundLadder();
  });
}

// ============================================
// NOT RECEIVED / TRACKING FLOWS
// ============================================
async function handleNotReceived() {
  await addBotMessage("Let me check the tracking status for your order...");
  await getTrackingForIntent();
}

async function getTrackingForIntent() {
  showProgress("Looking up tracking...", "Checking ParcelPanel for your package status");

  try {
    const orderNumber = state.selectedOrder?.orderNumber || state.customerData?.orderNumber;

    if (!orderNumber) {
      hideProgress();
      state.tracking = null;
      await handleTrackingResult();
      return;
    }

    const response = await fetch(`${CONFIG.API_URL}/api/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: orderNumber.replace('#', '') })
    });

    hideProgress();

    if (!response.ok) {
      state.tracking = null;
      await handleTrackingResult();
      return;
    }

    const data = await response.json();
    state.tracking = data.tracking;
    state.allTracking = data.allTracking; // Store all parcels if multi-parcel order

    await handleTrackingResult();
  } catch (error) {
    console.error('Tracking lookup error:', error);
    hideProgress();
    state.tracking = null;
    await handleTrackingResult();
  }
}

async function handleTrackingResult() {
  const tracking = state.tracking;

  if (!tracking) {
    await addBotMessage("I couldn't find tracking info for this order. Let me create a case for our team to investigate.");
    await createShippingCase('no_tracking');
    return;
  }

  // Handle different ParcelPanel statuses
  switch (tracking.status) {
    case 'delivered':
      await handleStatusDelivered(tracking);
      break;

    case 'out_for_delivery':
      await handleStatusOutForDelivery(tracking);
      break;

    case 'in_transit':
      await handleStatusInTransit(tracking);
      break;

    case 'pending':
    case 'info_received':
      await handleStatusPending(tracking);
      break;

    case 'failed_attempt':
      await handleStatusFailedAttempt(tracking);
      break;

    case 'pickup':
    case 'ready_for_pickup':
    case 'available_for_pickup':
      await handleStatusPickup(tracking);
      break;

    case 'exception':
    case 'expired':
    default:
      // Check if it's actually a pickup status that slipped through
      if (tracking.status?.includes('pickup') || tracking.statusLabel?.toLowerCase().includes('pickup')) {
        await handleStatusPickup(tracking);
      } else {
        await handleStatusException(tracking);
      }
      break;
  }
}

// Status: Delivered - but customer says not received
async function handleStatusDelivered(tracking) {
  const deliveryDate = tracking.deliveryDate ? formatDate(tracking.deliveryDate) : 'recently';

  await addBotMessage(`According to tracking, your order was delivered on <strong>${deliveryDate}</strong>.`);

  await addBotMessage(`Before we investigate, could you please double-check these common locations?<br><br>
• <strong>Neighbors</strong> - Sometimes packages are left next door<br>
• <strong>Family/household members</strong> - Someone may have brought it inside<br>
• <strong>Safe spots</strong> - Behind pillars, under mats, in bushes<br>
• <strong>Front desk/mailroom</strong> - If you live in an apartment or building<br>
• <strong>Garage or side door</strong> - Carriers sometimes leave packages there`);

  addOptions([
    { text: "I've checked all these places", action: () => handleDeliveredNotReceived() },
    { text: "Give me time to check", action: async () => {
      await addBotMessage("Take your time! 🙂 Feel free to come back if you still can't find it. We're here to help.");
      // Log that customer is checking - analytics
      Analytics.logEvent('delivered_checking_locations');
      addOptions([{ text: "Back to Home", action: showHomeMenu }]);
    }},
    { text: "I found it!", action: () => showSuccess("Great!", "So glad you found your package! 🎉") }
  ]);
}

// Status: Out for Delivery - treat same as In Transit for day thresholds
async function handleStatusOutForDelivery(tracking) {
  // Out for Delivery uses the same "on the way" logic as In Transit
  await handleOnTheWay(tracking, 'out_for_delivery');
}

// Status: In Transit - check how long
async function handleStatusInTransit(tracking) {
  await handleOnTheWay(tracking, 'in_transit');
}

// Shared handler for "on the way" statuses (in_transit + out_for_delivery)
async function handleOnTheWay(tracking, statusType) {
  const daysInTransit = tracking.daysInTransit || 0;
  const isInternational = isInternationalCarrier(tracking);
  const isOutForDelivery = statusType === 'out_for_delivery';

  // 15+ days: Auto-escalate with reship/refund options
  if (daysInTransit >= CONFIG.IN_TRANSIT_ESCALATE_DAYS) {
    await handleExtendedTransit(tracking, isInternational);
    return;
  }

  // 6-14 days: Sarah voice note with reassurance
  if (daysInTransit >= CONFIG.IN_TRANSIT_VOICE_DAYS) {
    await showSarahVoiceNote(tracking, isInternational);
    return;
  }

  // 0-5 days: Normal messaging
  const estimatedDelivery = tracking.estimatedDelivery ? ` Expected delivery: <strong>${formatDate(tracking.estimatedDelivery)}</strong>` : '';

  if (isOutForDelivery) {
    // Out for delivery - should arrive today
    await addBotMessage(`Great news! Your package is <strong>out for delivery today</strong>. It should arrive within the next few hours.${estimatedDelivery}`);

    if (isInternational) {
      await addBotMessage(`Your order is shipping from our international warehouse, which can sometimes take a bit longer but it's on its way to you!`);
    }

    addOptions([
      { text: "Perfect, I'll wait", action: () => showSuccess("Almost there!", "Your package should arrive today!") },
      { text: "It's been out for delivery for days", action: async () => {
        await addBotMessage("That's unusual. Let me create a case for our team to investigate with the carrier.");
        await createShippingCase('stuck_out_for_delivery');
      }}
    ]);
  } else {
    // In transit - normal progress
    let message = `Your order is currently <strong>in transit</strong> and has been shipping for ${daysInTransit} day${daysInTransit !== 1 ? 's' : ''}.`;

    if (isInternational) {
      message += ` Since this is shipping from our international warehouse, delivery typically takes 10-20 business days.`;
    } else {
      message += ` Delivery typically takes 5-10 business days.`;
    }

    message += `${estimatedDelivery}<br><br>It's still within the normal delivery window — your package is on its way!`;

    await addBotMessage(message);

    addOptions([
      { text: "Okay, I'll wait", action: () => showSuccess("Thanks for your patience!", "Your package is on its way! 📦") },
      { text: "I have a concern", action: () => handleExtendedTransit(tracking, isInternational) }
    ]);
  }
}

// Status: Pending/Info Received - not yet shipped
async function handleStatusPending(tracking) {
  await addBotMessage(`Your order is currently being prepared for shipment. The carrier has received the shipping information but hasn't picked up the package yet.<br><br>This typically happens within 1-2 business days of placing your order.`);

  // Check if it's been too long in pending status
  const daysInTransit = tracking.daysInTransit || 0;

  if (daysInTransit > 3) {
    await addBotMessage("However, I notice it's been a few days. Would you like me to look into this for you?");
    addOptions([
      { text: "Yes, please investigate", action: async () => {
        await createShippingCase('pending_too_long');
      }},
      { text: "I'll wait a bit longer", action: () => showSuccess("Thanks!", "We'll ship it soon!") }
    ]);
  } else {
    addOptions([
      { text: "Got it, I'll wait", action: () => showSuccess("Thanks!", "Your order will ship soon!") },
      { text: "I need to cancel instead", action: async () => {
        await addBotMessage("Since your order hasn't shipped yet, I can process a full cancellation and refund.");
        state.ladderType = 'order_refund';
        state.ladderStep = 0;
        await createRefundCase('full', true);
      }}
    ]);
  }
}

// Status: Failed Attempt - delivery was attempted but failed
async function handleStatusFailedAttempt(tracking) {
  await addBotMessage(`The carrier attempted to deliver your package but was unsuccessful. This could be due to:<br><br>• No one available to sign<br>• Address access issues<br>• Weather conditions<br><br>They'll typically try again within 1-2 business days.`);

  addOptions([
    { text: "I'll be home next time", action: () => showSuccess("Sounds good!", "The carrier will attempt delivery again soon.") },
    { text: "I need to change my address", action: () => handleFailedAttemptAddressChange(tracking) },
    { text: "They've tried multiple times", action: () => handleMultipleFailedAttempts(tracking) }
  ]);
}

// Handle address change request for failed attempts
async function handleFailedAttemptAddressChange(tracking) {
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);

  await addBotMessage(`Since your package is already with ${carrierInfo.name}, you'll need to contact them directly to update the delivery address or arrange a pickup.`);

  let contactMessage = `<strong>${carrierInfo.name} Contact Information:</strong><br><br>`;

  if (carrierInfo.phone) {
    contactMessage += `📞 Phone: <strong>${carrierInfo.phone}</strong><br>`;
  }
  if (carrierInfo.website) {
    contactMessage += `🌐 Website: <strong>${carrierInfo.website}</strong><br>`;
  }
  contactMessage += `📦 Tracking: <strong>${tracking?.trackingNumber || 'Check your email'}</strong>`;

  await addBotMessage(contactMessage);

  await addBotMessage(`When you call, they can help you:<br>• Update the delivery address<br>• Schedule a redelivery<br>• Arrange a pickup at a local facility`);

  addOptions([
    { text: "Thanks, I'll contact them", action: () => showSuccess("Good luck!", "The carrier should be able to help you with the address change.") },
    { text: "I'd rather get a reship", action: async () => {
      await addBotMessage("No problem! If you'd prefer, I can create a new shipment to your address once this one is returned to us, or you can provide a different address.");
      await handleReship();
    }}
  ]);
}

// Handle multiple failed delivery attempts
async function handleMultipleFailedAttempts(tracking) {
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);

  await addBotMessage(`I'm really sorry you're dealing with this — multiple failed attempts is frustrating. Let me help you figure out the best solution.`);

  await addBotMessage(`Is your address correct, or do you need to update it?`);

  addOptions([
    { text: "My address is correct", action: async () => {
      await addBotMessage(`Got it. Since ${carrierInfo.name} has been unable to deliver, here are your options:`);

      let optionsMessage = `<strong>Option 1: Contact ${carrierInfo.name}</strong><br>`;
      if (carrierInfo.phone) {
        optionsMessage += `Call ${carrierInfo.phone} to schedule a specific delivery time or arrange pickup.<br><br>`;
      } else {
        optionsMessage += `Contact them to schedule a specific delivery time or arrange pickup.<br><br>`;
      }
      optionsMessage += `<strong>Option 2: We reship to a different address</strong><br>If you have an alternate address (work, neighbor, etc.) that might work better.`;

      await addBotMessage(optionsMessage);

      addOptions([
        { text: "I'll contact the carrier", action: () => showSuccess("Sounds good!", "The carrier can help you schedule a specific delivery time.") },
        { text: "Reship to different address", action: () => handleReship() },
        { text: "I want a refund instead", action: async () => {
          state.ladderType = 'shipping';
          state.ladderStep = 0;
          await startShippingLadder();
        }}
      ]);
    }},
    { text: "I need to update my address", action: () => handleFailedAttemptAddressChange(tracking) }
  ]);
}

// Status: Pickup - ready for customer pickup
async function handleStatusPickup(tracking) {
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);
  const pickupLocation = getPickupLocationFromTracking(tracking);

  await addBotMessage(`Your package is <strong>ready for pickup</strong> at a ${carrierInfo.name} location.<br><br>Carrier: ${carrierInfo.name}<br>Tracking: ${tracking?.trackingNumber || 'N/A'}<br><br>Packages are usually held for 5-7 days before being returned to sender.`);

  addOptions([
    { text: "I'll go pick it up", action: async () => {
      let pickupMessage = `Perfect! Here's how to find your pickup location:<br><br>`;
      pickupMessage += `1. Check your email for a notification from ${carrierInfo.name}<br>`;
      if (carrierInfo.website) {
        pickupMessage += `2. Visit <strong>${carrierInfo.website}</strong> and enter your tracking number<br>`;
      }
      if (carrierInfo.phone) {
        pickupMessage += `3. Call ${carrierInfo.phone} if you need help locating it<br>`;
      }
      pickupMessage += `<br>Your tracking number: <strong>${tracking?.trackingNumber || 'Check your email'}</strong>`;

      await addBotMessage(pickupMessage);
      await addBotMessage("Let me know if you have any trouble finding it!");
      addOptions([{ text: "Back to Home", action: showHomeMenu }]);
    }},
    { text: "It wasn't there when I tried", action: () => handlePickupNotThere(tracking) }
  ]);
}

// Get pickup location from tracking checkpoints if available
function getPickupLocationFromTracking(tracking) {
  if (!tracking?.checkpoints?.length) return null;

  // Look for pickup-related checkpoint
  const pickupCheckpoint = tracking.checkpoints.find(cp =>
    cp.message?.toLowerCase().includes('pickup') ||
    cp.message?.toLowerCase().includes('ready') ||
    cp.message?.toLowerCase().includes('available')
  );

  return pickupCheckpoint?.location || tracking.checkpoints[0]?.location || null;
}

// Handle when customer says package wasn't at pickup location
async function handlePickupNotThere(tracking) {
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);
  const pickupLocation = getPickupLocationFromTracking(tracking);

  // First, validate they went to the right place
  if (pickupLocation) {
    await addBotMessage(`Just to make sure we're on the same page, the tracking shows your package should be at:<br><br><strong>${pickupLocation}</strong><br><br>Is this where you went?`);
  } else {
    await addBotMessage(`Let me help figure this out. Can you tell me where you went to pick up the package?<br><br>You can find the pickup location by checking your email from ${carrierInfo.name} or visiting their website with your tracking number.`);
  }

  addOptions([
    { text: "Yes, that's where I went", action: () => handleConfirmedWrongLocation(tracking) },
    { text: "No, I went somewhere else", action: async () => {
      if (pickupLocation) {
        await addBotMessage(`Got it! Your package is actually at <strong>${pickupLocation}</strong>. Please try picking it up from there and let me know if you still have issues.`);
      } else {
        await addBotMessage(`No worries! Check your email from ${carrierInfo.name} for the exact pickup location, or visit their website with tracking number <strong>${tracking?.trackingNumber}</strong> to find it.`);
      }
      addOptions([
        { text: "Thanks, I'll go there", action: () => showSuccess("Good luck!", "Hope you get your package!") },
        { text: "I still need help", action: () => handleConfirmedWrongLocation(tracking) }
      ]);
    }}
  ]);
}

// Customer confirmed they went to the right place but package wasn't there
async function handleConfirmedWrongLocation(tracking) {
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);

  // Collect details about their pickup attempt
  await addBotMessage("I'm sorry to hear that. Could you share a few details about your pickup attempt? This will help us investigate.");

  const formHtml = `
    <div class="form-container" id="pickupAttemptForm">
      <div class="form-group">
        <label>When did you try to pick it up?</label>
        <input type="date" class="form-input" id="pickupDate" max="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>What location did you go to?</label>
        <input type="text" class="form-input" id="pickupLocationInput" placeholder="e.g., USPS on Main Street, UPS Store downtown">
      </div>
      <div class="form-group">
        <label>What did they tell you? (optional)</label>
        <textarea class="form-input" id="pickupNotes" rows="2" placeholder="e.g., They said they couldn't find it, no record of the package, etc."></textarea>
      </div>
      <button class="form-button" onclick="submitPickupAttempt()">Submit</button>
    </div>
  `;

  addInteractiveContent(formHtml);
}

// Submit pickup attempt details and show investigation warning
async function submitPickupAttempt() {
  const dateEl = document.getElementById('pickupDate');
  const locationEl = document.getElementById('pickupLocationInput');
  const notesEl = document.getElementById('pickupNotes');

  const pickupDate = dateEl?.value;
  const pickupLocationInput = locationEl?.value?.trim();
  const pickupNotes = notesEl?.value?.trim();

  if (!pickupDate) {
    showToast("Please enter when you tried to pick it up");
    return;
  }

  if (!pickupLocationInput) {
    showToast("Please enter which location you went to");
    return;
  }

  document.getElementById('pickupAttemptForm')?.closest('.interactive-content').remove();

  const formattedDate = new Date(pickupDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  addUserMessage(`Went to ${pickupLocationInput} on ${formattedDate}${pickupNotes ? `. ${pickupNotes}` : ''}`);

  // Store for case creation
  state.pickupAttemptDetails = {
    date: pickupDate,
    location: pickupLocationInput,
    notes: pickupNotes
  };

  // Investigation warning to deter scammers - detailed with dynamic data
  const carrierInfo = getCarrierContactInfo(state.tracking?.carrier);
  const pickupLocation = getPickupLocationFromTracking(state.tracking);
  const customerLocation = state.pickupAttemptDetails?.location || pickupLocation || 'the pickup location';

  await addBotMessage(`Thanks for those details. This is quite rare so we'll need to open a formal investigation. Just so you know, PuppyPad and ${carrierInfo.name} are two separate companies. Our responsibility is to pack your order and hand it off to them safely, which we did. But we always go above and beyond to help when things go wrong on their end.`);

  await addBotMessage(`Here's how the investigation works:<br><br>
• We'll contact ${carrierInfo.name} and <strong>${customerLocation}</strong> directly<br>
• They'll review the security camera footage from that day<br>
• They'll pull scan records to see when your package arrived and if anyone collected it<br>
• Staff logs and handover records will be checked<br>
• ${carrierInfo.name} will file a police report as part of their missing package process`);

  await addBotMessage(`Your local police may reach out to you for a statement since you're the intended recipient. This helps if they need to pull CCTV footage or follow up with ${customerLocation}. We want to make this right, so while that's happening, we can reship your order. Would you like us to proceed?`);

  addOptions([
    { text: "Yes, please investigate and reship", action: () => handleInvestigationReship() },
    { text: "Actually, let me check again first", action: async () => {
      await addBotMessage("No worries at all! Sometimes packages show up in unexpected places. Take your time to have another look and just come back if you still need help.");
      addOptions([{ text: "Back to Home", action: showHomeMenu }]);
    }}
  ]);
}

// Handle investigation + reship flow
async function handleInvestigationReship() {
  await addBotMessage("Okay, I'll get that started for you. Our team will open the investigation with the carrier and we'll reship your order in the meantime.");

  // Store that this is an investigation case
  state.pickupReason = `Package not at pickup location. Attempted pickup on ${state.pickupAttemptDetails?.date} at ${state.pickupAttemptDetails?.location}. ${state.pickupAttemptDetails?.notes || ''}`.trim();
  state.carrierIssue = 'pickup_investigation';

  await handleReship();
}

// Make functions available globally
window.submitPickupAttempt = submitPickupAttempt;

// Status: Exception/Expired/Unknown - problem with delivery
async function handleStatusException(tracking) {
  const isExpired = tracking?.status === 'expired';
  const isInternational = isInternationalCarrier(tracking);

  if (isExpired) {
    await addBotMessage(`I see that your shipment tracking has expired. This usually means the package was returned to sender or the tracking timed out.`);

    if (isInternational) {
      await addBotMessage(`Since this was shipping from our international warehouse, transit times can vary. Let me help make this right.`);
    }

    await addBotMessage(`Don't worry — I'll take care of this for you. Would you like me to reship your order or process a refund?`);
  } else {
    await addBotMessage(`There seems to be an issue with your delivery (Status: <strong>${tracking?.statusLabel || 'Exception'}</strong>). This could be due to:<br><br>• An address issue<br>• Customs hold (for international shipments)<br>• Carrier problem<br><br>I'm sorry for the trouble — let me help you resolve this.`);
  }

  addOptions([
    { text: "Reship my order (free)", action: () => handleReship() },
    { text: "I'd prefer a refund", action: async () => {
      state.ladderType = 'shipping';
      state.ladderStep = 0;
      await startShippingLadder();
    }}
  ]);
}

async function showSarahVoiceNote(tracking, isInternational = false) {
  const daysInTransit = tracking?.daysInTransit || 0;

  let introMessage = `Your package has been in transit for ${daysInTransit} days now.`;
  if (isInternational) {
    introMessage += ` Since it's shipping from our international warehouse, it can take a bit longer than usual.`;
  }
  introMessage += ` Our CX lead Sarah has a quick update for you...`;

  await addBotMessage(introMessage);

  setPersona('sarah');

  // Waveform-style audio player
  const audioHtml = `
    <div class="voice-note-card" id="audioPlayer">
      <div class="voice-note-header">
        <img src="${CONFIG.AVATARS.sarah}" alt="Sarah" class="voice-note-avatar">
        <div class="voice-note-info">
          <div class="voice-note-name">Sarah</div>
          <div class="voice-note-role">Customer Experience Lead</div>
        </div>
      </div>
      <div class="voice-note-player">
        <button class="voice-note-play-btn" onclick="playAudio()">
          <svg viewBox="0 0 24 24" fill="currentColor" class="play-icon">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg viewBox="0 0 24 24" fill="currentColor" class="pause-icon" style="display:none;">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        <div class="voice-note-waveform">
          <div class="waveform-bars">
            ${Array.from({length: 40}, () => `<div class="waveform-bar" style="height: ${20 + Math.random() * 60}%"></div>`).join('')}
          </div>
          <div class="waveform-progress" id="waveformProgress"></div>
        </div>
        <div class="voice-note-duration" id="audioDuration">0:00</div>
      </div>
    </div>
    <audio id="voiceNote" src="/audio/Sarah%20USA%20In%20Transit%20Shipping%20Update.mp3"></audio>
  `;

  addInteractiveContent(audioHtml);

  setPersona('amy');

  await delay(1000);

  let followUpMessage = "Your package is still on its way and we're keeping an eye on it.";
  if (isInternational) {
    followUpMessage += " International shipments can sometimes take 10-20 business days, but rest assured it's moving.";
  }
  followUpMessage += " Is there anything specific you'd like me to help with while you wait?";

  await addBotMessage(followUpMessage);

  addOptions([
    { text: "I'll wait a bit longer", action: () => showSuccess("Thanks for your patience!", "Your package is on its way! 📦") },
    { text: "I'd like to explore my options", action: () => handleExtendedTransit(tracking, isInternational) }
  ]);
}

function playAudio() {
  const audio = document.getElementById('voiceNote');
  const waveformProgress = document.getElementById('waveformProgress');
  const durationEl = document.getElementById('audioDuration');
  const playIcon = document.querySelector('.play-icon');
  const pauseIcon = document.querySelector('.pause-icon');

  // Format time as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audio.paused) {
    audio.play();
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';

    audio.ontimeupdate = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      if (waveformProgress) waveformProgress.style.width = percent + '%';
      if (durationEl) durationEl.textContent = formatTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    };

    audio.onended = () => {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
      if (waveformProgress) waveformProgress.style.width = '0%';
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    };
  } else {
    audio.pause();
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }
}

async function handleExtendedTransit(tracking, isInternational = false) {
  const daysInTransit = tracking?.daysInTransit || 0;

  let message = "I understand this has taken longer than expected";
  if (daysInTransit >= CONFIG.IN_TRANSIT_ESCALATE_DAYS) {
    message = `I see your package has been in transit for ${daysInTransit} days — that's definitely too long`;
  }
  if (isInternational) {
    message += ", and I know waiting for international shipments can be frustrating";
  }
  message += ". Let me offer you some options to make this right:";

  await addBotMessage(message);

  addOptions([
    { text: "Reship my order (free)", action: () => handleReship() },
    { text: "I'd prefer a refund", action: async () => {
      state.ladderType = 'shipping';
      state.ladderStep = 0;
      await startShippingLadder();
    }}
  ]);
}

async function handleReship() {
  const address = state.selectedOrder?.shippingAddress;

  if (!address || !address.address1) {
    await addBotMessage("I'll create a free reship for you! Please provide your shipping address:");
    showAddressForm(null);
    return;
  }

  // Format the current address for display
  const formattedAddress = formatAddressForDisplay(address);

  await addBotMessage(`I'll create a free reship for you! First, let me confirm your shipping address:<br><br><div class="address-display">${formattedAddress}</div>`);

  await addBotMessage("Is this address correct, or would you like to update it?");

  addOptions([
    { text: "This address is correct", action: () => confirmReshipWithAddress(address) },
    { text: "I need to update it", action: () => showAddressForm(address) }
  ]);
}

// Format address for display
function formatAddressForDisplay(address) {
  const lines = [];
  if (address.address1) lines.push(`<strong>${address.address1}</strong>`);
  if (address.address2) lines.push(address.address2);

  const cityLine = [];
  if (address.city) cityLine.push(address.city);
  if (address.province || address.provinceCode) cityLine.push(address.province || address.provinceCode);
  if (address.zip) cityLine.push(address.zip);
  if (cityLine.length > 0) lines.push(cityLine.join(', '));

  if (address.country) lines.push(address.country);

  return lines.join('<br>');
}

// Show address form with country-specific fields (Shopify format)
function showAddressForm(currentAddress) {
  const address = currentAddress || {};
  const country = address.country || 'United States';

  // Country-specific field configurations (Shopify format)
  const countryConfigs = {
    'United States': {
      provinceLabel: 'State',
      provinces: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'],
      zipLabel: 'ZIP Code',
      zipPlaceholder: '12345'
    },
    'Canada': {
      provinceLabel: 'Province',
      provinces: ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'],
      zipLabel: 'Postal Code',
      zipPlaceholder: 'A1A 1A1'
    },
    'United Kingdom': {
      provinceLabel: 'County',
      provinces: null, // Text input
      zipLabel: 'Postcode',
      zipPlaceholder: 'SW1A 1AA'
    },
    'Australia': {
      provinceLabel: 'State',
      provinces: ['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'],
      zipLabel: 'Postcode',
      zipPlaceholder: '2000'
    }
  };

  const config = countryConfigs[country] || countryConfigs['United States'];

  // Build province field (dropdown or text input)
  let provinceField;
  if (config.provinces) {
    const provinceOptions = config.provinces.map(p =>
      `<option value="${p}" ${(address.province === p || address.provinceCode === p) ? 'selected' : ''}>${p}</option>`
    ).join('');
    provinceField = `<select class="form-input" id="province">${provinceOptions}</select>`;
  } else {
    provinceField = `<input type="text" class="form-input" id="province" value="${address.province || ''}" placeholder="${config.provinceLabel}">`;
  }

  // Build country dropdown
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia'];
  const countryOptions = countries.map(c =>
    `<option value="${c}" ${country === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  const addressHtml = `
    <div class="form-container" id="addressForm">
      <div class="form-group">
        <label>Country *</label>
        <select class="form-input" id="country" onchange="updateAddressFieldsForCountry()">
          ${countryOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Street Address *</label>
        <input type="text" class="form-input" id="address1" value="${address.address1 || ''}" placeholder="123 Main St">
      </div>
      <div class="form-group">
        <label>Apt/Suite/Unit</label>
        <input type="text" class="form-input" id="address2" value="${address.address2 || ''}" placeholder="Apt 4B">
      </div>
      <div class="form-group">
        <label>City *</label>
        <input type="text" class="form-input" id="city" value="${address.city || ''}" placeholder="City">
      </div>
      <div class="form-group" id="provinceGroup">
        <label>${config.provinceLabel} *</label>
        ${provinceField}
      </div>
      <div class="form-group">
        <label>${config.zipLabel} *</label>
        <input type="text" class="form-input" id="zip" value="${address.zip || ''}" placeholder="${config.zipPlaceholder}">
      </div>
      <button class="option-btn primary" onclick="submitAddressForm()" style="width: 100%;">
        Confirm & Reship
      </button>
    </div>
  `;

  addInteractiveContent(addressHtml);
}

// Update address fields when country changes
function updateAddressFieldsForCountry() {
  const country = document.getElementById('country')?.value || 'United States';

  const configs = {
    'United States': { label: 'State', provinces: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'], zipLabel: 'ZIP Code', zipPlaceholder: '12345' },
    'Canada': { label: 'Province', provinces: ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'], zipLabel: 'Postal Code', zipPlaceholder: 'A1A 1A1' },
    'United Kingdom': { label: 'County', provinces: null, zipLabel: 'Postcode', zipPlaceholder: 'SW1A 1AA' },
    'Australia': { label: 'State', provinces: ['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'], zipLabel: 'Postcode', zipPlaceholder: '2000' }
  };

  const config = configs[country] || configs['United States'];
  const provinceGroup = document.getElementById('provinceGroup');
  const zipInput = document.getElementById('zip');

  if (provinceGroup) {
    let provinceField;
    if (config.provinces) {
      const options = config.provinces.map(p => `<option value="${p}">${p}</option>`).join('');
      provinceField = `<select class="form-input" id="province">${options}</select>`;
    } else {
      provinceField = `<input type="text" class="form-input" id="province" placeholder="${config.label}">`;
    }
    provinceGroup.innerHTML = `<label>${config.label} *</label>${provinceField}`;
  }

  if (zipInput) {
    zipInput.placeholder = config.zipPlaceholder;
    const zipLabel = zipInput.parentElement?.querySelector('label');
    if (zipLabel) zipLabel.textContent = config.zipLabel + ' *';
  }
}

// Make function globally available
window.updateAddressFieldsForCountry = updateAddressFieldsForCountry;

// Submit address form and create reship
async function submitAddressForm() {
  const address1 = document.getElementById('address1')?.value.trim();
  const address2 = document.getElementById('address2')?.value.trim();
  const city = document.getElementById('city')?.value.trim();
  const province = document.getElementById('province')?.value.trim();
  const zip = document.getElementById('zip')?.value.trim();
  const country = document.getElementById('country')?.value;

  if (!address1 || !city || !zip) {
    showToast("Please fill in all required address fields");
    return;
  }

  const newAddress = { address1, address2, city, province, zip, country };
  state.addressChanged = true;
  state.newAddress = newAddress;

  document.getElementById('addressForm')?.closest('.interactive-content').remove();
  addUserMessage(`Updated address: ${address1}, ${city}, ${province} ${zip}`);

  // Check if we're processing a shipping offer or regular reship
  if (state.afterAddressAction === 'shipping_offer') {
    await processShippingOfferWithAddress(newAddress);
  } else {
    await confirmReshipWithAddress(newAddress);
  }
}

window.submitAddressForm = submitAddressForm;

// Confirm reship with address (new or existing)
async function confirmReshipWithAddress(address) {
  showProgress("Creating your free reship order...", "This will ship within 1-3 business days");

  const tracking = state.tracking || {};
  const addressChanged = state.addressChanged || false;

  // Determine carrier issue based on tracking status
  let carrierIssue = 'extendedTransit';
  if (tracking.status === 'exception') carrierIssue = 'exception';
  else if (tracking.status === 'expired') carrierIssue = 'expiredTracking';
  else if (tracking.status === 'failed_attempt') carrierIssue = 'failedDelivery';
  else if (tracking.status === 'delivered') carrierIssue = 'deliveredNotReceived';

  const result = await submitCase('shipping', 'reship', {
    issueType: 'reship_request',
    carrierIssue: carrierIssue,
    carrierName: tracking.carrier || 'Unknown',
    trackingNumber: tracking.trackingNumber || '',
    daysInTransit: tracking.daysInTransit || 0,
    trackingStatus: tracking.status || '',
    pickupReason: state.pickupReason || '',
    addressChanged: addressChanged,
    shippingAddress: address,
    notes: addressChanged
      ? `Free reship requested with NEW address: ${address.address1}, ${address.city}, ${address.province} ${address.zip}, ${address.country}`
      : `Free reship requested to SAME address: ${address.address1}, ${address.city}, ${address.province} ${address.zip}, ${address.country}`,
  });

  hideProgress();

  // Clear state
  state.addressChanged = false;
  state.newAddress = null;

  if (result.success) {
    state.caseId = result.caseId;
    await showSuccess(
      "Reship Request Received!",
      `<strong>What happens next:</strong><br><br>
      Our team has received your reship request and will process it within <strong>1-3 business days</strong>.<br><br>
      Once your order ships, we'll send you a confirmation email with tracking information.<br><br>
      ${getCaseIdHtml(result.caseId)}`
    );
  } else {
    state.caseId = generateCaseId('shipping');
    await showSuccess(
      "Reship Request Received!",
      `<strong>What happens next:</strong><br><br>
      Our team has received your reship request and will process it within <strong>1-3 business days</strong>.<br><br>
      Once your order ships, we'll send you a confirmation email with tracking information.<br><br>
      ${getCaseIdHtml(state.caseId)}`
    );
  }
}

async function confirmReship() {
  // Legacy function - redirect to new flow
  await submitAddressForm();
}

async function startShippingLadder() {
  const steps = [
    { percent: 20, message: "I'd love to make this right for you. How about a <strong>20% refund PLUS we'll reship your order</strong> free of charge? That way you get your money back AND your products!" },
    { percent: 50, message: "I really want to help you out here. Let me offer you a <strong>50% refund AND a free reship</strong>. You'll get half your money back plus we'll send out a new shipment right away." }
  ];

  if (state.ladderStep >= steps.length) {
    await addBotMessage("I completely understand. Let me process a full refund for you right away.");
    await createRefundCase('full', true);
    return;
  }

  const step = steps[state.ladderStep];
  const totalPrice = parseFloat(state.selectedOrder?.totalPrice || 0);
  const refundAmount = (totalPrice * step.percent / 100).toFixed(2);

  await addBotMessage(step.message);

  const html = `
    <div class="offer-card">
      <div class="offer-icon">🎁</div>
      <div class="offer-amount">${step.percent}% + Free Reship</div>
      <div class="offer-value">${formatCurrency(refundAmount)} back + new shipment</div>
      <div class="offer-label">Get your money back AND your products</div>
      <div class="offer-buttons">
        <button class="offer-btn accept" onclick="acceptShippingOffer(${step.percent}, ${refundAmount})">Accept This Offer</button>
        <button class="offer-btn decline" onclick="declineShippingOffer()">I just want a refund</button>
      </div>
    </div>
  `;

  addInteractiveContent(html);
}

async function acceptShippingOffer(percent, amount) {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage(`I'll take the ${percent}% refund + reship`);

  // Store the offer details for after address validation
  state.pendingOffer = { percent, amount: parseFloat(amount) };

  // Now validate the address before processing
  const address = state.selectedOrder?.shippingAddress;

  if (!address || !address.address1) {
    await addBotMessage("Great choice! Before we process this, please provide your shipping address:");
    showAddressForm(null);
    state.afterAddressAction = 'shipping_offer';
    return;
  }

  // Show address and ask for confirmation
  const formattedAddress = formatAddressForDisplay(address);
  await addBotMessage(`Great choice! Before we process your ${percent}% refund and reship, let me confirm your shipping address:<br><br><div class="address-display">${formattedAddress}</div>`);

  addOptions([
    { text: "This address is correct", action: () => processShippingOfferWithAddress(address) },
    { text: "I need to update it", action: () => {
      state.afterAddressAction = 'shipping_offer';
      showAddressForm(address);
    }}
  ]);
}

// Process shipping offer after address is confirmed
async function processShippingOfferWithAddress(address) {
  const { percent, amount } = state.pendingOffer || { percent: 0, amount: 0 };

  showProgress("Processing your refund and creating reship...");

  const tracking = state.tracking || {};
  const addressChanged = state.addressChanged || false;

  // Determine carrier issue based on tracking status
  let carrierIssue = 'extendedTransit';
  if (tracking.status === 'exception') carrierIssue = 'exception';
  else if (tracking.status === 'expired') carrierIssue = 'expiredTracking';
  else if (tracking.status === 'failed_attempt') carrierIssue = 'failedDelivery';
  else if (tracking.status === 'delivered') carrierIssue = 'deliveredNotReceived';

  const result = await submitCase('shipping', `partial_${percent}_reship`, {
    issueType: 'shipping_partial_refund_reship',
    carrierIssue: carrierIssue,
    refundPercent: percent,
    refundAmount: amount,
    carrierName: tracking.carrier || 'Unknown',
    trackingNumber: tracking.trackingNumber || '',
    daysInTransit: tracking.daysInTransit || 0,
    addressChanged: addressChanged,
    shippingAddress: address,
    notes: `Process ${percent}% partial refund ($${amount.toFixed(2)}) and create free reship. ${addressChanged ? 'NEW ADDRESS' : 'Same address'}: ${address.address1}, ${address.city}, ${address.province} ${address.zip}`,
  });

  hideProgress();

  // Clear state
  state.pendingOffer = null;
  state.addressChanged = false;
  state.afterAddressAction = null;

  const refundAmountFormatted = formatCurrency(amount);

  if (result.success) {
    state.caseId = result.caseId;
    await showSuccess(
      "Request Received!",
      `<strong>What happens next:</strong><br><br>
      <strong>Refund:</strong> ${percent}% (${refundAmountFormatted}) will be processed within <strong>1-2 business days</strong>. Once processed, it takes 3-5 business days to appear in your account depending on your bank.<br><br>
      <strong>Reship:</strong> Your new order will ship within <strong>1-3 business days</strong>. We'll email you tracking information once it's on its way.<br><br>
      ${getCaseIdHtml(result.caseId)}`
    );
  } else {
    state.caseId = generateCaseId('shipping');
    await showSuccess(
      "Request Received!",
      `<strong>What happens next:</strong><br><br>
      <strong>Refund:</strong> ${percent}% (${refundAmountFormatted}) will be processed within <strong>1-2 business days</strong>. Once processed, it takes 3-5 business days to appear in your account depending on your bank.<br><br>
      <strong>Reship:</strong> Your new order will ship within <strong>1-3 business days</strong>. We'll email you tracking information once it's on its way.<br><br>
      ${getCaseIdHtml(state.caseId)}`
    );
  }
}

async function declineShippingOffer() {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage("I just want a full refund");
  
  state.ladderStep++;
  
  if (state.ladderStep >= 2) {
    await addBotMessage("I completely understand. Let me process a full refund for you.");
    await createRefundCase('full', true);
  } else {
    await startShippingLadder();
  }
}

async function handleDeliveredNotReceived() {
  const tracking = state.tracking || state.trackingInfo || {};
  const carrierInfo = getCarrierContactInfo(tracking?.carrier);
  const shippingAddress = state.selectedOrder?.shippingAddress;
  const deliveryLocation = shippingAddress
    ? `${shippingAddress.city || ''}${shippingAddress.province ? ', ' + shippingAddress.province : ''}`.trim() || 'your address'
    : 'your address';

  await addBotMessage(`I'm really sorry to hear that. This is frustrating and I want to help you. Just so you know, PuppyPad and ${carrierInfo.name} are two separate companies. Our job is to pack your order and hand it to them safely, which we did. But we always go above and beyond to help when things go wrong on their end.`);

  await addBotMessage(`Here's how our investigation works:<br><br>
• We'll contact ${carrierInfo.name} directly to verify the delivery<br>
• They'll pull the GPS coordinates from where the driver scanned your package<br>
• Any delivery photos taken will be reviewed<br>
• Driver logs and route data from that day will be checked<br>
• We'll contact the local ${carrierInfo.name} facility near ${deliveryLocation}`);

  await addBotMessage(`${carrierInfo.name} will file a police report as part of their missing package process. Your local police may reach out to you for a statement since you're the intended recipient. This helps if they need to pull CCTV footage from cameras near your address. Would you like us to proceed?`);

  addOptions([
    { text: "Yes, please investigate", action: async () => {
      await handleDeliveredInvestigation(tracking);
    }},
    { text: "Actually, let me check again first", action: async () => {
      await addBotMessage("No worries! Sometimes packages turn up in unexpected spots. Take your time and come back if you still can't find it.");
      Analytics.logEvent('delivered_check_again');
      addOptions([{ text: "Back to Home", action: showHomeMenu }]);
    }}
  ]);
}

// Proceed with delivered not received investigation
async function handleDeliveredInvestigation(tracking) {
  showProgress("Creating investigation case...");

  const result = await submitCase('shipping', 'investigation_delivered_not_received', {
    issueType: 'delivered_not_received',
    carrierName: tracking.carrier || 'Unknown',
    trackingNumber: tracking.trackingNumber || '',
    deliveryDate: tracking.deliveryDate || '',
    notes: 'Customer confirmed they checked all locations and package is not found.',
  });

  hideProgress();

  if (result.success) {
    await showSuccess(
      "Investigation Started",
      `We've opened a case and will investigate with ${tracking.carrier?.toUpperCase() || 'the carrier'}. We'll get back to you within 48 hours.<br><br>
If we can't locate your package, we'll either reship or refund your order — whichever you prefer.<br><br>
<strong>Optional:</strong> If you'd like to file a police report, your local department can request CCTV footage from nearby cameras.<br><br>${getCaseIdHtml(result.caseId)}`
    );
  } else {
    await showSuccess(
      "Investigation Started",
      `Our team will investigate and contact the carrier. We'll reach out within 48 hours. If we can't locate it, we'll reship or refund your order.`
    );
  }
}

async function createShippingCase(type, options = {}) {
  showProgress("Creating case...");

  const tracking = state.tracking || {};

  const result = await submitCase('shipping', type, {
    issueType: type,
    carrierName: tracking.carrier || options.carrier || 'Unknown',
    trackingNumber: tracking.trackingNumber || options.trackingNumber || '',
    deliveryDate: tracking.deliveryDate || '',
    daysInTransit: tracking.daysInTransit || 0,
    trackingStatus: tracking.status || '',
    customerReason: options.customerReason || '',
    notes: options.notes || `Shipping issue: ${type}`,
    ...options,
  });

  hideProgress();

  if (result.success) {
    state.caseId = result.caseId;
    await showSuccess(
      "Case Created!",
      `Our team will investigate and get back to you within 24-48 hours.<br><br>${getCaseIdHtml(result.caseId)}`
    );
  } else {
    state.caseId = generateCaseId('shipping');
    await showSuccess(
      "Case Created!",
      `Our team will investigate and get back to you within 24-48 hours.<br><br>${getCaseIdHtml(state.caseId)}`
    );
  }
}

// ============================================
// TRACK ORDER FLOW
// ============================================
async function startTrackOrder() {
  state.flowType = 'track';
  // Log session and flow start
  Analytics.logSession({ flowType: 'track' });
  Analytics.logEvent('flow_start', 'track_order');
  await showWelcomeMessage('track');
  await showIdentifyForm('track');
}

async function handleTrackFlow() {
  if (state.orders.length === 1) {
    state.selectedOrder = state.orders[0];
    await getTrackingInfo();
  } else {
    await showOrderSelection('track');
  }
}

async function getTrackingInfo() {
  showProgress("Looking up tracking...", "Checking ParcelPanel for your package status");

  try {
    const orderNumber = state.selectedOrder?.orderNumber || state.customerData?.orderNumber;

    if (!orderNumber) {
      hideProgress();
      state.tracking = null;
      await addBotMessage("I couldn't find tracking information for your order. Would you like to contact support?");
      addOptions([
        { text: "Contact Support", action: () => startHelpFlow() },
        { text: "Back to Home", action: showHomeMenu }
      ]);
      return;
    }

    const response = await fetch(`${CONFIG.API_URL}/api/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: orderNumber.replace('#', '') })
    });

    hideProgress();

    if (!response.ok) {
      state.tracking = null;
      await addBotMessage("I couldn't retrieve tracking information right now. Would you like to contact support?");
      addOptions([
        { text: "Contact Support", action: () => startHelpFlow() },
        { text: "Back to Home", action: showHomeMenu }
      ]);
      return;
    }

    const data = await response.json();
    state.tracking = data.tracking;
    state.allTracking = data.allTracking;

    if (!state.tracking) {
      await addBotMessage("Tracking information isn't available yet. Your order may still be processing. Would you like to check back later or contact support?");
      addOptions([
        { text: "Contact Support", action: () => startHelpFlow() },
        { text: "Back to Home", action: showHomeMenu }
      ]);
      return;
    }

    await showTrackingCard();
  } catch (error) {
    console.error('Tracking lookup error:', error);
    hideProgress();
    state.tracking = null;
    await addBotMessage("Something went wrong while looking up your tracking. Would you like to try again or contact support?");
    addOptions([
      { text: "Try Again", action: () => getTrackingInfo() },
      { text: "Contact Support", action: () => startHelpFlow() }
    ]);
  }
}

async function showTrackingCard() {
  const tracking = state.tracking;
  const statusClass = tracking.status === 'delivered' ? 'delivered' : 
                     tracking.status === 'in_transit' ? 'in-transit' : 'exception';
  
  const checkpointsHtml = tracking.checkpoints.slice(0, 5).map(cp => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">${formatDate(cp.checkpoint_time)}</div>
      <div class="timeline-text">${cp.message}</div>
      ${cp.location ? `<div class="timeline-location">📍 ${cp.location}</div>` : ''}
    </div>
  `).join('');
  
  const trackingHtml = `
    <div class="tracking-card">
      <div class="tracking-header">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">${state.selectedOrder?.orderNumber}</div>
          <div class="tracking-number">${tracking.carrier} • ${tracking.trackingNumber}</div>
        </div>
        <span class="tracking-status order-status ${statusClass}">${tracking.statusLabel}</span>
      </div>
      ${tracking.estimatedDelivery && tracking.status !== 'delivered' ? `
        <div class="tracking-eta">
          <strong>📅 Estimated Delivery</strong>
          ${formatDate(tracking.estimatedDelivery)}
        </div>
      ` : ''}
      <div class="tracking-timeline">
        ${checkpointsHtml}
      </div>
    </div>
  `;
  
  addInteractiveContent(trackingHtml);
  
  await addBotMessage(tracking.status === 'delivered' 
    ? "Your order has been delivered! 🎉" 
    : "Your package is on its way! Is there anything else you need help with?");
  
  addOptions([
    { text: "I need help with this order", action: async () => {
      state.flowType = 'help';
      await showItemSelection();
    }},
    { text: "All good, thanks!", action: () => showSuccess("You're welcome!", "Have a great day! 🐕") }
  ]);
}

// ============================================
// MANAGE SUBSCRIPTION FLOW
// ============================================
async function startManageSubscription() {
  state.flowType = 'subscription';
  // Log session and flow start
  Analytics.logSession({ flowType: 'subscription' });
  Analytics.logEvent('flow_start', 'manage_subscription');
  await showWelcomeMessage('subscription');
  await showIdentifyForm('subscription');
}

async function handleSubscriptionFlow() {
  await addBotMessage("Let me check for any active subscriptions on your account...");
  
  // Mock subscription for demo
  state.subscriptions = [
    {
      purchaseId: 'PUR123456',
      productName: 'PuppyPad Reusable Pee Pad - Large',
      status: 'active',
      lastBillingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: 30,
      price: '39.99'
    }
  ];
  
  if (state.subscriptions.length === 0) {
    await addBotMessage("I couldn't find any active subscriptions on your account. Would you like help with something else?");
    addOptions([
      { text: "Help with an order", action: startHelpWithOrder },
      { text: "Back to home", action: showHomeMenu }
    ]);
    return;
  }
  
  await showSubscriptionCards();
}

async function showSubscriptionCards() {
  await addBotMessage(`I found ${state.subscriptions.length} subscription(s). Which one would you like to manage?`);
  
  const subsHtml = state.subscriptions.map((sub, index) => {
    const statusClass = sub.status === 'active' ? 'active' : 
                       sub.status === 'paused' ? 'paused' : 'cancelled';
    
    return `
      <div class="subscription-card" onclick="selectSubscription(${index})">
        <div class="subscription-header">
          <div>
            <div class="subscription-name">${sub.productName}</div>
          </div>
          <span class="subscription-status ${statusClass}">${sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}</span>
        </div>
        <div class="subscription-details">
          <div class="subscription-detail">
            <div class="subscription-detail-label">Last Billing</div>
            <div class="subscription-detail-value">${formatDate(sub.lastBillingDate)}</div>
          </div>
          <div class="subscription-detail">
            <div class="subscription-detail-label">Next Billing</div>
            <div class="subscription-detail-value">${formatDate(sub.nextBillingDate)}</div>
          </div>
          <div class="subscription-detail">
            <div class="subscription-detail-label">Delivery Schedule</div>
            <div class="subscription-detail-value">Every ${sub.frequency} days</div>
          </div>
          <div class="subscription-detail">
            <div class="subscription-detail-label">Price</div>
            <div class="subscription-detail-value">${formatCurrency(sub.price)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  addInteractiveContent(`<div class="subscriptions-list">${subsHtml}</div>`);
}

async function selectSubscription(index) {
  state.selectedSubscription = state.subscriptions[index];
  
  document.querySelector('.subscriptions-list')?.closest('.interactive-content').remove();
  
  const summaryHtml = `
    <div class="editable-summary">
      <div class="summary-row"><span class="summary-label">Product:</span> ${state.selectedSubscription.productName}</div>
      <div class="summary-row"><span class="summary-label">Status:</span> ${state.selectedSubscription.status}</div>
    </div>
  `;
  
  addEditableUserMessage(summaryHtml, () => {
    state.selectedSubscription = null;
    showSubscriptionCards();
  }, 'Change');
  
  await showSubscriptionActions();
}

async function showSubscriptionActions() {
  await addBotMessage("What would you like to do with this subscription?");
  
  addOptions([
    { icon: '⏸️', text: 'Pause Subscription', action: handlePauseSubscription },
    { icon: '❌', text: 'Cancel Subscription', action: handleCancelSubscription },
    { icon: '📅', text: 'Change Delivery Schedule', action: handleChangeSchedule },
    { icon: '📍', text: 'Change Shipping Address', action: handleChangeAddress }
  ]);
}

async function handlePauseSubscription() {
  await addBotMessage("How long would you like to pause your subscription?");
  
  addOptions([
    { text: '30 days', action: () => confirmPause(30) },
    { text: '60 days', action: () => confirmPause(60) },
    { text: '90 days', action: () => confirmPause(90) },
    { text: 'Custom date', action: showCustomPauseDate }
  ]);
}

async function confirmPause(days) {
  const resumeDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  showProgress("Pausing your subscription...", "Creating case...");

  // Submit case to ClickUp/Richpanel with subscription fields
  const result = await submitCase('subscription', 'subscription_paused', {
    actionType: 'pause',
    notes: `Pause for ${days} days. Resume on ${formatDate(resumeDate.toISOString())}`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Subscription Paused!",
    `Your subscription will automatically resume on <strong>${formatDate(resumeDate.toISOString())}</strong>.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

function showCustomPauseDate() {
  const html = `
    <div class="form-container">
      <div class="form-group">
        <label>Resume subscription on:</label>
        <input type="date" class="form-input" id="customPauseDate" min="${new Date().toISOString().split('T')[0]}">
      </div>
      <button class="option-btn primary" onclick="submitCustomPause()" style="width: 100%;">
        Confirm Pause
      </button>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function submitCustomPause() {
  const dateInput = document.getElementById('customPauseDate')?.value;

  if (!dateInput) {
    await addBotMessage("Please select a date.");
    return;
  }

  document.querySelector('.form-container')?.closest('.interactive-content').remove();

  showProgress("Pausing your subscription...", "Creating case...");

  // Submit case to ClickUp/Richpanel with subscription fields
  const result = await submitCase('subscription', 'subscription_paused', {
    actionType: 'pause',
    notes: `Custom pause. Resume on ${formatDate(dateInput)}`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Subscription Paused!",
    `Your subscription will resume on <strong>${formatDate(dateInput)}</strong>.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function handleCancelSubscription() {
  await addBotMessage("I'm sorry to see you go 😔 Can you tell me why you'd like to cancel?");
  
  addOptions([
    { text: "It's too expensive", action: () => handleCancelReason('expensive') },
    { text: "I have too many", action: () => handleCancelReason('too_many') },
    { text: "They don't work as described", action: () => handleCancelReason('not_working') },
    { text: "I'm moving", action: () => handleCancelReason('moving') },
    { text: "Other reason", action: () => handleCancelReason('other') }
  ]);
}

async function handleCancelReason(reason) {
  state.cancelReason = reason;
  
  if (reason === 'expensive') {
    await addBotMessage("I completely understand — budgets matter! Before you go, let me see if I can help make this more affordable...");
    state.ladderType = 'subscription';
    state.ladderStep = 0;
    await startSubscriptionLadder();
  } else if (reason === 'too_many') {
    await addBotMessage("Got it! Instead of cancelling, would you like to pause your subscription and have it resume later? That way you're locked in at the same price — prices may increase in the future!");
    
    addOptions([
      { text: "Yes, pause instead", action: handlePauseSubscription },
      { text: "No, I want to cancel", action: async () => {
        state.ladderType = 'subscription';
        state.ladderStep = 0;
        await startSubscriptionLadder();
      }}
    ]);
  } else if (reason === 'not_working') {
    await addBotMessage("I'm sorry to hear that! Could you tell me more about what's not working? I'd love to try to help.");
    
    showTextInput("What's not working?", async (text) => {
      hideTextInput();
      state.intentDetails = text;
      
      await addBotMessage("Thank you for sharing that. Let me see what I can offer to make this right...");
      state.ladderType = 'subscription';
      state.ladderStep = 0;
      await startSubscriptionLadder();
    });
  } else if (reason === 'moving') {
    await addBotMessage("No problem! Would you like to update your shipping address instead of cancelling? We can ship to your new location!");
    
    addOptions([
      { text: "Yes, update my address", action: handleChangeAddress },
      { text: "No, I still want to cancel", action: async () => {
        state.ladderType = 'subscription';
        state.ladderStep = 0;
        await startSubscriptionLadder();
      }}
    ]);
  } else {
    await addBotMessage("Thank you for letting me know. Before you go, let me see if there's anything I can offer...");
    state.ladderType = 'subscription';
    state.ladderStep = 0;
    await startSubscriptionLadder();
  }
}

async function startSubscriptionLadder() {
  const steps = [
    { percent: 10, message: "How about <strong>10% off all future shipments</strong>? That's ongoing savings on every delivery!" },
    { percent: 15, message: "Let me do better — <strong>15% off all future shipments</strong>. That really adds up over time!" },
    { percent: 20, message: "My best offer: <strong>20% off all future shipments</strong>. That's significant savings!" }
  ];
  
  if (state.ladderStep >= steps.length) {
    await handleFullSubscriptionCancel();
    return;
  }
  
  const step = steps[state.ladderStep];
  const price = parseFloat(state.selectedSubscription?.price || 0);
  const discount = (price * step.percent / 100).toFixed(2);
  const newPrice = (price - discount).toFixed(2);
  
  await addBotMessage(step.message);
  
  const html = `
    <div class="offer-card">
      <div class="offer-icon">🎁</div>
      <div class="offer-amount">${step.percent}% OFF</div>
      <div class="offer-value">New price: ${formatCurrency(newPrice)}/shipment</div>
      <div class="offer-label">Applied to all future deliveries</div>
      <div class="offer-buttons">
        <button class="offer-btn accept" onclick="acceptSubscriptionOffer(${step.percent})">Keep Subscription</button>
        <button class="offer-btn decline" onclick="declineSubscriptionOffer()">Still cancel</button>
      </div>
      <div class="offer-note">You save ${formatCurrency(discount)} every shipment!</div>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function acceptSubscriptionOffer(percent) {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage(`I'll keep my subscription with ${percent}% off`);

  showProgress("Applying your discount...", "Creating case...");

  // Submit case to ClickUp/Richpanel with discount info
  const result = await submitCase('subscription', 'discount_applied', {
    actionType: 'cancel', // Intent was to cancel, but saved with discount
    discountPercent: percent,
    notes: `Customer retained with ${percent}% discount on future shipments.`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Discount Applied!",
    `Great choice! Your ${percent}% discount will apply to all future shipments automatically.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function declineSubscriptionOffer() {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage("I still want to cancel");
  
  state.ladderStep++;
  await startSubscriptionLadder();
}

async function handleFullSubscriptionCancel() {
  await addBotMessage("I understand. Before I process the cancellation, has the product been used?");
  
  addOptionsRow([
    { text: "Yes, used", action: () => processSubscriptionCancel(true) },
    { text: "No, unused", action: () => processSubscriptionCancel(false) }
  ]);
}

async function processSubscriptionCancel(isUsed) {
  const address = state.selectedOrder?.shippingAddress;
  const country = address?.country || 'United States';
  const isUSorCanada = country.toLowerCase().includes('united states') || country.toLowerCase().includes('canada');
  const keepProduct = isUsed || !isUSorCanada;

  if (keepProduct) {
    await addBotMessage("Because we value you as a customer, we'll process a <strong>full refund</strong> and cancel your subscription. You can keep the product! ❤️");
  } else {
    await addBotMessage("We'll process a <strong>full refund</strong> once we receive the product back. Here are the return details:");
    showReturnInstructions();
    return;
  }

  showProgress("Cancelling subscription and processing refund...", "Creating case...");

  // Submit case to ClickUp/Richpanel with cancel details
  const result = await submitCase('subscription', 'subscription_cancelled', {
    actionType: 'cancel',
    keepProduct: keepProduct,
    notes: `Full cancellation. Reason: ${state.cancelReason || 'Not specified'}. Keep product: ${keepProduct ? 'Yes' : 'No (return required)'}`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Subscription Cancelled",
    `Your subscription has been cancelled and a full refund will be processed within 3-5 business days.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function handleChangeSchedule() {
  await addBotMessage("How often would you like to receive your deliveries?");
  
  addOptions([
    { text: 'Every 30 days', action: () => confirmScheduleChange(30) },
    { text: 'Every 45 days', action: () => confirmScheduleChange(45) },
    { text: 'Every 60 days', action: () => confirmScheduleChange(60) },
    { text: 'Every 90 days', action: () => confirmScheduleChange(90) }
  ]);
}

async function confirmScheduleChange(days) {
  const previousFrequency = state.selectedSubscription?.frequency || 'Unknown';

  showProgress("Updating your delivery schedule...", "Creating case...");

  // Submit case to ClickUp/Richpanel with schedule change
  const result = await submitCase('subscription', 'schedule_changed', {
    actionType: 'changeSchedule',
    notes: `Schedule changed from every ${previousFrequency} days to every ${days} days.`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Schedule Updated!",
    `Your deliveries will now arrive every <strong>${days} days</strong>.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function handleChangeAddress() {
  await addBotMessage("Please enter your new shipping address:");
  
  const html = `
    <div class="form-container" id="newAddressForm">
      <div class="form-group">
        <label>Street Address *</label>
        <input type="text" class="form-input" id="newAddress1" placeholder="123 Main St">
      </div>
      <div class="form-group">
        <label>Apt/Suite</label>
        <input type="text" class="form-input" id="newAddress2" placeholder="Apt 4B">
      </div>
      <div class="form-group">
        <label>City *</label>
        <input type="text" class="form-input" id="newCity" placeholder="City">
      </div>
      <div class="form-group">
        <label>State/Province *</label>
        <input type="text" class="form-input" id="newProvince" placeholder="State">
      </div>
      <div class="form-group">
        <label>ZIP/Postal Code *</label>
        <input type="text" class="form-input" id="newZip" placeholder="12345">
      </div>
      <div class="form-group">
        <label>Country *</label>
        <select class="form-input" id="newCountry" onchange="updateAddressFields('new')">
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Australia">Australia</option>
        </select>
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" class="form-input" id="newPhone" placeholder="+1 (555) 000-0000" oninput="formatPhoneInput(this)">
      </div>
      <button class="option-btn primary" onclick="submitNewAddress()" style="width: 100%;">
        Update Address
      </button>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function submitNewAddress() {
  const address1 = document.getElementById('newAddress1')?.value.trim();
  const address2 = document.getElementById('newAddress2')?.value.trim();
  const city = document.getElementById('newCity')?.value.trim();
  const province = document.getElementById('newProvince')?.value.trim();
  const zip = document.getElementById('newZip')?.value.trim();
  const country = document.getElementById('newCountry')?.value;

  if (!address1 || !city || !zip) {
    await addBotMessage("Please fill in all required fields.");
    return;
  }

  document.getElementById('newAddressForm')?.closest('.interactive-content').remove();
  addUserMessage("New address submitted");

  const newAddressFormatted = [address1, address2, `${city}, ${province} ${zip}`, country].filter(Boolean).join(', ');

  showProgress("Updating your shipping address...", "Creating case...");

  // Submit case to ClickUp/Richpanel with address change
  const result = await submitCase('subscription', 'address_changed', {
    actionType: 'changeAddress',
    notes: `New address: ${newAddressFormatted}`,
  });

  hideProgress();

  state.caseId = result.caseId;

  await showSuccess(
    "Address Updated!",
    `Your new shipping address has been saved and will be used for all future deliveries.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

// ============================================
// HELP WITH ORDER FLOW
// ============================================
async function startHelpWithOrder() {
  state.flowType = 'help';
  // Log session and flow start
  Analytics.logSession({ flowType: 'help' });
  Analytics.logEvent('flow_start', 'help_with_order');
  await showWelcomeMessage('help');
  await showIdentifyForm('help');
}

async function startHelpWithOrderDirect() {
  state.flowType = 'help';
  Analytics.logEvent('flow_start', 'help_direct');
  await showItemSelection();
}

async function handleHelpFlow() {
  if (state.orders.length === 1) {
    state.selectedOrder = state.orders[0];
  } else {
    await showOrderSelection('help');
    return;
  }

  // Check for existing open case (dedupe)
  const existingCase = await checkExistingCase();
  if (existingCase.existingCase) {
    await showExistingCaseMessage(existingCase);
    return;
  }

  // Check if within fulfillment window (backend-enforced via canModify flag)
  // The backend computes this based on created_at + fulfillment_status
  if (state.selectedOrder.canModify) {
    await handleUnfulfilledOrder();
  } else {
    await showItemSelection();
  }
}

async function handleUnfulfilledOrder() {
  await addBotMessage(`Great news! Your order hasn't shipped yet, so I can still make changes. Would you like to change or cancel your order?`);
  
  addOptions([
    { text: "Change my order", action: handleChangeOrder },
    { text: "Cancel my order", action: async () => {
      await addBotMessage("I'll help you cancel. Can you tell me why you'd like to cancel?");
      await showIntentOptions();
    }},
    { text: "Actually, keep it as is", action: () => showSuccess("Perfect!", "Your order will ship soon. 📦") }
  ]);
}

// ============================================
// ADDITIONAL CSS FOR EDITABLE MESSAGES
// ============================================
const additionalStyles = `
  .editable-bubble {
    position: relative;
  }
  
  .editable-content {
    margin-bottom: 8px;
  }
  
  .editable-summary {
    font-size: 14px;
  }
  
  .summary-row {
    margin-bottom: 4px;
  }
  
  .summary-label {
    opacity: 0.8;
    font-size: 12px;
  }
  
  .summary-items {
    font-size: 13px;
    opacity: 0.9;
  }
  
  .edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    color: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .edit-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .edit-btn svg {
    opacity: 0.8;
  }
  
  .option-btn.secondary {
    background: transparent;
    border: 1px solid var(--navy);
    color: var(--navy);
  }
  
  .option-btn.secondary:hover {
    background: var(--navy-soft);
  }
  
  .product-disabled-note {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
    font-style: italic;
  }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.toggleIdentifyMethod = toggleIdentifyMethod;
window.submitIdentifyForm = submitIdentifyForm;
window.submitDeepSearch = submitDeepSearch;
window.submitManualHelp = submitManualHelp;
window.selectOrder = selectOrder;
window.toggleItemSelection = toggleItemSelection;
window.selectAllItems = selectAllItems;
window.confirmItemSelection = confirmItemSelection;
window.submitDogInfo = submitDogInfo;
window.handleSatisfied = handleSatisfied;
window.acceptOffer = acceptOffer;
window.declineOffer = declineOffer;
window.confirmReturn = confirmReturn;
window.handleFileUpload = handleFileUpload;
window.removeUpload = removeUpload;
window.submitEvidence = submitEvidence;
window.selectSubscription = selectSubscription;
window.confirmPause = confirmPause;
window.submitCustomPause = submitCustomPause;
window.acceptSubscriptionOffer = acceptSubscriptionOffer;
window.declineSubscriptionOffer = declineSubscriptionOffer;
window.confirmScheduleChange = confirmScheduleChange;
window.submitNewAddress = submitNewAddress;
window.confirmReship = confirmReship;
window.acceptShippingOffer = acceptShippingOffer;
window.declineShippingOffer = declineShippingOffer;
window.playAudio = playAudio;
window.restartChat = restartChat;
window.formatPhoneInput = formatPhoneInput;
window.updateAddressFields = updateAddressFields;
window.selectContactMethod = selectContactMethod;
