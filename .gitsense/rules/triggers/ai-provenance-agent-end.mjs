// AI provenance completion gate.
// Reports pending third_party provenance entries at agent_end.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const context = JSON.parse(readFileSync(0, "utf8"));
const repoRoot = context.repo?.root || context.session?.cwd || process.cwd();
const ledgerPath = join(repoRoot, ".gitsense", "ai-provenance.jsonl");
const sessionId = context.session?.id || "";

if (!existsSync(ledgerPath)) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

const pending = readFileSync(ledgerPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(parseJsonLine)
  .filter(Boolean)
  .filter((entry) => entry.sessionId === sessionId && entry.status !== "complete");

if (pending.length === 0) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

const lines = pending.map((entry) => `- ${entry.id}: ${entry.file}`);
const message = [
  "AI provenance ledger has pending third_party entries for this session.",
  "Before final response, update .gitsense/ai-provenance.jsonl by replacing TODO summaries and setting status to \"complete\" for:",
  ...lines,
].join("\n");

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: message,
  message,
  deliveryMode: "followUp",
}));

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
