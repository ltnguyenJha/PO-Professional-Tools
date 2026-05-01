/**
 * epicHandlers.unit.test.ts
 *
 * Unit tests for DashboardPanel Epic Creation handlers:
 *  - Epic CRUD (create, get via state, update, delete with cascade)
 *  - Feature link / unlink (bidirectional state, no-duplicate guard)
 *  - AI feature generation (happy path, error handling)
 *  - ADO push (status logic, hierarchy links, error handling)
 *  - AppState (epicDrafts included, empty array default)
 */

import { DashboardPanel } from '../panels/DashboardPanel';
import type { EpicDraft, FeatureDraft } from '../shared/messages';
import type { RepoImportService } from '../services/repoImportService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEpic(overrides: Partial<EpicDraft> = {}): EpicDraft {
  return {
    id: 'epic-1',
    title: 'Mobile-First Redesign',
    description: 'Redesign the mobile experience end-to-end.',
    objectives: ['Improve UX', 'Reduce churn'],
    scope: 'In scope: mobile app. Out of scope: desktop.',
    linkedFeatureIds: [],
    selectedRepoIds: [],
    status: 'draft',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeFeature(overrides: Partial<FeatureDraft> = {}): FeatureDraft {
  return {
    id: 'feature-1',
    title: 'Auth Flow',
    description: 'Handles authentication.',
    repoIds: [],
    childPbiIds: [],
    hierarchyStatus: 'draft',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('DashboardPanel — Epic Handlers', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vscode = require('vscode');

  let store: Map<string, unknown>;
  let postMessageSpy: jest.Mock;
  let messageHandler: (msg: unknown) => Promise<void>;

  let mockAdoService: {
    pushEpicHierarchy: jest.Mock;
  };
  let mockCopilotService: {
    generateFeaturesFromEpic: jest.Mock;
    tryGenerateMermaidAttachment: jest.Mock;
  };
  let mockSettingsService: {
    getAdoSettings: jest.Mock;
    getUiSettings: jest.Mock;
    setTheme: jest.Mock;
  };
  let mockSecretStorage: {
    getAdoPat: jest.Mock;
    saveAdoPat: jest.Mock;
  };
  let mockImportService: {
    getProjects: jest.Mock;
    getLinkTargets: jest.Mock;
  };

  beforeEach(() => {
    // Reset the DashboardPanel singleton between tests
    (DashboardPanel as unknown as Record<string, unknown>)['currentPanel'] = undefined;
    jest.clearAllMocks();

    // ── In-memory globalState ──────────────────────────────────────────────
    store = new Map();
    const mockGlobalState = {
      get: jest.fn(<T>(key: string, defaultValue?: T): T => {
        return (store.has(key) ? store.get(key) : defaultValue) as T;
      }),
      update: jest.fn(async (key: string, value: unknown): Promise<void> => {
        store.set(key, value);
      }),
      keys: jest.fn(() => [...store.keys()]),
    };

    // ── Fake webview: capture postMessage calls and the message handler ────
    postMessageSpy = jest.fn();
    let capturedHandler: ((msg: unknown) => Promise<void>) | undefined;

    const fakeWebview = {
      html: '',
      postMessage: postMessageSpy,
      onDidReceiveMessage: jest.fn().mockImplementation((handler: unknown) => {
        capturedHandler = handler as (msg: unknown) => Promise<void>;
        return { dispose: jest.fn() };
      }),
      asWebviewUri: jest.fn().mockReturnValue({ toString: () => 'test://uri' }),
    };

    const fakePanel = {
      webview: fakeWebview,
      onDidDispose: jest.fn().mockReturnValue({ dispose: jest.fn() }),
      reveal: jest.fn(),
      dispose: jest.fn(),
    };

    vscode.window.createWebviewPanel.mockReturnValue(fakePanel);

    // ── Extension context ──────────────────────────────────────────────────
    const mockContext = {
      globalState: mockGlobalState,
      extensionPath: '/fake/extension/path',
      secrets: {
        store: jest.fn(),
        get: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn(),
      },
    };

    // ── Import service (constructor arg — cannot be replaced after creation) ─
    mockImportService = {
      getProjects: jest.fn().mockReturnValue([]),
      getLinkTargets: jest.fn().mockResolvedValue([]),
    };

    // ── Create DashboardPanel via the static factory ───────────────────────
    DashboardPanel.createOrShow(
      mockContext as unknown as import('vscode').ExtensionContext,
      mockImportService as unknown as RepoImportService
    );

    const panelInstance = (DashboardPanel as unknown as Record<string, unknown>)[
      'currentPanel'
    ] as Record<string, unknown>;

    // ── Inject mocked services into the panel instance ─────────────────────
    mockAdoService = {
      pushEpicHierarchy: jest.fn().mockResolvedValue({
        epicWorkItemId: 101,
        epicWorkItemUrl: 'https://dev.azure.com/myorg/_workitems/edit/101',
        featureResults: [],
        featureErrors: [],
      }),
    };

    mockCopilotService = {
      generateFeaturesFromEpic: jest.fn().mockResolvedValue([
        { title: 'Feature A', description: 'Desc A' },
        { title: 'Feature B', description: 'Desc B' },
      ]),
      tryGenerateMermaidAttachment: jest.fn().mockResolvedValue(null),
    };

    mockSettingsService = {
      getAdoSettings: jest.fn().mockReturnValue({
        orgUrl: 'https://dev.azure.com/myorg',
        projectName: 'MyProject',
      }),
      getUiSettings: jest.fn().mockReturnValue({ theme: 'auto' }),
      setTheme: jest.fn(),
    };

    mockSecretStorage = {
      getAdoPat: jest.fn().mockResolvedValue('fake-pat'),
      saveAdoPat: jest.fn(),
    };

    panelInstance['adoService'] = mockAdoService;
    panelInstance['copilotService'] = mockCopilotService;
    panelInstance['settingsService'] = mockSettingsService;
    panelInstance['secretStorage'] = mockSecretStorage;

    messageHandler = capturedHandler!;
  });

  // ─── Test helpers ──────────────────────────────────────────────────────────

  async function send(msg: unknown): Promise<void> {
    await messageHandler(msg);
  }

  function getPostedOf(type: string): unknown[] {
    return postMessageSpy.mock.calls
      .map(([msg]: [unknown]) => msg as Record<string, unknown>)
      .filter((m) => m.type === type);
  }

  function firstPostedOf(type: string): Record<string, unknown> | undefined {
    return getPostedOf(type)[0] as Record<string, unknown> | undefined;
  }

  function getStoredEpics(): EpicDraft[] {
    return (store.get('epicDrafts') as EpicDraft[]) ?? [];
  }

  function getStoredFeatures(): FeatureDraft[] {
    return (store.get('featureDrafts') as FeatureDraft[]) ?? [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Epic CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleGetEpicDrafts (via APP_READY → STATE_UPDATED)', () => {
    it('returns empty array when no epics in globalState', async () => {
      // Arrange: store has no epicDrafts entry
      // Act
      await send({ type: 'APP_READY' });
      // Assert
      const stateMsg = firstPostedOf('STATE_UPDATED') as { payload: { epicDrafts: EpicDraft[] } };
      expect(stateMsg?.payload.epicDrafts).toEqual([]);
    });

    it('returns stored epics when they exist', async () => {
      // Arrange
      const epic = makeEpic();
      store.set('epicDrafts', [epic]);
      // Act
      await send({ type: 'APP_READY' });
      // Assert
      const stateMsg = firstPostedOf('STATE_UPDATED') as { payload: { epicDrafts: EpicDraft[] } };
      expect(stateMsg?.payload.epicDrafts).toHaveLength(1);
      expect(stateMsg?.payload.epicDrafts[0].id).toBe('epic-1');
    });
  });

  describe('handleCreateEpicDraft', () => {
    const createPayload = {
      title: 'New Epic',
      description: 'An epic description.',
      objectives: ['Goal 1', 'Goal 2'],
      scope: 'In scope: X. Out of scope: Y.',
      linkedFeatureIds: [],
      selectedRepoIds: ['repo-1'],
      estimatedVelocity: 40,
    };

    it('creates epic with generated id and timestamps', async () => {
      // Arrange
      const before = Date.now();
      // Act
      await send({ type: 'CREATE_EPIC_DRAFT', payload: createPayload });
      // Assert
      const epics = getStoredEpics();
      expect(epics).toHaveLength(1);
      expect(epics[0].id).toBeDefined();
      expect(Number(epics[0].id)).toBeGreaterThanOrEqual(before);
      expect(epics[0].createdAt).toBeDefined();
      expect(epics[0].updatedAt).toBeDefined();
    });

    it('creates epic with correct fields from payload', async () => {
      // Arrange / Act
      await send({ type: 'CREATE_EPIC_DRAFT', payload: createPayload });
      // Assert
      const epic = getStoredEpics()[0];
      expect(epic.title).toBe('New Epic');
      expect(epic.description).toBe('An epic description.');
      expect(epic.objectives).toEqual(['Goal 1', 'Goal 2']);
      expect(epic.scope).toBe('In scope: X. Out of scope: Y.');
      expect(epic.status).toBe('draft');
      expect(epic.selectedRepoIds).toEqual(['repo-1']);
      expect(epic.estimatedVelocity).toBe(40);
    });

    it('posts EPIC_DRAFT_CREATED with the new epic', async () => {
      // Arrange / Act
      await send({ type: 'CREATE_EPIC_DRAFT', payload: createPayload });
      // Assert
      const msg = firstPostedOf('EPIC_DRAFT_CREATED') as { payload: EpicDraft };
      expect(msg).toBeDefined();
      expect(msg.payload.title).toBe('New Epic');
      expect(msg.payload.status).toBe('draft');
    });
  });

  describe('handleUpdateEpicDraft', () => {
    it('updates specified fields and preserves others', async () => {
      // Arrange
      const epic = makeEpic({ linkedFeatureIds: ['f-1'] });
      store.set('epicDrafts', [epic]);
      // Act
      await send({
        type: 'UPDATE_EPIC_DRAFT',
        payload: { ...epic, title: 'Updated Title', description: 'New desc' },
      });
      // Assert
      const saved = getStoredEpics()[0];
      expect(saved.title).toBe('Updated Title');
      expect(saved.description).toBe('New desc');
      expect(saved.linkedFeatureIds).toEqual(['f-1']); // preserved
    });

    it('updates the updatedAt timestamp', async () => {
      // Arrange
      const epic = makeEpic();
      store.set('epicDrafts', [epic]);
      const before = Date.now();
      // Act
      await send({ type: 'UPDATE_EPIC_DRAFT', payload: { ...epic, title: 'Changed' } });
      // Assert
      const saved = getStoredEpics()[0];
      expect(new Date(saved.updatedAt).getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('handleDeleteEpicDraft', () => {
    it('removes the epic from globalState', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1' }), makeEpic({ id: 'epic-2' })]);
      // Act
      await send({ type: 'DELETE_EPIC_DRAFT', payload: { epicId: 'epic-1' } });
      // Assert
      const remaining = getStoredEpics();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('epic-2');
    });

    it('clears parentEpicId on all linked features', async () => {
      // Arrange: two features belong to epic-1, one to another epic
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1', 'f-2'] })]);
      store.set('featureDrafts', [
        makeFeature({ id: 'f-1', parentEpicId: 'epic-1' }),
        makeFeature({ id: 'f-2', parentEpicId: 'epic-1' }),
        makeFeature({ id: 'f-3', parentEpicId: 'epic-99' }), // different epic — untouched
      ]);
      // Act
      await send({ type: 'DELETE_EPIC_DRAFT', payload: { epicId: 'epic-1' } });
      // Assert
      const features = getStoredFeatures();
      expect(features.find((f) => f.id === 'f-1')?.parentEpicId).toBeUndefined();
      expect(features.find((f) => f.id === 'f-2')?.parentEpicId).toBeUndefined();
      expect(features.find((f) => f.id === 'f-3')?.parentEpicId).toBe('epic-99');
    });

    it('posts EPIC_DRAFT_DELETED', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1' })]);
      // Act
      await send({ type: 'DELETE_EPIC_DRAFT', payload: { epicId: 'epic-1' } });
      // Assert
      const msg = firstPostedOf('EPIC_DRAFT_DELETED') as { payload: { epicId: string } };
      expect(msg?.payload.epicId).toBe('epic-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Feature Link / Unlink
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleLinkFeatureToEpic', () => {
    it('adds featureId to epic.linkedFeatureIds', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: [] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1' })]);
      // Act
      await send({ type: 'LINK_FEATURE_TO_EPIC', payload: { epicId: 'epic-1', featureId: 'f-1' } });
      // Assert
      expect(getStoredEpics()[0].linkedFeatureIds).toContain('f-1');
    });

    it('sets parentEpicId on the feature', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: [] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1' })]);
      // Act
      await send({ type: 'LINK_FEATURE_TO_EPIC', payload: { epicId: 'epic-1', featureId: 'f-1' } });
      // Assert
      const feature = getStoredFeatures().find((f) => f.id === 'f-1');
      expect(feature?.parentEpicId).toBe('epic-1');
    });

    it('posts FEATURE_LINKED_TO_EPIC', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: [] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1' })]);
      // Act
      await send({ type: 'LINK_FEATURE_TO_EPIC', payload: { epicId: 'epic-1', featureId: 'f-1' } });
      // Assert
      const msg = firstPostedOf('FEATURE_LINKED_TO_EPIC') as {
        payload: { epicId: string; featureId: string };
      };
      expect(msg?.payload).toEqual({ epicId: 'epic-1', featureId: 'f-1' });
    });

    it('does not duplicate featureId if already linked', async () => {
      // Arrange: f-1 already in linkedFeatureIds
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1', parentEpicId: 'epic-1' })]);
      // Act
      await send({ type: 'LINK_FEATURE_TO_EPIC', payload: { epicId: 'epic-1', featureId: 'f-1' } });
      // Assert: f-1 appears only once
      const ids = getStoredEpics()[0].linkedFeatureIds.filter((id) => id === 'f-1');
      expect(ids).toHaveLength(1);
    });
  });

  describe('handleUnlinkFeatureFromEpic', () => {
    it('removes featureId from epic.linkedFeatureIds', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1', 'f-2'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1', parentEpicId: 'epic-1' })]);
      // Act
      await send({
        type: 'UNLINK_FEATURE_FROM_EPIC',
        payload: { epicId: 'epic-1', featureId: 'f-1' },
      });
      // Assert
      const epic = getStoredEpics()[0];
      expect(epic.linkedFeatureIds).not.toContain('f-1');
      expect(epic.linkedFeatureIds).toContain('f-2'); // other features preserved
    });

    it('clears parentEpicId on the feature', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1', parentEpicId: 'epic-1' })]);
      // Act
      await send({
        type: 'UNLINK_FEATURE_FROM_EPIC',
        payload: { epicId: 'epic-1', featureId: 'f-1' },
      });
      // Assert
      const feature = getStoredFeatures().find((f) => f.id === 'f-1');
      expect(feature?.parentEpicId).toBeUndefined();
    });

    it('posts FEATURE_UNLINKED_FROM_EPIC', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1', parentEpicId: 'epic-1' })]);
      // Act
      await send({
        type: 'UNLINK_FEATURE_FROM_EPIC',
        payload: { epicId: 'epic-1', featureId: 'f-1' },
      });
      // Assert
      const msg = firstPostedOf('FEATURE_UNLINKED_FROM_EPIC') as {
        payload: { epicId: string; featureId: string };
      };
      expect(msg?.payload).toEqual({ epicId: 'epic-1', featureId: 'f-1' });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AI Generation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleGenerateFeaturesFromEpic', () => {
    const genPayload = {
      epicId: 'epic-1',
      title: 'Mobile Redesign',
      description: 'Redesign mobile UX from the ground up',
      objectives: ['Better UX', 'Reduce churn'],
      scope: 'Mobile app only',
      selectedRepoIds: [],
    };

    it('calls AI service with epic context', async () => {
      // Arrange / Act
      await send({ type: 'GENERATE_FEATURES_FROM_EPIC', payload: genPayload });
      // Assert
      expect(mockCopilotService.generateFeaturesFromEpic).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mobile Redesign',
          description: 'Redesign mobile UX from the ground up',
          objectives: ['Better UX', 'Reduce churn'],
          scope: 'Mobile app only',
        }),
        expect.anything(), // CancellationToken
        expect.anything()  // options
      );
    });

    it('posts EPIC_GENERATION_COMPLETE with features array', async () => {
      // Arrange / Act
      await send({ type: 'GENERATE_FEATURES_FROM_EPIC', payload: genPayload });
      // Assert
      const msg = firstPostedOf('EPIC_GENERATION_COMPLETE') as {
        payload: { epicId: string; suggestions: Array<{ title: string; description: string }> };
      };
      expect(msg?.payload.epicId).toBe('epic-1');
      expect(msg?.payload.suggestions).toHaveLength(2);
      expect(msg?.payload.suggestions[0].title).toBe('Feature A');
      expect(msg?.payload.suggestions[1].title).toBe('Feature B');
    });

    it('each suggestion includes a clientId', async () => {
      // Arrange / Act
      await send({ type: 'GENERATE_FEATURES_FROM_EPIC', payload: genPayload });
      // Assert: handler maps items to { clientId, title, description }
      const msg = firstPostedOf('EPIC_GENERATION_COMPLETE') as {
        payload: { suggestions: Array<{ clientId: string }> };
      };
      expect(msg?.payload.suggestions[0].clientId).toBeDefined();
      expect(msg?.payload.suggestions[1].clientId).toBeDefined();
    });

    it('posts EPIC_GENERATION_ERROR when AI service throws', async () => {
      // Arrange
      mockCopilotService.generateFeaturesFromEpic.mockRejectedValueOnce(
        new Error('Model unavailable')
      );
      // Act
      await send({ type: 'GENERATE_FEATURES_FROM_EPIC', payload: genPayload });
      // Assert
      const msg = firstPostedOf('EPIC_GENERATION_ERROR') as {
        payload: { epicId: string; message: string };
      };
      expect(msg?.payload.epicId).toBe('epic-1');
      expect(msg?.payload.message).toBe('Model unavailable');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADO Push
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handlePushEpicToAdo', () => {
    beforeEach(() => {
      // Default: epic with no linked features
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: [] })]);
    });

    it('calls ADO service with the epic and pushChildren flag', async () => {
      // Arrange / Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      expect(mockAdoService.pushEpicHierarchy).toHaveBeenCalledWith(
        expect.objectContaining({ orgUrl: 'https://dev.azure.com/myorg', projectName: 'MyProject' }),
        'fake-pat',
        expect.objectContaining({ id: 'epic-1', title: 'Mobile-First Redesign' }),
        expect.any(Array),
        false
      );
    });

    it('sets epic.adoId and epic.adoUrl after successful push', async () => {
      // Arrange / Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      const epic = getStoredEpics()[0];
      expect(epic.adoId).toBe(101);
      expect(epic.adoUrl).toBe('https://dev.azure.com/myorg/_workitems/edit/101');
    });

    it("sets status to 'pushed' when epic has no linked features", async () => {
      // Arrange: epicDrafts set in outer beforeEach (no linkedFeatureIds)
      // Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      expect(getStoredEpics()[0].status).toBe('pushed');
    });

    it("sets status to 'partial' when epic has linked features but pushLinkedFeatures is false", async () => {
      // Arrange: epic has features but we won't push them
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1', 'f-2'] })]);
      // Act: pushChildren=false → featureResults=[], but linkedFeatureIds.length > 0 → partial
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      expect(getStoredEpics()[0].status).toBe('partial');
    });

    it("sets status to 'pushed' when all features pushed successfully", async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1' })]);
      mockAdoService.pushEpicHierarchy.mockResolvedValueOnce({
        epicWorkItemId: 101,
        epicWorkItemUrl: 'https://dev.azure.com/myorg/_workitems/edit/101',
        featureResults: [{ featureId: 'f-1', adoWorkItemId: 202, linked: true }],
        featureErrors: [],
      });
      // Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: true } });
      // Assert
      expect(getStoredEpics()[0].status).toBe('pushed');
    });

    it('posts EPIC_PUSHED with updated epic data', async () => {
      // Arrange / Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      const msg = firstPostedOf('EPIC_PUSHED') as {
        payload: { epicId: string; adoWorkItemId: number; adoWorkItemUrl: string };
      };
      expect(msg?.payload.epicId).toBe('epic-1');
      expect(msg?.payload.adoWorkItemId).toBe(101);
      expect(msg?.payload.adoWorkItemUrl).toBe('https://dev.azure.com/myorg/_workitems/edit/101');
    });

    it('posts EPIC_PUSH_ERROR when ADO service throws', async () => {
      // Arrange
      mockAdoService.pushEpicHierarchy.mockRejectedValueOnce(new Error('ADO is down'));
      // Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: false } });
      // Assert
      const msg = firstPostedOf('EPIC_PUSH_ERROR') as { payload: { epicId: string; message: string } };
      expect(msg?.payload.epicId).toBe('epic-1');
      expect(msg?.payload.message).toBe('ADO is down');
    });

    it('passes linked features to ADO service when pushLinkedFeatures=true', async () => {
      // Arrange: epic has one linked feature in globalState
      store.set('epicDrafts', [makeEpic({ id: 'epic-1', linkedFeatureIds: ['f-1'] })]);
      store.set('featureDrafts', [makeFeature({ id: 'f-1' })]);
      // Act
      await send({ type: 'PUSH_EPIC_TO_ADO', payload: { epicId: 'epic-1', pushChildren: true } });
      // Assert: pushEpicHierarchy receives the feature in the linkedFeatures array with pushChildren=true
      const [, , , linkedFeatures, pushChildren] = mockAdoService.pushEpicHierarchy.mock.calls[0] as [
        unknown,
        unknown,
        unknown,
        FeatureDraft[],
        boolean
      ];
      expect(linkedFeatures).toHaveLength(1);
      expect(linkedFeatures[0].id).toBe('f-1');
      expect(pushChildren).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AppState
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getAppState (via APP_READY → STATE_UPDATED)', () => {
    it('includes epicDrafts array in the state payload', async () => {
      // Arrange
      store.set('epicDrafts', [makeEpic()]);
      // Act
      await send({ type: 'APP_READY' });
      // Assert
      const stateMsg = firstPostedOf('STATE_UPDATED') as { payload: Record<string, unknown> };
      expect(stateMsg?.payload).toHaveProperty('epicDrafts');
    });

    it('returns empty array when no epics are stored', async () => {
      // Arrange: store is empty (no epicDrafts key)
      // Act
      await send({ type: 'APP_READY' });
      // Assert
      const stateMsg = firstPostedOf('STATE_UPDATED') as { payload: { epicDrafts: EpicDraft[] } };
      expect(Array.isArray(stateMsg?.payload.epicDrafts)).toBe(true);
      expect(stateMsg?.payload.epicDrafts).toHaveLength(0);
    });
  });
});
