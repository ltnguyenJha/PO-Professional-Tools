import * as fs from 'fs';
import * as path from 'path';
import type { ProjectScanSummary } from '../shared/messages';

const MAX_OUTPUT_CHARS = 18_000;
const MAX_README_CHARS = 4_000;
const MAX_PACKAGE_JSON_CHARS = 6_000;
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'bin',
  'obj',
  '.vs',
  '__pycache__',
  'vendor'
]);

/**
 * Builds a bounded text snapshot of a linked repo for LM prompts (stack, layout, scan hints).
 * The AI uses this with the Product Manager rulebook to produce technically grounded backlog text.
 */
export function buildLinkedProjectContext(opts: {
  rootPath: string;
  projectName: string;
  scanSummary?: ProjectScanSummary;
}): string {
  const parts: string[] = [];
  parts.push('### Linked repository (PO Tools — use for technical alignment)');
  parts.push(`**Name:** ${opts.projectName}`);
  parts.push(`**Root:** ${opts.rootPath}`);
  parts.push('');
  parts.push(
    'Ground descriptions, acceptance criteria, and test ideas in this codebase: cite real folders, APIs, or patterns where relevant.'
  );
  parts.push('');

  if (opts.scanSummary) {
    const { routes, apiEndpoints, sqlObjects } = opts.scanSummary;
    parts.push('#### Repo scan highlights (from last Projects scan)');
    if (routes.length > 0) {
      parts.push(`**Routes (sample):** ${routes.slice(0, 25).join(', ')}`);
    }
    if (apiEndpoints.length > 0) {
      parts.push(`**API / endpoints (sample):** ${apiEndpoints.slice(0, 25).join(', ')}`);
    }
    if (sqlObjects.length > 0) {
      parts.push(`**SQL objects (sample):** ${sqlObjects.slice(0, 15).join(', ')}`);
    }
    if (routes.length + apiEndpoints.length + sqlObjects.length === 0) {
      parts.push('(No routes/APIs/SQL captured yet — run Scan in Projects for richer hints.)');
    }
    parts.push('');
  }

  const pkg = readPackageJsonSummary(opts.rootPath);
  if (pkg) {
    parts.push('#### package.json (summary)');
    parts.push(pkg);
    parts.push('');
  }

  const readme = readFileCap(path.join(opts.rootPath, 'README.md'), MAX_README_CHARS);
  if (readme) {
    parts.push('#### README (excerpt)');
    parts.push(readme);
    parts.push('');
  }

  const tree = buildPartialTree(opts.rootPath);
  if (tree) {
    parts.push('#### Layout (partial — key folders)');
    parts.push(tree);
    parts.push('');
  }

  let text = parts.join('\n');
  if (text.length > MAX_OUTPUT_CHARS) {
    text = text.slice(0, MAX_OUTPUT_CHARS) + '\n\n[…truncated for model context…]';
  }
  return text;
}

function readFileCap(filePath: string, max: number): string | null {
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile() || st.size > max * 4) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.length <= max ? raw : `${raw.slice(0, max)}\n[…]`;
  } catch {
    return null;
  }
}

function readPackageJsonSummary(root: string): string | null {
  const p = path.join(root, 'package.json');
  let raw: string;
  try {
    const st = fs.statSync(p);
    if (!st.isFile() || st.size > 256 * 1024) {
      return null;
    }
    raw = fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const deps = j.dependencies && typeof j.dependencies === 'object' ? j.dependencies : {};
    const devDeps =
      j.devDependencies && typeof j.devDependencies === 'object' ? j.devDependencies : {};
    const depKeys = [
      ...Object.keys(deps as object).slice(0, 35),
      ...Object.keys(devDeps as object).slice(0, 15)
    ];
    const name = typeof j.name === 'string' ? j.name : '(unnamed)';
    const scripts =
      j.scripts && typeof j.scripts === 'object'
        ? Object.keys(j.scripts as object).slice(0, 12).join(', ')
        : '';
    return [
      `name: ${name}`,
      scripts ? `scripts: ${scripts}` : '',
      depKeys.length > 0 ? `dependencies (sample): ${depKeys.join(', ')}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  } catch {
    return raw.length <= MAX_PACKAGE_JSON_CHARS ? raw : raw.slice(0, MAX_PACKAGE_JSON_CHARS);
  }
}

function buildPartialTree(root: string): string | null {
  const lines: string[] = [];
  try {
    const top = fs.readdirSync(root, { withFileTypes: true });
    const dirs = top
      .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
    const files = top
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
    for (const f of files.slice(0, 12)) {
      lines.push(f);
    }
    for (const d of dirs.slice(0, 20)) {
      lines.push(`${d}/`);
      if (['src', 'packages', 'apps', 'lib', 'server', 'api'].includes(d)) {
        const sub = path.join(root, d);
        try {
          const inner = fs.readdirSync(sub, { withFileTypes: true });
          for (const ent of inner.slice(0, 18)) {
            if (ent.isDirectory() && !SKIP_DIRS.has(ent.name)) {
              lines.push(`  ${d}/${ent.name}/`);
            } else if (ent.isFile()) {
              lines.push(`  ${d}/${ent.name}`);
            }
          }
        } catch {
          // ignore
        }
      }
      if (lines.length > 90) {
        break;
      }
    }
  } catch {
    return null;
  }
  return lines.length > 0 ? lines.join('\n') : null;
}
