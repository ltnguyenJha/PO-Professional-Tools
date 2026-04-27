import * as crypto from 'crypto';
import { AdoWorkItemType, ImportedProject, PbiDraft } from '../shared/messages';

/** Drafts not tied to an imported repo use this project id. */
export const STANDALONE_PROJECT_ID = 'standalone';

const PBI_KEY = 'poTools.pbiDrafts';

interface GlobalStateLike {
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Thenable<void>;
}

export class PbiDraftService {
  public getAll(state: GlobalStateLike): PbiDraft[] {
    return state.get<PbiDraft[]>(PBI_KEY, []);
  }

  public async saveAll(state: GlobalStateLike, drafts: PbiDraft[]): Promise<void> {
    await state.update(PBI_KEY, drafts);
  }

  public async upsert(state: GlobalStateLike, draft: PbiDraft): Promise<PbiDraft> {
    const next = { ...draft, updatedAt: new Date().toISOString() };
    const existing = this.getAll(state);
    const index = existing.findIndex((item) => item.id === draft.id);
    const updated =
      index >= 0
        ? existing.map((item) => (item.id === draft.id ? next : item))
        : [...existing, next];
    await this.saveAll(state, updated);
    return next;
  }

  public async deleteById(state: GlobalStateLike, draftId: string): Promise<void> {
    const filtered = this.getAll(state).filter((draft) => draft.id !== draftId);
    await this.saveAll(state, filtered);
  }

  public async deleteByProject(state: GlobalStateLike, projectId: string): Promise<void> {
    const filtered = this.getAll(state).filter((draft) => draft.projectId !== projectId);
    await this.saveAll(state, filtered);
  }

  /**
   * Blank item for PO-authored work (no scan). Attach to a repo or standalone.
   */
  public createBlankDraft(options: {
    projectId: string;
    title?: string;
    defaultWorkItemType?: AdoWorkItemType;
    /** Display leaf from saved ADO iteration path when set; else date-based default. */
    iteration?: string;
  }): PbiDraft {
    const title = options.title?.trim() || 'New backlog item';
    const iteration = options.iteration?.trim() || this.defaultIteration();
    return {
      id: this.newId(),
      projectId: options.projectId,
      title,
      description: '',
      effortDays: 2,
      iteration,
      status: 'draft',
      workItemType: options.defaultWorkItemType ?? 'Product Backlog Item',
      acceptanceCriteria: [],
      testScenarios: []
    };
  }

  public buildDrafts(
    project: ImportedProject,
    options?: { iteration?: string }
  ): PbiDraft[] {
    const iteration = options?.iteration?.trim() || this.defaultIteration();
    const summary = project.scanSummary;
    if (!summary) {
      return [];
    }

    const routes = summary.routes.slice(0, 5);
    const endpoints = summary.apiEndpoints.slice(0, 5);

    const drafts: PbiDraft[] = [];

    for (const route of routes) {
      drafts.push(this.createRouteDraft(project, route, iteration));
    }

    for (const endpoint of endpoints) {
      drafts.push(this.createEndpointDraft(project, endpoint, iteration));
    }

    if (drafts.length === 0) {
      drafts.push(this.createPlatformDraft(project, iteration));
    }

    return drafts;
  }

  public newId(): string {
    return crypto.randomBytes(9).toString('base64url');
  }

  private createRouteDraft(
    project: ImportedProject,
    route: string,
    iteration: string
  ): PbiDraft {
    const effort = this.scoreEffort(route.length);
    return {
      id: this.createId(project.id, route),
      projectId: project.id,
      title: `Improve UX flow for ${route}`,
      description: `Deliver a concise and reliable user journey for route ${route}, including clear state handling and validation boundaries.`,
      effortDays: effort,
      iteration,
      status: 'draft',
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

  private createEndpointDraft(
    project: ImportedProject,
    endpoint: string,
    iteration: string
  ): PbiDraft {
    const effort = this.scoreEffort(endpoint.length + 1);
    return {
      id: this.createId(project.id, endpoint),
      projectId: project.id,
      title: `Stabilize API contract: ${endpoint}`,
      description: `Define and enforce a dependable API behavior for ${endpoint}, including validation, error semantics, and traceability for downstream teams.`,
      effortDays: effort,
      iteration,
      status: 'draft',
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

  private createPlatformDraft(project: ImportedProject, iteration: string): PbiDraft {
    return {
      id: this.createId(project.id, 'platform-hardening'),
      projectId: project.id,
      title: `Establish baseline quality for ${project.name}`,
      description:
        'Create an initial backlog item that improves reliability, observability, and acceptance coverage for critical user paths.',
      effortDays: 2,
      iteration,
      status: 'draft',
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
