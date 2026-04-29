import * as azdev from 'azure-devops-node-api';
import { JsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { Readable } from 'stream';
import {
  AdoSettings,
  AdoWorkItemType,
  PbiAttachment,
  PbiDraft
} from '../shared/messages';
import { resolveIterationPathForPush } from '../shared/iterationUtils';

// The azure-devops-node-api typings declare `op` as the `Operation` enum (numeric),
// but the REST endpoint expects the string verb ('add', 'remove', ...). We keep the
// string form at runtime and use this loose shape for authoring the document.
type PatchEntry = { op: string; path: string; value?: unknown };
type FieldPatchOp = 'add' | 'replace';
const asPatch = (entries: PatchEntry[]): JsonPatchOperation[] =>
  entries as unknown as JsonPatchOperation[];

const MAX_ATTACHMENT_BYTES = 28 * 1024 * 1024;

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
        const patch = asPatch(this.buildFieldPatches(settings, draft, 'add'));
        const type = this.resolveWorkItemType(settings, draft);
        const item = await witApi.createWorkItem(undefined, patch, settings.projectName, type);
        if (item.id) {
          created.push({
            draftId: draft.id,
            workItemId: item.id,
            workItemUrl: item._links?.html?.href ?? this.buildBrowserUrl(settings, item.id)
          });
          if (draft.attachments && draft.attachments.length > 0) {
            try {
              await this.syncAttachments(witApi, settings, item.id, draft.attachments);
            } catch (attachErr) {
              const msg = attachErr instanceof Error ? attachErr.message : String(attachErr);
              errors.push({
                draftId: draft.id,
                message: `Work item #${item.id} was created but attachment upload failed: ${msg}`
              });
            }
          }
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
        const basePatch = this.buildFieldPatches(settings, draft, 'add');
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

  /**
   * Applies field updates to an existing work item (after initial push).
   * Optionally uploads and links attachments (diagrams, mermaid exports, etc.).
   */
  public async updateDraftInAdo(
    settings: AdoSettings,
    pat: string,
    draft: PbiDraft,
    workItemId: number
  ): Promise<void> {
    const connection = this.createConnection(settings, pat);
    const witApi = await connection.getWorkItemTrackingApi();
    const patch = asPatch(this.buildFieldPatches(settings, draft, 'replace'));
    await witApi.updateWorkItem(undefined, patch, workItemId, settings.projectName);
    if (draft.attachments && draft.attachments.length > 0) {
      try {
        await this.syncAttachments(witApi, settings, workItemId, draft.attachments);
      } catch (attachErr) {
        const msg = attachErr instanceof Error ? attachErr.message : String(attachErr);
        throw new Error(`Work item fields were updated but attachment upload failed: ${msg}`);
      }
    }
  }

  private async syncAttachments(
    witApi: Awaited<ReturnType<azdev.WebApi['getWorkItemTrackingApi']>>,
    settings: AdoSettings,
    workItemId: number,
    attachments: PbiAttachment[]
  ): Promise<void> {
    const project = settings.projectName;
    const areaPath = settings.areaPath;

    for (const att of attachments) {
      let buffer: Buffer;
      try {
        buffer = Buffer.from(att.dataBase64, 'base64');
      } catch {
        continue;
      }
      if (buffer.length === 0 || buffer.length > MAX_ATTACHMENT_BYTES) {
        continue;
      }

      const stream = Readable.from(buffer);
      const ref = await witApi.createAttachment(
        undefined,
        stream,
        att.fileName,
        'Simple',
        project,
        areaPath
      );
      if (!ref?.url) {
        continue;
      }

      const relPatch = asPatch([
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'AttachedFile',
            url: ref.url,
            attributes: { comment: 'PO Tools' }
          }
        }
      ]);
      await witApi.updateWorkItem(undefined, relPatch, workItemId, project);
    }
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

  private buildFieldPatches(
    settings: AdoSettings,
    draft: PbiDraft,
    op: FieldPatchOp
  ): PatchEntry[] {
    const acceptanceCriteriaHtml = `<ul>${draft.acceptanceCriteria
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join('')}</ul>`;
    const testScenariosHtml = `<ul>${draft.testScenarios
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join('')}</ul>`;

    const descriptionParts = [`<p>${this.escapeHtml(draft.description)}</p>`];
    
    // Add User Story Statement section if present
    if (draft.userStoryStatement) {
      descriptionParts.push(
        '<h3>User Story Statement</h3>',
        `<p>${this.escapeHtml(draft.userStoryStatement)}</p>`
      );
    }
    
    // Add Business Rules and Assumptions section (immediately after user story)
    const businessRules = draft.businessRulesAndAssumptions?.trim() || '';
    const businessRulesValue = businessRules.length > 0 ? businessRules : 'NA';
    descriptionParts.push(
      '<h3>Business Rules and Assumptions</h3>',
      `<p>${this.escapeHtml(businessRulesValue)}</p>`
    );
    
    if (draft.testScenarios.length > 0) {
      descriptionParts.push('<h3>Test Scenarios</h3>', testScenariosHtml);
    }
    
    // Add Technical Considerations section if present
    if (draft.technicalConsiderations) {
      const tcItems: string[] = [];
      if (draft.technicalConsiderations.technicalDetails) {
        tcItems.push(draft.technicalConsiderations.technicalDetails);
      }
      if (draft.technicalConsiderations.scopedFiles && draft.technicalConsiderations.scopedFiles.length > 0) {
        tcItems.push(`Scoped Files: ${draft.technicalConsiderations.scopedFiles.join(', ')}`);
      }
      if (draft.technicalConsiderations.architectureNotes) {
        tcItems.push(draft.technicalConsiderations.architectureNotes);
      }
      
      if (tcItems.length > 0) {
        const tcHtml = `<ul>${tcItems
          .map((item) => `<li>${this.escapeHtml(item)}</li>`)
          .join('')}</ul>`;
        descriptionParts.push('<h3>Technical Considerations</h3>', tcHtml);
      }
    }
    
    descriptionParts.push(
      '<h3>PO Tools Metadata</h3>',
      `<p>Project Id: ${this.escapeHtml(draft.projectId)}</p>`
    );
    const description = descriptionParts.join('');

    const entries: PatchEntry[] = [
      { op, path: '/fields/System.Title', value: draft.title },
      { op, path: '/fields/System.Description', value: description },
      { op, path: '/fields/System.Tags', value: 'AI-Generated;PO-Tools' },
      {
        op,
        path: '/fields/Microsoft.VSTS.Scheduling.Effort',
        value: draft.effortDays
      }
    ];

    if (settings.areaPath) {
      entries.push({ op, path: '/fields/System.AreaPath', value: settings.areaPath });
    }

    if (draft.acceptanceCriteria.length > 0) {
      entries.push({
        op,
        path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria',
        value: acceptanceCriteriaHtml
      });
    }

    const iterationPath = resolveIterationPathForPush(settings, draft);
    entries.push({ op, path: '/fields/System.IterationPath', value: iterationPath });

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
