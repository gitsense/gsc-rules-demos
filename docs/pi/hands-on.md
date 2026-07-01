# Pi Hands-On Guide

A hands-on guide for trying the GitSense rules, notes, lessons, and triggers included in this repo with Pi.

The README gives you the short path. This guide walks through each demo in more detail.

## What You'll Learn

- how rules can intercept prompts before they reach the model
- how rules can tell Pi to check notes before reading unfamiliar files
- how warnings differ from blocking guards
- how multiple rules can match the same action
- how triggers can run in parallel
- how rule priority and frequency affect delivery
- how trigger failures fail open
- how provenance tracking can create audit obligations
- how to create personal and repo rules by asking Pi

## Contents

- [Setup](#setup)
- [Example 1: Prompt Interception](#example-1-prompt-interception-start-here)
- [Example 2: Rule-Guided Notes](#example-2-rule-guided-notes)
- [Example 3: Notice-Only Warning](#example-3-notice-only-warning-without-blocking)
- [Example 4: Executable Edit Block](#example-4-executable-edit-block-with-environment-variable-bypass)
- [Example 5: Multi-Rule Match](#example-5-multi-rule-match)
- [Example 6: Parallel Execution](#example-6-parallel-execution)
- [Example 7: Priority Ordering](#example-7-priority-ordering)
- [Example 8: Frequency Modes](#example-8-frequency-modes)
- [Example 9: Error Handling](#example-9-error-handling-fail-open)
- [Example 10: AI Provenance Tracking](#example-10-ai-provenance-tracking)
- [Example 11: Mandatory Steering](#example-11-mandatory-steering-advanced)
- [Example 12: Repo-Specific Rules](#example-12-repo-specific-rules-advanced)

## Setup

```bash
cd ~/gsc-rules-demos
pi
```

If this is your first time using `pi-brains` in this repo, run:

```
/brains
```

This initializes pi-brains and GitSense context for the repo. If GitSense is not installed, `/brains` will show install instructions.

Optional - enable debug logging:
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

## Example 2: Rule-Guided Notes

**What you'll learn:** How declarative rules can tell Pi to check notes before interpreting unfamiliar files.

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
4. Message tells Pi to review accounting notes for this file or topic
5. The accounting note explains the ledger format and business meaning

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
**Scope:** Personal (works across all your repositories)

### Quick Setup (Ask the Agent)

The easiest way to set up this example is to ask the agent:

```
Create a personal rule that reminds me to run tests after editing test files. Use steer delivery mode so I don't forget.
```

The agent will:
1. Confirm this should be personal scope
2. Create the rule with `gsc rules new --creator agent --target personal`
3. Create the trigger file
4. Validate the trigger

### Why Personal Scope?

This rule is a **personal preference** - not everyone needs it, but it makes sense for developers who:
- Want to run tests after editing test files
- Prefer immediate feedback on test changes
- Have a habit of forgetting to run tests before committing

**Repo vs Personal:**
- **Repo scope**: Project-specific conventions everyone should follow
- **Personal scope**: Your individual workflow preferences

### Manual Setup (If Needed)

<details>
<summary>Click to expand manual setup steps</summary>

#### 1. Create the trigger file

Save as `.gitsense/rules/triggers/remind-tests.mjs`:

```javascript
import { readFileSync } from 'node:fs';

const context = JSON.parse(readFileSync(0, 'utf8'));
const toolResult = context.toolResult || {};
const toolCall = context.toolCall || {};
const action = toolCall.action || toolResult.action || '';
const file = toolCall.file || toolResult.input?.path || '';

// Only match test files
const isTestFile = file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__');
if (!isTestFile) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Only match edit/write actions
if (action !== 'edit' && action !== 'write') {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: 'You edited a test file. Consider running the tests to verify your changes.',
  deliveryMode: 'steer'
}));
```

#### 2. Create the rule with trigger

```bash
# Create rule JSON file
cat > /tmp/remind-tests-rule.json << 'EOF'
{
  "summary": "Remind to run tests after editing test files",
  "event": "post_tool_use",
  "actions": ["edit"],
  "glob_patterns": ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
  "trigger": {
    "runtime": "node",
    "entry": "remind-tests.mjs"
  },
  "creatorChecklist": {
    "creator": "agent",
    "intent": "Remind developer to run tests after editing test files",
    "scope": "personal",
    "ruleKind": "executable",
    "topic": {
      "slug": "developer-workflow",
      "source": "existing",
      "verifiedFrom": "gsc topics list"
    },
    "matching": {
      "event": "post_tool_use",
      "actions": ["edit"],
      "globs": ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"]
    },
    "delivery": {
      "mode": "steer",
      "blocks": false,
      "messageShownToAgent": "You edited a test file. Consider running the tests to verify your changes."
    },
    "sideEffects": ["None - just shows a notice"],
    "risk": {
      "level": "low",
      "reasons": ["Advisory notice only", "No blocking"]
    },
    "verification": {
      "lifecycleSupportVerifiedFrom": "gsc experts guide rules",
      "syntaxVerifiedFrom": "gsc rules trigger template",
      "deliveryModeVerifiedFrom": "gsc experts guide rules",
      "validationPlan": ["gsc rules trigger validate <created-rule-id>"]
    },
    "confirmation": {
      "required": true,
      "userConfirmed": true,
      "confirmedText": "confirm"
    },
    "unresolved": []
  }
}
EOF

# Create the rule
gsc rules trigger new --creator agent --target personal --from-file /tmp/remind-tests-rule.json
```

</details>

### Test It

**Prompt:**
```
edit src/utils.test.ts to add a test for the new helper function
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Edit completes**, then the trigger runs
4. Trigger detects you edited a test file
5. Trigger sends `steer` message: "You edited a test file. Consider running the tests..."
6. **Agent must acknowledge** the message (cannot ignore)
7. Agent can then run the tests or explain why they don't need to

### Why This Is Aggressive

| Mode | Behavior | Agent Can Ignore? |
|------|----------|-------------------|
| `passiveSteer` | Queues guidance for next context | ✅ Yes |
| `steer` | Forces agent to respond immediately | ❌ No |

**Use cases for `steer`:**
- Reminders that you don't want to miss
- Workflow habits you're trying to build
- Checks that should happen every time

**Use cases for `passiveSteer`:**
- Audit trails (like Example 10)
- Advisory guidance
- Background tasks

### Other Personal Rule Ideas

Here are other personal rules that might make sense for different workflows:

- **Late-night coding reminder**: "When editing files after 10pm, suggest taking a break"
- **Commit message reminder**: "After editing more than 5 files, suggest writing a commit message"
- **Import organizer**: "After editing TypeScript files, remind to organize imports"
- **Documentation reminder**: "After editing API files, remind to update documentation"
- **Backup reminder**: "Before editing configuration files, remind to create a backup"

---

## Example 12: Repo-Specific Rules (Advanced)

**What you'll learn:** How to create repo-specific rules that enforce project conventions for your team.

**Rule type:** Executable trigger
**Event:** `pre_tool_use`
**Delivery mode:** `steer` (blocks until approved)
**Scope:** Repo (shared with team)

### Quick Setup (Ask the Agent)

The easiest way to set up this example is to ask the agent:

```
Create a repo rule that blocks edits to production config files without approval. Use steer delivery mode to enforce this.
```

The agent will:
1. Confirm this should be repo scope
2. Create the rule with `gsc rules new --creator agent --target repo`
3. Create the trigger file
4. Validate the trigger

### Why Repo Scope?

This rule is a **project convention** - everyone on the team should follow it:
- Protects production configuration from accidental changes
- Enforces approval workflow for critical files
- Shared across all team members

**Repo vs Personal:**
- **Repo scope**: Project-specific conventions everyone should follow
- **Personal scope**: Your individual workflow preferences

### Manual Setup (If Needed)

<details>
<summary>Click to expand manual setup steps</summary>

#### 1. Create the trigger file

Save as `.gitsense/rules/triggers/require-approval.mjs`:

```javascript
import { readFileSync } from 'node:fs';

const context = JSON.parse(readFileSync(0, 'utf8'));
const toolCall = context.toolCall || {};
const file = toolCall.file || '';
const action = toolCall.action || toolCall.toolName || '';

// Only match production config files
const isProductionConfig = file.includes('config/production') || file.includes('.env.production');
if (!isProductionConfig) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Only match edit/write actions
if (action !== 'edit' && action !== 'write') {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Check for approval (in a real scenario, this would check a ticket system)
const hasApproval = process.env.PRODUCTION_APPROVAL === 'true';

if (hasApproval) {
  console.log(JSON.stringify({
    matched: true,
    block: false,
    notice: 'Production config edit approved. Proceeding.',
    deliveryMode: 'steer'
  }));
} else {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: 'Production config changes require approval.\n\nTo approve:\n1. Create a change request ticket\n2. Get approval from your team lead\n3. Set PRODUCTION_APPROVAL=true in your environment\n\nThen retry the edit.',
    deliveryMode: 'steer'
  }));
}
```

#### 2. Create the rule with trigger

```bash
# Create rule JSON file
cat > /tmp/require-approval-rule.json << 'EOF'
{
  "summary": "Require approval for production config changes",
  "event": "pre_tool_use",
  "actions": ["edit", "write"],
  "glob_patterns": ["config/production*", "*.env.production"],
  "trigger": {
    "runtime": "node",
    "entry": "require-approval.mjs"
  },
  "creatorChecklist": {
    "creator": "agent",
    "intent": "Block production config changes without approval",
    "scope": "repo",
    "ruleKind": "executable",
    "topic": {
      "slug": "production-safety",
      "source": "existing",
      "verifiedFrom": "gsc topics list"
    },
    "matching": {
      "event": "pre_tool_use",
      "actions": ["edit", "write"],
      "globs": ["config/production*", "*.env.production"]
    },
    "delivery": {
      "mode": "steer",
      "blocks": true,
      "messageShownToAgent": "Production config changes require approval. Create a change request and get team lead approval."
    },
    "sideEffects": ["Checks PRODUCTION_APPROVAL environment variable"],
    "risk": {
      "level": "high",
      "reasons": ["Blocks production config edits", "Requires approval workflow"]
    },
    "verification": {
      "lifecycleSupportVerifiedFrom": "gsc experts guide rules",
      "syntaxVerifiedFrom": "gsc rules trigger template",
      "deliveryModeVerifiedFrom": "gsc experts guide rules",
      "validationPlan": ["gsc rules trigger validate <created-rule-id>"]
    },
    "confirmation": {
      "required": true,
      "userConfirmed": true,
      "confirmedText": "confirm"
    },
    "unresolved": []
  }
}
EOF

# Create the rule
gsc rules trigger new --creator agent --target repo --from-file /tmp/require-approval-rule.json
```

</details>

### Test It

**Prompt:**
```
edit config/production.env to update the database connection string
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Block happens** when Pi tries to execute the edit
4. Message: "Production config changes require approval..."
5. **Agent cannot proceed** without approval
6. User must set `PRODUCTION_APPROVAL=true` to continue

### Comparison: Personal vs Repo Scope

| Aspect | Example 11 (Personal) | Example 12 (Repo) |
|--------|----------------------|-------------------|
| **Scope** | `--target personal` | `--target repo` |
| **Use case** | Individual workflow preference | Team convention |
| **Shared with** | Only you | All team members |
| **Example** | Test file reminder | Production config guard |
| **Blocking** | Advisory (steer notice) | Blocking (steer block) |

### Other Repo Rule Ideas

Here are other repo-specific rules that make sense for teams:

- **Deployment workflow guard**: "Block direct edits to .github/workflows/deploy.yml"
- **Auto-generated file warning**: "Warn when editing auto-generated files"
- **Security file protection**: "Block edits to security-sensitive files without review"
- **API contract enforcement**: "Require API documentation updates when changing endpoints"
- **Database migration guard**: "Require migration review for schema changes"

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
