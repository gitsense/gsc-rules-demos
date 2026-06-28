# Pi Rules Tutorial

Step-by-step guide for understanding and using GitSense rules in Pi.

## Setup

```bash
cd ~/gsc-trigger-test
pi
```

Once Pi starts (optional - enable debug logging):
```
/brains debug on
```

**Note:** Rules are enabled by default. No need to run `/brains rules on`.

---

## Example 1: Prompt Interception (Start Here!)

**Why this example first:** Simplest rule to understand - demonstrates how rules can intercept user input before it reaches the AI.

**Rule ID:** `019f0722-cd4b-76a1-b43a-5bd8a23c9359`
**Rule type:** Executable trigger
**Event:** `user_prompt_submit` (fires when you type a prompt, not when the AI calls a tool)
**Frequency:** Always (runs every time)

**Explore the rule:**
```bash
gsc rules show 019f0722-cd4b --format json
```

Or ask the agent: "show me rule 019f0722-cd4b"

**Prompt:**
```
exit
```

**Expected output:**
```
Warning: Input intercepted: 'exit' is not a valid Pi command. Use /quit or Ctrl+D.

To learn more about this rule, ask the agent: "show me rule 019f0722-cd4b --format json"
Or run: gsc rules show 019f0722-cd4b --format json

To add more command aliases (like "clear" or "ls"), simply ask the AI to update the rules.
```

**What happened:** The rule intercepted your input before it reached the AI. No LLM response was generated - the input was consumed and replaced with guidance.

**Try it yourself:** Ask the agent to add more command aliases:
```
add a rule that intercepts "clear" and shows a message to use /clear instead
```

---

## Example 2: Declarative Rules (Instructions)

**What you'll learn:** How declarative rules deliver instructions the first time, then get out of the way.

**Rule ID:** `019f097d-9091-7e89-a871-aa786b7c4a0b`
**Rule type:** Declarative (instruction-only)
**Event:** `pre_tool_use` (fires when read tool executes, not when prompt is typed)
**Frequency:** Once per rule hash (default for declarative rules)

**Explore the rule:**
```bash
gsc rules show 019f097d-9091 --format json
```

**Prompt:**
```
read data/accounting/q1.ledger
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `read` tool)
3. **Block happens when Pi tries to execute the read**
4. Message includes: "This is a pipe-delimited accounting ledger"
5. Instructions mention: "Check if there are relevant notes for this file"

**Important:** The block occurs at tool execution time, not at prompt time. You'll see Pi start to process, then get blocked when it tries to actually read the file.

**Try the same prompt again:**
```
read data/accounting/q1.ledger
```

**Expected:** Second read succeeds immediately (no block). Why? Declarative rules use once-per-rule-hash delivery tracking. After the instructions are delivered once, pi-brains remembers the rule hash and skips the block on subsequent reads.

---

## Example 3: Notice-Only (Warning Without Blocking)

**What you'll learn:** How triggers can warn without blocking - useful for advisory information.

**Rule ID:** `019f0721-044b-70bc-8719-318fa6adcd73`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Explore the rule:**
```bash
gsc rules show 019f0721-044b --format json
```

**Prompt:**
```
edit src/generated/types.ts to add a nickname field to User interface for testing the auto-generated file warning
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Notice appears when Pi tries to execute the edit**
4. Warning: "WARNING: You are editing an auto-generated file"
5. Edit proceeds (not blocked)

**Key difference from Example 2:** This trigger returns `block: false` with a `notice`, so the action continues after showing the warning.

---

## Example 4: Executable Edit Block (with Environment Variable Bypass)

**What you'll learn:** How to create safety guards with escape hatches for authorized users.

**Rule ID:** `019f0940-0155-742c-9bf0-7b0baf22b9c9`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Explore the rule:**
```bash
gsc rules show 019f0940-0155 --format json
```

### Part A: Without approval (should block)

**Setup:** Make sure the environment variable is NOT set:
```bash
unset AI_CONFIG_EDIT_APPROVED
```

Start Pi:
```bash
pi
```

**Prompt:**
```
edit config/production.env to change APP_PORT to 9090
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Block happens when Pi tries to execute the edit**
4. Message includes: "CONFIG FILE GUARD"
5. Message mentions: "Production configuration changes require deployment approval"
6. Message includes instructions to set `AI_CONFIG_EDIT_APPROVED=true`

### Part B: With approval (should allow with notice)

**Setup:** Exit Pi (type `/quit`), then set the environment variable and restart:
```bash
export AI_CONFIG_EDIT_APPROVED=true
pi
```

**Prompt:**
```
edit config/production.env to change APP_PORT to 9090
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Edit proceeds (not blocked)**
4. Notice appears: "CONFIG FILE GUARD: Override detected (AI_CONFIG_EDIT_APPROVED=true)"
5. Edit completes successfully

**Cleanup:** After testing, unset the variable:
```bash
unset AI_CONFIG_EDIT_APPROVED
```

---

## Example 5: Multi-Rule Match

**What you'll learn:** Multiple rules can match the same file - they're all delivered together.

**Rule IDs:**
- `019f0721-69af-7f7b-9cbd-6bf4ddd2e563` (declarative)
- `019f0721-8839-7487-837e-7a6abf082e66` (executable)

**Rule types:** Declarative + Executable
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Explore the rules:**
```bash
gsc rules show 019f0721-69af --format json
gsc rules show 019f0721-8839 --format json
```

**Prompt:**
```
edit .github/workflows/deploy.yml to add a step that logs the deployment timestamp
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Block happens when Pi tries to execute the edit**
4. Message includes BOTH:
   - "Deployment workflow changes require DevOps team review" (declarative)
   - "DEPLOYMENT WORKFLOW GUARD" (executable trigger)
5. Both rules appear in the matched-rule packet

---

## Example 6: Parallel Execution

**What you'll learn:** Multiple triggers can run concurrently - useful for independent checks.

**Rule IDs:**
- `019f0721-e0f9-7d47-80dd-96980e10a2b4` (trigger A)
- `019f0722-0767-7c38-a6f8-6c3df77dabb9` (trigger B)
- `019f0722-2030-7a7a-ba6e-d8a75ac9cb51` (trigger C)

**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Explore the rules:**
```bash
gsc rules show 019f0721-e0f9 --format json
gsc rules show 019f0722-0767 --format json
gsc rules show 019f0722-2030 --format json
```

**Prompt:**
```
edit src/parallel/checkout.ts to add a discount field
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Notices appear when Pi tries to execute the edit**
4. Three notices appear (order may vary):
   - "parallel-slow-a completed (501ms actual, 500ms target)"
   - "parallel-slow-b completed (1002ms actual, 1000ms target)"
   - "parallel-slow-c completed (1501ms actual, 1500ms target)"
5. Edit proceeds after all three notices

**Note:** The triggers have different sleep times (500ms, 1000ms, 1500ms), but they run in parallel so total time is ~1500ms (the longest), not 3000ms (the sum). You can verify this with `gsc rules execute` which returns `durationMs` for the total execution time.

---

## Example 7: Priority Ordering

**What you'll learn:** When multiple declarative rules match, they're delivered in priority order.

**Rule IDs:**
- `019f0723-735f-72bb-a9b4-34f6a73ad89c` (high, priority 100)
- `019f0723-5d51-7c30-8c6b-b8ccdb0a2cfd` (medium, priority 50)
- `019f0723-4090-7641-8fd9-5303f66b5a44` (low, priority 10)

**Rule type:** Declarative
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Once per rule hash

**Explore the rules:**
```bash
gsc rules show 019f0723-735f --format json
gsc rules show 019f0723-5d51 --format json
gsc rules show 019f0723-4090 --format json
```

**Prompt:**
```
edit src/priority/overlap.ts to add a cloneConfig function that returns a deep copy of a Config object
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Instructions appear when Pi tries to execute the edit**
4. Three instructions appear in priority order:
   - "This is a high priority instruction."
   - "This is a medium priority instruction."
   - "This is a low priority instruction."

---

## Example 8: Frequency Modes

**What you'll learn:** Triggers can be configured to run once (like declarative rules) or every time.

**Rule ID:** `019f073b-cc8c-7a61-8c94-b7d7b45ec396`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when read tool executes)
**Frequency:** Once per rule hash

**Explore the rule:**
```bash
gsc rules show 019f073b-cc8c --format json
```

**Prompt:**
```
read src/frequency/repeated-read.txt
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `read` tool)
3. **Notice appears when Pi tries to execute the read**
4. Notice: "Frequency test trigger executed for: src/frequency/repeated-read.txt"

**Try the same prompt again:**
```
read src/frequency/repeated-read.txt
```

**Expected:** Notice should NOT appear again (because frequency is `once-per-rule-hash`).

---

## Example 9: Error Handling (Fail-Open)

**What you'll learn:** Broken triggers don't block legitimate work - the system fails open.

**Rule IDs:**
- `019f0722-5c8c-74c3-a9b4-ff172d4d845e` (throws error)
- `019f0722-795b-78b7-aa51-b68f95a12e9e` (invalid JSON)
- `019f0722-99ac-72a8-9a97-694b3822e8a3` (timeout)

**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when read tool executes)
**Frequency:** Always (runs every time)

**Explore the rules:**
```bash
gsc rules show 019f0722-5c8c --format json
gsc rules show 019f0722-795b --format json
gsc rules show 019f0722-99ac --format json
```

**Prompt:**
```
read src/errors/broken-trigger-target.txt
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `read` tool)
3. **Read succeeds (not blocked)** - triggers fail open
4. Warning notices appear for each failed trigger:
   - `Trigger error (rule_019f0722-5c8c...): Intentional error for testing... - Action proceeding (fail-open)`
   - `Trigger error (rule_019f0722-795b...): Unexpected token... - Action proceeding (fail-open)`
   - `Trigger error (rule_019f0722-99ac...): Trigger timed out after 5000ms - Action proceeding (fail-open)`
5. Debug log shows full error details

**Why this matters:** If a trigger has a bug, it shouldn't prevent developers from working. The system is designed to be resilient. Error notices help you identify and fix broken triggers without blocking work.

---

## Example 10: AI Provenance Tracking

**What you'll learn:** How to track AI-authored changes to third-party code for audit purposes.

**Rule IDs:**
- `019f094d-6a10-7dfb-a76a-f11b9360a501` (post_tool_use)
- `019f094d-8ec0-7f31-9791-a63b697a9381` (agent_end)

**Rule type:** Executable trigger
**Events:** `post_tool_use` (records the edit) and `agent_end` (verifies completion)
**Frequency:** Always (runs every time)

**Explore the rules:**
```bash
gsc rules show 019f094d-6a10 --format json
gsc rules show 019f094d-8ec0 --format json
```

**Prompt:**
```
edit third_party/vendor-widget.js to add input validation to the normalizeVendorInput function
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **The edit completes first**, then the `post_tool_use` trigger appends a pending entry to `.gitsense/ai-provenance.jsonl`
4. A notice appears: "AI provenance entry created for third_party/vendor-widget.js"
5. The trigger queues passive guidance telling the agent to update the ledger entry, replace the TODO summary, and set `status` to `"complete"`
6. If the agent completes the ledger entry before finishing, `agent_end` shows an info notice that provenance is complete
7. If the agent does not complete it, `agent_end` shows a warning notice and queues passive guidance for the next real user turn

**Why this matters:** This example demonstrates stateful audit obligations with passive persistence. The `passiveSteer` delivery mode creates an obligation without forcing the agent to respond immediately. The `agent_end` trigger verifies completion without creating self-waking loops. If the agent doesn't complete the provenance entry, the guidance persists into the next real user turn.

---

## Example 11: Mandatory Steering (Advanced)

**What you'll learn:** How to use `steer` delivery mode to force the agent to respond immediately, creating mandatory obligations.

**Rule type:** Executable trigger
**Event:** `post_tool_use`
**Delivery mode:** `steer` (forces agent to respond)

### Quick Setup (Ask the Agent)

The easiest way to set up this example is to ask the agent:

```
Create a rule that verifies TypeScript compilation after editing .ts files. Use steer delivery mode so the agent must fix compilation errors before continuing.
```

The agent will:
1. Create the rule with `gsc rules new`
2. Create the trigger file
3. Update the rule to use the trigger

### Manual Setup (If Needed)

<details>
<summary>Click to expand manual setup steps</summary>

#### 1. Create the rule

```bash
gsc rules new \
  --event post_tool_use \
  --action edit \
  --glob "src/**/*.ts" \
  --summary "TypeScript edit verification" \
  --instruction "After editing TypeScript files, verify the changes compile successfully."
```

#### 2. Create the trigger

Save as `.gitsense/rules/triggers/typescript-verify.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const context = JSON.parse(readFileSync(0, 'utf8'));
const toolResult = context.toolResult || {};
const toolCall = context.toolCall || {};
const action = toolCall.action || toolResult.action || '';
const file = toolCall.file || toolResult.input?.path || '';

// Only match TypeScript files
if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Only match edit/write actions
if (action !== 'edit' && action !== 'write') {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Try to compile the file
let compileResult = 'unknown';
try {
  execSync('npx tsc --noEmit --pretty', { timeout: 10000 });
  compileResult = 'success';
} catch (error) {
  compileResult = 'failed';
}

if (compileResult === 'success') {
  console.log(JSON.stringify({
    matched: true,
    block: false,
    notice: 'TypeScript compilation passed for ' + file,
    deliveryMode: 'steer'
  }));
} else {
  console.log(JSON.stringify({
    matched: true,
    block: false,
    notice: 'TypeScript compilation failed for ' + file + '. Please fix the errors before continuing.',
    deliveryMode: 'steer'
  }));
}
```

#### 3. Update the rule to use the trigger

```bash
gsc rules update --id <rule-id> \
  --trigger-runtime node \
  --trigger-entry typescript-verify.mjs
```

</details>

### Test It

**Prompt:**
```
edit src/example.ts to add a new function that returns a greeting message
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Edit completes**, then the trigger runs
4. Trigger checks if TypeScript compiles
5. If compilation fails, trigger sends `steer` message: "TypeScript compilation failed..."
6. **Agent must respond** to the steer message (cannot ignore)
7. Agent fixes the compilation errors before continuing

### Why This Is Aggressive

| Mode | Behavior | Agent Can Ignore? |
|------|----------|-------------------|
| `passiveSteer` | Queues guidance for next context | ✅ Yes |
| `steer` | Forces agent to respond immediately | ❌ No |

**Use cases for `steer`:**
- Critical validation that must pass before continuing
- Security checks that require immediate attention
- Compliance requirements that cannot be skipped

**Use cases for `passiveSteer`:**
- Audit trails (like Example 10)
- Advisory guidance
- Background tasks

---

## Creating Your Own Rules

Now that you've seen how rules work, try creating your own!

### Basic rule template:
```bash
gsc rules new \
  --event pre_tool_use \
  --action read \
  --glob "docs/**" \
  --summary "Documentation guidance" \
  --instruction "Check if there are related notes before reading documentation files."
```

### Prompt interception rule:
```bash
gsc rules new \
  --event user_prompt_submit \
  --action prompt \
  --matches "clear" \
  --summary "Clear command alias" \
  --instruction "Pi uses /clear to clear the screen. Type /clear instead."
```

### Ask the AI to help:
```
add a rule that warns when editing test files in src/
```

```
create a rule that blocks edits to package.json unless TEST_MODE is set
```

---

## Verification Commands

Check rule status:
```
/brains rules status
```

View debug log path:
```
/brains debug file
```

Then in another terminal:
```bash
tail -f <path-from-above>
```

---

## Troubleshooting

| Issue | Possible Cause |
|-------|---------------|
| No block/notice | Rules disabled (`/brains rules on`) |
| No block/notice | gsc not available (`/brains` to check) |
| Prompt not intercepted | pi-brains not passing prompt text |
| Trigger error | Check debug log for details |

---

## Next Steps

- Explore existing rules: `gsc rules list`
- Search for rules: `gsc rules search <query>`
- Learn about rule topics: `gsc topics list`
- Add notes to files: `gsc notes add --file <path> --summary "..." --content "..."`
