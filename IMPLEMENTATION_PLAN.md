# PuppyPad Resolution App V2 - Implementation Plan

## Executive Summary

After analyzing the current codebase against the detailed specification, this document outlines what's already implemented and what remains to be built. The app has a solid foundation with ~60% of core functionality complete, but several critical features are missing.

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

## What's Missing - Priority Order

### Phase 1: Critical Policy Logic (Backend + Frontend)

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

**Policy Block Message:**
> "I'm really sorry — based on the date we have, this is outside our 90-day guarantee, so I can't process a refund here."

#### 1.2 10-Hour Fulfillment Cutoff ❌ NOT IMPLEMENTED
**Why Critical:** Allows order changes before shipping.

**Required Changes:**
```
Frontend: app.js (handleHelpFlow)
- Already has basic check, needs enhancement
- If unfulfilled AND within 10 hours:
  - Show: "Your order hasn't shipped yet! Change or cancel?"
  - Options: Change order, Cancel order, Keep as is
- This is partially done but needs proper messaging
```

#### 1.3 ClickUp Deduplication ❌ NOT IMPLEMENTED
**Why Critical:** Prevents duplicate cases for same order.

**Required Changes:**
```
Backend: src/index.js
- Already has handleCheckCase function ✅
- Needs to be called from frontend before creating any case

Frontend: app.js
- Before createCase(), call /api/check-case
- If existingCase: true:
  - Show: "We already have an active case for this order (Case ID: X)"
  - Options: "Add more info to existing case" OR "View status"
  - If add more info → call addComment to existing task
```

### Phase 2: Richpanel Integration ❌ NOT IMPLEMENTED

#### 2.1 Customer Email Creation
**Required Changes:**
```
Backend: src/index.js - createRichpanelEntry()
- Currently just console.log placeholder
- Need actual Richpanel API integration:
  POST https://api.richpanel.com/v1/conversations
  - Create conversation with customer email as sender
  - Subject: "Resolution Request - {caseId}"
  - Body: Case details, selected items, resolution requested

API Format (need to research actual Richpanel API):
{
  "customer_email": "customer@example.com",
  "subject": "Resolution Request - REF-20250101120000",
  "message": "..."
}
```

#### 2.2 Private Note Creation
```
After creating email, add private internal note:
POST https://api.richpanel.com/v1/conversations/{id}/notes
{
  "note": "ACTION REQUIRED:\n- {resolution}\n- SOP: {sop_link}\n- Evidence: {evidence_urls}"
}
```

#### 2.3 Test Mode
```
If APP_ENV === 'staging':
  - Prefix subject with [TEST]
  - Maybe skip actual creation or use test Richpanel workspace
```

### Phase 3: Analytics Dashboard ❌ NOT IMPLEMENTED

#### 3.1 D1 Database Schema
**Required Tables:**
```sql
-- Create this in Cloudflare D1
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  path_selected TEXT,  -- 'track', 'subscription', 'help'
  resolved_in_app INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,  -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS cases (
  case_id TEXT PRIMARY KEY,
  session_id TEXT,
  case_type TEXT NOT NULL,  -- refund, return, shipping, subscription, manual
  list_id TEXT,
  order_number TEXT,
  customer_email TEXT,
  resolution TEXT,
  refund_amount REAL,
  resolved_in_app INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Views for dashboard
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT
  date(created_at) as date,
  COUNT(*) as total_cases,
  SUM(CASE WHEN resolved_in_app = 1 THEN 1 ELSE 0 END) as resolved_in_app,
  SUM(refund_amount) as total_refunds
FROM cases
GROUP BY date(created_at);
```

#### 3.2 Events to Log
```javascript
const ANALYTICS_EVENTS = {
  'session_started': { path_selected: null },
  'path_selected': { path: 'track|subscription|help' },
  'order_found': { order_count: number },
  'order_not_found': {},
  'intent_selected': { intent: string },
  'parcel_status_seen': { status: string, days_in_transit: number },
  'voice_note_played': {},
  'ai_response_sent': { persona: 'amy|claudia', product: string },
  'satisfied_yes': {},
  'satisfied_no': {},
  'ladder_step_offered': { step: number, percent: number, type: string },
  'ladder_step_accepted': { step: number, percent: number },
  'ladder_step_declined': { step: number, percent: number },
  'case_created': { case_type: string, list_name: string },
  'closed_no_action': { reason: string },
  'policy_block_90day': {}
};
```

#### 3.3 Dashboard Endpoint
```
GET /admin/dashboard
Returns:
{
  totals: {
    sessions: number,
    cases_created: number,
    resolved_in_app: number,
    resolution_rate: percent
  },
  by_path: {
    track: { sessions: n, cases: n },
    subscription: { sessions: n, cases: n },
    help: { sessions: n, cases: n }
  },
  by_intent: { ... },
  satisfaction: {
    yes: number,
    no: number,
    rate: percent
  },
  ladder_stats: {
    offered: number,
    accepted_at_step: { 1: n, 2: n, 3: n, 4: n },
    went_to_full: number
  },
  shipping_status_distribution: { ... }
}
```

### Phase 4: Missing Frontend Flows

#### 4.1 Character-by-Character Typing ❌ MISSING
**Current:** Shows full message after typing dots
**Required:** Type out message character by character

```javascript
// Replace addBotMessage typing simulation with actual char-by-char
async function addBotMessageCharByChar(text, persona) {
  // Show typing dots
  const typingDiv = showTypingIndicator(persona);
  await delay(500);
  typingDiv.remove();

  // Create message bubble
  const messageDiv = createMessageBubble(persona);
  const contentSpan = messageDiv.querySelector('.message-text');

  // Type character by character
  for (let i = 0; i < text.length; i++) {
    contentSpan.textContent += text[i];
    scrollToBottom();
    await delay(20 + Math.random() * 20); // 20-40ms per char
  }
}
```

#### 4.2 Deep Search Fallback ❌ INCOMPLETE
**Current:** Shows deep search form but doesn't do real search
**Required:**
```javascript
// In submitDeepSearch
async function submitDeepSearch(flowType) {
  // ... validation ...

  // Call API with all fields including contains match for address
  const response = await fetch(`${CONFIG.API_URL}/api/lookup-order`, {
    method: 'POST',
    body: JSON.stringify({
      email: state.customerData.email,
      phone: state.customerData.phone,
      firstName: state.customerData.firstName,
      lastName: state.customerData.lastName,
      address1: state.customerData.address1,  // Backend should use LIKE
      deepSearch: true
    })
  });

  // If still not found → show manual help form
}
```

#### 4.3 Not Found Form → ClickUp List ❌ NOT IMPLEMENTED
**Required:** New ClickUp list for manual help requests

```
List Name: "Manual Lookup Requests" (list ID from config)
Custom Fields:
- caseId: NF-{timestamp}
- emailAddress: customer email
- firstName: provided
- lastName: provided (if deep search)
- address1: provided (if deep search)
- orderNumber: provided (optional)
- issueDescription: what customer wrote
- desiredResolution: what they want

Task Description:
"Customer could not be found in system. Please manually locate and assist."
```

#### 4.4 Track My Order Flow ❌ INCOMPLETE
**Current:** Basic tracking display
**Required:**
- Proper validation (email + order number BOTH required)
- Order number format validation (#12345P)
- Jump to Help With Order if needed

```javascript
function renderTrackOrderForm() {
  // Email required
  // Order number required (not optional like help flow)
  // First name optional but recommended
}
```

#### 4.5 Phone Number Formatting ❌ MISSING
**Required:**
- Country code dropdown with flags
- Auto-format based on country (US: +1 (XXX) XXX-XXXX)
- Libraries: libphonenumber-js

```javascript
// Add to frontend
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';

function formatPhoneInput(input, countryCode) {
  const formatter = new AsYouType(countryCode);
  input.value = formatter.input(input.value);
}
```

#### 4.6 Dynamic Address Fields ❌ MISSING
**Required:**
- Based on country selection, show appropriate fields
- US: State dropdown, ZIP (5 digits)
- Canada: Province dropdown, Postal Code (A1A 1A1)
- UK: County, Postcode
- Australia: State dropdown, Postcode (4 digits)

#### 4.7 Not Received - Full ParcelPanel Branching ❌ INCOMPLETE
**Current:** Basic handling
**Required Full Flow:**

```
Status: delivered
  → "It shows delivered. Checked neighbors/safe spots?"
    → Yes, checked everywhere → Investigation flow (police/carrier)
    → Need time to check → Close, come back later
    → Found it! → Close successfully

Status: in_transit
  → Days < 6 → "Still in normal window, check back later"
  → Days >= 6 → Play Sarah voice note
  → Days >= 15 → Escalation options (reship or refund+reship ladder)

Status: exception / expired / failed_delivery
  → Explain what happened
  → Validate/correct address
  → Offer reship or refund ladder

Status: pickup
  → "Ready for pickup at [location]"
  → Provide pickup instructions
```

#### 4.8 Return Instructions - Full Details ❌ INCOMPLETE
**Current:** Basic address
**Required:**
```html
<div class="return-instructions">
  <h3>📦 Return Instructions</h3>

  <div class="return-address">
    <strong>Ship to:</strong><br>
    PuppyPad Returns<br>
    [ACTUAL WISCONSIN ADDRESS NEEDED]<br>
    Wisconsin, WI [ZIP]<br>
    USA
  </div>

  <div class="return-checklist">
    <strong>Include in your package (copy this):</strong>
    <div class="copyable-text" onclick="copyToClipboard(this)">
      Order Number: #78901P
      Customer Name: John Smith
      Items Returning:
      - PuppyPad Large Green (SKU: PP-LG-GRN) x 2
      - Stain Eliminator 16oz (SKU: SOE-16) x 1
      Number of items: 3
      Reason: Return for refund
    </div>
    <button onclick="copyReturnInfo()">📋 Copy to Clipboard</button>
  </div>

  <div class="return-note">
    ⚠️ <strong>Important:</strong> Reply to your confirmation email
    with the tracking number once shipped. We cannot process your
    refund until we receive the return.
  </div>

  <div class="return-shipping-note">
    Note: We're unable to provide a prepaid shipping label as this
    is part of our policy. We recommend using USPS Priority Mail
    for the best rates and tracking.
  </div>
</div>
```

#### 4.9 Investigation Flow (Missing Item / Delivered Not Received) ❌ MISSING
```javascript
async function handleInvestigation(type) {
  await addBotMessage(
    `Here's what we'll do next:\n\n` +
    `1. I'll notify our fulfillment team\n` +
    `2. They'll contact the shipping carrier\n` +
    `3. The carrier may review delivery photos\n` +
    `4. Your local police may be contacted for CCTV review\n\n` +
    `This usually takes 3-5 business days. Would you like to proceed?`
  );

  addOptions([
    { text: "Yes, please investigate", action: createInvestigationCase },
    { text: "Just reship my order", action: handleReship },
    { text: "I'd prefer a refund", action: startRefundLadder }
  ]);
}
```

### Phase 5: Backend Enhancements

#### 5.1 Session Management ❌ MISSING
```
POST /api/session/start
- Creates session ID
- Logs to D1
- Returns { sessionId }

POST /api/session/end
- Updates session end time
- Calculates duration
```

#### 5.2 Signed Upload URLs ❌ MISSING
```
POST /api/upload/sign
- Takes filename, content-type
- Returns signed R2 upload URL
- Frontend uploads directly to R2
- More secure than current approach
```

#### 5.3 Case ID Prefix Standardization
```javascript
const CASE_PREFIXES = {
  refund: 'REF',
  return: 'RET',
  shipping: 'SHP',
  subscription: 'SUB',
  manual: 'NF',  // "Not Found" / manual lookup
};
```

---

## Implementation Order (Recommended)

### Sprint 1: Policy & Validation (1-2 days)
1. 90-day guarantee validation (backend + frontend)
2. 10-hour fulfillment check enhancement
3. ClickUp deduplication (use existing endpoint)

### Sprint 2: Analytics Foundation (1 day)
1. D1 schema creation
2. Event logging throughout flows
3. Basic dashboard endpoint

### Sprint 3: Richpanel Integration (1-2 days)
1. Research Richpanel API docs
2. Implement email creation
3. Implement private notes
4. Test mode handling

### Sprint 4: Frontend Flow Completion (2-3 days)
1. Character-by-character typing
2. Phone formatting with country codes
3. Dynamic address fields
4. Full ParcelPanel status branching
5. Investigation flow
6. Enhanced return instructions

### Sprint 5: Polish & Testing (1-2 days)
1. End-to-end testing all flows
2. Mobile responsiveness check
3. Error handling improvements
4. Analytics dashboard UI

---

## Configuration Needed

### Environment Variables to Add
```
# Already defined in wrangler.json/secrets:
SHOPIFY_STORE
SHOPIFY_API_KEY
CC_API_USERNAME
CC_API_PASSWORD
PARCELPANEL_API_KEY
CLICKUP_API_KEY
OPENAI_API_KEY

# Need to add:
RICHPANEL_API_KEY
RICHPANEL_WORKSPACE_ID
APP_ENV=production  # or staging
```

### ClickUp Lists to Create/Verify
```javascript
const CLICKUP_LISTS = {
  refundRequests: '901518836463',      // ✅ Exists
  returnRequests: '901519002456',      // ✅ Exists
  shippingIssues: '901519012573',      // ✅ Exists
  subscriptionManagement: '901519256086',  // ✅ Exists
  manualHelp: '901519256097',          // ✅ Exists - for "not found" cases
};
```

### Wisconsin Return Address
```
NEEDS TO BE PROVIDED:
PuppyPad Returns
[Street Address]
[City], WI [ZIP]
USA
```

### SOP Links (Placeholders)
```
const SOP_LINKS = {
  changeAddress: '[SOP_LINK_PLACEHOLDER]',
  processRefund: '[SOP_LINK_PLACEHOLDER]',
  createReship: '[SOP_LINK_PLACEHOLDER]',
  handleReturn: '[SOP_LINK_PLACEHOLDER]',
  cancelSubscription: '[SOP_LINK_PLACEHOLDER]',
  pauseSubscription: '[SOP_LINK_PLACEHOLDER]',
};
```

---

## Summary

**Total Completion: ~60%**

| Category | Complete | Missing |
|----------|----------|---------|
| Frontend UI | 90% | Char-by-char typing, phone formatting |
| Frontend Flows | 70% | Deep search, investigation, some intents |
| Backend APIs | 80% | Richpanel, guarantee validation |
| Analytics | 20% | Schema, events, dashboard |
| Policy Logic | 40% | 90-day check, dedupe integration |

**Estimated Remaining Work: 7-10 days**

The app has a strong foundation. The priority should be:
1. Policy logic (guarantee, dedupe) - prevents bad outcomes
2. Richpanel integration - team can't act without it
3. Analytics - needed for tracking/reporting
4. Frontend polish - better UX but not blocking
