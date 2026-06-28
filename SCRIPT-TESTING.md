# SCRIPT-TESTING.md

CLI test scenarios for the `gsc rules` system. For TUI testing with Pi, see [TUI-TESTING.md](TUI-TESTING.md).

## Scenario Matrix

| # | Scenario | Command/Prompt | Expected gsc Match | Expected Pi Behavior | Status | Notes |
|---|----------|----------------|-------------------|---------------------|--------|-------|
| 1 | Declarative read block | `read data/accounting/q1.ledger` | Rule matches `data/accounting/**` | Block with instructions | ✅ Supported | Core case |
| 2 | Executable edit/write block | `edit config/production.env` | Trigger matches `config/**` | Block with trigger message | ✅ Supported | Core case |
| 3 | Notice-only (no block) | `edit src/generated/types.ts` | Trigger matches `src/**/generated/**` | Warning notice, no block | ✅ Supported | Core case |
| 4 | Multi-rule match | `.github/workflows/deploy.yml` edit | Multiple rules match | Block with both reasons | ✅ Supported | Best matched-rule packet proof |
| 5 | Prompt interception (exit) | Type `exit` | Trigger matches `^\s*exit\s*$` | Notice + input consumed | ⚠️ CLI first | Pi may not pass prompt text yet |
| 6 | Parallel execution | `edit src/parallel/checkout.ts` | 3 triggers match | All 3 notices, ~1s | ✅ Supported | CLI timing proof preferred |
| 7 | Priority ordering | `edit src/priority/overlap.ts` | Multiple rules, different priorities | Priority ordering respected | ✅ Supported | Verify in matchedRules output |
| 8 | Frequency modes | `read src/frequency/repeated-read.txt` | Trigger with frequency=once | First read triggers, subsequent skip | ⚠️ CLI first | Old delivery tracker not active path |
| 9 | Error handling | `read src/errors/broken-trigger-target.txt` | Error-throwing trigger | Fail-open, no block | ✅ Supported | Error logged |
| 10 | canBlock=false | Direct fixture test | Trigger with canBlock=false | Block forced to notice | ❌ CLI only | Pi sets canBlock=true for pre_tool_use |
| 11 | AI provenance ledger | `edit third_party/vendor-widget.js` | post_tool_use trigger appends ledger entry; agent_end verifies completion | Warning notice plus passive next-turn guidance if pending | ⚠️ Review scenario | Demonstrates stateful triggers without follow-up loops |

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Supported | Works in both Pi and direct CLI |
| ⚠️ CLI First | Test via `gsc rules execute`; Pi integration pending |
| ❌ CLI Only | Direct execution only; Pi doesn't support this lifecycle/capability |

## Running Tests

### 1. Declarative Read Block

**Command:**
```bash
read data/accounting/q1.ledger
```

**Expected behavior:**
- First read: Blocks with instructions about pipe-delimited format
- Instructions include: `gsc query --file data/accounting/q1.ledger --topic accounting`
- Subsequent reads: May skip if delivery tracking is active

**Verify:**
```bash
gsc rules get --event pre_tool_use --action read --file data/accounting/q1.ledger
```

### 2. Executable Edit/Write Block

**Command:**
```bash
edit config/production.env
```

**Expected behavior:**
- Blocks with message about deployment approval requirement
- Message includes DevOps team approval process

**Verify:**
```bash
gsc rules get --event pre_tool_use --action edit --file config/production.env
```

### 3. Notice-Only (No Block)

**Command:**
```bash
edit src/generated/types.ts
```

**Expected behavior:**
- Shows warning notice about auto-generated file
- Does NOT block the edit
- Notice includes guidance about editing source schema

**Verify:**
```bash
gsc rules get --event pre_tool_use --action edit --file src/generated/types.ts
```

### 4. Multi-Rule Match

**Command:**
```bash
edit .github/workflows/deploy.yml
```

**Expected behavior:**
- Blocks with reason that includes BOTH:
  - Declarative instruction about deployment workflows
  - Executable trigger message about DevOps approval
- Both rules appear in the matched-rule packet

**Verify:**
```bash
gsc rules get --event pre_tool_use --action edit --file .github/workflows/deploy.yml
```

### 5. Prompt Interception (Exit)

**Command:**
Type `exit` in Pi

**Expected behavior:**
- Shows notice: "Pi uses /quit to exit. Type /quit or press Ctrl+D."
- Input is consumed (not sent to LLM)
- No chat completion runs

**Direct CLI test:**
```bash
gsc rules execute \
  --context .gitsense/rules/fixtures/prompt-submit-context.json \
  --rules <(gsc rules get --event user_prompt_submit --action prompt --format rules-json)
```

**Limitation:** pi-brains may not pass prompt text to `gsc rules get --prompt` yet.

### 6. Parallel Execution

**Command:**
```bash
edit src/parallel/checkout.ts
```

**Expected behavior:**
- All 3 triggers execute
- All 3 notices are shown
- Total time ~1 second (not ~3 seconds)

**CLI timing proof:**
```bash
./scripts/test-parallel-execute.sh
```

**Expected:**
- `-j 1`: ~3 seconds
- `-j 3`: ~1 second

### 7. Priority Ordering

**Command:**
```bash
edit src/priority/overlap.ts
```

**Expected behavior:**
- Multiple rules match
- Rules appear in priority order in matched-rule packet
- Higher priority rules listed first

**Verify:**
```bash
gsc rules get --event pre_tool_use --action edit --file src/priority/overlap.ts
```

### 8. Frequency Modes

**Command:**
```bash
read src/frequency/repeated-read.txt
# Then read again
read src/frequency/repeated-read.txt
```

**Expected behavior:**
- First read: Trigger fires
- Second read: Trigger may skip (if frequency=once)

**Direct CLI test:**
```bash
# First run
gsc rules execute \
  --context <context-with-frequency-trigger> \
  --rules <rules>

# Second run - should show trigger skipped
gsc rules execute \
  --context <context-with-frequency-trigger> \
  --rules <rules>
```

### 9. Error Handling

**Command:**
```bash
read src/errors/broken-trigger-target.txt
```

**Expected behavior:**
- Trigger throws error (or returns invalid JSON)
- No block (fail-open)
- Error is logged/diagnosed

**Verify:**
```bash
gsc rules get --event pre_tool_use --action read --file src/errors/broken-trigger-target.txt
```

### 10. canBlock=false

**Direct CLI test only** (Pi sets canBlock=true for pre_tool_use)

```bash
gsc rules execute \
  --context .gitsense/rules/fixtures/can-block-false-context.json \
  --rules <rules-with-blocking-trigger>
```

**Expected behavior:**
- Trigger returns block=true
- Since canBlock=false, block is forced to notice
- Action proceeds, notice is shown

### 11. AI Provenance Ledger

**Command:**
```bash
edit third_party/vendor-widget.js
```

**Expected behavior:**
- After a successful edit/write, `.gitsense/ai-provenance.jsonl` is created if needed
- A pending JSONL entry is appended with timestamp, session id, leaf id, tool call id, file path, action, model, and file hash
- If a pending entry already exists for the same session and file, the post-tool trigger stays quiet instead of appending duplicates
- The trigger sends a passive steering message asking the agent to replace the TODO summary and set `status` to `"complete"`
- At `agent_end`, completed entries produce an info notice
- At `agent_end`, unresolved entries produce a warning notice and `passiveSteer` guidance for the next real user turn
- The `agent_end` trigger must not use `followUp`, so it cannot create a self-waking reminder loop

**Direct CLI test:**
```bash
gsc rules execute \
  --context .gitsense/rules/fixtures/third-party-edit-context.json \
  --rules <(gsc rules get --event post_tool_use --action edit --file third_party/vendor-widget.js --format rules-json)

gsc rules execute \
  --context .gitsense/rules/fixtures/agent-end-context.json \
  --rules <(gsc rules get --event agent_end --action agent_end --format rules-json)
```

## Creating New Test Scenarios

### Adding a New File

1. Create the file in the appropriate directory
2. Create a trigger script in `.gitsense/rules/triggers/`
3. Create a rule (via `gsc rules new` or fixture file)
4. Document in this file

### Trigger Script Template

**Important:** `gsc rules execute` transforms the context before passing it to triggers. The `toolCall` field is at the **top level**, not inside `payload`. Use this pattern for compatibility:

```javascript
import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

// toolCall is at top level in gsc, but may be in payload for direct testing
const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';
const action = toolCall.action || toolCall.toolName || '';

// Match logic
if (!file.includes('your-pattern')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Response
console.log(JSON.stringify({
  matched: true,
  block: true,  // or false for notice-only
  message: "Your message here"  // or notice for notice-only
}));
```

### Fixture Template

```json
{
  "version": "1",
  "debug": false,
  "event": {
    "name": "pre_tool_use",
    "runtime": "pi",
    "runtimeEvent": "tool_call"
  },
  "capabilities": {
    "canBlock": true,
    "canAddContext": true,
    "canModifyInput": false,
    "canModifyOutput": false
  },
  "session": {
    "id": "test-session",
    "path": "/tmp/test.jsonl",
    "cwd": "/Users/terrchen/gsc-trigger-test"
  },
  "conversation": {
    "leafId": "leaf-1",
    "messageIds": ["msg-1"]
  },
  "payload": {
    "toolCall": {
      "id": "call-test",
      "toolName": "read",
      "action": "read",
      "file": "/path/to/file",
      "command": null,
      "input": { "path": "relative/path" }
    }
  },
  "repo": {
    "root": "/Users/terrchen/gsc-trigger-test",
    "normalizedFile": "relative/path"
  },
  "rule": {
    "id": "test-rule",
    "summary": "Test rule",
    "type": "tool-trigger",
    "ruleHash": "sha256:test",
    "triggerHash": "sha256:test-trigger",
    "event": "pre_tool_use"
  }
}
```

## Troubleshooting

### Trigger not firing

1. Check rule matches the file/action
2. Verify trigger script is in `.gitsense/rules/triggers/`
3. Test trigger directly: `echo '{"payload":{}}' | node trigger.mjs`
4. Check gsc rules get returns the rule

### Pi not blocking

1. Verify rules are enabled: `/brains rules on`
2. Check debug mode: `/brains debug on`
3. Verify gsc is available: `/brains`
4. Check trigger returns `{ block: true }`

### Parallel execution not working

1. Verify triggers are independent
2. Check `-j` flag value
3. Ensure triggers sleep long enough to measure (~1000ms)
4. Use `time` command for timing

## References

- [Parallel Execution](docs/parallel-execution.md)
- [Input Command Mapping](docs/input-command-mapping.md)
- [pi-brains Extension](~/pi-brains)
- [GitSense CLI](https://github.com/gitsense/gsc-cli)
