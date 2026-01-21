# Making Flow Documentation Future-Proof

## Current Problem

- `app.js` has flow logic with hardcoded messages (e.g., `handleDogNotUsing()`)
- `flow-docs.html` has hardcoded `FLOW_DATA` constant with same messages
- **Manual synchronization required** - easy to get out of sync

## Recommended Solution: Shared Flow Configuration

### Option 1: Extract to Shared Config File (RECOMMENDED)

Create `src/config/flows.js` with declarative flow definitions:

```javascript
export const FLOW_DEFINITIONS = {
  dog_not_using: {
    id: 'dog_not_using',
    name: 'Dog Not Using Product',
    nodes: [
      {
        id: 'msg1',
        type: 'message',
        persona: 'amy',
        content: "I understand — the main reason you purchased this was to solve your problem, and we want to make sure it works for you! 🐕<br><br>Let me get some details about your pup so we can help.",
        position: { x: 350, y: 150 }
      },
      // ... more nodes
    ]
  },
  // ... other flows
};
```

Then:
1. **app.js** imports and uses these definitions to generate UI
2. **flow-docs.html** imports and uses the same definitions for React Flow visualization
3. **Single source of truth** - update once, both update automatically

### Option 2: Build Script (Alternative)

Create a script that:
1. Parses `app.js` to extract flow logic, messages, forms
2. Generates `FLOW_DATA` constant for `flow-docs.html`
3. Runs automatically on build

### Option 3: Runtime Extraction (Advanced)

Have `flow-docs.html` fetch flow metadata from `app.js` at runtime, but this requires significant refactoring.

## Implementation Recommendation

**Start with Option 1** - it's the cleanest and most maintainable:
- Clear separation of concerns
- Type-safe (if using TypeScript)
- Easy to version control
- No parsing complexity

Would you like me to implement Option 1?
