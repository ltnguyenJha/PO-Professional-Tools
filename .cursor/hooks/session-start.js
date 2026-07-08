#!/usr/bin/env node
/**
 * Squad session-start hook for Cursor (PO-Professional-Tools).
 * Injects team context + GitHub backlog snapshot at session start.
 * Output: JSON with additional_context (Cursor schema).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function readSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return null;
  }
}

function runGh(args) {
  try {
    return execSync(`gh ${args}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 8000,
    }).trim();
  } catch {
    return null;
  }
}

function main() {
  const cwd = process.cwd();
  const lines = ['## Squad session context (auto-injected)'];

  const nowPath = path.join(cwd, '.squad', 'identity', 'now.md');
  const now = readSafe(nowPath);
  if (now) {
    const focus = now.split('\n').find((l) => l.startsWith('focus_area:'));
    if (focus) lines.push(`- Focus: ${focus.replace('focus_area:', '').trim()}`);
    else lines.push('- Focus: see .squad/identity/now.md');
  }

  const decisions = readSafe(path.join(cwd, '.squad', 'decisions.md'));
  if (decisions) {
    const activeIdx = decisions.indexOf('## Active Decisions');
    if (activeIdx >= 0) {
      const snippet = decisions.slice(activeIdx, activeIdx + 600);
      lines.push('- Decisions: read .squad/decisions.md before implementing');
      const firstDecision = snippet.match(/### [^\n]+/);
      if (firstDecision) lines.push(`- Latest decision topic: ${firstDecision[0].replace('### ', '')}`);
    }
  }

  const ghAuth = runGh('auth status 2>&1');
  if (ghAuth && ghAuth.includes('Logged in')) {
    const issues = runGh(
      'issue list --state open --json number,title,labels --limit 15'
    );
    if (issues) {
      try {
        const parsed = JSON.parse(issues);
        const squadIssues = parsed.filter((i) =>
          (i.labels || []).some((l) => (l.name || l).toString().startsWith('squad'))
        );
        if (squadIssues.length > 0) {
          lines.push('- Open squad issues:');
          squadIssues.slice(0, 5).forEach((i) => {
            const labels = (i.labels || []).map((l) => l.name || l).join(', ');
            lines.push(`  - #${i.number}: ${i.title} (${labels})`);
          });
          lines.push('- Proactively offer to pick up the highest-priority issue.');
        } else {
          lines.push('- No open squad-labeled issues found.');
        }
      } catch {
        lines.push('- gh available; run squad issue scan manually.');
      }
    }
  } else {
    lines.push('- gh not authenticated — skip issue scan (run `gh auth login` for proactive backlog).');
  }

  lines.push('');
  lines.push('## PR Pre-Flight (before gh pr create)');
  lines.push('- Run: `npm run lint` (extension) + `npx tsc --noEmit` (extension + webview-ui)');
  lines.push('- Run: `npm run build` — extension + webview must compile');
  lines.push('- Never work on `main` — use feature branch + PR (see `.squad/git-workflow.md`)');
  lines.push('');
  lines.push('## FORCE Squad (mandatory)');
  lines.push('- You are the Coordinator — NOT a solo implementer or analyst.');
  lines.push('- EVERY domain task: acknowledge → Task (spawn .squad/ member) → relay in member voice.');
  lines.push('- Forbidden: long solo diagnosis, code changes, or reviews without Task spawn.');
  lines.push('- Charters: .squad/agents/{name}/charter.md · Protocol: .github/agents/squad.agent.md');
  lines.push('- Rules: .cursor/rules/squad-force.mdc + .cursor/agents/squad.md');

  const payload = {
    additional_context: lines.join('\n'),
    continue: true,
  };

  process.stdout.write(JSON.stringify(payload));
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', main);
process.stdin.resume();
