// Error handling test trigger
// Intentionally throws an error to test fail-open behavior

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';

// Only match files in errors directory
if (!file.includes('/errors/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Throw an error to test fail-open behavior
throw new Error('Intentional error for testing fail-open behavior');
