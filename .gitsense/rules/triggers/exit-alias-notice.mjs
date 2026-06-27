// Exit command alias trigger
// Intercepts "exit" and shows guidance to use /quit instead

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const text = context.payload?.prompt?.text || '';

// Match "exit" command (with optional whitespace)
if (/^\s*exit\s*$/.test(text)) {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: "Pi uses /quit to exit. Type /quit or press Ctrl+D.",
    notice: "Input intercepted: 'exit' is not a valid Pi command. Use /quit or Ctrl+D."
  }));
} else {
  console.log(JSON.stringify({ matched: false, block: false }));
}
