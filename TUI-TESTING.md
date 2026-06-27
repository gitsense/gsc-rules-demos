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

**Rule type:** Declarative (instruction-only)
**Frequency:** Once per rule hash (default for declarative rules)

**Prompt:**
```
read data/accounting/q1.ledger
```

**Expected behavior:**
- Pi blocks the read
- Message includes: "This is a pipe-delimited accounting ledger"
- Instructions mention: `gsc query --file data/accounting/q1.ledger --topic accounting`

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

**Prompt:**
```
edit config/production.env to change APP_PORT to 9090
```

**Expected behavior:**
- Pi blocks the edit
- Message includes: "CONFIG FILE GUARD"
- Message mentions: "Production configuration changes require deployment approval"

---

## Test 3: Notice-Only (No Block)

**Prompt:**
```
edit src/generated/types.ts to add a new field to User interface
```

**Expected behavior:**
- Pi shows warning notice: "WARNING: You are editing an auto-generated file"
- Edit proceeds (not blocked)
- Notice appears but Pi continues with the edit

---

## Test 4: Multi-Rule Match

**Prompt:**
```
edit .github/workflows/deploy.yml to add a new step
```

**Expected behavior:**
- Pi blocks the edit
- Message includes BOTH:
  - "Deployment workflow changes require DevOps team review"
  - "DEPLOYMENT WORKFLOW GUARD"
- Both rules appear in the matched-rule packet

---

## Test 5: Prompt Interception (Exit)

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

**Prompt:**
```
edit src/parallel/checkout.ts to add a discount field
```

**Expected behavior:**
- Three notices appear (order may vary):
  - "parallel-slow-a completed (1000ms delay)"
  - "parallel-slow-b completed (1000ms delay)"
  - "parallel-slow-c completed (1000ms delay)"
- Edit proceeds after all three notices

---

## Test 7: Priority Ordering

**Prompt:**
```
edit src/priority/overlap.ts to add a new function
```

**Expected behavior:**
- Three instructions appear in priority order:
  1. "This is a high priority instruction."
  2. "This is a medium priority instruction."
  3. "This is a low priority instruction."

---

## Test 8: Frequency Modes

**Prompt:**
```
read src/frequency/repeated-read.txt
```

**Expected behavior:**
- Notice appears: "Frequency test trigger executed for: src/frequency/repeated-read.txt"

**Follow-up:**
```
read src/frequency/repeated-read.txt
```
- Behavior depends on frequency mode:
  - `always`: Notice appears again
  - `once-per-rule-hash`: Notice may not appear

---

## Test 9: Error Handling

**Prompt:**
```
read src/errors/broken-trigger-target.txt
```

**Expected behavior:**
- Read succeeds (not blocked)
- No error shown to user
- Debug log shows error details

---

## Test 10: AI Provenance

**Prompt:**
```
edit third_party/vendor-widget.js to fix a bug
```

**Expected behavior:**
- Notice appears: "AI provenance entry created for third_party/vendor-widget.js"
- Notice mentions updating `.gitsense/ai-provenance.jsonl`
- Edit proceeds

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
