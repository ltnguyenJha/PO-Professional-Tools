/**
 * rdiDraftService.unit.test.ts
 *
 * Unit tests for RdiDraftService — CRUD operations over a StateLike mock.
 */

import { RdiDraftService } from '../services/rdiDraftService';
import type { RdiDraft } from '../shared/messages';

// ─── In-memory StateLike mock ─────────────────────────────────────────────────

function makeState(initial: RdiDraft[] = []): {
  store: Map<string, unknown>;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Promise<void>;
} {
  const store = new Map<string, unknown>();
  store.set('rdi-drafts', initial);
  return {
    store,
    get<T>(key: string, defaultValue: T): T {
      return (store.has(key) ? store.get(key) : defaultValue) as T;
    },
    async update(key: string, value: unknown): Promise<void> {
      store.set(key, value);
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RdiDraftService', () => {
  let service: RdiDraftService;

  beforeEach(() => {
    service = new RdiDraftService();
  });

  // ── listDrafts ──────────────────────────────────────────────────────────────

  describe('listDrafts()', () => {
    it('returns an empty array when no drafts exist', () => {
      const state = makeState([]);
      expect(service.listDrafts(state)).toEqual([]);
    });

    it('returns all stored drafts', async () => {
      const state = makeState([]);
      const d1 = service.createDraft(state);
      await new Promise((r) => setTimeout(r, 10)); // let void save settle
      const d2 = service.createDraft(state);
      await new Promise((r) => setTimeout(r, 10));
      const all = service.listDrafts(state);
      expect(all.length).toBe(2);
      expect(all.map((d) => d.id)).toContain(d1.id);
      expect(all.map((d) => d.id)).toContain(d2.id);
    });
  });

  // ── createDraft ─────────────────────────────────────────────────────────────

  describe('createDraft()', () => {
    it('returns a new RdiDraft with correct default values', () => {
      const state = makeState([]);
      const draft = service.createDraft(state);

      expect(draft.id).toBeDefined();
      expect(typeof draft.id).toBe('string');
      expect(draft.id.length).toBeGreaterThan(0);

      expect(draft.title).toBe('New Release Deployment Item');
      expect(draft.status).toBe('draft');
      expect(draft.workItemTitle).toBe('');
      expect(draft.iterationPath).toBe('');
      expect(draft.areaPath).toBe('');
      expect(draft.assignedTo).toBe('');
      expect(draft.targetReleaseDate).toBe('');
      expect(draft.pbiLinks).toEqual([]);
      expect(draft.releaseNotes).toBe('');
      expect(draft.deploymentDetails).toEqual([]);
      expect(draft.applications).toBe('');
      expect(draft.backoutStrategy).toBe('');
      expect(draft.backoutOwner).toBe('');
      expect(draft.estimatedBackoutTime).toBe('');
      expect(draft.manualDbChanges).toEqual([]);
      expect(draft.hasManualDbChanges).toBe(false);
    });

    it('sets createdAt and updatedAt as valid ISO timestamps', () => {
      const before = new Date().toISOString();
      const state = makeState([]);
      const draft = service.createDraft(state);
      const after = new Date().toISOString();

      expect(draft.createdAt >= before).toBe(true);
      expect(draft.createdAt <= after).toBe(true);
      expect(draft.updatedAt >= before).toBe(true);
    });

    it('generates unique ids across multiple drafts', () => {
      const state = makeState([]);
      const ids = Array.from({ length: 20 }, () => service.createDraft(state).id);
      expect(new Set(ids).size).toBe(20);
    });
  });

  // ── saveDraft / getDraft ────────────────────────────────────────────────────

  describe('saveDraft() + getDraft()', () => {
    it('persists a draft and retrieves it by id', async () => {
      const state = makeState([]);
      const draft = service.createDraft(state);
      const modified: RdiDraft = { ...draft, title: 'My RDI', workItemTitle: 'Deploy v2.0' };

      await service.saveDraft(state, modified);
      const retrieved = service.getDraft(state, draft.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe('My RDI');
      expect(retrieved!.workItemTitle).toBe('Deploy v2.0');
    });

    it('updates updatedAt on save', async () => {
      const state = makeState([]);
      const draft = service.createDraft(state);
      const originalUpdated = draft.updatedAt;

      // Ensure a tick passes so timestamps differ
      await new Promise((r) => setTimeout(r, 5));
      await service.saveDraft(state, draft);
      const saved = service.getDraft(state, draft.id);

      expect(saved!.updatedAt >= originalUpdated).toBe(true);
    });

    it('inserts a new draft when the id does not yet exist', async () => {
      const state = makeState([]);
      const newDraft: RdiDraft = {
        id: 'brand-new',
        title: 'Fresh',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        hasManualDbChanges: false,
      };

      await service.saveDraft(state, newDraft);
      expect(service.getDraft(state, 'brand-new')).toBeDefined();
    });

    it('getDraft returns undefined for unknown id', () => {
      const state = makeState([]);
      expect(service.getDraft(state, 'not-there')).toBeUndefined();
    });
  });

  // ── deleteDraft ─────────────────────────────────────────────────────────────

  describe('deleteDraft()', () => {
    it('removes the draft so it no longer appears in listDrafts', async () => {
      const state = makeState([]);
      const draft = service.createDraft(state);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.listDrafts(state).length).toBe(1);

      await service.deleteDraft(state, draft.id);

      expect(service.listDrafts(state).length).toBe(0);
      expect(service.getDraft(state, draft.id)).toBeUndefined();
    });

    it('is a no-op when the id does not exist (does not throw)', async () => {
      const state = makeState([]);
      await expect(service.deleteDraft(state, 'ghost-id')).resolves.not.toThrow();
    });

    it('only removes the targeted draft, leaving others intact', async () => {
      const state = makeState([]);
      const d1 = service.createDraft(state);
      await new Promise((r) => setTimeout(r, 10));
      const d2 = service.createDraft(state);
      await new Promise((r) => setTimeout(r, 10));

      await service.deleteDraft(state, d1.id);

      const remaining = service.listDrafts(state);
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(d2.id);
    });
  });
});
