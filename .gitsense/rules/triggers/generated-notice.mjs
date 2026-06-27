// Generated file notice trigger
// Warns about auto-generated files without blocking

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';
const action = toolCall.action || toolCall.toolName || '';

// Only match files in generated directories
// Check both absolute path and normalized path
const normalizedFile = context.repo?.normalizedFile || '';
if (!file.includes('/generated/') && !file.includes('/auto-generated/') &&
    !normalizedFile.includes('/generated/') && !normalizedFile.includes('/auto-generated/') &&
    !normalizedFile.startsWith('src/generated/')) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Warn about editing generated files but don't block
if (action === 'edit' || action === 'write') {
  console.log(JSON.stringify({
    matched: true,
    block: false,
    notice: `WARNING: You are editing an auto-generated file.\n\nFile: ${context.repo?.normalizedFile || file}\n\nThis file will be overwritten on the next build. Consider:\n1. Editing the source schema/template instead\n2. Running the generator after your source changes\n3. Checking if your changes should be in a different file`
  }));
} else {
  // Reading is fine, no notice needed
  console.log(JSON.stringify({ matched: false, block: false }));
}
