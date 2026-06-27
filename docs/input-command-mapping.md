# Input Command Mapping

This document explains how to use `gsc rules` to intercept user input and provide guidance.

## Overview

Pi has specific commands like `/quit`, `/new`, `/model`, etc. Users coming from other agents might type common alternatives like `exit`, `quit`, `new`, etc. Using `gsc rules`, you can intercept these inputs and provide helpful guidance.

## Example: Exit Command

When a user types `exit`, instead of sending it to the LLM (which would be confused), intercept it and show:

```
Pi uses /quit to exit. Type /quit or press Ctrl+D.
```

## Implementation

### Rule Configuration

```json
{
  "event": "user_prompt_submit",
  "action": "prompt",
  "matches": "^\\s*exit\\s*$",
  "type": "tool-trigger"
}
```

### Trigger Script

```javascript
// .gitsense/rules/triggers/exit-alias-notice.mjs
const context = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));

const text = context.payload?.prompt?.text || '';

if (/^\s*exit\s*$/.test(text)) {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    notice: "Pi uses /quit to exit. Type /quit or press Ctrl+D."
  }));
} else {
  console.log(JSON.stringify({ matched: false, block: false }));
}
```

## How It Works

1. User types `exit`
2. pi-brains evaluates `user_prompt_submit` rules
3. Trigger matches the input
4. Trigger returns `{ block: true, notice: "..." }`
5. pi-brains shows the notice
6. pi-brains returns `{ action: "handled" }` to Pi
7. No user message is appended
8. No chat completion runs

## Other Useful Mappings

| Input | Guidance |
|-------|----------|
| `exit` | Pi uses /quit to exit. Type /quit or press Ctrl+D. |
| `quit` | Pi uses /quit to exit. Type /quit or press Ctrl+D. |
| `clear` | Pi uses /new for a new session. Type /new or press Ctrl+N. |
| `reset` | Pi uses /new for a new session. Type /new or press Ctrl+N. |
| `help` | Type /help to see available commands. |
| `?` | Type /help to see available commands. |

## Testing

### Direct CLI Test

```bash
# Test with gsc rules execute
gsc rules execute \
  --context .gitsense/rules/fixtures/prompt-submit-context.json \
  --rules <(gsc rules get --event user_prompt_submit --action prompt --format rules-json)
```

### Pi Live Test

Type `exit` in Pi. You should see the notice and no LLM response.

## Limitations

- pi-brains must pass prompt text to `gsc rules get --prompt` for pattern matching
- Currently, prompt text may not be passed, so direct CLI testing may be more reliable
- Pattern matching uses JavaScript regex syntax

## Security Considerations

This feature is for **command guidance**, not security blocking. It helps users learn Pi's command syntax.

For actual security restrictions (e.g., blocking destructive commands), use separate rules with appropriate glob patterns and trigger logic.
