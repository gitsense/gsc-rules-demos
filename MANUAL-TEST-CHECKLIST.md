# Manual Test Checklist

Use this checklist when testing rules in Pi TUI.

## Setup

```bash
cd ~/gsc-trigger-test
pi
/brains debug on  # Optional - enables file-based debug logging
```

**Note:** Rules are enabled by default. No need to run `/brains rules on`.

---

## Core Scenarios

### 1. Declarative Read Block
**File:** `data/accounting/q1.ledger`
**Action:** `read`
**Expected:** Block with instructions about pipe-delimited format

- [ ] `read data/accounting/q1.ledger`
- [ ] Verify block message appears
- [ ] Verify instructions mention `gsc query --file ... --topic accounting`
- [ ] Retry read after instructions delivered
- [ ] Second read should succeed

---

### 2. Executable Edit/Write Block
**File:** `config/production.env`
**Action:** `edit` or `write`
**Expected:** Block with config guard message

- [ ] `edit config/production.env`
- [ ] Verify "CONFIG FILE GUARD" message appears
- [ ] Verify message mentions deployment approval
- [ ] Edit should be blocked

---

### 3. Notice-Only (No Block)
**File:** `src/generated/types.ts`
**Action:** `edit`
**Expected:** Warning notice, edit proceeds

- [ ] `edit src/generated/types.ts`
- [ ] Verify "WARNING: You are editing an auto-generated file" notice
- [ ] Edit should proceed (not blocked)

---

### 4. Multi-Rule Match
**File:** `.github/workflows/deploy.yml`
**Action:** `edit`
**Expected:** Block with both declarative instruction AND trigger message

- [ ] `edit .github/workflows/deploy.yml`
- [ ] Verify block message includes BOTH:
  - "Deployment workflow changes require DevOps team review"
  - "DEPLOYMENT WORKFLOW GUARD"
- [ ] Edit should be blocked

---

### 5. Prompt Interception (Exit)
**Action:** Type `exit`
**Expected:** Notice + input consumed

- [ ] Type `exit`
- [ ] Verify "Pi uses /quit to exit" notice appears
- [ ] Verify no LLM response is generated
- [ ] Verify input is not in conversation history

---

### 6. Parallel Execution
**File:** `src/parallel/checkout.ts`
**Action:** `edit`
**Expected:** All 3 notices appear

- [ ] `edit src/parallel/checkout.ts`
- [ ] Verify "parallel-slow-a completed" notice
- [ ] Verify "parallel-slow-b completed" notice
- [ ] Verify "parallel-slow-c completed" notice
- [ ] All notices should appear (order may vary)

---

### 7. Priority Ordering
**File:** `src/priority/overlap.ts`
**Action:** `edit`
**Expected:** Rules in priority order (100, 50, 10)

- [ ] `edit src/priority/overlap.ts`
- [ ] Verify high priority instruction appears first
- [ ] Verify medium priority instruction appears second
- [ ] Verify low priority instruction appears third

---

### 8. Frequency Modes
**File:** `src/frequency/repeated-read.txt`
**Action:** `read` (twice)
**Expected:** First read triggers, second may skip

- [ ] `read src/frequency/repeated-read.txt`
- [ ] Verify "Frequency test trigger executed" notice
- [ ] `read src/frequency/repeated-read.txt` again
- [ ] Verify behavior matches frequency mode

---

### 9. Error Handling
**File:** `src/errors/broken-trigger-target.txt`
**Action:** `read`
**Expected:** Fail-open, no block

- [ ] `read src/errors/broken-trigger-target.txt`
- [ ] Verify read succeeds (not blocked)
- [ ] Check debug log for error messages

---

### 10. canBlock=false
**Note:** Cannot test in Pi TUI (Pi sets canBlock=true for pre_tool_use)
**Test via CLI:** `gsc rules execute --context .gitsense/rules/fixtures/can-block-false-context.json`

---

### 11. AI Provenance (Third-Party Edits)
**File:** `third_party/vendor-widget.js`
**Action:** `edit`
**Expected:** Provenance entry is recorded; agent_end verifies without waking a follow-up turn

- [ ] `edit third_party/vendor-widget.js`
- [ ] Verify "AI provenance entry created" notice
- [ ] Verify `.gitsense/ai-provenance.jsonl` gets a pending entry
- [ ] If the agent completes the entry, verify an info notice says provenance is complete
- [ ] If the entry remains pending, verify a warning says the next real turn will be guided to fix it
- [ ] Verify no automatic follow-up turn is created

---

## Verification Commands

After testing, verify with these commands:

```bash
# Check rules status
/brains rules status

# View debug log
/brains debug file
tail -f <path-from-above>

# Check rules list
gsc rules list
```

---

## Notes

- Debug mode writes to file, use `tail -f` to monitor
- Some scenarios may only work via CLI (`gsc rules execute`)
- Prompt interception requires pi-brains to pass prompt text to gsc
