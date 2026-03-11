import { ImportedProject, PbiDraft } from '../shared/messages';

const PBI_KEY = 'poTools.pbiDrafts';

export class PbiDraftService {
  public getAll(contextValue: { get<T>(key: string, defaultValue: T): T }): PbiDraft[] {
    return contextValue.get<PbiDraft[]>(PBI_KEY, []);
  }

  public async saveAll(
    contextValue: { update(key: string, value: unknown): Thenable<void> },
    drafts: PbiDraft[]
  ): Promise<void> {
    await contextValue.update(PBI_KEY, drafts);
  }

  public buildDrafts(project: ImportedProject): PbiDraft[] {
    const summary = project.scanSummary;
    if (!summary) {
      return [];
    }

    const routes = summary.routes.slice(0, 5);
    const endpoints = summary.apiEndpoints.slice(0, 5);

    const drafts: PbiDraft[] = [];

    for (const route of routes) {
      drafts.push(this.createRouteDraft(project, route));
    }

    for (const endpoint of endpoints) {
      drafts.push(this.createEndpointDraft(project, endpoint));
    }

    if (drafts.length === 0) {
      drafts.push(this.createPlatformDraft(project));
    }

    return drafts;
  }

  private createRouteDraft(project: ImportedProject, route: string): PbiDraft {
    const effort = this.scoreEffort(route.length);
    return {
      id: this.createId(project.id, route),
      projectId: project.id,
      title: `Improve UX flow for ${route}`,
      description: `Deliver a concise and reliable user journey for route ${route}, including clear state handling and validation boundaries.`,
      effortDays: effort,
      iteration: this.defaultIteration(),
      acceptanceCriteria: [
        `Given a user opens ${route}, when the page loads, then required data is visible within target response time.`,
        'Given invalid user input, when submission is attempted, then clear validation guidance is shown.',
        'Given expected business flow, when action completes, then user receives a success state and next-step guidance.'
      ],
      testScenarios: [
        `Route smoke test for ${route}`,
        `Validation behavior test for ${route}`,
        `Error fallback test for ${route}`
      ]
    };
  }

  private createEndpointDraft(project: ImportedProject, endpoint: string): PbiDraft {
    const effort = this.scoreEffort(endpoint.length + 1);
    return {
      id: this.createId(project.id, endpoint),
      projectId: project.id,
      title: `Stabilize API contract: ${endpoint}`,
      description: `Define and enforce a dependable API behavior for ${endpoint}, including validation, error semantics, and traceability for downstream teams.`,
      effortDays: effort,
      iteration: this.defaultIteration(),
      acceptanceCriteria: [
        `Given valid request data to ${endpoint}, when processed, then response payload aligns with documented contract.`,
        `Given invalid or incomplete request data, when processed, then API returns a predictable and documented error structure.`,
        `Given repeated calls to ${endpoint}, when monitored, then logs contain request correlation details.`
      ],
      testScenarios: [
        `Happy path API test for ${endpoint}`,
        `Validation failure API test for ${endpoint}`,
        `Observability test for ${endpoint}`
      ]
    };
  }

  private createPlatformDraft(project: ImportedProject): PbiDraft {
    return {
      id: this.createId(project.id, 'platform-hardening'),
      projectId: project.id,
      title: `Establish baseline quality for ${project.name}`,
      description: 'Create an initial backlog item that improves reliability, observability, and acceptance coverage for critical user paths.',
      effortDays: 2,
      iteration: this.defaultIteration(),
      acceptanceCriteria: [
        'Critical user paths are documented and validated.',
        'At least one automated test scenario is mapped to each critical flow.',
        'Definition of done includes acceptance criteria and test traceability.'
      ],
      testScenarios: [
        'Critical flow smoke test',
        'Regression checklist execution',
        'Error path verification'
      ]
    };
  }

  private scoreEffort(signal: number): 1 | 2 | 3 | 4 | 5 {
    if (signal < 15) {
      return 1;
    }
    if (signal < 30) {
      return 2;
    }
    if (signal < 45) {
      return 3;
    }
    if (signal < 60) {
      return 4;
    }
    return 5;
  }

  private defaultIteration(): string {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    return `${month} Sprint ${Math.max(1, Math.ceil(now.getDate() / 14))}`;
  }

  private createId(projectId: string, seed: string): string {
    return Buffer.from(`${projectId}:${seed}`).toString('base64url').slice(0, 24);
  }
}
