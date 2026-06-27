# Trigger Context Structure Issue

## Problem Discovered

We found that triggers return `matched: false` when run through `gsc rules execute`, but work correctly when run directly with `node trigger.mjs < context.json`.

## Root Cause

The gsc developer confirmed that `gsc rules execute` **transforms** the context before passing it to triggers. The key difference:

**What we provide (V1ExecutionContext):**
```json
{
  "payload": {
    "toolCall": {
      "file": "/path/to/file",
      "action": "edit"
    }
  }
}
```

**What the trigger actually receives (V1TriggerContext):**
```json
{
  "toolCall": {
    "file": "/path/to/file",
    "action": "edit"
  },
  "payload": {
    "prompt": { ... },
    "toolResult": { ... }
    // toolCall is NOT here
  }
}
```

## The Issue in Our Triggers

All triggers currently check:
```javascript
const file = context.payload?.toolCall?.file || '';
```

But they should check:
```javascript
const file = context.toolCall?.file || '';
```

## Decision Needed

We need to decide:

### Option A: Update Triggers Only
- Change all triggers to use `context.toolCall?.file`
- Keep pi-brains types as-is (incorrect)
- Quick fix, but types don't match reality

### Option B: Update Triggers + pi-brains Types
- Change all triggers to use `context.toolCall?.file`
- Update `V1TriggerContext` in `pi-brains/extensions/pi-brains/rules/types.ts`
- Types match gsc behavior
- More work, but correct

### Option C: Update gsc (Not Recommended)
- Change gsc to put toolCall in payload
- Breaking change for existing triggers
- gsc is source of truth, shouldn't change

## Recommendation

**Option B** is correct. The pi-brains TypeScript types should match what gsc actually does. The types are wrong, not gsc.

## Questions for Your Feedback

1. Should we update the types in pi-brains to match gsc's actual behavior?
2. Are there any existing triggers in pi-brains that already use the correct structure?
3. Should we add a compatibility layer that checks both locations?

## Files Affected

- `pi-brains/extensions/pi-brains/rules/types.ts` - V1TriggerContext type definition
- `pi-brains/extensions/pi-brains/rules/engine.ts` - Context building logic
- `gsc-trigger-test/.gitsense/rules/triggers/*.mjs` - All trigger scripts
- `pi-brains/test/rules.test.ts` - Test fixtures
