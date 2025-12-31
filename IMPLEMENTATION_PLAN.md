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

## IMPLEMENTATION FILES SUMMARY

### Files to Modify:

1. **frontend/index.html**
   - Add footer structure
   - Update header structure
   - Add meta viewport improvements
   - Link to updated CSS

2. **frontend/styles.css** (Complete Rewrite)
   - New design system variables
   - All component styles updated
   - Animations and transitions
   - Responsive improvements

3. **frontend/app.js**
   - Update message rendering with name/role
   - Add character-by-character typing
   - Update all button/option rendering
   - Add persona-specific styling
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
*(Unchanged)*

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

### Sprint 0: UI/UX Overhaul (2-3 days) ⭐ NEW FIRST PRIORITY
1. Design system & CSS variables
2. Message bubbles with name/role
3. Button system redesign
4. Header redesign with persona indicator
5. Footer with brand logo
6. Form styling updates
7. Card and offer redesign
8. Animation enhancements
9. Character-by-character typing
10. Mobile responsiveness polish

### Sprint 1: Policy & Validation (1-2 days)
1. 90-day guarantee validation
2. 10-hour fulfillment check
3. ClickUp deduplication

### Sprint 2: Analytics Foundation (1 day)
1. D1 schema creation
2. Event logging
3. Dashboard endpoint

### Sprint 3: Richpanel Integration (1-2 days)
1. Email creation
2. Private notes
3. Test mode

### Sprint 4: Frontend Flow Completion (2-3 days)
1. Deep search
2. Phone formatting
3. Dynamic address fields
4. ParcelPanel branching
5. Investigation flows

### Sprint 5: Polish & Testing (1-2 days)
1. End-to-end testing
2. Cross-browser testing
3. Performance optimization

---

## Summary

**Total Completion After UI Phase: ~65%**

| Category | Current | After UI Phase |
|----------|---------|----------------|
| Frontend UI | 50% | 95% |
| Frontend Flows | 70% | 75% |
| Backend APIs | 80% | 80% |
| Analytics | 20% | 20% |
| Policy Logic | 40% | 40% |

**Estimated Total Remaining Work: 10-13 days**
- UI Overhaul: 2-3 days
- Backend Features: 4-5 days
- Flow Completion: 2-3 days
- Testing: 1-2 days

---

## Assets Needed

- **Brand Logo:** https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041 ✅
- **Wisconsin Return Address:** STILL NEEDED
- **SOP Links:** STILL NEEDED (placeholders will be used)
