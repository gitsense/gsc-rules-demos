# Parallel Execution

This document explains how `gsc rules execute` handles multiple triggers concurrently.

## Overview

When multiple executable triggers match the same file/action, `gsc rules execute` can run them in parallel. This is controlled by the `-j` / `--concurrency` flag (default: 8).

## Why Parallel Execution Matters

Without parallel execution:
- 3 triggers × 1000ms each = 3000ms total

With parallel execution (-j 3):
- 3 triggers × 1000ms each = ~1000ms total (concurrent)

## Testing Parallel Execution

Use the provided test script:

```bash
./scripts/test-parallel-execute.sh
```

Or test manually:

```bash
# Get rules
gsc rules get \
  --event pre_tool_use \
  --action edit \
  --file src/parallel/checkout.ts \
  --format rules-json > /tmp/parallel-rules.json

# Sequential (should take ~3s)
time gsc rules execute \
  --context .gitsense/rules/fixtures/parallel-edit-context.json \
  --rules /tmp/parallel-rules.json \
  -j 1

# Parallel (should take ~1s)
time gsc rules execute \
  --context .gitsense/rules/fixtures/parallel-edit-context.json \
  --rules /tmp/parallel-rules.json \
  -j 3
```

## Expected Output

### Sequential (-j 1)
```json
{
  "block": false,
  "notices": [
    "parallel-slow-a completed (1000ms delay)",
    "parallel-slow-b completed (1000ms delay)",
    "parallel-slow-c completed (1000ms delay)"
  ]
}
```
Time: ~3 seconds

### Parallel (-j 3)
```json
{
  "block": false,
  "notices": [
    "parallel-slow-a completed (1000ms delay)",
    "parallel-slow-b completed (1000ms delay)",
    "parallel-slow-c completed (1000ms delay)"
  ]
}
```
Time: ~1 second

**Note:** Notice ordering may vary in parallel execution. Don't rely on ordering for test assertions.

## How It Works

1. `gsc rules get` returns all matching rules
2. `gsc rules execute` receives the rules and context
3. Executable triggers are identified
4. Triggers are executed concurrently up to the `-j` limit
5. Results are collected and merged
6. Final result includes all trigger results

## Pi Integration

When using pi-brains with live Pi:
- pi-brains calls `gsc rules execute` without `-j`, so it uses the default (8)
- Multiple triggers for the same file run concurrently
- No configuration needed

## Troubleshooting

### Triggers run sequentially despite -j 3
- Check that triggers are independent (no shared state)
- Verify Node.js version supports concurrent execution

### Timeout issues
- Default trigger timeout is 10 seconds
- Use `timeoutMs` in trigger config to override
- Parallel execution doesn't multiply timeouts

### Results differ between runs
- This is expected for parallel execution
- Use set-based assertions, not ordered assertions
