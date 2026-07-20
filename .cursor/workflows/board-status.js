#!/usr/bin/env node
/**
 * Local Ralph board status — mirrors squad.agent.md "Ralph on the Board" format.
 * Usage: node .cursor/workflows/board-status.js
 */
const { execSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

function ghJson(args) {
  const out = execSync(`gh ${args}`, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out);
}

function hasSquadMemberLabel(labels) {
  return labels.some((l) => {
    const name = (l.name || l).toString();
    return name.startsWith('squad:') && name !== 'squad:copilot';
  });
}

function main() {
  try {
    execSync('gh auth status', { cwd: REPO_ROOT, stdio: 'ignore' });
  } catch {
    console.log('gh not authenticated — run: gh auth login');
    process.exit(1);
  }

  const issues = ghJson(
    'issue list --state open --json number,title,labels,assignees --limit 50'
  );
  const prs = ghJson(
    'pr list --state open --json number,title,reviewDecision,isDraft,statusCheckRollup --limit 20'
  );

  const squadIssues = issues.filter((i) =>
    (i.labels || []).some((l) => (l.name || l).toString().startsWith('squad'))
  );

  const untriaged = squadIssues.filter(
    (i) =>
      (i.labels || []).some((l) => (l.name || l) === 'squad') &&
      !hasSquadMemberLabel(i.labels || [])
  );

  const assigned = squadIssues.filter((i) => hasSquadMemberLabel(i.labels || []));

  const draftPrs = prs.filter((p) => p.isDraft);
  const readyPrs = prs.filter(
    (p) =>
      !p.isDraft &&
      p.reviewDecision === 'APPROVED' &&
      !(p.statusCheckRollup || []).some((c) => c.conclusion === 'FAILURE')
  );

  console.log('🔄 Ralph — Work Monitor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Board Status:');
  console.log(`  🔴 Untriaged:    ${untriaged.length} issue(s)`);
  console.log(`  🟡 In Progress:  ${assigned.length} assigned, ${draftPrs.length} draft PR(s)`);
  console.log(`  🟢 Ready:        ${readyPrs.length} PR(s) approved`);

  if (untriaged[0]) {
    console.log(`\nNext action: Triaging #${untriaged[0].number} — "${untriaged[0].title}"`);
  } else if (assigned[0]) {
    console.log(`\nNext action: Pick up #${assigned[0].number} — "${assigned[0].title}"`);
  } else {
    console.log('\n📋 Board is clear.');
  }
}

main();
