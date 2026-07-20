#!/usr/bin/env node
/**
 * After a squad subagent completes, nudge the coordinator to synthesize
 * and consider follow-up work (Scribe, Ralph, chained tasks).
 */
const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let subagentType = 'agent';
  try {
    const evt = JSON.parse(input || '{}');
    subagentType = evt.subagent_type || evt.subagentType || subagentType;
  } catch {
    // ignore parse errors
  }

  const inboxDir = '.squad/decisions/inbox';
  let inboxCount = 0;
  try {
    inboxCount = fs.readdirSync(inboxDir).filter((f) => f.endsWith('.md')).length;
  } catch {
    inboxCount = 0;
  }

  const parts = [
    'Squad follow-up:',
    '- Present a 1-line outcome per agent to the user.',
    '- If multiple agents ran or decisions inbox has files, spawn Scribe to merge .squad/decisions/inbox/ → decisions.md.',
  ];

  if (inboxCount > 0) {
    parts.push(`- Decisions inbox has ${inboxCount} file(s) — Scribe merge recommended.`);
  }

  parts.push('- If Ralph is active, scan GitHub for next work item without waiting for user prompt.');

  process.stdout.write(
    JSON.stringify({
      followup_message: parts.join('\n'),
    })
  );
});

process.stdin.resume();
