#!/usr/bin/env node
/**
 * Local port of .github/workflows/squad-heartbeat.yml
 * Triage untriaged squad issues and apply labels via gh CLI.
 *
 * Usage:
 *   node .cursor/workflows/ralph-heartbeat.js
 *   GITHUB_TOKEN=$(gh auth token) node .cursor/workflows/ralph-heartbeat.js
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const TRIAGE_SCRIPT = path.join(REPO_ROOT, '.squad/templates/ralph-triage.js');
const OUTPUT = path.join(REPO_ROOT, '.cursor/workflows/.ralph-triage-results.json');

function gh(args) {
  return execSync(`gh ${args}`, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return gh('auth token');
  } catch {
    throw new Error('gh not authenticated — run: gh auth login');
  }
}

function runTriage(token) {
  if (!fs.existsSync(TRIAGE_SCRIPT)) {
    throw new Error(`Missing ${TRIAGE_SCRIPT} — run squad upgrade`);
  }
  const result = spawnSync(
    process.execPath,
    [TRIAGE_SCRIPT, '--squad-dir', '.squad', '--output', OUTPUT],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_TOKEN: token },
    }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'ralph-triage failed');
  }
  if (!fs.existsSync(OUTPUT)) return [];
  return JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
}

function applyTriage(decision) {
  const body = [
    '### 🔄 Ralph — Auto-Triage (local)',
    '',
    `**Assigned to:** ${decision.assignTo}`,
    `**Reason:** ${decision.reason}`,
    `**Source:** ${decision.source}`,
    '',
    '> Triaged by `.cursor/workflows/ralph-heartbeat.js` (Cursor local workflow).',
    '> To reassign, swap the `squad:*` label.',
  ].join('\n');

  gh(`issue edit ${decision.issueNumber} --add-label "${decision.label}"`);
  gh(`issue comment ${decision.issueNumber} --body "${body.replace(/"/g, '\\"')}"`);
}

function main() {
  const token = getToken();
  const results = runTriage(token);

  if (results.length === 0) {
    console.log('📋 Board is clear — Ralph found no untriaged squad issues');
    return;
  }

  for (const decision of results) {
    try {
      applyTriage(decision);
      console.log(`✅ Triaged #${decision.issueNumber} → ${decision.assignTo} (${decision.label})`);
    } catch (err) {
      console.error(`⚠️ Failed #${decision.issueNumber}: ${err.message}`);
    }
  }

  console.log(`🔄 Ralph triaged ${results.length} issue(s)`);
}

main();
