# Bug: Missing `frequency` field in `rules-json` format

## Summary

The `gsc rules get --format rules-json` output is missing the `frequency` field for executable triggers. This field is present in `gsc rules show --format json` but not in the `rules-json` format.

## Evidence

**`gsc rules show 019f073b-cc8c --format json`** includes:
```json
{
  "id": "rule_019f073b-cc8c-7a61-8c94-b7d7b45ec396",
  "type": "executable",
  "trigger": {
    "runtime": "node",
    "entry": "frequency-test.mjs"
  },
  "frequency": {
    "mode": "once-per-rule-hash"
  }
}
```

**`gsc rules get --event pre_tool_use --action read --file src/frequency/repeated-read.txt --format rules-json`** returns:
```json
{
  "rules": [
    {
      "id": "rule_019f073b-cc8c-7a61-8c94-b7d7b45ec396",
      "type": "executable",
      "trigger": {
        "runtime": "node",
        "entry": "frequency-test.mjs"
      }
      // Missing frequency field!
    }
  ]
}
```

## Impact

pi-brains uses `gsc rules get --format rules-json` to get matching rules and needs the `frequency` field to:
1. Filter out triggers with `once-per-rule-hash` frequency that have already been delivered
2. Implement delivery tracking for triggers with explicit frequency settings

Without this field, triggers with `once-per-rule-hash` frequency fire every time instead of just once.

## Expected Fix

Add `frequency` to the `rules-json` output format, matching the structure in `gsc rules show`:

```json
{
  "rules": [
    {
      "id": "rule_019f073b-cc8c-7a61-8c94-b7d7b45ec396",
      "type": "executable",
      "trigger": {
        "runtime": "node",
        "entry": "frequency-test.mjs"
      },
      "frequency": {
        "mode": "once-per-rule-hash"
      }
    }
  ]
}
```

## Verification

After fix, this command should include the frequency field:
```bash
gsc rules get --event pre_tool_use --action read --file src/frequency/repeated-read.txt --format rules-json
```

Expected output should include:
```json
"frequency": {
  "mode": "once-per-rule-hash"
}
```
