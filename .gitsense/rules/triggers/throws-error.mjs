// Error handling test trigger
// Intentionally throws an error to test fail-open behavior

const context = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));

const file = context.payload?.toolCall?.file || '';

// Only match files in errors directory
if (!file.includes('/errors/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Throw an error to test fail-open behavior
throw new Error('Intentional error for testing fail-open behavior');
