# Flow Documentation Sync Checklist

**IMPORTANT**: When updating messages, flows, or forms in the chat app (`app.js`), you MUST also update the Flow Documentation (`flow-docs.html`) to keep them in sync.

## Quick Checklist

Before committing changes to `app.js` that affect chat flows, check:

- [ ] **Message updates**: If you changed any message text in `app.js`, did you update the corresponding node in `flow-docs.html`?
- [ ] **Form changes**: If you modified form fields or labels in `app.js`, did you update the form node in `flow-docs.html`?
- [ ] **New flows**: If you added a new flow handler (e.g., `handleNewFlow()`), did you add it to `FLOW_DATA` in `flow-docs.html`?
- [ ] **Persona changes**: If you changed persona roles/titles in `app.js`, did you update the `personas` constant in `flow-docs.html`?
- [ ] **Options updates**: If you changed option buttons/labels, did you update the options node in `flow-docs.html`?

## Common Sync Scenarios

### Scenario 1: Updating a Message

**In `app.js`:**
```javascript
async function handleDogNotUsing() {
  await addBotMessage("NEW MESSAGE TEXT HERE 🐕<br><br>More text...");
}
```

**Action Required:**
1. Find the corresponding node in `flow-docs.html` → Search for `dog_not_using` in `FLOW_DATA`
2. Update the `content` field in the message node:
   ```javascript
   { id: 'msg1', type: 'message', data: { 
     persona: 'amy', 
     content: "NEW MESSAGE TEXT HERE 🐕<br><br>More text..." 
   } }
   ```

### Scenario 2: Adding a New Flow

**In `app.js`:**
```javascript
async function handleNewIssue() {
  await addBotMessage("Welcome message");
  // ... flow logic
}
```

**Action Required:**
1. Add the new flow to `FLOW_DATA.subflows` in `flow-docs.html`
2. Create all nodes (messages, forms, options, etc.)
3. Add edges connecting the nodes
4. If it's a top-level flow, add to `parentFlows` instead

### Scenario 3: Changing Form Fields

**In `app.js`:**
```javascript
function renderSomeForm() {
  // ... form HTML with new field
  <input type="text" placeholder="New Field">
}
```

**Action Required:**
1. Find the form node in `flow-docs.html` → Search for `formType: 'Some Form'`
2. Update the `fields` array in the node data:
   ```javascript
   { id: 'form1', type: 'form', data: { 
     formType: 'Some Form',
     fields: ['existingField', 'newField']  // Add new field
   } }
   ```
3. Check if `renderForm()` in `flow-docs.html` needs a specific handler for this form type

### Scenario 4: Updating Persona Information

**In `app.js`:**
```javascript
const PERSONAS = {
  amy: {
    role: 'New Role Title',  // Changed from 'Customer Support'
  }
};
```

**Action Required:**
1. Update the `personas` constant in `flow-docs.html` (around line 1593):
   ```javascript
   const personas = {
     amy: { 
       name: 'Amy', 
       role: 'New Role Title',  // Must match app.js
       avatar: '...',
       color: '#3b82f6' 
     }
   };
   ```

## How to Find Corresponding Code

### Finding Messages in `flow-docs.html`

1. **Search by function name**: If `app.js` has `handleDogNotUsing()`, search for `dog_not_using` or `dog not using` in `flow-docs.html`
2. **Search by message text**: Copy part of the message text and search in `flow-docs.html`
3. **Use FLOW_DATA structure**: Flow definitions are in the `FLOW_DATA` constant starting around line 251

### Finding Forms in `flow-docs.html`

1. **Search by formType**: Forms use `formType` field (e.g., `'Customer Lookup'`, `'Deep Search'`, `'Dog Info Form'`)
2. **Search by render function**: If `app.js` has `renderSomeForm()`, search for that form type

## Testing After Sync

After updating `flow-docs.html`, verify:

1. **Open Flow Documentation**: Go to `/hub/flow-docs.html`
2. **Select the flow**: Click on the flow you modified
3. **Click nodes**: Open each modified node in the simulator
4. **Verify simulator**: Check that messages, forms, and options match `app.js` exactly
5. **Check all personas**: Verify persona names and roles match

## Quick Reference: Key Locations

| Item | `app.js` Location | `flow-docs.html` Location |
|------|------------------|---------------------------|
| Welcome messages | `MESSAGES.welcome` (line ~51) | Entry flow `msg1` node (line ~262) |
| Persona roles | `PERSONAS` (line ~26) | `personas` constant (line ~1593) |
| Flow handlers | `handleDogNotUsing()` etc. | `FLOW_DATA.subflows.dog_not_using` (line ~362) |
| Form rendering | `renderSomeForm()` functions | `renderForm()` in simulator (line ~1705) |
| Option buttons | `showIntentOptions()` etc. | Options nodes with `options` array |

## Reminder

**Always test both:**
- ✅ Chat app (`/`) - Verify functionality works
- ✅ Flow docs (`/hub/flow-docs.html`) - Verify simulator matches chat app

If you forget to sync, the simulator will show outdated information, which can confuse team members reviewing flows!
