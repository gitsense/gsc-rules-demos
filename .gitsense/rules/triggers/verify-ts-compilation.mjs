import { execSync } from "child_process";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const ctx = JSON.parse(Buffer.concat(chunks).toString("utf8"));

const isEdit = ctx.toolCall?.action === "edit";
const isTypeScriptFile =
  ctx.repo?.normalizedFile?.match(/\.(ts|tsx)$/);

const applies = isEdit && isTypeScriptFile;

if (!applies) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

let compilationFailed = false;
let errorMessage = "";

try {
  execSync("npx tsc --noEmit 2>&1", {
    cwd: ctx.repo?.root || process.cwd(),
    encoding: "utf8",
    timeout: 30000,
  });
} catch (err) {
  compilationFailed = true;
  // Extract relevant error output (limit to 50 lines)
  const lines = (err.stdout || err.stderr || "").split("\n");
  const errorLines = lines.filter((l) => l.includes("error TS")).slice(0, 50);
  errorMessage = errorLines.length > 0 ? errorLines.join("\n") : "TypeScript compilation failed.";
}

console.log(
  JSON.stringify({
    matched: true,
    block: compilationFailed,
    message: compilationFailed
      ? `TypeScript compilation failed after editing ${ctx.repo?.normalizedFile}. Fix these errors before continuing:\n\n${errorMessage}`
      : undefined,
    notice: compilationFailed
      ? "Blocked: TypeScript compilation errors detected."
      : "TypeScript compilation passed.",
  })
);
