import * as crypto from 'crypto';
import { RdiDraft } from '../shared/messages';

const RDI_KEY = 'rdi-drafts';

interface StateLike {
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Thenable<void>;
}

export class RdiDraftService {
  public listDrafts(state: StateLike): RdiDraft[] {
    return state.get<RdiDraft[]>(RDI_KEY, []);
  }

  public getDraft(state: StateLike, id: string): RdiDraft | undefined {
    return this.listDrafts(state).find((d) => d.id === id);
  }

  public createDraft(state: StateLike): RdiDraft {
    const now = new Date().toISOString();
    const draft: RdiDraft = {
      id: this.newId(),
      title: 'New Release Deployment Item',
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      workItemTitle: '',
      iterationPath: '',
      areaPath: '',
      assignedTo: '',
      targetReleaseDate: '',
      pbiLinks: [],
      releaseNotes: '',
      deploymentDetails: [],
      applications: '',
      backoutStrategy: '',
      backoutOwner: '',
      estimatedBackoutTime: '',
      manualDbChanges: [],
      hasManualDbChanges: false
    };
    void this.saveDraft(state, draft);
    return draft;
  }

  public async saveDraft(state: StateLike, draft: RdiDraft): Promise<void> {
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    const all = this.listDrafts(state);
    const idx = all.findIndex((d) => d.id === draft.id);
    const next = idx >= 0 ? all.map((d) => (d.id === draft.id ? updated : d)) : [...all, updated];
    await state.update(RDI_KEY, next);
  }

  public async deleteDraft(state: StateLike, id: string): Promise<void> {
    const filtered = this.listDrafts(state).filter((d) => d.id !== id);
    await state.update(RDI_KEY, filtered);
  }

  private newId(): string {
    return crypto.randomBytes(9).toString('base64url');
  }
}
