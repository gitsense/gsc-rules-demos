#!/bin/bash
# Test parallel execution with gsc rules execute
# This script demonstrates that multiple triggers run concurrently

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE="$REPO_ROOT/.gitsense/rules/fixtures/parallel-edit-context.json"
RULES_FILE="/tmp/parallel-rules.json"

echo "=== Parallel Execution Test ==="
echo ""
echo "This test verifies that gsc rules execute runs multiple triggers concurrently."
echo "With -j 1 (sequential), 3 triggers with 1000ms delay should take ~3 seconds."
echo "With -j 3 (parallel), they should take ~1 second."
echo ""

# Get rules for the parallel test file
echo "Fetching rules for src/parallel/checkout.ts..."
gsc rules get \
  --event pre_tool_use \
  --action edit \
  --file "$REPO_ROOT/src/parallel/checkout.ts" \
  --format rules-json > "$RULES_FILE"

echo "Rules fetched:"
cat "$RULES_FILE" | head -20
echo "..."
echo ""

# Test sequential execution
echo "=== Sequential Execution (-j 1) ==="
echo "Expected: ~3 seconds"
time gsc rules execute \
  --context "$FIXTURE" \
  --rules "$RULES_FILE" \
  -j 1
echo ""

# Test parallel execution
echo "=== Parallel Execution (-j 3) ==="
echo "Expected: ~1 second"
time gsc rules execute \
  --context "$FIXTURE" \
  --rules "$RULES_FILE" \
  -j 3
echo ""

echo "=== Test Complete ==="
echo "If parallel execution was ~3x faster, the test passed!"
