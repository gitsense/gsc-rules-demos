// Non-blocking capability test trigger
// Tests canBlock=false behavior

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const toolResult = context.toolResult || context.payload?.toolResult || {};
const file = toolCall.file || toolResult.input?.path || '';

// Only match files in capabilities directory
if (!file.includes('/capabilities/') && !context.repo?.normalizedFile?.startsWith('src/capabilities/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Return a notice (block will be forced to notice when canBlock=false)
console.log(JSON.stringify({
  matched: true,
  block: true,
  message: "NON-BLOCKING TEST: This trigger attempted to block, but canBlock=false forces it to a notice."
}));
