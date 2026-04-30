/**
 * adoService.rdi.unit.test.ts
 *
 * Unit tests for AdoService RDI methods:
 *  - buildRdiDescription (via pushRdi spy pattern)
 *  - pushRdi work-item creation with correct type and relations
 *  - getDefaultIteration REST call
 */

import { AdoService } from '../services/adoService';
import type { AdoSettings, RdiDraft } from '../shared/messages';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSettings(overrides: Partial<AdoSettings> = {}): AdoSettings {
  return {
    orgUrl: 'https://dev.azure.com/myorg',
    projectName: 'MyProject',
    team: 'MyTeam',
    areaPath: 'MyProject\\Area',
    iterationPath: 'MyProject\\Sprint 1',
    ...overrides,
  };
}

function makeDraft(overrides: Partial<RdiDraft> = {}): RdiDraft {
  return {
    id: 'test-id',
    title: 'Test RDI',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    status: 'draft',
    workItemTitle: 'Deploy Feature X to Prod',
    iterationPath: 'MyProject\\Sprint 1',
    areaPath: 'MyProject\\Area',
    assignedTo: 'jane@example.com',
    targetReleaseDate: '2024-02-15',
    pbiLinks: [],
    releaseNotes: 'Fixed the login bug.',
    deploymentDetails: [],
    applications: 'web-app, api-service',
    backoutStrategy: 'Redeploy previous version.',
    backoutOwner: 'john@example.com',
    estimatedBackoutTime: '30 minutes',
    manualDbChanges: [],
    hasManualDbChanges: false,
    ...overrides,
  };
}

// ─── buildRdiDescription ──────────────────────────────────────────────────────
// buildRdiDescription is private; we test it through pushRdi by capturing what
// createWorkItem receives.

describe('AdoService — buildRdiDescription (via pushRdi mock)', () => {
  let service: AdoService;
  let capturedPatches: unknown;
  let createWorkItemMock: jest.Mock;
  let updateWorkItemMock: jest.Mock;

  beforeEach(() => {
    service = new AdoService();
    createWorkItemMock = jest.fn().mockResolvedValue({
      id: 42,
      _links: { html: { href: 'https://dev.azure.com/myorg/MyProject/_workitems/edit/42' } },
    });
    updateWorkItemMock = jest.fn().mockResolvedValue({});

    // Inject a fake connection
    (service as unknown as Record<string, unknown>)['createConnection'] = jest
      .fn()
      .mockReturnValue({
        getWorkItemTrackingApi: jest.fn().mockResolvedValue({
          createWorkItem: (...args: unknown[]) => {
            capturedPatches = args[1]; // patch array is second arg
            return createWorkItemMock(...args);
          },
          updateWorkItem: updateWorkItemMock,
        }),
      });
  });

  it('includes all required HTML sections in the description', async () => {
    const settings = makeSettings();
    const draft = makeDraft({
      releaseNotes: 'Deployed widget v3',
      applications: 'widget-service',
      backoutStrategy: 'Roll back to v2',
    });

    await service.pushRdi(settings, 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: unknown }>;
    const descPatch = patches.find((p) => p.path === '/fields/System.Description');
    expect(descPatch).toBeDefined();
    const html = descPatch!.value as string;

    expect(html).toContain('<h3>Applications Involved</h3>');
    expect(html).toContain('<h3>Associated PBIs</h3>');
    expect(html).toContain('<h3>Release Notes</h3>');
    expect(html).toContain('<h3>Deployment Details</h3>');
    expect(html).toContain('<h3>Backout Strategy</h3>');
    expect(html).toContain('<h3>Database Changes</h3>');
    expect(html).toContain('<h3>PO Tools Metadata</h3>');
  });

  it('HTML-encodes user-supplied content (XSS prevention)', async () => {
    const settings = makeSettings();
    const draft = makeDraft({
      releaseNotes: '<script>alert("xss")</script>',
    });

    await service.pushRdi(settings, 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: string }>;
    const html = patches.find((p) => p.path === '/fields/System.Description')!.value;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('shows "No database changes required." when hasManualDbChanges is false', async () => {
    const draft = makeDraft({ hasManualDbChanges: false, manualDbChanges: [] });
    await service.pushRdi(makeSettings(), 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: string }>;
    const html = patches.find((p) => p.path === '/fields/System.Description')!.value;
    expect(html).toContain('No database changes required.');
  });

  it('shows database change entries when hasManualDbChanges is true', async () => {
    const draft = makeDraft({
      hasManualDbChanges: true,
      manualDbChanges: [
        { description: 'Add users table index', script: 'CREATE INDEX ...', rollbackScript: 'DROP INDEX ...' },
      ],
    });
    await service.pushRdi(makeSettings(), 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: string }>;
    const html = patches.find((p) => p.path === '/fields/System.Description')!.value;
    expect(html).toContain('Add users table index');
    expect(html).toContain('CREATE INDEX');
  });

  it('shows PBI links as an unordered list when pbiLinks are present', async () => {
    const draft = makeDraft({
      pbiLinks: [{ pbiId: '1001', pbiTitle: 'Story A' }, { pbiId: '1002', pbiTitle: 'Story B' }],
    });
    await service.pushRdi(makeSettings(), 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: string }>;
    const html = patches.find((p) => p.path === '/fields/System.Description')!.value;
    expect(html).toContain('Story A');
    expect(html).toContain('Story B');
    expect(html).toContain('<ul>');
  });

  it('shows "None" for PBI links when none exist', async () => {
    const draft = makeDraft({ pbiLinks: [] });
    await service.pushRdi(makeSettings(), 'fake-pat', draft);

    const patches = capturedPatches as Array<{ op: string; path: string; value: string }>;
    const html = patches.find((p) => p.path === '/fields/System.Description')!.value;
    // Empty state renders <p>None</p>
    expect(html).toContain('<p>None</p>');
  });
});

// ─── pushRdi — work item creation ─────────────────────────────────────────────

describe('AdoService — pushRdi()', () => {
  let service: AdoService;
  let createWorkItemMock: jest.Mock;
  let updateWorkItemMock: jest.Mock;
  let capturedType: string;
  let capturedProject: string;

  beforeEach(() => {
    service = new AdoService();
    createWorkItemMock = jest.fn().mockImplementation(
      (_ctx: unknown, _patch: unknown, project: string, type: string) => {
        capturedType = type;
        capturedProject = project;
        return Promise.resolve({
          id: 99,
          _links: { html: { href: 'https://dev.azure.com/myorg/MyProject/_workitems/edit/99' } },
        });
      }
    );
    updateWorkItemMock = jest.fn().mockResolvedValue({});

    (service as unknown as Record<string, unknown>)['createConnection'] = jest
      .fn()
      .mockReturnValue({
        getWorkItemTrackingApi: jest.fn().mockResolvedValue({
          createWorkItem: createWorkItemMock,
          updateWorkItem: updateWorkItemMock,
        }),
      });
  });

  it('creates a work item with type "Release Deployment Item"', async () => {
    await service.pushRdi(makeSettings(), 'pat', makeDraft());
    expect(capturedType).toBe('Release Deployment Item');
  });

  it('creates the work item in the correct project', async () => {
    await service.pushRdi(makeSettings({ projectName: 'AlphaProject' }), 'pat', makeDraft());
    expect(capturedProject).toBe('AlphaProject');
  });

  it('returns the id and url from the created work item', async () => {
    const result = await service.pushRdi(makeSettings(), 'pat', makeDraft());
    expect(result.id).toBe(99);
    expect(result.url).toContain('workitems/edit/99');
  });

  it('adds Hierarchy-Reverse relations for each pbiLink', async () => {
    const draft = makeDraft({
      pbiLinks: [
        { pbiId: '500', pbiTitle: 'PBI 500' },
        { pbiId: '501', pbiTitle: 'PBI 501' },
      ],
    });

    await service.pushRdi(makeSettings(), 'pat', draft);

    expect(updateWorkItemMock).toHaveBeenCalledTimes(1);
    const relPatches = updateWorkItemMock.mock.calls[0][1] as Array<{
      op: string;
      path: string;
      value: { rel: string; url: string };
    }>;
    expect(relPatches).toHaveLength(2);
    expect(relPatches[0].value.rel).toBe('System.LinkTypes.Hierarchy-Reverse');
    expect(relPatches[0].value.url).toContain('/500');
    expect(relPatches[1].value.url).toContain('/501');
  });

  it('does NOT call updateWorkItem when there are no pbiLinks', async () => {
    await service.pushRdi(makeSettings(), 'pat', makeDraft({ pbiLinks: [] }));
    expect(updateWorkItemMock).not.toHaveBeenCalled();
  });

  it('throws when ADO returns no work item id', async () => {
    createWorkItemMock.mockResolvedValueOnce({ id: undefined });
    await expect(service.pushRdi(makeSettings(), 'pat', makeDraft())).rejects.toThrow(
      'ADO did not return a work item ID'
    );
  });
});

// ─── getDefaultIteration ──────────────────────────────────────────────────────

describe('AdoService — getDefaultIteration()', () => {
  let service: AdoService;

  beforeEach(() => {
    service = new AdoService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct ADO teams settings iteration endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ value: [{ path: 'MyProject\\Sprint 5' }] }),
    });

    await service.getDefaultIteration(makeSettings(), 'fake-pat');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('_apis/work/teamsettings/iterations');
    expect(calledUrl).toContain('$timeframe=current');
    expect(calledUrl).toContain('api-version=7.1');
  });

  it('returns the iteration path from the first value', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ value: [{ path: 'MyProject\\Sprint 5' }] }),
    });

    const path = await service.getDefaultIteration(makeSettings(), 'fake-pat');
    expect(path).toBe('MyProject\\Sprint 5');
  });

  it('uses Basic auth header with base64-encoded PAT', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ value: [{ path: 'x' }] }),
    });

    await service.getDefaultIteration(makeSettings(), 'mytoken');

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers as Record<string, string>;
    const expected = 'Basic ' + Buffer.from(':mytoken').toString('base64');
    expect(headers['Authorization']).toBe(expected);
  });

  it('throws when the response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(service.getDefaultIteration(makeSettings(), 'bad-pat')).rejects.toThrow(
      'Failed to fetch default iteration: 401 Unauthorized'
    );
  });

  it('throws when value array is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ value: [] }),
    });

    await expect(service.getDefaultIteration(makeSettings(), 'pat')).rejects.toThrow(
      'No current iteration found'
    );
  });
});
