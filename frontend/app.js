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
  customerData: {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    orderNumber: '',
    address1: ''
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
  caseId: null,
  flowType: null,
  // Store references for edit functionality
  editHistory: []
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

function scrollToBottom() {
  if (!elements.chatArea) return;
  elements.chatArea.scrollTop = elements.chatArea.scrollHeight;
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
async function typeText(element, text, speed = 40, isBot = true) {
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
        scrollToBottom();
        // Add slight variation to typing speed for realism
        const variance = Math.random() * 15 - 7;
        await delay(Math.max(speed + variance, 10));
      }
    }
  }

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
// OPTIONS & BUTTONS
// ============================================
function addOptions(options) {
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'options-container';
  
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.className = `option-btn ${option.primary ? 'primary' : ''} ${option.secondary ? 'secondary' : ''}`;
    btn.innerHTML = option.icon ? `<span class="icon">${option.icon}</span>${option.text}` : option.text;
    btn.onclick = () => {
      optionsDiv.remove();
      if (option.showAsMessage !== false) {
        addUserMessage(option.text);
      }
      option.action();
    };
    optionsDiv.appendChild(btn);
  });
  
  elements.chatArea.appendChild(optionsDiv);
  scrollToBottom();
}

function addOptionsRow(options) {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'options-container';
  
  const innerRow = document.createElement('div');
  innerRow.className = 'options-row';
  
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.className = `option-btn ${option.primary ? 'primary' : ''} ${option.class || ''}`;
    btn.textContent = option.text;
    btn.onclick = () => {
      rowDiv.remove();
      if (option.showAsMessage !== false) {
        addUserMessage(option.text);
      }
      option.action();
    };
    innerRow.appendChild(btn);
  });
  
  rowDiv.appendChild(innerRow);
  elements.chatArea.appendChild(rowDiv);
  scrollToBottom();
}

async function addInteractiveContent(html, delayMs = 600) {
  // Give customer time to read Amy's message before showing interactive content
  await delay(delayMs);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'interactive-content';
  contentDiv.innerHTML = html;
  elements.chatArea.appendChild(contentDiv);
  scrollToBottom();
  // Scroll again after animation completes to ensure visibility
  setTimeout(scrollToBottom, 450);
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
    editHistory: []
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
        <input type="tel" class="form-input" id="inputPhone" placeholder="+1 (555) 000-0000" value="${state.customerData.phone || ''}">
        <div class="error-text">Please enter the phone number used at checkout.</div>
      </div>
      
      <div class="form-group">
        <label>First Name *</label>
        <input type="text" class="form-input" id="inputFirstName" placeholder="Your first name" value="${state.customerData.firstName || ''}">
        <div class="error-text">Please enter the first name used at checkout.</div>
      </div>
      
      <div class="form-group">
        <label>Order Number (optional)</label>
        <input type="text" class="form-input" id="inputOrderNumber" placeholder="#12345P" value="${state.customerData.orderNumber || ''}">
        <div class="error-text">Order number must look like #12345P.</div>
      </div>
      
      <button class="option-btn primary" onclick="submitIdentifyForm('${flowType}')" style="margin-top: 8px; width: 100%;">
        Find My Order
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
  const firstName = document.getElementById('inputFirstName')?.value.trim();
  const orderNumber = document.getElementById('inputOrderNumber')?.value.trim();
  
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
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      phoneInput.classList.add('error');
      hasError = true;
    } else {
      phoneInput.classList.remove('error');
      state.customerData.phone = phone;
    }
  }
  
  const firstNameInput = document.getElementById('inputFirstName');
  if (!firstName) {
    firstNameInput.classList.add('error');
    hasError = true;
  } else {
    firstNameInput.classList.remove('error');
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
  
  // Create editable summary
  const summaryHtml = `
    <div class="editable-summary">
      <div class="summary-row"><span class="summary-label">${state.identifyMethod === 'email' ? 'Email' : 'Phone'}:</span> ${state.identifyMethod === 'email' ? email : phone}</div>
      <div class="summary-row"><span class="summary-label">Name:</span> ${firstName}</div>
      ${orderNumber ? `<div class="summary-row"><span class="summary-label">Order:</span> ${orderNumber}</div>` : ''}
    </div>
  `;
  
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
  await addBotMessage("Looking up your order... 🔍");
  
  try {
    // Try API call
    if (CONFIG.API_URL) {
      const response = await fetch(`${CONFIG.API_URL}/api/lookup-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.customerData)
      });
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        state.orders = data.orders;
        await handleOrdersFound(flowType);
        return;
      }
    }
    
    // Fallback to mock data for testing
    await loadMockOrders(flowType);
    
  } catch (error) {
    console.error('Lookup error:', error);
    await loadMockOrders(flowType);
  }
}

async function loadMockOrders(flowType) {
  // Mock data for testing
  state.orders = [
    {
      id: '123456789',
      orderNumber: '#78901P',
      email: state.customerData.email || 'customer@example.com',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      totalPrice: '89.99',
      currency: 'USD',
      customerName: state.customerData.firstName || 'Customer',
      shippingAddress: {
        address1: '123 Main St',
        city: 'Austin',
        province: 'TX',
        zip: '78701',
        country: 'United States'
      },
      lineItems: [
        {
          id: '1',
          title: 'PuppyPad Reusable Pee Pad',
          variantTitle: 'Large / Green',
          sku: 'PP-LG-GRN',
          quantity: 2,
          price: '39.99',
          image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
          fulfillmentStatus: 'fulfilled',
          productType: 'OFFER',
          isFree: false,
          isDigital: false,
          isPuppyPad: true
        },
        {
          id: '2',
          title: 'Stain & Odor Eliminator Spray',
          variantTitle: '16oz',
          sku: 'SOE-16',
          quantity: 1,
          price: '14.99',
          image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=100&h=100&fit=crop',
          fulfillmentStatus: 'fulfilled',
          productType: 'UPSALE',
          isFree: false,
          isDigital: false,
          isPuppyPad: false
        },
        {
          id: '3',
          title: 'Dog Training eBook',
          variantTitle: 'Digital Download',
          sku: 'EBOOK-001',
          quantity: 1,
          price: '0.00',
          image: null,
          fulfillmentStatus: 'fulfilled',
          productType: null,
          isFree: true,
          isDigital: true,
          isPuppyPad: false
        }
      ],
      clientOrderId: '99887766'
    }
  ];
  
  await handleOrdersFound(flowType);
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
  await addBotMessage("I couldn't find an order with those details. Let's try a deeper search with more information.");
  await renderDeepSearchForm(flowType);
}

async function renderDeepSearchForm(flowType) {
  const formHtml = `
    <div class="form-container" id="deepSearchForm">
      <div class="form-group">
        <label>Last Name *</label>
        <input type="text" class="form-input" id="inputLastName" placeholder="Your last name" value="${state.customerData.lastName || ''}">
      </div>

      <div class="form-group">
        <label>Shipping Address (first line) *</label>
        <input type="text" class="form-input" id="inputAddress1" placeholder="123 Main Street" value="${state.customerData.address1 || ''}">
      </div>

      <button class="option-btn primary" onclick="submitDeepSearch('${flowType}')" style="margin-top: 8px; width: 100%;">
        Search Again
      </button>
    </div>
  `;

  await addInteractiveContent(formHtml);
}

async function submitDeepSearch(flowType) {
  const lastName = document.getElementById('inputLastName')?.value.trim();
  const address1 = document.getElementById('inputAddress1')?.value.trim();
  
  if (!lastName || !address1) {
    await addBotMessage("Please fill in both fields to continue.");
    return;
  }
  
  state.customerData.lastName = lastName;
  state.customerData.address1 = address1;
  
  document.getElementById('deepSearchForm')?.closest('.interactive-content').remove();
  
  addUserMessage(`Searching with ${lastName}, ${address1}...`);
  
  // For demo, show manual help form
  await showManualHelpForm();
}

async function showManualHelpForm() {
  await addBotMessage("I still couldn't find your order, but don't worry — I'll make sure our team helps you personally. Please fill in these details:");
  
  const formHtml = `
    <div class="form-container" id="manualHelpForm">
      <div class="form-group">
        <label>Your Email Address *</label>
        <input type="email" class="form-input" id="manualEmail" placeholder="you@example.com" value="${state.customerData.email || ''}">
      </div>
      
      <div class="form-group">
        <label>First Name *</label>
        <input type="text" class="form-input" id="manualFirstName" placeholder="Your first name" value="${state.customerData.firstName || ''}">
      </div>
      
      <div class="form-group">
        <label>What's the issue?</label>
        <textarea class="form-input" id="manualIssue" rows="3" placeholder="Describe your issue..."></textarea>
      </div>
      
      <div class="form-group">
        <label>What resolution would you like?</label>
        <textarea class="form-input" id="manualResolution" rows="2" placeholder="How can we help?"></textarea>
      </div>
      
      <button class="option-btn primary" onclick="submitManualHelp()" style="margin-top: 8px; width: 100%;">
        Submit Request
      </button>
    </div>
  `;
  
  addInteractiveContent(formHtml);
}

async function submitManualHelp() {
  const email = document.getElementById('manualEmail')?.value.trim();
  const firstName = document.getElementById('manualFirstName')?.value.trim();
  const issue = document.getElementById('manualIssue')?.value.trim();
  const resolution = document.getElementById('manualResolution')?.value.trim();
  
  if (!email || !firstName) {
    await addBotMessage("Please enter your email and first name so we can help you.");
    return;
  }
  
  document.getElementById('manualHelpForm')?.closest('.interactive-content').remove();
  addUserMessage(`Email: ${email}, Issue: ${issue || 'Not specified'}`);
  
  showProgress("Creating your support case...", "Our team will be notified");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('manual');
  
  await showSuccess(
    "Request Submitted!",
    `Our team will reach out to you at ${email} within 24 hours.<br><br>${getCaseIdHtml(state.caseId)}`
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
  await addBotMessage(
    `I see we already have an open case for this order! 📋<br><br>` +
    `Your case ID is <strong>${caseInfo.caseId || 'N/A'}</strong> and it's currently being worked on.<br><br>` +
    `Our team is on it and will reach out to you soon. Would you like to do something else?`
  );

  // Log policy block to analytics
  Analytics.logPolicyBlock('existing_case', { existingCaseId: caseInfo.caseId });
  Analytics.logEvent('policy_block', 'existing_case_found', {
    existingCaseId: caseInfo.caseId,
    orderNumber: state.selectedOrder?.orderNumber
  });

  addOptions([
    { text: "I have a different issue", action: showItemSelection },
    { text: "Back to Home", primary: true, action: () => restartChat() }
  ]);
}

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
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('refund');
  
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
      
      <div style="background: var(--navy-soft); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
        <strong>Ship to:</strong><br>
        PuppyPad Returns<br>
        123 Warehouse Drive<br>
        Wisconsin, WI 53001<br>
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
        <strong>⚠️ Important:</strong> Please reply to your confirmation email with the tracking number once you've shipped the return.
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

async function createRefundCase(type, keepProduct) {
  showProgress("Creating your case...", "Notifying our team");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId(keepProduct ? 'refund' : 'return');
  
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
    await addBotMessage("Great! We'll send you a return label and ship out your new order once we receive the return. Free of charge!");
  }
  
  showProgress("Creating your order change request...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('shipping');
  
  await showSuccess(
    "Order Change Requested!",
    `We'll process your change to: <strong>${state.intentDetails}</strong><br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function handleMissingItem() {
  await addBotMessage("Oh no! I'm really sorry something was missing 😔 To help investigate, could you please upload a photo of what you received (including any packaging)?");
  
  showUploadArea();
}

function showUploadArea() {
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
  
  await addBotMessage("Thank you for the photos. I've noted this issue and we'll investigate with our fulfillment center.<br><br>We'll send out any missing items free of charge once confirmed. Should I proceed with creating this case?");
  
  addOptionsRow([
    { text: "Yes, create case", primary: true, action: async () => {
      showProgress("Creating case and uploading evidence...");
      await delay(2000);
      hideProgress();
      
      state.caseId = generateCaseId('shipping');
      
      await showSuccess(
        "Investigation Started!",
        `We'll look into this and ship any missing items free of charge. You'll hear from us within 24-48 hours.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "Cancel", action: showHomeMenu }
  ]);
}

async function handleDamaged() {
  await addBotMessage("I'm so sorry your order arrived damaged 😔 To help process this quickly, please upload photos of the damage:");
  showUploadArea();
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
  // Simulate tracking lookup
  state.tracking = {
    status: 'in_transit',
    statusLabel: 'In Transit',
    daysInTransit: 8,
    trackingNumber: 'TRK123456789',
    checkpoints: [
      { checkpoint_time: new Date().toISOString(), message: 'In transit', location: 'Chicago, IL' }
    ]
  };
  
  await handleTrackingResult();
}

async function handleTrackingResult() {
  const tracking = state.tracking;
  
  if (!tracking) {
    await addBotMessage("I couldn't find tracking info for this order. Let me create a case for our team to investigate.");
    await createShippingCase('no_tracking');
    return;
  }
  
  if (tracking.status === 'delivered') {
    await addBotMessage(`According to tracking, your order was delivered. Have you checked with neighbors or looked in safe spots around your home?`);
    
    addOptions([
      { text: "Yes, I've checked everywhere", action: () => handleDeliveredNotReceived() },
      { text: "Let me check again", action: () => {
        addBotMessage("Take your time! Feel free to come back if you still can't find it. 🙂");
        addOptions([{ text: "Back to Home", action: showHomeMenu }]);
      }},
      { text: "I think I found it!", action: () => showSuccess("Great!", "Glad you found it! 🎉") }
    ]);
  } else if (tracking.status === 'in_transit') {
    if (tracking.daysInTransit >= CONFIG.IN_TRANSIT_ESCALATE_DAYS) {
      await handleExtendedTransit();
    } else if (tracking.daysInTransit >= CONFIG.IN_TRANSIT_VOICE_DAYS) {
      await showSarahVoiceNote();
    } else {
      await addBotMessage(`Your order is currently in transit and has been shipping for ${tracking.daysInTransit} days. Delivery typically takes 5-10 business days.<br><br>It's still within the normal delivery window — I'd recommend checking back in a few days.`);
      
      addOptions([
        { text: "Okay, I'll wait", action: () => showSuccess("Thanks!", "Your package is on its way! 📦") },
        { text: "I need it urgently", action: () => handleExtendedTransit() }
      ]);
    }
  } else {
    // Exception, failed, expired
    await addBotMessage(`There seems to be an issue with your delivery (Status: ${tracking.statusLabel}). This could be due to an address issue or carrier problem.<br><br>Let me help you resolve this.`);
    
    addOptions([
      { text: "Reship my order", action: () => handleReship() },
      { text: "I want a refund instead", action: async () => {
        state.ladderType = 'shipping';
        state.ladderStep = 0;
        await startShippingLadder();
      }}
    ]);
  }
}

async function showSarahVoiceNote() {
  await addBotMessage("Your package has been in transit for a few days now. Our CX lead Sarah has a quick update for you...");
  
  setPersona('sarah');
  
  const audioHtml = `
    <div class="audio-player" id="audioPlayer">
      <img src="${CONFIG.AVATARS.sarah}" alt="Sarah" class="audio-avatar">
      <div class="audio-info">
        <div class="audio-name">Sarah</div>
        <div class="audio-role">Customer Experience Lead</div>
      </div>
      <div class="audio-controls">
        <button class="play-btn" onclick="playAudio()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div class="audio-progress">
          <div class="audio-progress-bar" id="audioProgress"></div>
        </div>
      </div>
    </div>
    <audio id="voiceNote" src="/audio/Sarah%20USA%20In%20Transit%20Shipping%20Update.mp3"></audio>
  `;
  
  addInteractiveContent(audioHtml);
  
  setPersona('amy');
  
  await delay(1000);
  
  await addBotMessage("Your package is still on its way. Is there anything specific you'd like me to help with while you wait?");
  
  addOptions([
    { text: "I'll wait a bit longer", action: () => showSuccess("Thanks for your patience!", "Your package is on its way! 📦") },
    { text: "I need to escalate this", action: () => handleExtendedTransit() }
  ]);
}

function playAudio() {
  const audio = document.getElementById('voiceNote');
  const progress = document.getElementById('audioProgress');
  const playBtn = document.querySelector('.play-btn');
  
  if (audio.paused) {
    audio.play();
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    
    audio.ontimeupdate = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      progress.style.width = percent + '%';
    };
    
    audio.onended = () => {
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      progress.style.width = '0%';
    };
  } else {
    audio.pause();
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }
}

async function handleExtendedTransit() {
  await addBotMessage("I understand this has taken too long. Let me offer you some options to make this right:");
  
  addOptions([
    { icon: '📦', text: "Reship my order (free)", action: () => handleReship() },
    { icon: '💰', text: "I'd prefer a refund", action: async () => {
      state.ladderType = 'shipping';
      state.ladderStep = 0;
      await startShippingLadder();
    }}
  ]);
}

async function handleReship() {
  const address = state.selectedOrder?.shippingAddress;
  
  await addBotMessage("I'll create a free reship for you! First, let me confirm your shipping address:");
  
  const addressHtml = `
    <div class="form-container" id="addressForm">
      <div class="form-group">
        <label>Street Address *</label>
        <input type="text" class="form-input" id="address1" value="${address?.address1 || ''}" placeholder="123 Main St">
      </div>
      <div class="form-group">
        <label>Apt/Suite/Unit</label>
        <input type="text" class="form-input" id="address2" value="${address?.address2 || ''}" placeholder="Apt 4B">
      </div>
      <div class="form-group">
        <label>City *</label>
        <input type="text" class="form-input" id="city" value="${address?.city || ''}" placeholder="City">
      </div>
      <div class="form-group">
        <label>State/Province *</label>
        <input type="text" class="form-input" id="province" value="${address?.province || ''}" placeholder="State">
      </div>
      <div class="form-group">
        <label>ZIP/Postal Code *</label>
        <input type="text" class="form-input" id="zip" value="${address?.zip || ''}" placeholder="12345">
      </div>
      <div class="form-group">
        <label>Country *</label>
        <select class="form-input" id="country">
          <option value="United States" ${address?.country?.includes('United States') ? 'selected' : ''}>United States</option>
          <option value="Canada" ${address?.country?.includes('Canada') ? 'selected' : ''}>Canada</option>
          <option value="United Kingdom" ${address?.country?.includes('United Kingdom') ? 'selected' : ''}>United Kingdom</option>
          <option value="Australia" ${address?.country?.includes('Australia') ? 'selected' : ''}>Australia</option>
        </select>
      </div>
      <button class="option-btn primary" onclick="confirmReship()" style="width: 100%;">
        Confirm & Reship
      </button>
    </div>
  `;
  
  addInteractiveContent(addressHtml);
}

async function confirmReship() {
  const address1 = document.getElementById('address1')?.value.trim();
  const city = document.getElementById('city')?.value.trim();
  const zip = document.getElementById('zip')?.value.trim();
  
  if (!address1 || !city || !zip) {
    await addBotMessage("Please fill in all required address fields.");
    return;
  }
  
  document.getElementById('addressForm')?.closest('.interactive-content').remove();
  addUserMessage("Address confirmed");
  
  showProgress("Creating your free reship order...", "This will ship within 1-2 business days");
  await delay(2000);
  hideProgress();
  
  state.caseId = generateCaseId('shipping');
  
  await showSuccess(
    "Reship Created!",
    `Your order will be reshipped free of charge within 1-2 business days. We'll email you the tracking info.<br><br>${getCaseIdHtml(state.caseId)}`
  );
}

async function startShippingLadder() {
  const steps = [
    { percent: 10, message: "How about I give you a <strong>10% refund PLUS reship your order</strong> free of charge? Best of both worlds!" },
    { percent: 20, message: "Let me sweeten the deal — <strong>20% refund AND a free reship</strong>. You'll get your money back and your products!" }
  ];
  
  if (state.ladderStep >= steps.length) {
    await addBotMessage("I understand. Let me process a full cancellation and refund for you.");
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
      <div class="offer-amount">${step.percent}% + Reship</div>
      <div class="offer-value">${formatCurrency(refundAmount)} refund + free reship</div>
      <div class="offer-label">Get your money back AND your products</div>
      <div class="offer-buttons">
        <button class="offer-btn accept" onclick="acceptShippingOffer(${step.percent}, ${refundAmount})">Accept</button>
        <button class="offer-btn decline" onclick="declineShippingOffer()">Full refund instead</button>
      </div>
    </div>
  `;
  
  addInteractiveContent(html);
}

async function acceptShippingOffer(percent, amount) {
  document.querySelector('.offer-card')?.closest('.interactive-content').remove();
  addUserMessage(`I'll take the ${percent}% refund + reship`);
  
  showProgress("Processing refund and creating reship...");
  await delay(2000);
  hideProgress();
  
  state.caseId = generateCaseId('shipping');
  
  await showSuccess(
    "All Set!",
    `Your ${percent}% refund (${formatCurrency(amount)}) will process in 3-5 days, and your reship will go out within 1-2 business days.<br><br>${getCaseIdHtml(state.caseId)}`
  );
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
  await addBotMessage("I'm sorry to hear that 😔 When packages show as delivered but aren't received, it usually means there was an issue with the carrier.<br><br>Here's what we'll do: I'll open an investigation with our fulfillment team and the carrier. This may involve reviewing delivery photos and contacting your local postal service.<br><br>Would you like me to proceed?");
  
  addOptions([
    { text: "Yes, please investigate", action: async () => {
      showProgress("Creating investigation case...");
      await delay(1500);
      hideProgress();
      
      state.caseId = generateCaseId('shipping');
      
      await showSuccess(
        "Investigation Started",
        `We'll investigate with the carrier and get back to you within 48 hours. If we can't locate it, we'll reship or refund.<br><br>${getCaseIdHtml(state.caseId)}`
      );
    }},
    { text: "Just reship it", action: () => handleReship() },
    { text: "Just refund me", action: async () => {
      await createRefundCase('full', true);
    }}
  ]);
}

async function createShippingCase(type) {
  showProgress("Creating case...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('shipping');
  
  await showSuccess(
    "Case Created!",
    `Our team will investigate and get back to you within 24-48 hours.<br><br>${getCaseIdHtml(state.caseId)}`
  );
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
  await addBotMessage("Checking your tracking info... 📦");
  
  // Mock tracking for demo
  state.tracking = {
    status: 'in_transit',
    statusLabel: 'In Transit',
    trackingNumber: 'USPS9400111899223456789012',
    carrier: 'USPS',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysInTransit: 4,
    checkpoints: [
      { checkpoint_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), message: 'Out for delivery', location: 'Austin, TX' },
      { checkpoint_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), message: 'Arrived at local facility', location: 'Austin, TX' },
      { checkpoint_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), message: 'In transit', location: 'Dallas, TX' },
      { checkpoint_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), message: 'Shipped', location: 'Los Angeles, CA' }
    ]
  };
  
  await showTrackingCard();
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
  
  showProgress("Pausing your subscription...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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
  
  showProgress("Pausing your subscription...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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
  
  showProgress("Applying your discount...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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
  
  if (isUsed || !isUSorCanada) {
    await addBotMessage("Because we value you as a customer, we'll process a <strong>full refund</strong> and cancel your subscription. You can keep the product! ❤️");
  } else {
    await addBotMessage("We'll process a <strong>full refund</strong> once we receive the product back. Here are the return details:");
    showReturnInstructions();
    return;
  }
  
  showProgress("Cancelling subscription and processing refund...");
  await delay(2000);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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
  showProgress("Updating your delivery schedule...");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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
        <select class="form-input" id="newCountry">
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Australia">Australia</option>
        </select>
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" class="form-input" id="newPhone" placeholder="+1 (555) 000-0000">
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
  const city = document.getElementById('newCity')?.value.trim();
  const zip = document.getElementById('newZip')?.value.trim();
  
  if (!address1 || !city || !zip) {
    await addBotMessage("Please fill in all required fields.");
    return;
  }
  
  document.getElementById('newAddressForm')?.closest('.interactive-content').remove();
  addUserMessage("New address submitted");
  
  showProgress("Updating your shipping address...", "This will apply to all future shipments");
  await delay(1500);
  hideProgress();
  
  state.caseId = generateCaseId('subscription');
  
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

  // Check if within fulfillment window (can still modify/cancel)
  const orderDate = new Date(state.selectedOrder.createdAt);
  const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceOrder < CONFIG.FULFILLMENT_CUTOFF_HOURS && state.selectedOrder.fulfillmentStatus !== 'fulfilled') {
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
