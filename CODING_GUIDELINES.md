# PuppyPad Resolution App - Coding Guidelines

## Purpose
This document ensures code quality, consistency, and maintainability. **Always reference this before and after making changes.**

---

## Pre-Coding Checklist

Before writing ANY code, verify:

- [ ] Read related existing code first
- [ ] Understand the current file structure
- [ ] Check if similar functionality already exists
- [ ] Identify which files will be affected
- [ ] Plan where new code should live (don't create unnecessary files)

---

## QA Checklist (Run EVERY Time)

### After EVERY code change, verify:

#### 1. No Duplicate Code
- [ ] Search for similar function names across all files
- [ ] Check if the same logic exists elsewhere
- [ ] Consolidate repeated patterns into reusable functions

#### 2. No Unused Code
- [ ] Remove commented-out code blocks
- [ ] Delete unused imports/variables
- [ ] Remove functions that are never called
- [ ] Clean up console.log statements (except intentional logging)

#### 3. No Conflicting Code
- [ ] Check for duplicate function names
- [ ] Verify no conflicting event listeners
- [ ] Ensure CSS classes don't clash
- [ ] Confirm API endpoints don't overlap

#### 4. No Redundant Logic
- [ ] Avoid multiple API calls for the same data
- [ ] Don't store the same data in multiple places
- [ ] Remove unnecessary conditionals

#### 5. Syntax & Structure
- [ ] Run `node --check <file>` for JS files
- [ ] Verify all brackets/braces are properly closed
- [ ] Check for proper async/await usage

---

## File Structure & Organization

### Current Structure
```
puppypad-resolution-app/
├── src/
│   └── index.js          # Backend Worker (all API handlers)
├── frontend/
│   ├── index.html        # Main HTML
│   ├── app.js            # Frontend logic
│   └── styles.css        # Styles
├── schema.sql            # D1 database schema
├── wrangler.json         # Cloudflare config
├── IMPLEMENTATION_PLAN.md
└── CODING_GUIDELINES.md  # This file
```

### Configuration Sections (in index.js)
When modifying, find these clearly marked sections:

```javascript
// ============================================
// SECTION_NAME
// ============================================
```

| Section | Purpose | Lines (approx) |
|---------|---------|----------------|
| CLICKUP_CONFIG | ClickUp list IDs, field IDs | Top of file |
| SHOPIFY ORDER LOOKUP | Order fetching logic | ~200 |
| PARCEL PANEL TRACKING | Tracking API | ~320 |
| 90-DAY GUARANTEE | Policy validation | ~400 |
| CHECKOUTCHAMP SUBSCRIPTION | Subscription API | ~500 |
| CREATE CLICKUP CASE | Case creation | ~560 |
| AI RESPONSE | OpenAI prompts | ~800 |
| ANALYTICS API | Event/session logging | ~1000 |
| ADMIN AUTHENTICATION | Login/tokens | ~1100 |
| ADMIN DASHBOARD | Dashboard endpoints | ~1200 |

### Frontend Sections (in app.js)
| Section | Purpose |
|---------|---------|
| CONFIGURATION | API URLs, avatars, constants |
| ANALYTICS MODULE | Frontend analytics calls |
| STATE MANAGEMENT | App state object |
| HOME SCREEN | Welcome screen logic |
| MESSAGE FUNCTIONS | Bot/user message handling |
| TRACK ORDER FLOW | Tracking flow |
| SUBSCRIPTION FLOW | Subscription management |
| HELP WITH ORDER FLOW | Refund/return flows |

---

## Persona Messages & Prompts

### Modifying Amy/Sarah/Claudia Messages

**Location:** `frontend/app.js`

Search for these patterns:
- `addBotMessage("` - Bot messages
- `persona === 'amy'` - Persona-specific logic
- `persona === 'claudia'` - Claudia-specific logic
- `persona === 'sarah'` - Sarah-specific logic

### Modifying OpenAI Prompts

**Location:** `src/index.js`

Search for:
- `buildAmyPrompt` - Amy's AI personality
- `buildClaudiaPrompt` - Claudia's AI personality
- `systemPrompt` - System instructions

**Template:**
```javascript
function buildAmyPrompt(productDoc, context) {
  return `You are Amy from PuppyPad customer support...

  Your characteristics:
  - Warm and heartwarming tone
  - Use occasional emojis
  ...
  `;
}
```

---

## API Endpoint Conventions

### Naming Pattern
```
/api/{resource}           # Main resource
/api/{resource}/{action}  # Resource action
/admin/api/{resource}     # Protected admin endpoints
```

### Existing Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/lookup-order` | POST | Shopify order lookup |
| `/api/tracking` | POST | ParcelPanel tracking |
| `/api/validate-guarantee` | POST | 90-day check |
| `/api/subscription` | POST | CheckoutChamp sub |
| `/api/create-case` | POST | Create ClickUp case |
| `/api/check-case` | POST | Dedupe check |
| `/api/ai-response` | POST | AI message |
| `/api/analytics/*` | POST | Analytics logging |
| `/admin/api/*` | GET/POST | Admin dashboard |

**Before adding new endpoints:**
1. Check if existing endpoint can be extended
2. Follow naming convention
3. Add to this list

---

## State Management Rules

### Frontend State (`state` object in app.js)
- Single source of truth
- Don't duplicate state elsewhere
- Reset properly in `restartChat()`

### What goes in state:
```javascript
const state = {
  sessionId,        // Current session
  currentPersona,   // amy/sarah/claudia
  currentStep,      // Flow step
  customerData,     // Form inputs
  orders,           // Fetched orders
  selectedOrder,    // User selection
  selectedItems,    // Items for action
  // ... etc
};
```

**Rule:** If data needs to persist across functions, put it in state.

---

## Common Mistakes to Avoid

### 1. Duplicate Event Listeners
```javascript
// BAD - adds new listener each time
function showForm() {
  document.getElementById('btn').addEventListener('click', handleClick);
}

// GOOD - use onclick or check if listener exists
function showForm() {
  document.getElementById('btn').onclick = handleClick;
}
```

### 2. Floating Promises
```javascript
// BAD - unhandled promise
someAsyncFunction();

// GOOD - await or handle
await someAsyncFunction();
// or
someAsyncFunction().catch(console.error);
```

### 3. Hardcoded Values
```javascript
// BAD
if (days > 90) { ... }

// GOOD
const GUARANTEE_DAYS = 90;
if (days > GUARANTEE_DAYS) { ... }
```

### 4. Global Namespace Pollution
```javascript
// BAD - creates global
function myHelper() { ... }
window.myHelper = myHelper;

// Only expose to window if NEEDED for onclick handlers
```

---

## Testing Checklist

Before committing:

1. **Syntax Check**
   ```bash
   node --check src/index.js
   ```

2. **Manual Test Flows**
   - [ ] Home screen loads
   - [ ] Track order flow works
   - [ ] Subscription flow works
   - [ ] Help flow works
   - [ ] Admin dashboard loads
   - [ ] Analytics logs appear

3. **Check Console**
   - [ ] No JavaScript errors
   - [ ] No failed network requests
   - [ ] No CORS errors

---

## Git Commit Guidelines

### Commit Message Format
```
<type>: <short description>

<detailed description if needed>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure (no new features)
- `docs:` Documentation only
- `style:` Formatting, no logic change
- `chore:` Maintenance tasks

### Examples
```
feat: Add 90-day guarantee validation
fix: Remove extra closing brace causing build failure
refactor: Extract persona prompts to config section
```

---

## Quick Reference Commands

```bash
# Check JS syntax
node --check src/index.js
node --check frontend/app.js

# Search for duplicate functions
grep -r "function functionName" .

# Find unused variables (manual check)
grep -r "variableName" .

# Check git status
git status

# View recent changes
git diff
```

---

## When in Doubt

1. **Read the existing code first**
2. **Check if it already exists**
3. **Keep it simple**
4. **Test before committing**
5. **Update this document if adding new patterns**

---

*Last Updated: 2025-12-31*
