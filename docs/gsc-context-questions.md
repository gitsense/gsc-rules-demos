# Questions for gsc Developer

## Context

We're building a test repository for `gsc rules` and discovered that triggers return `matched: false` when run through `gsc rules execute`, but work correctly when run directly with `node trigger.mjs < context.json`.

## Questions

### 1. Context Structure Passed to Triggers

When `gsc rules execute` runs a trigger, what is the exact JSON structure passed to the trigger's stdin?

Is it:
- The raw V1ExecutionContext we provide to `--context`?
- A transformed/filtered version of the context?
- A different structure altogether?

**Specifically:** Does the trigger receive `context.payload.toolCall.file` as provided, or is it restructured?

### 2. Debug Output

When `debug: true` is set in the context, where does the debug output go?
- File specified by `debugPath`?
- Stderr?
- Both?

### 3. Trigger Input Format

Is there documentation for the exact JSON schema that triggers receive on stdin? We've been using V1TriggerContext from pi-brains types, but want to confirm this matches what `gsc` actually sends.

### 4. Rule Execution Flow

What is the exact flow when `gsc rules execute` processes an executable rule?
1. Does it read the trigger file from `.gitsense/rules/triggers/`?
2. Does it pass the full context or a subset?
3. Does it transform any fields before passing to the trigger?

### 5. Recommended Debugging Approach

What's the recommended way to debug trigger execution issues? Should we:
- Add `debug: true` and check `debugPath`?
- Use `--verbose` flag?
- Capture stderr from the trigger?

## Current Test Setup

- Repository: `/Users/terrchen/gsc-trigger-test`
- Trigger: `.gitsense/rules/triggers/config-guard.mjs`
- Rule ID: `rule_019f0940-0155-742c-9bf0-7b0baf22b9c9`
- Fixture: `.gitsense/rules/fixtures/config-edit-context.json`

## Working Direct Execution

```bash
# This works - trigger returns matched: true
cat .gitsense/rules/fixtures/config-edit-context.json | node .gitsense/rules/triggers/config-guard.mjs
```

## Failing gsc Execution

```bash
# This fails - trigger returns matched: false
gsc rules get --event pre_tool_use --action edit --file config/production.env --format rules-json > /tmp/rules.json
gsc rules execute --context .gitsense/rules/fixtures/config-edit-context.json --rules /tmp/rules.json
```
