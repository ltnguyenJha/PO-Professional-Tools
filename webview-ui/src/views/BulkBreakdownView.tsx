import { useEffect, useMemo, useState } from 'react';
import type {
  AdoProgressPayload,
  AdoSettings,
  AdoWorkItemType,
  BulkBreakdownRequest,
  BulkChildInput,
  ImportedProject,
  PbiDraft,
  WebviewRequest
} from '../types';
import { LoadingBar } from '../components/LoadingBar';
import { WORK_ITEM_TYPES } from '../types';

type Mode = 'manual' | 'ai' | 'scan';

interface Props {
  /** Imported repos plus workspace folders (same as PBI Studio link list). */
  linkTargets: ImportedProject[];
  drafts: PbiDraft[];
  adoSettings?: AdoSettings;
  aiBusy: boolean;
  adoProgress: AdoProgressPayload;
  suggestedChildren?: BulkChildInput[];
  onConsumeSuggestion: () => void;
  send: (message: WebviewRequest) => void;
}

export function BulkBreakdownView({
  linkTargets,
  drafts,
  adoSettings,
  aiBusy,
  adoProgress,
  suggestedChildren,
  onConsumeSuggestion,
  send
}: Props): JSX.Element {
  const bulkAdoBusy = adoProgress.busy && adoProgress.scope === 'bulk';
  const bulkAdoLabel =
    bulkAdoBusy && adoProgress.message.trim().length > 0
      ? adoProgress.message
      : 'Syncing with Azure DevOps…';

  const [mode, setMode] = useState<Mode>('manual');
  const [prefix, setPrefix] = useState('PAL Guest Payment');
  const [separator, setSeparator] = useState(' - ');
  const [projectId, setProjectId] = useState<string>(linkTargets[0]?.id ?? '');
  const [iteration, setIteration] = useState<string>(adoSettings?.iterationPath ?? '');

  useEffect(() => {
    if (linkTargets.length === 0) {
      return;
    }
    setProjectId((prev) => {
      if (prev && linkTargets.some((p) => p.id === prev)) {
        return prev;
      }
      return linkTargets[0]!.id;
    });
  }, [linkTargets]);
  const [childType, setChildType] = useState<AdoWorkItemType>(
    adoSettings?.defaultWorkItemType ?? 'Product Backlog Item'
  );
  const [parentType, setParentType] = useState<AdoWorkItemType | 'none'>('Feature');
  const [parentDescription, setParentDescription] = useState('');
  const [manualText, setManualText] = useState('Login\nAPI Loan-verify\nConfirm payment\nReceipt');
  const [aiDescription, setAiDescription] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [children, setChildren] = useState<BulkChildInput[]>([]);

  useEffect(() => {
    if (suggestedChildren && suggestedChildren.length > 0) {
      setChildren(suggestedChildren);
      onConsumeSuggestion();
    }
  }, [suggestedChildren, onConsumeSuggestion]);

  const manualChildren: BulkChildInput[] = useMemo(() => {
    return manualText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((suffix) => ({ suffix }));
  }, [manualText]);

  const scanProject = linkTargets.find((p) => p.id === projectId);
  const scanChildren: BulkChildInput[] = useMemo(() => {
    if (!scanProject?.scanSummary) {
      return [];
    }
    const routes = scanProject.scanSummary.routes.slice(0, 8).map((route) => ({
      suffix: route,
      description: `Deliver the ${route} flow end-to-end.`
    }));
    const apis = scanProject.scanSummary.apiEndpoints.slice(0, 6).map((api) => ({
      suffix: api,
      description: `Stabilize the ${api} endpoint contract and tests.`
    }));
    return [...routes, ...apis];
  }, [scanProject]);

  const effectiveChildren =
    mode === 'manual' ? manualChildren : mode === 'scan' ? scanChildren : children;

  const request = (): BulkBreakdownRequest => ({
    prefix,
    separator,
    projectId,
    iteration: iteration || undefined,
    childWorkItemType: childType,
    parentWorkItemType: parentType === 'none' ? undefined : parentType,
    parentDescription: parentDescription || undefined,
    children: effectiveChildren
  });

  const createDrafts = (): void => {
    if (!projectId.trim() || !linkTargets.some((p) => p.id === projectId)) {
      alert('Choose “Attach to project” (a repo or workspace folder) before creating drafts.');
      return;
    }
    if (effectiveChildren.length === 0) {
      alert('Add at least one child item first.');
      return;
    }
    send({ type: 'BULK_CREATE_DRAFTS', payload: request() });
  };

  const pushToAdo = (): void => {
    if (!projectId.trim() || !linkTargets.some((p) => p.id === projectId)) {
      alert('Choose “Attach to project” before pushing to Azure DevOps.');
      return;
    }
    const req = request();
    if (req.children.length === 0) {
      alert('Add at least one child item first.');
      return;
    }
    const relatedDraftIds = drafts
      .filter(
        (draft) =>
          typeof draft.title === 'string' &&
          draft.title.startsWith(`${req.prefix}${req.separator}`)
      )
      .map((draft) => draft.id);

    send({
      type: 'BULK_PUSH_TO_ADO',
      payload: { ...req, draftIds: relatedDraftIds }
    });
  };

  const requestAi = (): void => {
    if (!projectId.trim() || !linkTargets.some((p) => p.id === projectId)) {
      alert('Choose “Attach to project” before running AI breakdown.');
      return;
    }
    if (!prefix || !aiDescription.trim()) {
      alert('Fill in prefix and description first.');
      return;
    }
    send({
      type: 'AI_SUGGEST_BREAKDOWN',
      payload: {
        prefix,
        description: aiDescription.trim(),
        count: aiCount,
        projectId
      }
    });
  };

  return (
    <div className="content">
      {bulkAdoBusy && (
        <div className="bulk-ado-banner">
          <LoadingBar label={bulkAdoLabel} ariaLabel={`Azure DevOps: ${bulkAdoLabel}`} />
        </div>
      )}
      {linkTargets.length === 0 && (
        <p className="hint card" style={{ marginBottom: 12 }}>
          Open a workspace folder or import a project on the Projects tab — bulk breakdown requires a
          linked repo or folder for AI context.
        </p>
      )}
      <section className="card">
        <div className="card-header">
          <h3>Feature definition</h3>
        </div>
        <div className="field-row">
          <label className="field">
            Prefix
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="PAL Guest Payment"
            />
          </label>
          <label className="field">
            Separator
            <input value={separator} onChange={(e) => setSeparator(e.target.value)} />
          </label>
          <label className="field">
            Attach to project (required)
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={linkTargets.length === 0}
            >
              {linkTargets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="hint" style={{ marginTop: 6 }}>
              AI breakdown scans this repo (same as PBI Studio) so child stories align with the
              Product Manager prompt and real modules or APIs.
            </p>
          </label>
          <label className="field">
            Iteration
            <input
              value={iteration}
              onChange={(e) => setIteration(e.target.value)}
              placeholder="Project\\Iteration\\Sprint 1"
            />
          </label>
          <label className="field">
            Child Work Item Type
            <select
              value={childType}
              onChange={(e) => setChildType(e.target.value as AdoWorkItemType)}
            >
              {WORK_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Parent Work Item Type
            <select
              value={parentType}
              onChange={(e) => setParentType(e.target.value as AdoWorkItemType | 'none')}
            >
              <option value="none">None (no parent)</option>
              {WORK_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        {parentType !== 'none' && (
          <label className="field">
            Parent description (optional)
            <textarea
              rows={2}
              value={parentDescription}
              onChange={(e) => setParentDescription(e.target.value)}
              placeholder="A short description for the parent Feature/Epic."
            />
          </label>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Children</h3>
          <div className="tabs">
            <button aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>
              Manual
            </button>
            <button aria-pressed={mode === 'ai'} onClick={() => setMode('ai')}>
              AI-assisted
            </button>
            <button aria-pressed={mode === 'scan'} onClick={() => setMode('scan')}>
              From scan
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <label className="field">
            One child suffix per line
            <textarea
              rows={6}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
          </label>
        )}

        {mode === 'ai' && (
          <>
            <label className="field">
              Feature description (be specific — personas, constraints, channels)
              <textarea
                rows={5}
                placeholder="Who is affected, what problem is solved, boundaries (in/out of scope), compliance or reporting needs, and happy vs edge paths."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
            </label>
            <label className="field">
              Suggested child count
              <input
                type="number"
                min={2}
                max={15}
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value) || 5)}
              />
            </label>
            <div className="action-row">
              <button
                className="btn btn-primary"
                disabled={aiBusy || bulkAdoBusy}
                onClick={requestAi}
              >
                {aiBusy ? 'Asking Copilot...' : 'Suggest breakdown with AI'}
              </button>
              {children.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setChildren([])}>
                  Clear AI results
                </button>
              )}
            </div>
            {children.length > 0 && (
              <div className="bulk-preview">
                {children.map((child, index) => (
                  <div className="preview-item" key={`${child.suffix}-${index}`}>
                    <input
                      style={{ flex: 1 }}
                      value={child.suffix}
                      onChange={(e) => {
                        const next = children.slice();
                        next[index] = { ...child, suffix: e.target.value };
                        setChildren(next);
                      }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setChildren(children.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === 'scan' && (
          <>
            {!scanProject && (
              <p className="hint">Pick a project above to pull children from its scan.</p>
            )}
            {scanProject && scanChildren.length === 0 && (
              <p className="hint">
                No scan data for {scanProject.name}. Run a scan in Projects first.
              </p>
            )}
            {scanChildren.length > 0 && (
              <div className="bulk-preview">
                {scanChildren.map((child, index) => (
                  <div className="preview-item" key={`${child.suffix}-${index}`}>
                    <span>{child.suffix}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Preview ({effectiveChildren.length} item{effectiveChildren.length === 1 ? '' : 's'})</h3>
          <div className="action-row">
            <button
              className="btn"
              onClick={createDrafts}
              disabled={effectiveChildren.length === 0 || bulkAdoBusy}
            >
              Save as drafts
            </button>
            <button
              className="btn btn-primary"
              onClick={pushToAdo}
              disabled={effectiveChildren.length === 0 || bulkAdoBusy}
            >
              Create drafts &amp; push to ADO
            </button>
          </div>
        </div>
        <div className="bulk-preview">
          {effectiveChildren.map((child, index) => (
            <div className="preview-item" key={`preview-${index}`}>
              <span>
                {prefix}
                {separator}
                {child.suffix}
              </span>
              <span className="chip info">{childType}</span>
            </div>
          ))}
          {effectiveChildren.length === 0 && (
            <div className="hint">Add children on the left to see the preview.</div>
          )}
        </div>
        <p className="hint">
          "Save as drafts" stores items in the PBI Studio without pushing. "Create drafts &amp;
          push to ADO" saves them, creates a parent (if selected), and links children under it.
        </p>
      </section>
    </div>
  );
}
