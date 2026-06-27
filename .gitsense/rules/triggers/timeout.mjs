// Timeout test trigger
// Sleeps for 30 seconds to trigger timeout

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';

// Only match files in errors directory
if (!file.includes('/errors/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Sleep for 30 seconds to trigger timeout
await new Promise(resolve => setTimeout(resolve, 30000));

// This should never be reached
console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: "This should not appear if timeout works"
}));
