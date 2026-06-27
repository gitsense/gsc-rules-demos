// Exit command alias trigger
// Intercepts "exit" and shows guidance to use /quit instead

const context = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));

const text = context.payload?.prompt?.text || '';

// Match "exit" command (with optional whitespace)
if (/^\s*exit\s*$/.test(text)) {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    notice: "Pi uses /quit to exit. Type /quit or press Ctrl+D."
  }));
} else {
  console.log(JSON.stringify({ matched: false, block: false }));
}
