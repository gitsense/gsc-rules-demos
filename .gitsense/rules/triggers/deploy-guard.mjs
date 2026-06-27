// Deployment workflow guard trigger
// Blocks direct edits to deployment workflows without approval

import { readFileSync } from 'node:fs';
const context = JSON.parse(readFileSync(0, 'utf8'));

const toolCall = context.toolCall || context.payload?.toolCall || {};
const file = toolCall.file || '';
const action = toolCall.action || toolCall.toolName || '';

// Only match deployment workflow files
// Check both absolute path and normalized path
const normalizedFile = context.repo?.normalizedFile || '';
if ((!file.includes('.github/workflows') || !file.includes('deploy')) &&
    (!normalizedFile.includes('.github/workflows') || !normalizedFile.includes('deploy'))) {
  console.log(JSON.stringify({ matched: false, block: false }));
  process.exit(0);
}

// Block edits to deployment workflows
if (action === 'edit' || action === 'write') {
  console.log(JSON.stringify({
    matched: true,
    block: true,
    message: `DEPLOYMENT WORKFLOW GUARD\n\nYou are attempting to modify a deployment workflow file.\n\nFile: ${context.repo?.normalizedFile || file}\nAction: ${action}\n\nThis requires explicit approval from the DevOps team.\n\nPlease:\n1. Create a PR with the proposed changes\n2. Request review from @devops-team\n3. Wait for approval before merging\n\nBypassing this guard may result in production outages.`
  }));
} else {
  // Reading is allowed
  console.log(JSON.stringify({ matched: false, block: false }));
}
