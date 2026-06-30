# gsc-rules-demos

A demo repo for trying GitSense rules, notes, lessons, and triggers with coding agents.

## Start Here With Pi

```bash
git clone https://github.com/gitsense/gsc-rules-demos.git
cd gsc-rules-demos
pi install npm:@gitsense/pi-brains
pi
```

If this is your first time using `pi-brains`, run:

```text
/brains
```

Then ask Pi:

```text
Show me what rules, notes, lessons, and triggers are available in this repo.
```

The repo ships with rules, notes, lessons, and triggers so you can see how an agent can pick up behavior and project knowledge from the workspace.

## What You'll Learn

- **Block risky operations** — Prevent agents from editing production configs without approval
- **Use notes on demand** — Teach agents how to interpret files with project-specific context
- **Inject context** — Provide format guidance when agents read specialized files
- **Show warnings** — Alert agents when working with auto-generated code
- **Intercept input** — Guide users toward correct agent commands
- **Run triggers in parallel** — Execute multiple safety checks concurrently

## CLI Quick Start

### Prerequisites

- [GitSense CLI (gsc)](https://github.com/gitsense/gsc-cli) installed
- A coding agent with GitSense integration (see [docs/pi/](docs/pi/) for Pi setup)

### Try It

```bash
# Clone and enter the repo
git clone https://github.com/gitsense/gsc-rules-demos.git
cd gsc-rules-demos

# Import the demo rules
gsc manifest import .

# See what rules exist
gsc rules list

# Test a rule — this will block with a message
gsc rules execute \
  --context .gitsense/rules/fixtures/config-edit-context.json \
  --rules <(gsc rules get --event pre_tool_use --action edit --file config/production.env --format rules-json)
```

## Demo Rules

### 1. Config Guard (Block)

Edits to `config/production.env` are blocked until you acknowledge the deployment approval process.

```
$ edit config/production.env
→ BLOCKED: CONFIG FILE GUARD — Changes to production config require deployment approval.
```

### 2. Accounting Guidance (Rule + Note)

Reading `data/accounting/*.ledger` triggers a rule that tells the agent to review accounting notes before interpreting the file.

```
$ read data/accounting/q1.ledger
→ BLOCKED: Review the accounting note to learn how to read this ledger.
```

### 3. Generated File Warning (Notice Only)

Editing `src/generated/types.ts` shows a warning but allows the edit to proceed.

```
$ edit src/generated/types.ts
→ WARNING: You are editing an auto-generated file. Consider editing the source schema instead.
```

### 4. Deployment Workflow Guard (Multi-Rule)

Editing `.github/workflows/deploy.yml` triggers both a declarative rule and an executable trigger.

```
$ edit .github/workflows/deploy.yml
→ BLOCKED: Deployment workflow changes require DevOps team review.
→ BLOCKED: DEPLOYMENT WORKFLOW GUARD — Contact DevOps before modifying.
```

### 5. Parallel Execution

Three triggers run concurrently when editing `src/parallel/checkout.ts`, completing in ~1s instead of ~3s.

## Creating Your Own Rules

### Declarative Rules (Instructions)

Static instructions that agents should follow:

```bash
gsc rules new \
  --glob "internal/cli/**" \
  --action edit \
  --summary "CLI file conventions" \
  --instruction "Do not run gofmt -w" \
  --instruction "Bump the Version field"
```

### Executable Triggers (Dynamic)

Scripts that evaluate context and decide whether to block:

```bash
# Create a trigger file
cat > .gitsense/rules/triggers/my-guard.mjs << 'EOF'
import { readFileSync } from 'node:fs';
const ctx = JSON.parse(readFileSync(0, 'utf8'));
const file = ctx.repo?.normalizedFile || '';

if (file.startsWith('config/')) {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: "Config changes require approval."
  }));
} else {
  console.log(JSON.stringify({ matched: false, block: false }));
}
EOF

# Register the trigger
gsc rules trigger new \
  --title "Config guard" \
  --runtime node \
  --entry my-guard.mjs \
  --glob "config/**" \
  --action edit \
  --frequency always
```

### Trigger Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `matched` | boolean | Does this rule apply? |
| `block` | boolean | Stop the action? |
| `message` | string | Reason shown when blocking |
| `notice` | string | Warning shown without blocking |

## Repository Structure

```
gsc-rules-demos/
├── config/                  # Protected config files
│   └── production.env
├── data/
│   └── accounting/          # Pipe-delimited ledger files
├── src/
│   ├── generated/           # Auto-generated code (warning only)
│   ├── parallel/            # Parallel execution test files
│   ├── priority/            # Priority ordering test files
│   ├── frequency/           # Frequency mode test files
│   └── errors/              # Error handling test files
├── third_party/             # External code (AI provenance tracking)
├── .gitsense/
│   ├── rules/
│   │   ├── records.jsonl    # Rule definitions
│   │   ├── triggers/        # Executable trigger scripts
│   │   └── fixtures/        # Test contexts for CLI testing
│   └── topics/              # Topic definitions
└── docs/
    ├── testing/             # Test documentation
    │   ├── cli-testing.md
    │   ├── agent-testing.md
    │   └── parallel-execution.md
    └── pi/                  # Pi-specific documentation
        ├── tutorial.md
        └── input-command-mapping.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/testing/cli-testing.md](docs/testing/cli-testing.md) | CLI test scenarios and procedures |
| [docs/testing/agent-testing.md](docs/testing/agent-testing.md) | Agent TUI test checklist |
| [docs/testing/parallel-execution.md](docs/testing/parallel-execution.md) | How parallel trigger execution works |
| [docs/pi/tutorial.md](docs/pi/tutorial.md) | Step-by-step Pi tutorial |
| [docs/pi/input-command-mapping.md](docs/pi/input-command-mapping.md) | Pi-specific command interception |

## Test Scenarios

| # | Scenario | Status |
|---|----------|--------|
| 1 | Declarative read block | ✅ |
| 2 | Executable edit/write block | ✅ |
| 3 | Notice-only (no block) | ✅ |
| 4 | Multi-rule match | ✅ |
| 5 | Prompt interception | ⚠️ CLI first |
| 6 | Parallel execution | ✅ |
| 7 | Priority ordering | ✅ |
| 8 | Frequency modes | ⚠️ CLI first |
| 9 | Error handling (fail-open) | ✅ |
| 10 | canBlock=false | ❌ CLI only |
| 11 | AI provenance tracking | ⚠️ Review |

See [docs/testing/cli-testing.md](docs/testing/cli-testing.md) for details.

## License

MIT
