# TUI Testing Guide

Step-by-step guide for testing rules in Pi TUI.

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

## Test 1: Declarative Read Block

**Rule ID:** `019f097d-9091-7e89-a871-aa786b7c4a0b`
**Rule type:** Declarative (instruction-only)
**Event:** `pre_tool_use` (fires when read tool executes, not when prompt is typed)
**Frequency:** Once per rule hash (default for declarative rules)

**Verify rule:**
```bash
gsc rules show 019f097d-9091
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
5. Instructions mention: `gsc rg` and `gsc notes list --topic accounting`

**Important:** The block occurs at tool execution time, not at prompt time. You'll see Pi start to process, then get blocked when it tries to actually read the file.

**Why second read succeeds:**
Declarative rules use once-per-rule-hash delivery tracking. After the instructions are delivered once, pi-brains remembers the rule hash and skips the block on subsequent reads. This prevents repeated blocking for the same guidance.

**Follow-up:**
```
read data/accounting/q1.ledger
```
- Second read should succeed immediately (no block)
- Instructions were already delivered in the first read

---

## Test 2: Executable Edit Block

**Rule ID:** `019f0940-0155-742c-9bf0-7b0baf22b9c9`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Verify rule:**
```bash
gsc rules show 019f0940-0155
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

---

## Test 3: Notice-Only (No Block)

**Rule ID:** `019f0721-044b-70bc-8719-318fa6adcd73`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Verify rule:**
```bash
gsc rules show 019f0721-044b
```

**Prompt:**
```
edit src/generated/types.ts to add a new field to User interface
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Notice appears when Pi tries to execute the edit**
4. Warning: "WARNING: You are editing an auto-generated file"
5. Edit proceeds (not blocked)

---

## Test 4: Multi-Rule Match

**Rule IDs:**
- `019f0721-69af-7f7b-9cbd-6bf4ddd2e563` (declarative)
- `019f0721-8839-7487-837e-7a6abf082e66` (executable)

**Rule types:** Declarative + Executable
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Verify rules:**
```bash
gsc rules show 019f0721-69af
gsc rules show 019f0721-8839
```

**Prompt:**
```
edit .github/workflows/deploy.yml to add a new step
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Block happens when Pi tries to execute the edit**
4. Message includes BOTH:
   - "Deployment workflow changes require DevOps team review"
   - "DEPLOYMENT WORKFLOW GUARD"
5. Both rules appear in the matched-rule packet

---

## Test 5: Prompt Interception (Exit)

**Rule ID:** `019f0722-cd4b-76a1-b43a-5bd8a23c9359`
**Rule type:** Executable trigger
**Frequency:** Always (runs every time)

**Verify rule:**
```bash
gsc rules show 019f0722-cd4b
```

**Prompt:**
```
exit
```

**Expected behavior:**
- Notice appears: "Pi uses /quit to exit. Type /quit or press Ctrl+D."
- No LLM response generated
- Input is consumed (not in conversation)

**Note:** This requires pi-brains to pass prompt text to gsc. May not work if that integration is missing.

---

## Test 6: Parallel Execution

**Rule IDs:**
- `019f0721-e0f9-7d47-80dd-96980e10a2b4` (trigger A)
- `019f0722-0767-7c38-a6f8-6c3df77dabb9` (trigger B)
- `019f0722-2030-7a7a-ba6e-d8a75ac9cb51` (trigger C)

**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Always (runs every time)

**Verify rules:**
```bash
gsc rules show 019f0721-e0f9
gsc rules show 019f0722-0767
gsc rules show 019f0722-2030
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
   - "parallel-slow-a completed (1000ms delay)"
   - "parallel-slow-b completed (1000ms delay)"
   - "parallel-slow-c completed (1000ms delay)"
5. Edit proceeds after all three notices

---

## Test 7: Priority Ordering

**Rule IDs:**
- `019f0723-735f-72bb-a9b4-34f6a73ad89c` (high, priority 100)
- `019f0723-5d51-7c30-8c6b-b8ccdb0a2cfd` (medium, priority 50)
- `019f0723-4090-7641-8fd9-5303f66b5a44` (low, priority 10)

**Rule type:** Declarative
**Event:** `pre_tool_use` (fires when edit tool executes)
**Frequency:** Once per rule hash

**Verify rules:**
```bash
gsc rules show 019f0723-735f
gsc rules show 019f0723-5d51
gsc rules show 019f0723-4090
```

**Prompt:**
```
edit src/priority/overlap.ts to add a new function
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

## Test 8: Frequency Modes

**Rule ID:** `019f073b-cc8c-7a61-8c94-b7d7b45ec396`
**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when read tool executes)
**Frequency:** Once per rule hash

**Verify rule:**
```bash
gsc rules show 019f073b-cc8c
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

**Follow-up:**
```
read src/frequency/repeated-read.txt
```
- With `once-per-rule-hash`: Notice should NOT appear again
- With `always`: Notice would appear again

---

## Test 9: Error Handling

**Rule IDs:**
- `019f0722-5c8c-74c3-a9b4-ff172d4d845e` (throws error)
- `019f0722-795b-78b7-aa51-b68f95a12e9e` (invalid JSON)
- `019f0722-99ac-72a8-9a97-694b3822e8a3` (timeout)

**Rule type:** Executable trigger
**Event:** `pre_tool_use` (fires when read tool executes)
**Frequency:** Always (runs every time)

**Verify rules:**
```bash
gsc rules show 019f0722-5c8c
gsc rules show 019f0722-795b
gsc rules show 019f0722-99ac
```

**Prompt:**
```
read src/errors/broken-trigger-target.txt
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `read` tool)
3. **Read succeeds (not blocked)** - triggers fail open
4. No error shown to user
5. Debug log shows error details

---

## Test 10: canBlock=false

**Rule ID:** `019f0941-6b4c-7852-8a9e-6fbad87977dd`
**Note:** Cannot test in Pi TUI (Pi sets canBlock=true for pre_tool_use)

**Test via CLI:**
```bash
gsc rules execute \
  --context .gitsense/rules/fixtures/can-block-false-context.json \
  --rules <(gsc rules get --event post_tool_use --action edit --file src/capabilities/nonblocking-target.txt --format rules-json)
```

---

## Test 11: AI Provenance

**Rule IDs:**
- `019f094d-6a10-7dfb-a76a-f11b9360a501` (post_tool_use)
- `019f094d-8ec0-7f31-9791-a63b697a9381` (agent_end)

**Rule type:** Executable trigger
**Event:** `post_tool_use` (fires after edit completes)
**Frequency:** Always (runs every time)

**Verify rules:**
```bash
gsc rules show 019f094d-6a10
gsc rules show 019f094d-8ec0
```

**Prompt:**
```
edit third_party/vendor-widget.js to fix a bug
```

**Expected behavior:**
1. You type the prompt
2. Pi processes it (LLM decides to call `edit` tool)
3. **Notice appears AFTER the edit completes** (post_tool_use)
4. Notice: "AI provenance entry created for third_party/vendor-widget.js"
5. Notice mentions updating `.gitsense/ai-provenance.jsonl`
6. Edit proceeds

---

## Verification Commands

After testing, check rule status:
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
