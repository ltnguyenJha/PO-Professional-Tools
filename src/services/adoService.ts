import * as azdev from 'azure-devops-node-api';
import { IJsonPatchOperation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { AdoSettings, PbiDraft } from '../shared/messages';

export interface PushResult {
  createdIds: number[];
}

export class AdoService {
  public async pushDrafts(
    settings: AdoSettings,
    pat: string,
    drafts: PbiDraft[]
  ): Promise<PushResult> {
    const authHandler = azdev.getPersonalAccessTokenHandler(pat);
    const connection = new azdev.WebApi(settings.orgUrl, authHandler);
    const witApi = await connection.getWorkItemTrackingApi();

    const createdIds: number[] = [];

    for (const draft of drafts) {
      const patch = this.buildPatch(settings, draft);
      try {
        const item = await witApi.createWorkItem(
          undefined,
          patch,
          settings.projectName,
          'Product Backlog Item'
        );
        if (item.id) {
          createdIds.push(item.id);
        }
      } catch {
        const fallback = await witApi.createWorkItem(undefined, patch, settings.projectName, 'User Story');
        if (fallback.id) {
          createdIds.push(fallback.id);
        }
      }
    }

    return { createdIds };
  }

  private buildPatch(settings: AdoSettings, draft: PbiDraft): IJsonPatchOperation[] {
    const acceptanceCriteria = `<ul>${draft.acceptanceCriteria.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    const testScenarios = `<ul>${draft.testScenarios.map((item) => `<li>${item}</li>`).join('')}</ul>`;

    const description = [
      `<p>${draft.description}</p>`,
      '<h3>Acceptance Criteria</h3>',
      acceptanceCriteria,
      '<h3>Test Scenarios</h3>',
      testScenarios,
      '<h3>AI Notes</h3>',
      `<p>Generated from local repository analysis. Project Id: ${draft.projectId}</p>`
    ].join('');

    const patch: IJsonPatchOperation[] = [
      { op: 'add', path: '/fields/System.Title', value: draft.title },
      { op: 'add', path: '/fields/System.Description', value: description },
      { op: 'add', path: '/fields/System.Tags', value: 'AI-Generated;PO-Tools' }
    ];

    patch.push({
      op: 'add',
      path: '/fields/Microsoft.VSTS.Scheduling.Effort',
      value: draft.effortDays
    });

    if (settings.areaPath) {
      patch.push({ op: 'add', path: '/fields/System.AreaPath', value: settings.areaPath });
    }

    const iterationPath = settings.iterationPath || `${settings.projectName}\\${draft.iteration}`;
    patch.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });

    return patch;
  }
}
