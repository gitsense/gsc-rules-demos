# gsc-trigger-test

A test repository for demonstrating and validating the `gsc rules` system.

## Purpose

This repository contains realistic test scenarios for the GitSense rules engine, including:

- Declarative instruction rules
- Executable trigger scripts
- Parallel execution testing
- Error handling and edge cases
- Input command mapping

## Quick Start

### Prerequisites

- [GitSense CLI (gsc)](https://github.com/gitsense/gsc-cli) installed
- [Pi coding agent](https://github.com/gitsense/pi) with pi-brains extension

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd gsc-trigger-test

# Import rules (if using manifest)
gsc manifest import .

# Or create rules manually
gsc rules new --event pre_tool_use --action read --glob "data/accounting/**" \
  --summary "Accounting file guidance" \
  --instruction "This is a pipe-delimited ledger. Use gsc query for metadata."
```

### Running Tests

See [TESTING.md](TESTING.md) for detailed test scenarios.

Quick tests:

```bash
# Test parallel execution
./scripts/test-parallel-execute.sh

# Test a specific rule
gsc rules get --event pre_tool_use --action read --file data/accounting/q1.ledger

# Test with direct execution
gsc rules execute \
  --context .gitsense/rules/fixtures/parallel-edit-context.json \
  --rules <(gsc rules get --event pre_tool_use --action edit --file src/parallel/checkout.ts --format rules-json)
```

## Repository Structure

```
gsc-trigger-test/
├── data/
│   └── accounting/          # Accounting ledger files (pipe-delimited)
├── config/
│   └── production.env       # Production environment config
├── src/
│   ├── generated/           # Auto-generated files
│   ├── parallel/            # Parallel execution test files
│   ├── priority/            # Priority ordering test files
│   ├── frequency/           # Frequency mode test files
│   ├── errors/              # Error handling test files
│   └── capabilities/        # Capability test files
├── .github/workflows/       # Deployment workflows
├── .gitsense/
│   ├── rules/
│   │   ├── triggers/        # Executable trigger scripts
│   │   └── fixtures/        # Test fixtures for direct execution
│   └── experts-context.md   # Agent context
├── scripts/
│   └── test-parallel-execute.sh  # Parallel execution test script
├── docs/
│   ├── parallel-execution.md     # Parallel execution documentation
│   └── input-command-mapping.md  # Input command mapping guide
├── TESTING.md               # Test scenarios and procedures
└── README.md                # This file
```

## Test Scenarios

| # | Scenario | Status |
|---|----------|--------|
| 1 | Declarative read block | ✅ Supported |
| 2 | Executable edit/write block | ✅ Supported |
| 3 | Notice-only (no block) | ✅ Supported |
| 4 | Multi-rule match | ✅ Supported |
| 5 | Prompt interception (exit) | ⚠️ CLI first |
| 6 | Parallel execution | ✅ Supported |
| 7 | Priority ordering | ✅ Supported |
| 8 | Frequency modes | ⚠️ CLI first |
| 9 | Error handling | ✅ Supported |
| 10 | canBlock=false | ❌ CLI only |
| 11 | AI provenance ledger for third-party edits | ⚠️ Review scenario |

See [TESTING.md](TESTING.md) for detailed descriptions.

## Documentation

- [TESTING.md](TESTING.md) - Complete test scenarios and procedures
- [docs/parallel-execution.md](docs/parallel-execution.md) - Parallel execution guide
- [docs/input-command-mapping.md](docs/input-command-mapping.md) - Input command mapping guide

## Triggers

### Core Triggers

| Trigger | File | Purpose |
|---------|------|---------|
| deploy-guard.mjs | .github/workflows/deploy.yml, config/** | Deployment workflow and config protection |
| generated-notice.mjs | src/generated/**, src/capabilities/** | Auto-generated file warnings |
| exit-alias-notice.mjs | user input "exit" | Exit command guidance |

### Test Triggers

| Trigger | File | Purpose |
|---------|------|---------|
| accounting-check.mjs | data/accounting/** | Accounting file guidance (available but not wired to rule) |
| parallel-slow-a.mjs | src/parallel/** | Parallel execution test (1000ms) |
| parallel-slow-b.mjs | src/parallel/** | Parallel execution test (1000ms) |
| parallel-slow-c.mjs | src/parallel/** | Parallel execution test (1000ms) |
| frequency-test.mjs | src/frequency/** | Frequency mode test |
| throws-error.mjs | src/errors/** | Error handling test |
| invalid-json.mjs | src/errors/** | Invalid JSON handling test |
| timeout.mjs | src/errors/** | Timeout handling test |
| ai-provenance-post-tool.mjs | third_party/** | Append pending AI provenance ledger entries |
| ai-provenance-agent-end.mjs | agent_end | Remind about unresolved provenance entries |

## Fixtures

| Fixture | Purpose |
|---------|---------|
| parallel-edit-context.json | Parallel execution CLI test |
| can-block-false-context.json | canBlock=false capability test |
| prompt-submit-context.json | Prompt interception test |
| third-party-edit-context.json | AI provenance post_tool_use test |
| agent-end-context.json | AI provenance agent_end reminder test |

## Creating Triggers

### Context Structure

**Important:** `gsc rules execute` transforms the context before passing it to triggers. The `toolCall` and `toolResult` fields are at the **top level**, not inside `payload`.

**What you provide (V1ExecutionContext):**
```json
{
  "payload": {
    "toolCall": { "file": "/path/to/file", "action": "edit" }
  }
}
```

**What the trigger receives (V1TriggerContext):**
```json
{
  "toolCall": { "file": "/path/to/file", "action": "edit" },
  "payload": { "prompt": { ... }, "toolResult": { ... } }
}
```

### Trigger Template

Use this pattern for compatibility with both `gsc rules execute` and direct testing:

```javascript
import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

// toolCall is at top level in gsc, but may be in payload for direct testing
const toolCall = context.toolCall || context.payload?.toolCall || {};
const toolResult = context.toolResult || context.payload?.toolResult || {};
const file = toolCall.file || toolResult.input?.path || '';
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

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `matched` | boolean | Whether the trigger matched the context |
| `block` | boolean | Whether to block the action (forced to false when `canBlock=false`) |
| `message` | string | Message shown when blocking |
| `notice` | string | Notice shown without blocking |
| `deliveryMode` | string | `"steer"`, `"followUp"`, or `"passiveSteer"` |

## Contributing

To add a new test scenario:

1. Create the target file
2. Create a trigger script in `.gitsense/rules/triggers/`
3. Create a fixture if needed for direct CLI testing
4. Add the scenario to [TESTING.md](TESTING.md)
5. Update this README if needed

## License

MIT
