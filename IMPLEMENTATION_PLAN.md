# PuppyPad Resolution App V2 - Implementation Plan

## Executive Summary

After analyzing the current codebase against the detailed specification, this document outlines what's already implemented and what remains to be built. The app has a solid foundation with ~60% of core functionality complete, but several critical features are missing.

**NEW PRIORITY:** Complete UI overhaul to create a premium, modern, and delightful user experience before implementing backend features.

---

## Current Implementation Status

### Frontend (frontend/app.js, index.html, styles.css) ✅ Mostly Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Chat UI with header (avatar, name, status) | ✅ Complete | Amy, Sarah, Claudia personas work |
| Typing indicator (3 dots) | ✅ Complete | Shows before messages |
| Message bubbles (bot/user) | ✅ Complete | Different colors per persona |
| Start Again button | ✅ Complete | Resets entire chat |
| Welcome screen & home menu | ✅ Complete | 3 main options show |
| Customer identification form | ✅ Complete | Email/phone toggle, first name, optional order # |
| Edit functionality on inputs | ✅ Complete | Can go back and change answers |
| Order cards display | ✅ Complete | Shows order info with status |
| Product/item selection | ✅ Complete | Checkboxes, select all, badges |
| Initial Order / Upsell badges | ✅ Complete | Uses productType from Shopify |
| Free / Digital item badges | ✅ Complete | Grays out digital items |
| Intent options menu | ✅ Complete | Dynamic based on products |
| Dog not using (Claudia flow) | ✅ Complete | Dog info form → AI tips |
| Satisfaction buttons | ✅ Complete | Yes/No with emojis |
| Refund ladder (order) | ✅ Complete | 20% → 30% → 40% → 50% |
| Shipping ladder | ✅ Complete | 10%+reship → 20%+reship |
| Subscription ladder | ✅ Complete | 10% → 15% → 20% off future |
| Offer cards UI | ✅ Complete | Beautiful gradient cards |
| Return instructions | ✅ Complete | Basic version |
| File upload for evidence | ✅ Complete | Drag/drop, preview, remove |
| Address forms | ✅ Complete | Basic fields |
| Tracking card | ✅ Complete | Timeline, status badges |
| Progress spinners | ✅ Complete | Loading states |
| Success/Error cards | ✅ Complete | With icons |
| Audio player (Sarah) | ✅ Complete | Play/pause, progress bar |
| Subscription management | ✅ Complete | Pause, cancel, change schedule, address |

### Backend (src/index.js, wrangler.json) ✅ Foundation Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Worker structure & routing | ✅ Complete | Clean router setup |
| CORS handling | ✅ Complete | Works for frontend |
| Shopify order lookup | ✅ Complete | Query builder works |
| Line item processing | ✅ Complete | productType, images, flags |
| ClientOrderId extraction | ✅ Complete | From note_attributes |
| ParcelPanel tracking | ✅ Complete | Correct v3 API |
| CheckoutChamp subscription | ✅ Complete | Order + purchase lookup |
| ClickUp task creation | ✅ Complete | With custom fields |
| ClickUp comment adding | ✅ Complete | For action steps |
| OpenAI response generation | ✅ Complete | Amy & Claudia prompts |
| R2 product doc lookup | ✅ Complete | Product name matching |
| Message chunking | ✅ Complete | Splits long messages |
| Evidence upload | ✅ Complete | To R2 bucket |
| Audio file serving | ✅ Complete | Sarah voice note |
| Case ID generation | ✅ Complete | Prefix + timestamp |
| Basic analytics logging | ✅ Complete | To D1 (needs schema) |
| ClickUp config | ✅ Complete | Lists & field UUIDs |

---

## PHASE 0: UI/UX OVERHAUL (PRIORITY)

### 0.1 Design System & Color Palette

**Current Issues:**
- Colors are pleasant but not premium
- Buttons lack visual hierarchy
- Limited animation/interaction feedback
- No brand identity integration

**New Design System:**

```css
/* Premium Color Palette */
:root {
  /* Primary Brand Colors */
  --brand-navy: #0A1628;           /* Deep navy - headers, primary buttons */
  --brand-navy-light: #1E3A5F;     /* Lighter navy - hover states */
  --brand-navy-soft: #E8EEF4;      /* Soft navy tint - backgrounds */

  /* Accent Colors */
  --accent-coral: #FF6B6B;         /* Warm coral - CTAs, highlights */
  --accent-coral-light: #FF8E8E;   /* Lighter coral - hover */
  --accent-teal: #4ECDC4;          /* Fresh teal - success, positive */
  --accent-amber: #FFE66D;         /* Warm amber - warnings, attention */
  --accent-purple: #A78BFA;        /* Soft purple - Claudia persona */

  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Persona Colors */
  --amy-gradient: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  --amy-bg: #FFF5F5;
  --sarah-gradient: linear-gradient(135deg, #FFE66D 0%, #F7B733 100%);
  --sarah-bg: #FFFDF5;
  --claudia-gradient: linear-gradient(135deg, #A78BFA 0%, #818CF8 100%);
  --claudia-bg: #F5F3FF;
  --customer-gradient: linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%);

  /* Effects */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-glow: 0 0 20px rgba(78, 205, 196, 0.3);

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
  --transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 0.1.5 Home Screen / Welcome Screen ⭐ NEW

**Purpose:** Create a polished, inviting entry point that sets the tone for the entire experience.

**Home Screen Structure:**
```html
<div class="home-screen" id="homeScreen">
  <!-- Hero Section -->
  <div class="home-hero">
    <div class="hero-background">
      <div class="hero-gradient"></div>
      <div class="hero-pattern"></div>
    </div>

    <div class="hero-content">
      <!-- Brand Logo -->
      <div class="brand-container">
        <img
          src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041"
          alt="PuppyPad"
          class="home-logo"
        >
      </div>

      <!-- Welcome Message -->
      <div class="welcome-text">
        <h1 class="welcome-title">Welcome to Resolution Center</h1>
        <p class="welcome-subtitle">
          Get instant help with your order, subscription, or tracking.
          Our team is here to make things right.
        </p>
      </div>

      <!-- Support Team Preview -->
      <div class="team-preview">
        <div class="team-avatars">
          <img src="amy-avatar.jpg" alt="Amy" class="team-avatar" title="Amy - Customer Support">
          <img src="claudia-avatar.jpg" alt="Claudia" class="team-avatar" title="Claudia - Veterinarian">
          <img src="sarah-avatar.jpg" alt="Sarah" class="team-avatar" title="Sarah - CX Lead">
        </div>
        <span class="team-text">Our support team is ready to help</span>
      </div>
    </div>
  </div>

  <!-- Main Action Cards -->
  <div class="home-actions">
    <h2 class="actions-title">How can we help you today?</h2>

    <div class="action-cards">
      <!-- Track Order -->
      <button class="action-card" data-action="track">
        <div class="action-icon-wrapper">
          <div class="action-icon">📦</div>
          <div class="action-icon-bg"></div>
        </div>
        <div class="action-content">
          <h3 class="action-title">Track My Order</h3>
          <p class="action-description">See where your package is and estimated delivery</p>
        </div>
        <div class="action-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </button>

      <!-- Manage Subscription -->
      <button class="action-card" data-action="subscription">
        <div class="action-icon-wrapper">
          <div class="action-icon">🔄</div>
          <div class="action-icon-bg"></div>
        </div>
        <div class="action-content">
          <h3 class="action-title">Manage Subscription</h3>
          <p class="action-description">Pause, cancel, or update your subscription</p>
        </div>
        <div class="action-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </button>

      <!-- Help With Order -->
      <button class="action-card" data-action="help">
        <div class="action-icon-wrapper">
          <div class="action-icon">💬</div>
          <div class="action-icon-bg"></div>
        </div>
        <div class="action-content">
          <h3 class="action-title">Help With An Order</h3>
          <p class="action-description">Refunds, returns, missing items, or other issues</p>
        </div>
        <div class="action-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </button>
    </div>
  </div>

  <!-- Trust Indicators -->
  <div class="trust-section">
    <div class="trust-item">
      <span class="trust-icon">⚡</span>
      <span class="trust-text">Instant Resolution</span>
    </div>
    <div class="trust-divider"></div>
    <div class="trust-item">
      <span class="trust-icon">🛡️</span>
      <span class="trust-text">90-Day Guarantee</span>
    </div>
    <div class="trust-divider"></div>
    <div class="trust-item">
      <span class="trust-icon">💚</span>
      <span class="trust-text">24/7 Support</span>
    </div>
  </div>

  <!-- Footer -->
  <footer class="home-footer">
    <p class="footer-text">Powered by</p>
    <img
      src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041"
      alt="PuppyPad"
      class="footer-logo"
    >
  </footer>
</div>
```

**Home Screen Styles:**
```css
/* Home Screen Container */
.home-screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%);
  overflow-y: auto;
}

/* Hero Section */
.home-hero {
  position: relative;
  padding: 48px 24px 40px;
  text-align: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0A1628 0%, #1E3A5F 60%, #2D4A6F 100%);
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,107,107,0.15) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(78,205,196,0.15) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

/* Brand Logo */
.brand-container {
  margin-bottom: 32px;
  animation: fade-in-down 0.6s ease-out;
}

.home-logo {
  height: 48px;
  width: auto;
  filter: brightness(0) invert(1);
}

/* Welcome Text */
.welcome-text {
  margin-bottom: 32px;
  animation: fade-in-up 0.6s ease-out 0.2s backwards;
}

.welcome-title {
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
}

/* Team Preview */
.team-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: fade-in-up 0.6s ease-out 0.4s backwards;
}

.team-avatars {
  display: flex;
  align-items: center;
}

.team-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid white;
  object-fit: cover;
  margin-left: -12px;
  transition: transform 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.team-avatar:first-child {
  margin-left: 0;
}

.team-avatar:hover {
  transform: scale(1.1) translateY(-4px);
  z-index: 10;
}

.team-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

/* Action Cards Section */
.home-actions {
  padding: 32px 20px;
  flex: 1;
}

.actions-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 20px;
  text-align: center;
}

.action-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 440px;
  margin: 0 auto;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  width: 100%;
  box-shadow: var(--shadow-sm);
}

.action-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-xl);
  border-color: var(--brand-navy);
}

.action-card:active {
  transform: translateY(-2px) scale(0.99);
}

.action-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.action-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: var(--radius-lg);
  background: var(--gray-100);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.action-card:hover .action-icon {
  background: var(--brand-navy);
  transform: scale(1.1) rotate(-5deg);
}

.action-card:hover .action-icon::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: var(--radius-lg);
  background: var(--brand-navy);
  opacity: 0.2;
  z-index: -1;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 4px;
}

.action-description {
  font-size: 13px;
  color: var(--gray-500);
  margin: 0;
  line-height: 1.4;
}

.action-arrow {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  transition: all 0.3s ease;
}

.action-card:hover .action-arrow {
  color: var(--brand-navy);
  transform: translateX(4px);
}

/* Trust Section */
.trust-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 20px;
  background: white;
  border-top: 1px solid var(--gray-100);
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trust-icon {
  font-size: 16px;
}

.trust-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
}

.trust-divider {
  width: 1px;
  height: 20px;
  background: var(--gray-200);
}

/* Home Footer */
.home-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px 24px;
  background: white;
}

.footer-text {
  font-size: 12px;
  color: var(--gray-400);
  margin: 0;
}

.footer-logo {
  height: 20px;
  width: auto;
  opacity: 0.7;
}

/* Animations */
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered card animations */
.action-card:nth-child(1) { animation: slide-up 0.4s ease-out 0.3s backwards; }
.action-card:nth-child(2) { animation: slide-up 0.4s ease-out 0.4s backwards; }
.action-card:nth-child(3) { animation: slide-up 0.4s ease-out 0.5s backwards; }

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Desktop Enhancement */
@media (min-width: 768px) {
  .home-screen {
    max-width: 480px;
    margin: 24px auto;
    min-height: calc(100vh - 48px);
    border-radius: var(--radius-xl);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .welcome-title {
    font-size: 32px;
  }

  .action-cards {
    gap: 16px;
  }
}
```

**Home Screen JavaScript:**
```javascript
// Home Screen Controller
const HomeScreen = {
  init() {
    this.bindEvents();
    this.show();
  },

  show() {
    document.getElementById('homeScreen').classList.add('active');
    document.getElementById('chatContainer').classList.remove('active');
  },

  hide() {
    document.getElementById('homeScreen').classList.remove('active');
    document.getElementById('chatContainer').classList.add('active');
  },

  bindEvents() {
    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action);
      });
    });
  },

  handleAction(action) {
    // Add ripple effect
    this.addRipple(event.currentTarget);

    // Transition to chat
    setTimeout(() => {
      this.hide();

      switch(action) {
        case 'track':
          startTrackOrderFlow();
          break;
        case 'subscription':
          startSubscriptionFlow();
          break;
        case 'help':
          startHelpFlow();
          break;
      }
    }, 200);
  },

  addRipple(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  HomeScreen.init();
});
```

---

### 0.2 Message Bubbles with Name & Role

**Current:** Just avatar + bubble
**New Design:**

```html
<!-- Bot Message Structure -->
<div class="message-wrapper bot" data-persona="amy">
  <div class="message-sender">
    <img src="..." alt="Amy" class="sender-avatar">
    <div class="sender-info">
      <span class="sender-name">Amy</span>
      <span class="sender-role">Customer Support</span>
    </div>
    <span class="message-time">Just now</span>
  </div>
  <div class="message-bubble">
    <div class="bubble-content">
      <!-- Message text here -->
    </div>
    <div class="bubble-tail"></div>
  </div>
</div>

<!-- Customer Message Structure -->
<div class="message-wrapper customer">
  <div class="message-sender customer-sender">
    <span class="message-time">Just now</span>
    <div class="sender-info">
      <span class="sender-name">You</span>
    </div>
    <div class="customer-avatar-icon">
      <svg><!-- User icon --></svg>
    </div>
  </div>
  <div class="message-bubble customer-bubble">
    <div class="bubble-content">
      <!-- Message text here -->
    </div>
  </div>
</div>
```

**Persona Definitions:**
```javascript
const PERSONAS = {
  amy: {
    name: 'Amy',
    role: 'Customer Support',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    gradient: 'var(--amy-gradient)',
    bubbleBg: 'var(--amy-bg)',
    accentColor: '#FF6B6B'
  },
  sarah: {
    name: 'Sarah',
    role: 'Customer Experience Lead',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    gradient: 'var(--sarah-gradient)',
    bubbleBg: 'var(--sarah-bg)',
    accentColor: '#F7B733'
  },
  claudia: {
    name: 'Claudia',
    role: 'In-House Veterinarian',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
    gradient: 'var(--claudia-gradient)',
    bubbleBg: 'var(--claudia-bg)',
    accentColor: '#A78BFA'
  }
};
```

### 0.3 Button System Redesign

**Current Issues:**
- All buttons look similar
- Limited visual hierarchy
- No micro-interactions

**New Button System:**

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

/* Primary Button - Gradient with glow */
.btn-primary {
  background: var(--customer-gradient);
  color: white;
  box-shadow: var(--shadow-md), 0 4px 14px rgba(10, 22, 40, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 6px 20px rgba(10, 22, 40, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Secondary Button - Outlined */
.btn-secondary {
  background: transparent;
  color: var(--brand-navy);
  border: 2px solid var(--brand-navy);
}

.btn-secondary:hover {
  background: var(--brand-navy);
  color: white;
  transform: translateY(-1px);
}

/* Ghost Button - Minimal */
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  padding: 10px 16px;
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--brand-navy);
}

/* Success Button */
.btn-success {
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(78, 205, 196, 0.4);
}

/* Danger/Decline Button */
.btn-danger {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%);
  color: white;
}

/* Option Card Button (for menu items) */
.btn-option {
  width: 100%;
  padding: 18px 20px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.btn-option:hover {
  border-color: var(--brand-navy);
  background: var(--brand-navy-soft);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.btn-option .btn-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all var(--transition-normal);
}

.btn-option:hover .btn-icon {
  background: var(--brand-navy);
  color: white;
  transform: scale(1.1);
}

/* Ripple Effect */
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: all 0.5s ease;
}

.btn:active::after {
  transform: scale(2);
  opacity: 1;
  transition: 0s;
}
```

### 0.4 Header Redesign

**New Header Structure:**
```html
<header class="app-header">
  <div class="header-content">
    <div class="header-left">
      <div class="persona-indicator">
        <div class="avatar-ring" data-status="online">
          <img src="..." alt="Amy" class="header-avatar">
        </div>
        <div class="persona-info">
          <h1 class="persona-name">Amy</h1>
          <div class="persona-status">
            <span class="status-indicator"></span>
            <span class="status-text">Online</span>
          </div>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button class="btn-ghost btn-restart">
        <svg class="icon-refresh">...</svg>
        <span>Start Over</span>
      </button>
    </div>
  </div>
</header>
```

**Header Styles:**
```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 20px;
}

.avatar-ring {
  position: relative;
  padding: 3px;
  border-radius: 50%;
  background: var(--amy-gradient); /* Changes per persona */
}

.avatar-ring[data-status="typing"] {
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
}

.header-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid white;
  object-fit: cover;
}

.persona-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  animation: pulse 2s infinite;
}

.status-indicator.typing {
  background: #F59E0B;
  animation: typing-pulse 0.8s infinite alternate;
}

@keyframes typing-pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
```

### 0.5 Footer with Brand Logo

**New Footer Structure:**
```html
<footer class="app-footer">
  <div class="footer-content">
    <div class="powered-by">
      <span class="powered-text">Powered by</span>
      <img
        src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041"
        alt="PuppyPad"
        class="brand-logo"
      >
    </div>
  </div>
</footer>
```

**Footer Styles:**
```css
.app-footer {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 20px;
  text-align: center;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.powered-by {
  display: flex;
  align-items: center;
  gap: 8px;
}

.powered-text {
  font-size: 12px;
  color: var(--gray-400);
  font-weight: 500;
}

.brand-logo {
  height: 24px;
  width: auto;
  opacity: 0.85;
  transition: opacity var(--transition-fast);
}

.brand-logo:hover {
  opacity: 1;
}
```

### 0.6 Enhanced Animations & Micro-interactions

**Message Entry Animation:**
```css
@keyframes message-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-wrapper {
  animation: message-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Staggered option buttons */
.options-container .btn-option {
  opacity: 0;
  animation: slide-up 0.3s ease forwards;
}

.options-container .btn-option:nth-child(1) { animation-delay: 0.1s; }
.options-container .btn-option:nth-child(2) { animation-delay: 0.2s; }
.options-container .btn-option:nth-child(3) { animation-delay: 0.3s; }
.options-container .btn-option:nth-child(4) { animation-delay: 0.4s; }

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Typing Indicator Enhancement:**
```css
.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  background: var(--amy-bg);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-400);
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    background: var(--gray-400);
  }
  30% {
    transform: translateY(-8px);
    background: var(--gray-600);
  }
}
```

**Card Hover Effects:**
```css
.order-card,
.product-card,
.subscription-card {
  transition: all var(--transition-normal);
  cursor: pointer;
}

.order-card:hover,
.subscription-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.product-card:hover {
  transform: translateX(8px);
  border-left: 4px solid var(--brand-navy);
}

/* Selected state with checkmark animation */
.product-card.selected .checkbox-icon {
  animation: check-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### 0.7 Offer Card Redesign

**Premium Offer Card:**
```css
.offer-card {
  position: relative;
  background: var(--customer-gradient);
  border-radius: var(--radius-xl);
  padding: 32px 24px;
  color: white;
  text-align: center;
  overflow: hidden;
  box-shadow:
    var(--shadow-xl),
    0 0 40px rgba(10, 22, 40, 0.2);
}

/* Decorative background elements */
.offer-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: float 6s ease-in-out infinite;
}

.offer-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(78, 205, 196, 0.2) 0%, transparent 60%);
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.offer-amount {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.offer-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.offer-btn-accept {
  flex: 1;
  padding: 16px 24px;
  background: white;
  color: var(--brand-navy);
  font-weight: 700;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
}

.offer-btn-accept:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(255,255,255,0.3);
}

.offer-btn-decline {
  flex: 1;
  padding: 16px 24px;
  background: rgba(255,255,255,0.15);
  color: white;
  font-weight: 600;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255,255,255,0.3);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.offer-btn-decline:hover {
  background: rgba(255,255,255,0.25);
}
```

### 0.8 Form Redesign

**Modern Input Fields:**
```css
.form-container {
  background: white;
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-100);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  font-family: inherit;
  color: var(--gray-900);
  background: var(--gray-50);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  background: white;
  border-color: var(--brand-navy);
  box-shadow: 0 0 0 4px rgba(10, 22, 40, 0.1);
}

.form-input.error {
  border-color: var(--accent-coral);
  background: #FFF5F5;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--accent-coral);
}

/* Toggle Switch */
.toggle-container {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-lg);
  padding: 4px;
  position: relative;
}

.toggle-option {
  flex: 1;
  padding: 12px 20px;
  text-align: center;
  font-weight: 600;
  color: var(--gray-500);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-md);
  z-index: 1;
}

.toggle-option.active {
  color: var(--brand-navy);
}

.toggle-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-normal);
}

.toggle-container.phone .toggle-slider {
  transform: translateX(100%);
}
```

### 0.9 Success/Error Cards Redesign

```css
.result-card {
  text-align: center;
  padding: 40px 24px;
  border-radius: var(--radius-xl);
  animation: result-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes result-enter {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.result-card.success {
  background: linear-gradient(135deg, #E8FFF0 0%, #D1FAE5 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.result-card.error {
  background: linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.result-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
}

.success .result-icon {
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  animation: success-bounce 0.6s ease-out 0.2s;
}

@keyframes success-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.success .result-title { color: #166534; }
.error .result-title { color: #991B1B; }

.result-message {
  font-size: 15px;
  line-height: 1.6;
  color: var(--gray-600);
}

.result-case-id {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.05);
  border-radius: var(--radius-full);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 14px;
  font-weight: 600;
}
```

### 0.10 Layout Structure Update

**App Container:**
```html
<div class="app-container">
  <header class="app-header">...</header>

  <main class="chat-area" id="chatArea">
    <!-- Messages flow here -->
  </main>

  <div class="input-area" id="inputArea">
    <!-- Text input when needed -->
  </div>

  <footer class="app-footer">
    <div class="footer-content">
      <span class="powered-text">Powered by</span>
      <img src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041" alt="PuppyPad" class="brand-logo">
    </div>
  </footer>
</div>
```

**Layout Styles:**
```css
.app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%);
  position: relative;
}

@media (min-width: 768px) {
  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .app-container {
    min-height: 700px;
    max-height: 900px;
    border-radius: var(--radius-xl);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.chat-area::-webkit-scrollbar {
  width: 6px;
}

.chat-area::-webkit-scrollbar-track {
  background: transparent;
}

.chat-area::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 3px;
}

.chat-area::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}
```

### 0.11 Character-by-Character Typing with Cursor

```javascript
async function typeMessage(element, text, speed = 25) {
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  cursor.textContent = '|';
  element.appendChild(cursor);

  for (let i = 0; i < text.length; i++) {
    // Handle HTML tags (skip typing them char by char)
    if (text[i] === '<') {
      const closeIndex = text.indexOf('>', i);
      if (closeIndex !== -1) {
        const tag = text.substring(i, closeIndex + 1);
        element.insertBefore(document.createRange().createContextualFragment(tag), cursor);
        i = closeIndex;
        continue;
      }
    }

    const char = document.createTextNode(text[i]);
    element.insertBefore(char, cursor);
    scrollToBottom();

    // Variable speed for natural feeling
    const delay = text[i] === '.' || text[i] === '!' || text[i] === '?'
      ? speed * 8  // Pause at sentence ends
      : text[i] === ','
        ? speed * 4  // Smaller pause at commas
        : speed + Math.random() * 15;

    await new Promise(r => setTimeout(r, delay));
  }

  cursor.remove();
}
```

```css
.typing-cursor {
  display: inline;
  animation: cursor-blink 0.8s step-end infinite;
  color: var(--brand-navy);
  font-weight: 400;
}

@keyframes cursor-blink {
  50% { opacity: 0; }
}
```

---

### 0.12 Additional Enhancements ⭐ NEW

These additional features will elevate the app from good to exceptional:

#### 0.12.1 Progress Indicator

Show customers where they are in the resolution flow:

```html
<div class="progress-indicator" id="progressIndicator">
  <div class="progress-steps">
    <div class="progress-step completed" data-step="identify">
      <div class="step-dot">
        <svg class="check-icon">...</svg>
      </div>
      <span class="step-label">Identify</span>
    </div>
    <div class="progress-line completed"></div>
    <div class="progress-step active" data-step="select">
      <div class="step-dot">2</div>
      <span class="step-label">Select Items</span>
    </div>
    <div class="progress-line"></div>
    <div class="progress-step" data-step="resolve">
      <div class="step-dot">3</div>
      <span class="step-label">Resolve</span>
    </div>
  </div>
</div>
```

```css
.progress-indicator {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid var(--gray-100);
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gray-200);
  color: var(--gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.progress-step.active .step-dot {
  background: var(--brand-navy);
  color: white;
  box-shadow: 0 0 0 4px rgba(10, 22, 40, 0.15);
}

.progress-step.completed .step-dot {
  background: var(--accent-teal);
  color: white;
}

.step-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--gray-400);
}

.progress-step.active .step-label,
.progress-step.completed .step-label {
  color: var(--gray-700);
}

.progress-line {
  width: 40px;
  height: 2px;
  background: var(--gray-200);
  margin: 0 8px 20px;
  transition: background 0.3s ease;
}

.progress-line.completed {
  background: var(--accent-teal);
}
```

#### 0.12.2 Copy Case ID Feature

Allow customers to easily copy their case ID:

```javascript
function createCaseIdDisplay(caseId) {
  return `
    <div class="case-id-display">
      <span class="case-id-label">Your Case ID</span>
      <div class="case-id-value">
        <code>${caseId}</code>
        <button class="copy-btn" onclick="copyCaseId('${caseId}')" title="Copy to clipboard">
          <svg class="copy-icon" width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 4v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2zm2-2v2h4a2 2 0 0 1 2 2v4h2v-6h-6z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <span class="copy-feedback" id="copyFeedback">Copied!</span>
    </div>
  `;
}

async function copyCaseId(caseId) {
  try {
    await navigator.clipboard.writeText(caseId);
    const feedback = document.getElementById('copyFeedback');
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 2000);
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = caseId;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
```

```css
.case-id-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  margin-top: 16px;
}

.case-id-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.case-id-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.case-id-value code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--brand-navy);
  background: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

.copy-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--gray-500);
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--brand-navy);
  color: white;
  border-color: var(--brand-navy);
}

.copy-feedback {
  font-size: 12px;
  color: var(--accent-teal);
  font-weight: 600;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.copy-feedback.show {
  opacity: 1;
  transform: translateY(0);
}
```

#### 0.12.3 Session Recovery

Recover session if user accidentally closes browser:

```javascript
const SessionManager = {
  STORAGE_KEY: 'puppypad_session',
  EXPIRY_HOURS: 2,

  save(state) {
    const session = {
      state,
      timestamp: Date.now(),
      expiresAt: Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000)
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
  },

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      if (Date.now() > session.expiresAt) {
        this.clear();
        return null;
      }
      return session.state;
    } catch (e) {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  checkForRecovery() {
    const saved = this.load();
    if (saved && saved.currentStep !== 'home') {
      return this.showRecoveryPrompt(saved);
    }
    return false;
  },

  showRecoveryPrompt(savedState) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'recovery-modal';
      modal.innerHTML = `
        <div class="recovery-content">
          <div class="recovery-icon">🔄</div>
          <h3>Continue where you left off?</h3>
          <p>You have an unfinished session from earlier.</p>
          <div class="recovery-actions">
            <button class="btn btn-primary" id="recoverSession">Continue</button>
            <button class="btn btn-ghost" id="startFresh">Start Fresh</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('recoverSession').onclick = () => {
        modal.remove();
        resolve(savedState);
      };

      document.getElementById('startFresh').onclick = () => {
        this.clear();
        modal.remove();
        resolve(null);
      };
    });
  }
};

// Auto-save on state changes
function updateState(newState) {
  state = { ...state, ...newState };
  SessionManager.save(state);
}
```

#### 0.12.4 Loading Skeleton States

Show beautiful skeleton loaders while content loads:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-order-card {
  padding: 20px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.skeleton-line {
  height: 16px;
  margin-bottom: 12px;
}

.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 70%; }
.skeleton-line.full { width: 100%; }

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-button {
  height: 48px;
  border-radius: var(--radius-lg);
}
```

```javascript
function showOrderSkeleton() {
  return `
    <div class="skeleton-order-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line full"></div>
      <div class="skeleton skeleton-button" style="margin-top: 16px;"></div>
    </div>
  `;
}
```

#### 0.12.5 Confirmation Dialogs

Add confirmation before destructive actions:

```javascript
function showConfirmDialog(options) {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' } = options;

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog ${type}">
        <div class="confirm-icon">
          ${type === 'warning' ? '⚠️' : type === 'danger' ? '🚨' : 'ℹ️'}
        </div>
        <h3 class="confirm-title">${title}</h3>
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost confirm-cancel">${cancelText}</button>
          <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.querySelector('.confirm-ok').onclick = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      resolve(true);
    };

    overlay.querySelector('.confirm-cancel').onclick = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      resolve(false);
    };
  });
}

// Usage
async function handleCancelSubscription() {
  const confirmed = await showConfirmDialog({
    title: 'Cancel Subscription?',
    message: 'Your subscription will be cancelled immediately. You can resubscribe anytime.',
    confirmText: 'Yes, Cancel',
    cancelText: 'Keep Subscription',
    type: 'danger'
  });

  if (confirmed) {
    // Proceed with cancellation
  }
}
```

```css
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding: 20px;
}

.confirm-overlay.active {
  opacity: 1;
}

.confirm-dialog {
  background: white;
  border-radius: var(--radius-xl);
  padding: 32px 24px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  transform: scale(0.9);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-overlay.active .confirm-dialog {
  transform: scale(1);
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 8px;
}

.confirm-message {
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.5;
  margin: 0 0 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .btn {
  flex: 1;
}
```

#### 0.12.6 Network Status Indicator

Show when connection is lost:

```javascript
const NetworkStatus = {
  init() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  },

  updateStatus(isOnline) {
    const banner = document.getElementById('networkBanner');
    if (isOnline) {
      banner.className = 'network-banner online';
      banner.innerHTML = '✓ Back online';
      setTimeout(() => banner.classList.remove('show'), 3000);
    } else {
      banner.className = 'network-banner offline show';
      banner.innerHTML = '⚠️ No internet connection';
    }
  }
};
```

```css
.network-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 9999;
}

.network-banner.show {
  transform: translateY(0);
}

.network-banner.offline {
  background: var(--accent-coral);
  color: white;
}

.network-banner.online {
  background: var(--accent-teal);
  color: white;
}
```

#### 0.12.7 Accessibility Enhancements

Ensure the app is usable by everyone:

```css
/* Focus visible for keyboard navigation */
*:focus-visible {
  outline: 2px solid var(--brand-navy);
  outline-offset: 2px;
}

/* Reduced motion for vestibular disorders */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .btn-primary {
    border: 2px solid white;
  }

  .message-bubble {
    border: 1px solid currentColor;
  }
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```javascript
// Announce dynamic content to screen readers
function announceToScreenReader(message) {
  const announcer = document.getElementById('srAnnouncer');
  announcer.textContent = message;
}

// Keyboard navigation for options
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const focused = document.activeElement;
    if (focused.classList.contains('btn-option')) {
      focused.click();
    }
  }
});
```

#### 0.12.8 End-of-Session Survey

Quick satisfaction survey after resolution:

```javascript
function showEndSurvey(caseId) {
  return `
    <div class="survey-card">
      <h3 class="survey-title">How was your experience?</h3>
      <div class="survey-emojis">
        <button class="survey-emoji" data-rating="1" aria-label="Very unhappy">😢</button>
        <button class="survey-emoji" data-rating="2" aria-label="Unhappy">😕</button>
        <button class="survey-emoji" data-rating="3" aria-label="Neutral">😐</button>
        <button class="survey-emoji" data-rating="4" aria-label="Happy">🙂</button>
        <button class="survey-emoji" data-rating="5" aria-label="Very happy">😍</button>
      </div>
      <p class="survey-skip">
        <button class="btn-ghost" onclick="skipSurvey()">Skip</button>
      </p>
    </div>
  `;
}

async function submitRating(rating, caseId) {
  await fetch('/api/analytics/rating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, rating, timestamp: Date.now() })
  });

  // Show thank you
  showThankYou();
}
```

```css
.survey-card {
  text-align: center;
  padding: 32px 24px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.survey-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 24px;
}

.survey-emojis {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.survey-emoji {
  font-size: 40px;
  padding: 12px;
  background: var(--gray-50);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.survey-emoji:hover {
  transform: scale(1.2);
  border-color: var(--brand-navy);
  background: var(--brand-navy-soft);
}

.survey-emoji.selected {
  transform: scale(1.3);
  border-color: var(--accent-teal);
  background: #E8FFF0;
}

.survey-skip {
  margin-top: 16px;
}
```

---

## IMPLEMENTATION FILES SUMMARY

### Files to Modify:

1. **frontend/index.html**
   - Add Home Screen structure (hero, action cards, trust indicators)
   - Add footer structure with brand logo
   - Update header structure with persona indicator
   - Add network status banner element
   - Add screen reader announcer element
   - Add meta viewport improvements
   - Link to updated CSS

2. **frontend/styles.css** (Complete Rewrite)
   - New design system variables (colors, shadows, radii, transitions)
   - Home Screen styles (hero, action cards, trust section, animations)
   - Message bubbles with name/role
   - Button system (primary, secondary, ghost, option cards)
   - Header & footer styles
   - Form styling updates
   - Offer card premium design
   - Success/error cards
   - Progress indicator
   - Skeleton loading states
   - Confirmation dialogs
   - Network status banner
   - Accessibility enhancements
   - Responsive improvements
   - Print styles

3. **frontend/app.js**
   - Add HomeScreen controller
   - Add SessionManager for recovery
   - Add NetworkStatus handler
   - Update message rendering with name/role
   - Add character-by-character typing with cursor
   - Update all button/option rendering
   - Add persona-specific styling
   - Add progress indicator updates
   - Add copy case ID functionality
   - Add confirmation dialogs
   - Add end-of-session survey
   - Add screen reader announcements
   - Enhanced animations

---

## Phase 1: Critical Policy Logic (Backend + Frontend)

*(Remaining phases unchanged from original plan)*

#### 1.1 90-Day Guarantee Validation ❌ NOT IMPLEMENTED
**Why Critical:** Without this, customers outside the guarantee period could request refunds.

**Required Changes:**
```
Backend: src/index.js
- Add endpoint: POST /api/validate-guarantee
- Logic: Check ParcelPanel delivery_date first
- Fallback: Use order created_at (tell customer we used fallback)
- Return: { eligible: boolean, daysRemaining: number, usedFallback: boolean }

Frontend: app.js
- Before showing refund ladder, call validate-guarantee
- If not eligible, show policy block message
- Log as analytics event (policy_block_90day)
```

#### 1.2 10-Hour Fulfillment Cutoff ❌ NOT IMPLEMENTED
#### 1.3 ClickUp Deduplication ❌ NOT IMPLEMENTED

---

## Phase 2: Richpanel Integration ❌ NOT IMPLEMENTED

### 2.1 Configuration Constants

```javascript
// Worker configuration (src/index.js)
const TEST_MODE = true;  // Set to false for production
const TEST_EMAIL = 'zarg.business@gmail.com';
const SUPPORT_EMAIL = 'help@teampuppypad.com';
```

**Test Mode Behavior:**
| TEST_MODE | Customer Email Used |
|-----------|---------------------|
| `true` | `zarg.business@gmail.com` (all emails route here for testing) |
| `false` | Actual customer's email from the order |

### 2.2 Environment Variables

```
# Add to wrangler.toml or Cloudflare secrets
RICHPANEL_API_KEY=your_api_key_here
RICHPANEL_WORKSPACE_ID=your_workspace_id
```

### 2.3 Create Customer Email (Proof of Request)

When a case is created, send an email to Richpanel that appears to come FROM the customer:

```javascript
async function createRichpanelTicket(env, caseData) {
  const {
    customerEmail,
    customerName,
    orderNumber,
    caseId,
    caseType,
    resolution,
    selectedItems,
    intentDetails
  } = caseData;

  // Use test email in test mode
  const fromEmail = TEST_MODE ? TEST_EMAIL : customerEmail;

  // Build subject line (with [TEST] prefix in test mode)
  const subjectPrefix = TEST_MODE ? '[TEST] ' : '';
  const subject = `${subjectPrefix}Resolution Request - ${caseId}`;

  // Build email body
  const body = buildEmailBody(caseData);

  const response = await fetch('https://api.richpanel.com/v1/conversations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RICHPANEL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: subject,
      via: {
        channel: 'email',
        source: {
          from: {
            address: fromEmail,
            name: customerName
          },
          to: {
            address: SUPPORT_EMAIL  // Always help@teampuppypad.com
          }
        }
      },
      message: {
        content: body,
        content_type: 'text/html'
      },
      customer: {
        email: fromEmail,
        name: customerName
      },
      custom_fields: {
        case_id: caseId,
        order_number: orderNumber,
        case_type: caseType
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Richpanel API error: ${response.status}`);
  }

  return await response.json();
}
```

### 2.4 Email Body Template

```javascript
function buildEmailBody(caseData) {
  const {
    customerName,
    orderNumber,
    caseId,
    caseType,
    resolution,
    selectedItems,
    intentDetails,
    refundAmount
  } = caseData;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0A1628;">Resolution Request Submitted</h2>

      <p>Hi PuppyPad Team,</p>

      <p>I'm reaching out regarding my order and would like to request the following resolution:</p>

      <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Case ID:</strong> ${caseId}</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Request Type:</strong> ${caseType}</p>
        ${refundAmount ? `<p><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
      </div>

      <h3>Resolution Requested:</h3>
      <p style="background: #E8F5E9; padding: 12px; border-radius: 8px; border-left: 4px solid #4CAF50;">
        ${resolution}
      </p>

      ${selectedItems?.length ? `
        <h3>Products Involved:</h3>
        <ul>
          ${selectedItems.map(item => `<li>${item.name} (SKU: ${item.sku})</li>`).join('')}
        </ul>
      ` : ''}

      ${intentDetails ? `
        <h3>Additional Details:</h3>
        <p>${intentDetails}</p>
      ` : ''}

      <p>Thank you,<br>${customerName}</p>

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
      <p style="color: #6B7280; font-size: 12px;">
        This email was generated by the PuppyPad Resolution App.
        ${TEST_MODE ? '<br><strong style="color: #EF4444;">[TEST MODE - Not a real customer request]</strong>' : ''}
      </p>
    </div>
  `;
}
```

### 2.5 Create Private Note (Internal Action Steps)

After creating the customer email, add an internal private note with action steps for the team:

```javascript
async function createRichpanelPrivateNote(env, conversationId, caseData) {
  const {
    caseId,
    caseType,
    resolution,
    orderNumber,
    refundAmount,
    selectedItems,
    evidenceUrls,
    sopLink
  } = caseData;

  const noteContent = `
## 🎯 ACTION REQUIRED

**Case ID:** ${caseId}
**Type:** ${caseType}
**Order:** ${orderNumber}

---

### Resolution to Execute:
${resolution}

${refundAmount ? `### Refund Amount: $${refundAmount}` : ''}

${selectedItems?.length ? `
### Products:
${selectedItems.map(item => `- ${item.name} (${item.sku}) - Qty: ${item.quantity}`).join('\n')}
` : ''}

${evidenceUrls?.length ? `
### Evidence/Photos:
${evidenceUrls.map(url => `- ${url}`).join('\n')}
` : ''}

---

### SOP Reference:
${sopLink || '[SOP_LINK_PLACEHOLDER]'}

---

*This note was auto-generated by Resolution App*
${TEST_MODE ? '\n⚠️ **TEST MODE** - Do not process this request' : ''}
  `.trim();

  const response = await fetch(
    `https://api.richpanel.com/v1/conversations/${conversationId}/notes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RICHPANEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: noteContent,
        content_type: 'text/markdown'
      })
    }
  );

  if (!response.ok) {
    console.error('Failed to create private note:', response.status);
  }

  return response.ok;
}
```

### 2.6 Complete Integration Function

```javascript
async function createRichpanelEntry(env, caseData) {
  try {
    // 1. Create the customer email (ticket)
    const ticket = await createRichpanelTicket(env, caseData);
    const conversationId = ticket.id;

    // 2. Add private note with action steps
    await createRichpanelPrivateNote(env, conversationId, caseData);

    // 3. Return conversation URL for ClickUp
    const conversationUrl = `https://app.richpanel.com/conversations/${conversationId}`;

    return {
      success: true,
      conversationId,
      conversationUrl
    };
  } catch (error) {
    console.error('Richpanel integration error:', error);

    // Don't fail the whole case creation if Richpanel fails
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2.7 Test Mode Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST MODE (true)                         │
├─────────────────────────────────────────────────────────────────┤
│ • All emails route to: zarg.business@gmail.com                 │
│ • Subject prefix: [TEST]                                        │
│ • Email footer shows: [TEST MODE - Not a real customer request]│
│ • Private note shows: ⚠️ TEST MODE - Do not process            │
│ • Safe to test full flow without affecting real customers       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION MODE (false)                     │
├─────────────────────────────────────────────────────────────────┤
│ • Emails use actual customer email address                      │
│ • No [TEST] prefix on subjects                                  │
│ • Clean email footer                                            │
│ • Private notes ready for team action                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.8 Switching to Production

When ready to go live, simply change:
```javascript
const TEST_MODE = false;  // Changed from true
```

Or better, use environment variable:
```javascript
const TEST_MODE = env.APP_ENV !== 'production';
```

---

## Phase 3: Analytics Dashboard ❌ NOT IMPLEMENTED

### 3.1 Dashboard Overview

A professional, print-ready analytics dashboard for tracking Resolution App performance.

**Route:** `/admin/dashboard` (protected)

**Key Features:**
- Date range picker with presets
- Real-time metrics cards
- Interactive charts
- Export & print functionality
- Responsive design

### 3.2 Dashboard Layout Design

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resolution App - Analytics Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <aside class="dashboard-sidebar">
      <div class="sidebar-logo">
        <img src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041" alt="PuppyPad">
        <span class="logo-text">Analytics</span>
      </div>

      <nav class="sidebar-nav">
        <a href="#" class="nav-item active">
          <svg class="nav-icon"><!-- Dashboard icon --></svg>
          <span>Overview</span>
        </a>
        <a href="#" class="nav-item">
          <svg class="nav-icon"><!-- Cases icon --></svg>
          <span>Cases</span>
        </a>
        <a href="#" class="nav-item">
          <svg class="nav-icon"><!-- Sessions icon --></svg>
          <span>Sessions</span>
        </a>
        <a href="#" class="nav-item">
          <svg class="nav-icon"><!-- Refunds icon --></svg>
          <span>Refunds</span>
        </a>
        <a href="#" class="nav-item">
          <svg class="nav-icon"><!-- Settings icon --></svg>
          <span>Settings</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Top Bar -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Analytics Overview</h1>
          <p class="page-subtitle">Track your Resolution App performance</p>
        </div>
        <div class="header-right">
          <!-- Date Range Picker -->
          <div class="date-picker-container">
            <button class="date-picker-trigger" id="datePickerBtn">
              <svg class="calendar-icon"><!-- Calendar icon --></svg>
              <span id="dateRangeLabel">Last 7 days</span>
              <svg class="chevron-icon"><!-- Chevron down --></svg>
            </button>

            <div class="date-picker-dropdown" id="datePickerDropdown">
              <div class="preset-buttons">
                <button class="preset-btn active" data-range="7d">Last 7 days</button>
                <button class="preset-btn" data-range="30d">Last 30 days</button>
                <button class="preset-btn" data-range="90d">Last 90 days</button>
                <button class="preset-btn" data-range="year">This Year</button>
                <button class="preset-btn" data-range="custom">Custom Range</button>
              </div>

              <div class="custom-range-picker" id="customRangePicker" style="display: none;">
                <div class="date-inputs">
                  <div class="date-input-group">
                    <label>Start Date</label>
                    <input type="date" id="startDate" class="date-input">
                  </div>
                  <span class="date-separator">to</span>
                  <div class="date-input-group">
                    <label>End Date</label>
                    <input type="date" id="endDate" class="date-input">
                  </div>
                </div>
                <button class="apply-btn" id="applyCustomRange">Apply</button>
              </div>
            </div>
          </div>

          <!-- Export Buttons -->
          <div class="export-buttons">
            <button class="btn-export" onclick="exportCSV()">
              <svg><!-- Download icon --></svg>
              Export CSV
            </button>
            <button class="btn-export btn-print" onclick="printReport()">
              <svg><!-- Print icon --></svg>
              Print Report
            </button>
          </div>
        </div>
      </header>

      <!-- Metrics Cards -->
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Sessions</span>
            <span class="metric-trend positive">+12.5%</span>
          </div>
          <div class="metric-value" id="totalSessions">1,248</div>
          <div class="metric-comparison">vs 1,109 last period</div>
          <div class="metric-sparkline" id="sessionsSparkline"></div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Cases Created</span>
            <span class="metric-trend negative">-3.2%</span>
          </div>
          <div class="metric-value" id="totalCases">342</div>
          <div class="metric-comparison">vs 353 last period</div>
          <div class="metric-sparkline" id="casesSparkline"></div>
        </div>

        <div class="metric-card highlight">
          <div class="metric-header">
            <span class="metric-label">Resolved In-App</span>
            <span class="metric-trend positive">+18.7%</span>
          </div>
          <div class="metric-value" id="resolvedInApp">72.4%</div>
          <div class="metric-comparison">906 sessions self-resolved</div>
          <div class="metric-sparkline" id="resolvedSparkline"></div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Refunds</span>
            <span class="metric-trend neutral">0%</span>
          </div>
          <div class="metric-value" id="totalRefunds">$4,892</div>
          <div class="metric-comparison">Avg $14.30 per refund</div>
          <div class="metric-sparkline" id="refundsSparkline"></div>
        </div>
      </section>

      <!-- Charts Row -->
      <section class="charts-row">
        <div class="chart-card wide">
          <div class="chart-header">
            <h3 class="chart-title">Sessions & Cases Over Time</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot sessions"></span>Sessions</span>
              <span class="legend-item"><span class="legend-dot cases"></span>Cases</span>
              <span class="legend-item"><span class="legend-dot resolved"></span>Resolved</span>
            </div>
          </div>
          <div class="chart-container" id="timeSeriesChart"></div>
        </div>
      </section>

      <!-- Two Column Charts -->
      <section class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Cases by Path</h3>
          </div>
          <div class="chart-container" id="pathsChart"></div>
          <div class="chart-stats">
            <div class="stat-row">
              <span class="stat-label">Help With Order</span>
              <span class="stat-value">58%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Manage Subscription</span>
              <span class="stat-value">32%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Track Order</span>
              <span class="stat-value">10%</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Intent Distribution</h3>
          </div>
          <div class="chart-container" id="intentsChart"></div>
        </div>
      </section>

      <!-- Satisfaction & Ladder Stats -->
      <section class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Customer Satisfaction</h3>
          </div>
          <div class="satisfaction-display">
            <div class="satisfaction-ring">
              <svg viewBox="0 0 120 120">
                <circle class="ring-bg" cx="60" cy="60" r="54"/>
                <circle class="ring-fill" cx="60" cy="60" r="54"
                        stroke-dasharray="339.3"
                        stroke-dashoffset="95"/>
              </svg>
              <div class="satisfaction-value">72%</div>
            </div>
            <div class="satisfaction-breakdown">
              <div class="satisfaction-item yes">
                <span class="emoji">😊</span>
                <span class="label">Satisfied</span>
                <span class="count">654</span>
              </div>
              <div class="satisfaction-item no">
                <span class="emoji">😔</span>
                <span class="label">Not Satisfied</span>
                <span class="count">252</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Refund Ladder Performance</h3>
          </div>
          <div class="ladder-stats">
            <div class="ladder-funnel">
              <div class="funnel-step" style="width: 100%;">
                <span class="step-label">Offered</span>
                <span class="step-value">892</span>
              </div>
              <div class="funnel-step" style="width: 45%;">
                <span class="step-label">Accepted at 10-20%</span>
                <span class="step-value">401</span>
              </div>
              <div class="funnel-step" style="width: 25%;">
                <span class="step-label">Accepted at 30-40%</span>
                <span class="step-value">223</span>
              </div>
              <div class="funnel-step" style="width: 15%;">
                <span class="step-label">Went to Full Refund</span>
                <span class="step-value">134</span>
              </div>
            </div>
            <div class="ladder-insight">
              <strong>55%</strong> of customers accepted a partial offer
            </div>
          </div>
        </div>
      </section>

      <!-- Shipping Status Distribution -->
      <section class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Shipping Status Distribution</h3>
            <span class="chart-subtitle">ParcelPanel status for "Haven't Received" cases</span>
          </div>
          <div class="status-grid" id="shippingStatusGrid">
            <div class="status-card delivered">
              <div class="status-icon">📦</div>
              <div class="status-name">Delivered</div>
              <div class="status-count">128</div>
              <div class="status-percent">34%</div>
            </div>
            <div class="status-card in-transit">
              <div class="status-icon">🚚</div>
              <div class="status-name">In Transit</div>
              <div class="status-count">186</div>
              <div class="status-percent">49%</div>
            </div>
            <div class="status-card exception">
              <div class="status-icon">⚠️</div>
              <div class="status-name">Exception</div>
              <div class="status-count">32</div>
              <div class="status-percent">8%</div>
            </div>
            <div class="status-card expired">
              <div class="status-icon">⏰</div>
              <div class="status-name">Expired</div>
              <div class="status-count">18</div>
              <div class="status-percent">5%</div>
            </div>
            <div class="status-card failed">
              <div class="status-icon">❌</div>
              <div class="status-name">Failed Delivery</div>
              <div class="status-count">15</div>
              <div class="status-percent">4%</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Cases Table -->
      <section class="table-section">
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">Recent Cases</h3>
            <div class="table-filters">
              <select class="filter-select" id="caseTypeFilter">
                <option value="all">All Types</option>
                <option value="refund">Refund</option>
                <option value="return">Return</option>
                <option value="shipping">Shipping</option>
                <option value="subscription">Subscription</option>
              </select>
              <input type="search" class="search-input" placeholder="Search cases..." id="caseSearch">
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Resolution</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="casesTableBody">
                <!-- Populated dynamically -->
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Showing 1-10 of 342 cases</span>
            <div class="pagination-controls">
              <button class="pagination-btn" disabled>Previous</button>
              <button class="pagination-btn active">1</button>
              <button class="pagination-btn">2</button>
              <button class="pagination-btn">3</button>
              <span class="pagination-ellipsis">...</span>
              <button class="pagination-btn">35</button>
              <button class="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>
```

### 3.3 Dashboard CSS Styles

```css
/* Dashboard Variables */
:root {
  --dash-bg: #F8FAFC;
  --dash-sidebar: #0A1628;
  --dash-card: #FFFFFF;
  --dash-border: #E2E8F0;
  --dash-text: #1E293B;
  --dash-text-muted: #64748B;
  --dash-primary: #3B82F6;
  --dash-success: #22C55E;
  --dash-warning: #F59E0B;
  --dash-danger: #EF4444;
}

/* Layout */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: var(--dash-bg);
}

/* Sidebar */
.dashboard-sidebar {
  width: 260px;
  background: var(--dash-sidebar);
  color: white;
  padding: 24px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px 32px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 24px;
}

.sidebar-logo img {
  height: 32px;
  filter: brightness(0) invert(1);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.9;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}

/* Main Content */
.dashboard-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--dash-text);
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--dash-text-muted);
  margin-top: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Date Picker */
.date-picker-container {
  position: relative;
}

.date-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--dash-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dash-text);
  cursor: pointer;
  transition: all 0.2s;
}

.date-picker-trigger:hover {
  border-color: var(--dash-primary);
}

.date-picker-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid var(--dash-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  padding: 16px;
  min-width: 300px;
  z-index: 100;
  display: none;
}

.date-picker-dropdown.active {
  display: block;
  animation: dropdown-enter 0.2s ease;
}

@keyframes dropdown-enter {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  padding: 8px 14px;
  background: var(--dash-bg);
  border: 1px solid var(--dash-border);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--dash-primary);
  background: #EFF6FF;
}

.preset-btn.active {
  background: var(--dash-primary);
  color: white;
  border-color: var(--dash-primary);
}

/* Export Buttons */
.export-buttons {
  display: flex;
  gap: 8px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--dash-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dash-text);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: var(--dash-bg);
  border-color: var(--dash-text);
}

.btn-export.btn-print {
  background: var(--dash-primary);
  color: white;
  border-color: var(--dash-primary);
}

.btn-export.btn-print:hover {
  background: #2563EB;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--dash-border);
  position: relative;
  overflow: hidden;
}

.metric-card.highlight {
  background: linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%);
  color: white;
  border: none;
}

.metric-card.highlight .metric-label,
.metric-card.highlight .metric-comparison {
  color: rgba(255,255,255,0.7);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--dash-text-muted);
}

.metric-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 20px;
}

.metric-trend.positive {
  background: #DCFCE7;
  color: #166534;
}

.metric-trend.negative {
  background: #FEE2E2;
  color: #991B1B;
}

.metric-trend.neutral {
  background: var(--dash-bg);
  color: var(--dash-text-muted);
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--dash-text);
  margin-bottom: 8px;
}

.metric-card.highlight .metric-value {
  color: white;
}

.metric-comparison {
  font-size: 13px;
  color: var(--dash-text-muted);
}

.metric-sparkline {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  opacity: 0.3;
}

/* Chart Cards */
.charts-row {
  margin-bottom: 24px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--dash-border);
}

.chart-card.wide {
  grid-column: span 2;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dash-text);
  margin: 0;
}

.chart-subtitle {
  font-size: 13px;
  color: var(--dash-text-muted);
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--dash-text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.sessions { background: var(--dash-primary); }
.legend-dot.cases { background: var(--dash-warning); }
.legend-dot.resolved { background: var(--dash-success); }

.chart-container {
  height: 280px;
}

/* Satisfaction Ring */
.satisfaction-display {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px 0;
}

.satisfaction-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.satisfaction-ring svg {
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--dash-bg);
  stroke-width: 12;
}

.ring-fill {
  fill: none;
  stroke: var(--dash-success);
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease;
}

.satisfaction-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--dash-text);
}

.satisfaction-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.satisfaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.satisfaction-item .emoji {
  font-size: 24px;
}

.satisfaction-item .label {
  font-size: 14px;
  color: var(--dash-text-muted);
  min-width: 100px;
}

.satisfaction-item .count {
  font-size: 16px;
  font-weight: 600;
  color: var(--dash-text);
}

/* Ladder Funnel */
.ladder-funnel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.funnel-step {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, var(--dash-primary) 0%, #60A5FA 100%);
  color: white;
  border-radius: 6px;
  font-size: 13px;
}

.funnel-step:nth-child(2) { opacity: 0.85; }
.funnel-step:nth-child(3) { opacity: 0.7; }
.funnel-step:nth-child(4) { opacity: 0.55; background: var(--dash-warning); }

.ladder-insight {
  text-align: center;
  padding: 16px;
  background: #F0FDF4;
  border-radius: 8px;
  color: #166534;
  font-size: 14px;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.status-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--dash-bg);
  border-radius: 10px;
  transition: all 0.2s;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.status-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.status-name {
  font-size: 12px;
  color: var(--dash-text-muted);
  margin-bottom: 8px;
}

.status-count {
  font-size: 24px;
  font-weight: 700;
  color: var(--dash-text);
}

.status-percent {
  font-size: 12px;
  color: var(--dash-text-muted);
}

/* Table */
.table-card {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--dash-border);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--dash-border);
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.table-filters {
  display: flex;
  gap: 12px;
}

.filter-select,
.search-input {
  padding: 8px 12px;
  border: 1px solid var(--dash-border);
  border-radius: 6px;
  font-size: 14px;
}

.search-input {
  width: 200px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 24px;
  text-align: left;
  font-size: 14px;
}

.data-table th {
  background: var(--dash-bg);
  font-weight: 600;
  color: var(--dash-text-muted);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.data-table tr:not(:last-child) td {
  border-bottom: 1px solid var(--dash-border);
}

.data-table tr:hover td {
  background: #F8FAFC;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--dash-border);
}

.pagination-info {
  font-size: 14px;
  color: var(--dash-text-muted);
}

.pagination-controls {
  display: flex;
  gap: 4px;
}

.pagination-btn {
  padding: 8px 14px;
  border: 1px solid var(--dash-border);
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--dash-bg);
  border-color: var(--dash-text);
}

.pagination-btn.active {
  background: var(--dash-primary);
  color: white;
  border-color: var(--dash-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Print Styles */
@media print {
  .dashboard-sidebar,
  .header-right,
  .table-filters,
  .table-pagination,
  .export-buttons {
    display: none !important;
  }

  .dashboard-main {
    margin-left: 0;
    padding: 20px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    page-break-inside: avoid;
  }

  .data-table {
    font-size: 12px;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-sidebar {
    display: none;
  }

  .dashboard-main {
    margin-left: 0;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.wide {
    grid-column: span 1;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
}
```

### 3.4 Dashboard JavaScript

```javascript
// Dashboard Configuration
const DASHBOARD_CONFIG = {
  apiUrl: '/admin/api',
  refreshInterval: 60000, // 1 minute
};

let currentDateRange = '7d';
let dashboardData = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  initDatePicker();
  loadDashboardData();
  initCharts();

  // Auto-refresh
  setInterval(loadDashboardData, DASHBOARD_CONFIG.refreshInterval);
});

// Date Picker
function initDatePicker() {
  const trigger = document.getElementById('datePickerBtn');
  const dropdown = document.getElementById('datePickerDropdown');
  const presetBtns = document.querySelectorAll('.preset-btn');

  trigger.addEventListener('click', () => {
    dropdown.classList.toggle('active');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.date-picker-container')) {
      dropdown.classList.remove('active');
    }
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const range = btn.dataset.range;
      if (range === 'custom') {
        document.getElementById('customRangePicker').style.display = 'block';
      } else {
        document.getElementById('customRangePicker').style.display = 'none';
        setDateRange(range);
      }
    });
  });

  document.getElementById('applyCustomRange').addEventListener('click', () => {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (start && end) {
      setDateRange('custom', start, end);
    }
  });
}

function setDateRange(range, startDate = null, endDate = null) {
  currentDateRange = range;
  const label = document.getElementById('dateRangeLabel');

  const labels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    'year': 'This Year',
    'custom': `${startDate} - ${endDate}`
  };

  label.textContent = labels[range];
  document.getElementById('datePickerDropdown').classList.remove('active');
  loadDashboardData();
}

// Load Data
async function loadDashboardData() {
  try {
    const response = await fetch(
      `${DASHBOARD_CONFIG.apiUrl}/dashboard?range=${currentDateRange}`
    );
    dashboardData = await response.json();
    updateDashboard(dashboardData);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

function updateDashboard(data) {
  // Update metrics
  document.getElementById('totalSessions').textContent =
    data.totals.sessions.toLocaleString();
  document.getElementById('totalCases').textContent =
    data.totals.cases_created.toLocaleString();
  document.getElementById('resolvedInApp').textContent =
    `${data.totals.resolution_rate}%`;
  document.getElementById('totalRefunds').textContent =
    `$${data.totals.total_refunds.toLocaleString()}`;

  // Update charts
  updateCharts(data);

  // Update table
  updateCasesTable(data.recent_cases);
}

// Export Functions
function exportCSV() {
  const headers = ['Case ID', 'Customer', 'Type', 'Resolution', 'Amount', 'Created', 'Status'];
  const rows = dashboardData.recent_cases.map(c => [
    c.case_id,
    c.customer_email,
    c.case_type,
    c.resolution,
    c.refund_amount || '-',
    c.created_at,
    c.status
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resolution-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

function printReport() {
  window.print();
}

// Charts (using lightweight chart library)
function initCharts() {
  // Initialize chart containers
  // Would use Chart.js or similar library
}

function updateCharts(data) {
  // Update all charts with new data
}

function updateCasesTable(cases) {
  const tbody = document.getElementById('casesTableBody');
  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><code>${c.case_id}</code></td>
      <td>${c.customer_email}</td>
      <td><span class="badge badge-${c.case_type}">${c.case_type}</span></td>
      <td>${c.resolution}</td>
      <td>${c.refund_amount ? '$' + c.refund_amount : '-'}</td>
      <td>${formatDate(c.created_at)}</td>
      <td><span class="status-badge ${c.status}">${c.status}</span></td>
    </tr>
  `).join('');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

### 3.5 Dashboard API Endpoint

```javascript
// In worker: /admin/api/dashboard
async function handleDashboard(request, env) {
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '7d';

  const { startDate, endDate } = getDateRange(range);

  // Query D1 database
  const stats = await env.ANALYTICS_DB.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(CASE WHEN resolved_in_app = 1 THEN 1 ELSE 0 END) as resolved_in_app
    FROM sessions
    WHERE started_at BETWEEN ? AND ?
  `).bind(startDate, endDate).first();

  const cases = await env.ANALYTICS_DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(refund_amount) as total_refunds,
      case_type,
      COUNT(*) as count
    FROM cases
    WHERE created_at BETWEEN ? AND ?
    GROUP BY case_type
  `).bind(startDate, endDate).all();

  const recentCases = await env.ANALYTICS_DB.prepare(`
    SELECT * FROM cases
    WHERE created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
    LIMIT 50
  `).bind(startDate, endDate).all();

  // Calculate resolution rate
  const resolutionRate = stats.total_sessions > 0
    ? Math.round((stats.resolved_in_app / stats.total_sessions) * 100)
    : 0;

  return new Response(JSON.stringify({
    totals: {
      sessions: stats.total_sessions,
      cases_created: cases.results.reduce((sum, c) => sum + c.count, 0),
      resolved_in_app: stats.resolved_in_app,
      resolution_rate: resolutionRate,
      total_refunds: cases.results.reduce((sum, c) => sum + (c.total_refunds || 0), 0)
    },
    by_type: cases.results,
    recent_cases: recentCases.results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function getDateRange(range) {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case '7d': start.setDate(end.getDate() - 7); break;
    case '30d': start.setDate(end.getDate() - 30); break;
    case '90d': start.setDate(end.getDate() - 90); break;
    case 'year': start = new Date(end.getFullYear(), 0, 1); break;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}
```

---

## Phase 4: Missing Frontend Flows
*(Unchanged)*

---

## Phase 5: Backend Enhancements
*(Unchanged)*

---

## REVISED IMPLEMENTATION ORDER

### Sprint 0: UI/UX Overhaul ✅ COMPLETE
1. ✅ Design system & CSS variables
2. ✅ **Home Screen / Welcome Screen** (hero, action cards, trust indicators)
3. ✅ Message bubbles with name/role
4. ✅ Button system redesign
5. ✅ Header redesign with persona indicator
6. ✅ Footer with brand logo
7. ✅ Form styling updates
8. ✅ Card and offer redesign
9. ✅ Animation enhancements
10. ✅ Character-by-character typing
11. ✅ **Progress indicator** (skeleton loading in CSS)
12. ✅ **Session recovery** (SessionManager added)
13. ✅ **Copy case ID functionality** (click-to-copy with visual feedback)
14. ✅ **Skeleton loading states**
15. ✅ **Confirmation dialogs** (for destructive actions like restart)
16. ✅ **Network status indicator** (NetworkStatus handler added)
17. ✅ **Accessibility enhancements** (screen reader announcer, focus-visible)
18. ✅ **End-of-session survey** (5-point emoji rating scale)
19. ✅ Mobile responsiveness polish

### Sprint 1: Policy & Validation ✅ COMPLETE
1. ✅ 90-day guarantee validation (backend API + frontend integration)
2. ✅ 10-hour fulfillment check (already in frontend, verified working)
3. ✅ ClickUp deduplication (backend API + frontend integration)

### Sprint 2: Analytics Foundation ✅ COMPLETE
1. ✅ D1 schema creation (schema.sql with sessions, events, cases, survey_responses, policy_blocks, admin_users)
2. ✅ Event logging (frontend Analytics module + backend API endpoints)
3. ✅ Dashboard endpoint (admin login, metrics, cases list, events log)

### Sprint 3: Richpanel Integration ✅ COMPLETE
1. ✅ Email creation (`createRichpanelTicket` - simulated customer email)
2. ✅ Private notes (`createRichpanelPrivateNote` - action steps for agents)
3. ✅ Test mode (`RICHPANEL_CONFIG.testMode` - routes all emails to test address)
4. ✅ ClickUp conversation URL update (auto-populates after Richpanel ticket created)
5. ✅ Frontend connected to backend (`submitCase` calls `/api/create-case`)

### Sprint 4: Frontend Flow Completion
1. Deep search
2. Phone formatting
3. Dynamic address fields
4. ParcelPanel branching
5. Investigation flows

### Sprint 5: Polish & Testing (1-2 days)
1. End-to-end testing
2. Cross-browser testing
3. Performance optimization

### Sprint 6: Code Organization & Maintainability ✅ COMPLETE
**Goal:** Make code easier to modify without touching core logic

**Approach:** Instead of separate files (which breaks Cloudflare Workers), we added clear "EASY CONFIG" sections at TOP of existing files.

1. ✅ **Backend Config (src/index.js top):**
   - `POLICY_CONFIG` - Guarantee days, fulfillment cutoff
   - `ADMIN_CONFIG` - Token secret, setup key, expiry
   - `PERSONA_PROMPTS` - Amy/Sarah/Claudia AI personalities
   - `PRODUCT_DOC_MAP` - Product to R2 file mapping

2. ✅ **Frontend Config (frontend/app.js top):**
   - `CONFIG` - API URL, policy constants
   - `PERSONAS` - Names, titles, avatars, colors
   - `MESSAGES` - Welcome, survey, error messages

3. ✅ **Code Updated to Use Configs**

**How to Modify:**
- Amy's AI personality → `PERSONA_PROMPTS.amy` in index.js
- Greeting messages → `MESSAGES.welcome` in app.js
- 90-day policy → `POLICY_CONFIG.guaranteeDays`

---

## Code Quality Guidelines

**IMPORTANT:** Always reference `CODING_GUIDELINES.md` before and after making changes.

Key rules:
- [ ] No duplicate code - search before writing
- [ ] No unused code - delete what's not used
- [ ] No conflicting code - check for name clashes
- [ ] Run syntax checks before committing
- [ ] Test all flows after changes

See `CODING_GUIDELINES.md` for complete checklist.

---

## Summary

**Total Completion: ~85%** (Updated 2025-12-31)

| Category | Status | Progress |
|----------|--------|----------|
| Frontend UI | ✅ Sprint 0 COMPLETE | 100% |
| Frontend Flows | In progress | 80% |
| Backend APIs | ✅ Sprint 1+2 COMPLETE | 95% |
| Analytics | ✅ Sprint 2 COMPLETE | 100% |
| Policy Logic | ✅ Sprint 1 COMPLETE | 100% |

**Sprint 0 (19/19 items):** ✅ COMPLETE
- ✅ Design system, Home Screen, Message bubbles, Buttons, Header, Footer
- ✅ Forms, Cards, Animations, Typing, Progress indicator, Session recovery
- ✅ Skeleton loading, Network status, Accessibility, Mobile responsiveness
- ✅ Copy case ID, Confirmation dialogs, End-of-session survey

**Sprint 1 (3/3 items):** ✅ COMPLETE
- ✅ 90-day guarantee validation (ParcelPanel + fallback)
- ✅ 10-hour fulfillment check
- ✅ ClickUp deduplication

**Sprint 2 (3/3 items):** ✅ COMPLETE
- ✅ D1 schema (schema.sql) with 6 tables: sessions, events, cases, survey_responses, policy_blocks, admin_users
- ✅ Frontend Analytics module with session/event/survey/policy-block logging
- ✅ Admin dashboard with login, metrics, cases table, events log

**Sprint 3 (5/5 items):** ✅ COMPLETE
- ✅ Email creation (`createRichpanelTicket` - simulated customer email)
- ✅ Private notes (`createRichpanelPrivateNote` with action steps)
- ✅ Test mode (`RICHPANEL_CONFIG.testMode` routes to test email)
- ✅ ClickUp conversation URL auto-populated
- ✅ Frontend `submitCase()` connected to backend

**Sprint 6 (3/3 items):** ✅ COMPLETE
- ✅ Backend config sections (POLICY_CONFIG, ADMIN_CONFIG, PERSONA_PROMPTS, PRODUCT_DOC_MAP)
- ✅ Frontend config sections (CONFIG, PERSONAS, MESSAGES)
- ✅ Code updated to use new configs

**Next Up: Sprint 4 - Frontend Flow Completion**
- Deep search, phone formatting, dynamic address fields
- ParcelPanel branching, investigation flows

---

## Assets Needed

- **Brand Logo:** https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041 ✅
- **Wisconsin Return Address:** STILL NEEDED
- **SOP Links:** STILL NEEDED (placeholders will be used)
