import * as azdev from 'azure-devops-node-api';
import { JsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import {
  AdoSettings,
  AdoWorkItemType,
  PbiDraft
} from '../shared/messages';
import { resolveIterationPathForPush } from '../shared/iterationUtils';

// The azure-devops-node-api typings declare `op` as the `Operation` enum (numeric),
// but the REST endpoint expects the string verb ('add', 'remove', ...). We keep the
// string form at runtime and use this loose shape for authoring the document.
type PatchEntry = { op: string; path: string; value: unknown };
const asPatch = (entries: PatchEntry[]): JsonPatchOperation[] =>
  entries as unknown as JsonPatchOperation[];

export interface PushItemResult {
  draftId: string;
  workItemId: number;
  workItemUrl?: string;
}

export interface PushResult {
  created: PushItemResult[];
  errors: Array<{ draftId: string; message: string }>;
}

export interface BulkPushResult extends PushResult {
  parent?: PushItemResult;
}

export class AdoService {
  public async testConnection(settings: AdoSettings, pat: string): Promise<void> {
    const connection = this.createConnection(settings, pat);
    const core = await connection.getCoreApi();
    const wanted = settings.projectName.trim();
    try {
      const project = await core.getProject(wanted);
      if (project?.id) {
        return;
      }
      throw new Error(`Project "${wanted}" returned no id.`);
    } catch (first) {
      let hint = '';
      try {
        const all = await core.getProjects();
        const names = (all ?? [])
          .map((p) => p.name)
          .filter((n): n is string => typeof n === 'string' && n.length > 0);
        if (names.length > 0) {
          const match = names.find((n) => n.toLowerCase() === wanted.toLowerCase());
          if (match && match !== wanted) {
            hint += ` Use the exact project name as shown in Azure DevOps: "${match}".`;
          }
          hint += ` Projects visible with this token (sample): ${names.slice(0, 15).join(', ')}${names.length > 15 ? ' …' : ''}.`;
        }
      } catch {
        // ignore listing failure
      }
      const base = first instanceof Error ? first.message : String(first);
      throw new Error(
        `${base} Check Organization URL (e.g. https://dev.azure.com/your-org), project name, and PAT scope (Work Items: Read).${hint}`
      );
    }
  }

  public async pushDrafts(
    settings: AdoSettings,
    pat: string,
    drafts: PbiDraft[]
  ): Promise<PushResult> {
    const connection = this.createConnection(settings, pat);
    const witApi = await connection.getWorkItemTrackingApi();

    const created: PushItemResult[] = [];
    const errors: PushResult['errors'] = [];

    for (const draft of drafts) {
      try {
        const patch = asPatch(this.buildPatchEntries(settings, draft));
        const type = this.resolveWorkItemType(settings, draft);
        const item = await witApi.createWorkItem(undefined, patch, settings.projectName, type);
        if (item.id) {
          created.push({
            draftId: draft.id,
            workItemId: item.id,
            workItemUrl: item._links?.html?.href ?? this.buildBrowserUrl(settings, item.id)
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ draftId: draft.id, message });
      }
    }

    return { created, errors };
  }

  public async pushWithParent(
    settings: AdoSettings,
    pat: string,
    parent: {
      title: string;
      description: string;
      workItemType: AdoWorkItemType;
      iteration?: string;
    },
    children: PbiDraft[]
  ): Promise<BulkPushResult> {
    const connection = this.createConnection(settings, pat);
    const witApi = await connection.getWorkItemTrackingApi();

    const parentEntries: PatchEntry[] = [
      { op: 'add', path: '/fields/System.Title', value: parent.title },
      { op: 'add', path: '/fields/System.Description', value: `<p>${parent.description}</p>` },
      { op: 'add', path: '/fields/System.Tags', value: 'AI-Generated;PO-Tools;Bulk-Parent' }
    ];

    if (settings.areaPath) {
      parentEntries.push({ op: 'add', path: '/fields/System.AreaPath', value: settings.areaPath });
    }
    const parentIteration = parent.iteration || settings.iterationPath;
    if (parentIteration) {
      parentEntries.push({ op: 'add', path: '/fields/System.IterationPath', value: parentIteration });
    }
    const parentPatch = asPatch(parentEntries);

    const parentItem = await witApi.createWorkItem(
      undefined,
      parentPatch,
      settings.projectName,
      parent.workItemType
    );

    if (!parentItem.id) {
      throw new Error('Failed to create parent work item in Azure DevOps.');
    }

    const parentResult: PushItemResult = {
      draftId: 'parent',
      workItemId: parentItem.id,
      workItemUrl: parentItem._links?.html?.href ?? this.buildBrowserUrl(settings, parentItem.id)
    };

    const parentApiUrl = `${this.trimSlash(settings.orgUrl)}/_apis/wit/workItems/${parentItem.id}`;

    const created: PushItemResult[] = [];
    const errors: BulkPushResult['errors'] = [];

    for (const draft of children) {
      try {
        const basePatch = this.buildPatchEntries(settings, draft);
        basePatch.push({
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: parentApiUrl
          }
        });
        const type = this.resolveWorkItemType(settings, draft);
        const item = await witApi.createWorkItem(
          undefined,
          asPatch(basePatch),
          settings.projectName,
          type
        );
        if (item.id) {
          created.push({
            draftId: draft.id,
            workItemId: item.id,
            workItemUrl: item._links?.html?.href ?? this.buildBrowserUrl(settings, item.id)
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ draftId: draft.id, message });
      }
    }

    return { parent: parentResult, created, errors };
  }

  private createConnection(settings: AdoSettings, pat: string): azdev.WebApi {
    const authHandler = azdev.getPersonalAccessTokenHandler(pat);
    const orgUrl = this.normalizeOrgUrl(settings.orgUrl);
    return new azdev.WebApi(orgUrl, authHandler);
  }

  /** Collection URL without trailing slash — required for reliable REST routing. */
  private normalizeOrgUrl(url: string): string {
    let u = url.trim();
    if (u.endsWith('/')) {
      u = u.slice(0, -1);
    }
    return u;
  }

  private resolveWorkItemType(settings: AdoSettings, draft: PbiDraft): string {
    return draft.workItemType || settings.defaultWorkItemType || 'Product Backlog Item';
  }

  private buildBrowserUrl(settings: AdoSettings, id: number): string {
    return `${this.trimSlash(settings.orgUrl)}/${encodeURIComponent(settings.projectName)}/_workitems/edit/${id}`;
  }

  private trimSlash(input: string): string {
    return input.endsWith('/') ? input.slice(0, -1) : input;
  }

  private buildPatchEntries(settings: AdoSettings, draft: PbiDraft): PatchEntry[] {
    const acceptanceCriteria = `<ul>${draft.acceptanceCriteria
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join('')}</ul>`;
    const testScenarios = `<ul>${draft.testScenarios
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join('')}</ul>`;

    const description = [
      `<p>${this.escapeHtml(draft.description)}</p>`,
      '<h3>Acceptance Criteria</h3>',
      acceptanceCriteria,
      '<h3>Test Scenarios</h3>',
      testScenarios,
      '<h3>PO Tools Metadata</h3>',
      `<p>Project Id: ${this.escapeHtml(draft.projectId)}</p>`
    ].join('');

    const entries: PatchEntry[] = [
      { op: 'add', path: '/fields/System.Title', value: draft.title },
      { op: 'add', path: '/fields/System.Description', value: description },
      { op: 'add', path: '/fields/System.Tags', value: 'AI-Generated;PO-Tools' },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.Scheduling.Effort',
        value: draft.effortDays
      }
    ];

    if (settings.areaPath) {
      entries.push({ op: 'add', path: '/fields/System.AreaPath', value: settings.areaPath });
    }

    const iterationPath = resolveIterationPathForPush(settings, draft);
    entries.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });

    return entries;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
