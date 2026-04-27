import { AdoSettings, PbiDraft } from './messages';

/**
 * Last segment of an Azure DevOps iteration path for display on drafts, e.g.
 * `Contoso\\PayRailz Team\\Sprint 42` → `Sprint 42`.
 */
export function iterationLeafFromPath(path: string | undefined): string | undefined {
  if (!path?.trim()) {
    return undefined;
  }
  const normalized = path.trim().replace(/\//g, '\\');
  const parts = normalized.split('\\').filter((p) => p.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : undefined;
}

/**
 * Resolves `System.IterationPath` for work item create: prefers Settings, then a full path on the draft, else `projectName\\leaf`.
 */
export function resolveIterationPathForPush(settings: AdoSettings, draft: PbiDraft): string {
  const configured = settings.iterationPath?.trim();
  if (configured) {
    return configured.replace(/\//g, '\\');
  }
  const d = draft.iteration.trim();
  if (d.includes('\\')) {
    return d.replace(/\//g, '\\');
  }
  return `${settings.projectName}\\${d}`;
}
