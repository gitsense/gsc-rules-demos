// Invalid JSON test trigger
// Returns invalid JSON to test error handling

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';

// Only match files in errors directory
if (!file.includes('/errors/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Output invalid JSON
console.log('This is not valid JSON { broken: true');
