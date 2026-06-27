// Config file guard trigger
// Blocks edits to production configuration files
// DevOps can bypass by setting AI_CONFIG_EDIT_APPROVED=true

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

// Check for environment variable bypass
const isApproved = process.env.AI_CONFIG_EDIT_APPROVED === 'true';

if (action === 'edit' || action === 'write') {
  if (isApproved) {
    // Allow with notice when approved
    console.log(JSON.stringify({
      matched: true,
      block: false,
      notice: `CONFIG FILE GUARD: Override detected (AI_CONFIG_EDIT_APPROVED=true). Allowing edit to ${context.repo?.normalizedFile || file}.`
    }));
  } else {
    // Block when not approved
    console.log(JSON.stringify({
      matched: true,
      block: true,
      message: `CONFIG FILE GUARD\n\nYou are attempting to modify a configuration file.\n\nFile: ${context.repo?.normalizedFile || file}\nAction: ${action}\n\nProduction configuration changes require deployment approval.\n\nTo allow AI edits to config files, set the environment variable:\n  export AI_CONFIG_EDIT_APPROVED=true\n\nThen restart Pi and try again.`
    }));
  }
} else {
  // Reading is allowed
  console.log(JSON.stringify({ matched: false, block: false }));
}
