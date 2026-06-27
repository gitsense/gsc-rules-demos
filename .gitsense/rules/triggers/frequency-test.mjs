// Frequency test trigger
// Returns a notice to test frequency modes (once-per-rule-hash vs always)

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const file = context.payload?.toolCall?.file || '';

// Only match files in frequency directory
if (!file.includes('/frequency/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Return a notice
console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: `Frequency test trigger executed for: ${context.repo?.normalizedFile || file}`
}));
