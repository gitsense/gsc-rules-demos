// AI provenance ledger trigger.
// Records successful AI edits to third_party files as pending provenance entries.

import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";

const context = JSON.parse(readFileSync(0, "utf8"));
const toolResult = context.toolResult || context.payload?.toolResult || {};
const toolCall = context.toolCall || context.payload?.toolCall || {};
const input = toolResult.input || toolCall.input || {};
const action = toolCall.action || toolResult.action || toolResult.toolName || toolCall.toolName || "";
const isError = Boolean(toolResult.isError);
const repoRoot = context.repo?.root || context.session?.cwd || process.cwd();
const inputPath = input.path || input.file || toolCall.file || "";
const absoluteFile = normalizePath(inputPath, repoRoot);
const normalizedFile = normalizeRepoPath(context.repo?.normalizedFile || inputPath || absoluteFile, repoRoot);

if (isError || !["edit", "write"].includes(action) || !normalizedFile.startsWith("third_party/")) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

const ledgerPath = join(repoRoot, ".gitsense", "ai-provenance.jsonl");
mkdirSync(dirname(ledgerPath), { recursive: true });

let afterHash = "";
try {
  afterHash = sha256(readFileSync(absoluteFile));
} catch {
  afterHash = "";
}

const entry = {
  id: `prov_${Date.now().toString(36)}_${sha256(`${context.session?.id || "session"}:${toolResult.toolCallId || toolCall.id || "call"}:${normalizedFile}`).slice(0, 12)}`,
  createdAt: new Date().toISOString(),
  sessionId: context.session?.id || "unknown",
  sessionPath: context.session?.path || "unknown",
  leafId: context.conversation?.leafId || "unknown",
  messageIds: context.conversation?.messageIds || [],
  toolCallId: toolResult.toolCallId || toolCall.id || "unknown",
  file: normalizedFile,
  action,
  model: context.model || null,
  status: "pending",
  summary: "TODO: describe why this AI-authored third-party change was made before finishing.",
  afterHash,
};

appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`);

const message = [
  `AI provenance entry created for ${normalizedFile}.`,
  `Update .gitsense/ai-provenance.jsonl entry ${entry.id} before finishing: replace the TODO summary and set status to "complete".`,
].join(" ");

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: message,
  message,
  deliveryMode: "passiveSteer",
}));

function normalizePath(file, cwd) {
  if (!file) return cwd;
  return file.startsWith("/") ? file : resolve(cwd, file);
}

function normalizeRepoPath(file, cwd) {
  if (!file) return "";
  if (file.startsWith("/")) return relative(cwd, file).replaceAll("\\", "/");
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
