// Accounting file read trigger
// Inspects context to provide file-specific guidance

const context = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));

const file = context.payload?.toolCall?.file || '';
const action = context.payload?.toolCall?.action || '';

// Only match accounting ledger files
if (!file.includes('accounting') || !file.endsWith('.ledger')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Provide guidance based on action
let message = '';
if (action === 'read') {
  message = `This is a pipe-delimited accounting ledger.\n\nFormat: date | type | amount | account | reference\n\nUse \`gsc query --file ${context.repo?.normalizedFile || file} --topic accounting\` for metadata and analysis context.`;
} else if (action === 'edit' || action === 'write') {
  message = `WARNING: You are modifying an accounting ledger file.\n\nPlease ensure:\n1. All entries follow the format: date | type | amount | account | reference\n2. Amounts are formatted with 2 decimal places\n3. Types are either DEBIT or CREDIT\n4. Run \`gsc query --file ${context.repo?.normalizedFile || file} --topic accounting\` before making changes`;
}

console.log(JSON.stringify({
  matched: true,
  block: true,
  message: message
}));
