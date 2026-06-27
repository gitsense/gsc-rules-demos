// Config file guard trigger
// Blocks edits to production configuration files

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';
const action = toolCall.action || toolCall.toolName || '';

// Only match config files
if (!file.includes('/config/') || !file.endsWith('.env')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Block edits to config files
if (action === 'edit' || action === 'write') {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: `CONFIG FILE GUARD\n\nYou are attempting to modify a configuration file.\n\nFile: ${context.repo?.normalizedFile || file}\nAction: ${action}\n\nProduction configuration changes require deployment approval.\n\nPlease:\n1. Verify the change is necessary\n2. Create a PR with the proposed changes\n3. Request review from the DevOps team\n4. Wait for approval before merging`
  }));
} else {
  // Reading is allowed
  console.log(JSON.stringify({ matched: false, block: false }));
}
