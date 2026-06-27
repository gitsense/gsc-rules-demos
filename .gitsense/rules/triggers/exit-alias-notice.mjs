// Exit command alias trigger
// Intercepts "exit" and shows guidance to use /quit instead

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const text = (context.payload?.prompt?.text || '').trim();
const ruleId = context.rule?.id || '019f0722-cd4b';

// Exact match for "exit" command
if (text === 'exit') {
  const notice = [
    "Input intercepted: 'exit' is not a valid Pi command. Use /quit or Ctrl+D.",
    "",
    `To learn more about this rule, ask the agent: \"show me rule ${ruleId} --format json\"`,
    `Or run: gsc rules show ${ruleId} --format json`,
    "",
    "To add more command aliases (like 'clear' or 'ls'), simply ask the AI to update the rules."
  ].join('\n');

  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: "Pi uses /quit to exit. Type /quit or press Ctrl+D.",
    notice
  }));
} else {
  console.log(JSON.stringify({ matched: false, block: false }));
}
