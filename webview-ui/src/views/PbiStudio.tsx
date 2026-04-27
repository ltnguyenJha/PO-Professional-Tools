import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdoProgressPayload,
  AiSuggestion,
  AppStatePayload,
  BugReportInput,
  ImportedProject,
  InvestWizardInput,
  PbiDraft,
  WebviewRequest
} from '../types';
import { STANDALONE_PROJECT_ID, WORK_ITEM_TYPES } from '../types';
import { ListEditor } from '../components/ListEditor';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingBar } from '../components/LoadingBar';
import { UserStoryWizard } from '../components/UserStoryWizard';
import { BugReportWizard } from '../components/BugReportWizard';
import { parsePbiSuggestionFromText } from '../utils/extractCopilotJson';
import {
  extractMermaidBlocksAsAttachments,
  filesToAttachments
} from '../utils/attachments';

const AUTO_APPLY_KEY = 'poTools.pbi.autoApplyCopilotJson';

interface Props {
  state: AppStatePayload;
  suggestions: Record<string, AiSuggestion>;
  aiBusyDraftId?: string;
  adoProgress: AdoProgressPayload;
  focusDraftId?: string;
  onConsumedFocusDraft?: () => void;
  send: (message: WebviewRequest) => void;
  onDismissSuggestion: (draftId: string) => void;
}

function projectName(projects: ImportedProject[], id: string): string {
  if (id === STANDALONE_PROJECT_ID) {
    return 'Standalone';
  }
  return projects.find((p) => p.id === id)?.name ?? 'Unassigned';
}

export function PbiStudio({
  state,
  suggestions,
  aiBusyDraftId,
  adoProgress,
  focusDraftId,
  onConsumedFocusDraft,
  send,
  onDismissSuggestion
}: Props): JSX.Element {
  const { pbiDrafts, linkTargets: linkTargetsState, projects } = state;
  const linkTargets = linkTargetsState ?? projects;
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | undefined>(pbiDrafts[0]?.id);
  const [working, setWorking] = useState<PbiDraft | undefined>(undefined);
  const [aiInstruction, setAiInstruction] = useState('');
  const [pastedAi, setPastedAi] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [newScope, setNewScope] = useState<string>('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSeed, setHeroSeed] = useState('');
  const [autoApplyNotice, setAutoApplyNotice] = useState('');
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(() => {
    try {
      return sessionStorage.getItem(AUTO_APPLY_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const lastClipboardApplyHash = useRef<string>('');
  const fileAttachInputRef = useRef<HTMLInputElement>(null);
  /** Extra context for in-panel full-story generation (optional; falls back to Description). */
  const [fullStorySeed, setFullStorySeed] = useState('');

  // PBI type selector: 'feature' | 'bug'
  const [pbiType, setPbiType] = useState<'feature' | 'bug'>('feature');
  // Collapsible section state — User Story Wizard starts expanded, others collapsed
  const [openEditItem, setOpenEditItem] = useState(true);
  const [openFullStory, setOpenFullStory] = useState(false);
  const [openCopilotChat, setOpenCopilotChat] = useState(false);
  const [openRefineAI, setOpenRefineAI] = useState(false);
  const [openBugRefinement, setOpenBugRefinement] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pbiDrafts.filter((draft) => {
      if (filterProject !== 'all' && draft.projectId !== filterProject) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        draft.title.toLowerCase().includes(term) ||
        draft.description.toLowerCase().includes(term)
      );
    });
  }, [pbiDrafts, search, filterProject]);

  useEffect(() => {
    if (!activeId && filtered.length > 0) {
      setActiveId(filtered[0].id);
      return;
    }
    if (activeId && !pbiDrafts.some((d) => d.id === activeId)) {
      setActiveId(filtered[0]?.id);
    }
  }, [filtered, activeId, pbiDrafts]);

  useEffect(() => {
    if (focusDraftId && pbiDrafts.some((d) => d.id === focusDraftId)) {
      setActiveId(focusDraftId);
      setFilterProject('all');
      onConsumedFocusDraft?.();
    }
  }, [focusDraftId, pbiDrafts, onConsumedFocusDraft]);

  useEffect(() => {
    if (linkTargets.length === 0) {
      return;
    }
    setNewScope((prev) => {
      if (prev && linkTargets.some((p) => p.id === prev)) {
        return prev;
      }
      return linkTargets[0]!.id;
    });
  }, [linkTargets]);

  useEffect(() => {
    const source = pbiDrafts.find((d) => d.id === activeId);
    if (!source) {
      setWorking(undefined);
    } else {
      let next: PbiDraft = { ...source };
      if (linkTargets.length > 0) {
        const valid = linkTargets.some((t) => t.id === next.projectId);
        if (!valid || next.projectId === STANDALONE_PROJECT_ID) {
          next = { ...next, projectId: linkTargets[0]!.id };
        }
      }
      setWorking(next);
    }
    setAiInstruction('');
    setPastedAi('');
    setFullStorySeed('');
    lastClipboardApplyHash.current = '';
  }, [activeId, pbiDrafts, linkTargets]);

  // Reset pbi type selector to 'feature' whenever the selected draft changes
  useEffect(() => {
    setPbiType('feature');
  }, [activeId]);

  const persistAutoApply = (value: boolean): void => {
    setAutoApplyEnabled(value);
    try {
      sessionStorage.setItem(AUTO_APPLY_KEY, value ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const canCreateLinked =
    linkTargets.length > 0 &&
    Boolean(newScope) &&
    linkTargets.some((p) => p.id === newScope);

  const createPayload = (openChat: boolean): void => {
    if (!canCreateLinked) {
      window.alert(
        'Open a workspace folder or import a project on the Projects tab, then pick a linked project.'
      );
      return;
    }
    send({
      type: 'CREATE_PBI_DRAFT',
      payload: {
        projectId: newScope,
        title: heroTitle.trim() || undefined,
        openCopilotChat: openChat ? 'newStory' : undefined,
        seedIdea: heroSeed.trim() || undefined
      }
    });
    if (!openChat) {
      setHeroTitle('');
    }
    setHeroSeed('');
  };

  const quickCreateBlank = (): void => {
    if (!canCreateLinked) {
      window.alert(
        'Open a workspace folder or import a project on the Projects tab, then pick a linked project.'
      );
      return;
    }
    send({
      type: 'CREATE_PBI_DRAFT',
      payload: {
        projectId: newScope,
        title: undefined
      }
    });
  };

  const active = working;
  const suggestion = activeId ? suggestions[activeId] : undefined;
  const aiBusy = aiBusyDraftId === activeId;
  const adoSyncingThis =
    adoProgress.busy &&
    adoProgress.scope === 'single' &&
    Boolean(activeId) &&
    adoProgress.draftId === activeId;
  const adoMessage =
    adoSyncingThis && adoProgress.message.trim().length > 0
      ? adoProgress.message
      : 'Syncing with Azure DevOps…';
  const isLinkedToAdo = Boolean(active?.status === 'pushed' && active?.adoWorkItemId != null);

  const tryApplyRawToActive = useCallback(
    (raw: string): boolean => {
      if (!activeId) {
        return false;
      }
      const suggestionParsed = parsePbiSuggestionFromText(raw);
      if (!suggestionParsed) {
        return false;
      }
      send({
        type: 'APPLY_AI_SUGGESTION',
        payload: { draftId: activeId, suggestion: suggestionParsed }
      });
      setPastedAi('');
      setAutoApplyNotice('Applied Copilot JSON to this backlog item.');
      window.setTimeout(() => setAutoApplyNotice(''), 4000);
      return true;
    },
    [activeId, send]
  );

  useEffect(() => {
    if (!autoApplyEnabled || !activeId) {
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const tryClipboard = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void navigator.clipboard
          .readText()
          .then((text) => {
            if (!text?.trim()) {
              return;
            }
            const fingerprint = `${text.length}:${text.slice(0, 512)}`;
            if (fingerprint === lastClipboardApplyHash.current) {
              return;
            }
            if (!parsePbiSuggestionFromText(text)) {
              return;
            }
            if (tryApplyRawToActive(text)) {
              lastClipboardApplyHash.current = fingerprint;
            }
          })
          .catch(() => {});
      }, 450);
    };
    window.addEventListener('focus', tryClipboard);
    document.addEventListener('visibilitychange', tryClipboard);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', tryClipboard);
      document.removeEventListener('visibilitychange', tryClipboard);
    };
  }, [activeId, autoApplyEnabled, tryApplyRawToActive]);

  const save = (): void => {
    if (active) {
      send({ type: 'UPDATE_PBI_DRAFT', payload: { draft: active } });
    }
  };

  const pushOne = (): void => {
    if (active) {
      send({ type: 'PUSH_PBI_TO_ADO', payload: { draftId: active.id, draft: active } });
    }
  };

  const updateInAdo = (): void => {
    if (active) {
      send({ type: 'UPDATE_PBI_IN_ADO', payload: { draftId: active.id, draft: active } });
    }
  };

  const handleWizardGenerate = (wizard: InvestWizardInput): void => {
    if (active) {
      send({ type: 'GENERATE_FROM_INVEST_WIZARD', payload: { draftId: active.id, wizard } });
    }
  };

  const handleWizardOpenInChat = (wizard: InvestWizardInput): void => {
    if (active) {
      send({ type: 'OPEN_INVEST_WIZARD_IN_CHAT', payload: { draftId: active.id, wizard } });
    }
  };

  const handleBugGenerate = (input: BugReportInput): void => {
    send({ type: 'GENERATE_BUG_REPORT', payload: input });
  };

  const handleBugOpenInChat = (input: BugReportInput): void => {
    send({ type: 'OPEN_BUG_REPORT_IN_CHAT', payload: input });
  };

  const onPickAttachments = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files?.length || !active) {
      return;
    }
    const next = await filesToAttachments(files);
    setWorking({
      ...active,
      attachments: [...(active.attachments ?? []), ...next]
    });
    e.target.value = '';
  };

  const removeAttachment = (id: string): void => {
    if (!active) {
      return;
    }
    setWorking({
      ...active,
      attachments: (active.attachments ?? []).filter((a) => a.id !== id)
    });
  };

  const addMermaidFromDescription = (): void => {
    if (!active) {
      return;
    }
    const found = extractMermaidBlocksAsAttachments(active.description);
    if (found.length === 0) {
      setAutoApplyNotice('No ```mermaid``` blocks found in Description.');
      window.setTimeout(() => setAutoApplyNotice(''), 3500);
      return;
    }
    setWorking({
      ...active,
      attachments: [...(active.attachments ?? []), ...found]
    });
    setAutoApplyNotice(`Added ${found.length} Mermaid file(s) to attachments.`);
    window.setTimeout(() => setAutoApplyNotice(''), 4000);
  };

  const refine = (): void => {
    if (active) {
      send({
        type: 'REFINE_PBI_WITH_AI',
        payload: { draftId: active.id, instruction: aiInstruction || undefined }
      });
    }
  };

  const applyPastedAi = (): void => {
    if (!activeId) {
      return;
    }
    const suggestionParsed = parsePbiSuggestionFromText(pastedAi);
    if (!suggestionParsed) {
      alert(
        'Could not find valid PBI JSON. Copy the full block from Copilot (including { … }). If it still fails, ask Copilot to reply with valid JSON only, escaping quotes inside strings.'
      );
      return;
    }
    send({
      type: 'APPLY_AI_SUGGESTION',
      payload: { draftId: activeId, suggestion: suggestionParsed }
    });
    setPastedAi('');
    setAutoApplyNotice('Applied JSON from the text box.');
    window.setTimeout(() => setAutoApplyNotice(''), 3500);
  };

  const importFromClipboard = (): void => {
    void navigator.clipboard.readText().then((text) => {
      if (tryApplyRawToActive(text)) {
        return;
      }
      setPastedAi(text);
      setAutoApplyNotice('Clipboard pasted into the box — fix or click Apply JSON.');
      window.setTimeout(() => setAutoApplyNotice(''), 4000);
    });
  };

  const onPasteApplyBox = (e: React.ClipboardEvent<HTMLTextAreaElement>): void => {
    if (!autoApplyEnabled) {
      return;
    }
    const text = e.clipboardData.getData('text/plain');
    if (text && tryApplyRawToActive(text)) {
      e.preventDefault();
    }
  };

  const acceptSuggestedField = (field: keyof AiSuggestion): void => {
    if (!active || !suggestion) {
      return;
    }
    const partial: AiSuggestion = {};
    if (field === 'title' && typeof suggestion.title === 'string') {
      partial.title = suggestion.title;
    } else if (field === 'description' && typeof suggestion.description === 'string') {
      partial.description = suggestion.description;
    } else if (field === 'acceptanceCriteria' && Array.isArray(suggestion.acceptanceCriteria)) {
      partial.acceptanceCriteria = suggestion.acceptanceCriteria;
    } else if (field === 'testScenarios' && Array.isArray(suggestion.testScenarios)) {
      partial.testScenarios = suggestion.testScenarios;
    }
    send({ type: 'APPLY_AI_SUGGESTION', payload: { draftId: active.id, suggestion: partial } });
  };

  if (pbiDrafts.length === 0) {
    return (
      <div className="content">
        <section className="card studio-hero">
          <h2 style={{ margin: '0 0 8px' }}>PBI Studio — start here</h2>
          <p className="card-subtitle" style={{ marginBottom: 16 }}>
            Link each backlog item to a <strong>repo or workspace folder</strong> so AI refinement,
            full-story generation, and Copilot Chat use your codebase (Product Manager prompt + linked
            context). Use <strong>VS Code Copilot Chat</strong> to co-author if you like — with{' '}
            <strong>Auto-apply</strong> on (default), JSON from chat can merge into your draft
            automatically.
          </p>
          {linkTargets.length === 0 ? (
            <p className="hint" style={{ marginBottom: 16 }}>
              Open a folder in this workspace or use the <strong>Projects</strong> tab to import a repo
              before creating a PBI.
            </p>
          ) : null}
          <div className="field-row">
            <label className="field">
              Link to project (required)
              {linkTargets.length > 0 ? (
                <select value={newScope} onChange={(e) => setNewScope(e.target.value)}>
                  {linkTargets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="hint" style={{ marginTop: 6 }}>
                  No workspace folders yet — add one above first.
                </p>
              )}
            </label>
            <label className="field">
              Working title (optional)
              <input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. Guest payment — loan verify"
              />
            </label>
          </div>
          <label className="field">
            Idea or context for Copilot (optional)
            <textarea
              rows={3}
              value={heroSeed}
              onChange={(e) => setHeroSeed(e.target.value)}
              placeholder="Describe the outcome, actors, or constraints. Copilot will use this in Chat."
            />
          </label>
          <div className="action-row" style={{ marginTop: 8 }}>
            <button
              className="btn btn-primary"
              disabled={!canCreateLinked}
              onClick={() => createPayload(true)}
            >
              Create &amp; open Copilot Chat
            </button>
            <button className="btn" disabled={!canCreateLinked} onClick={() => createPayload(false)}>
              Create blank PBI only
            </button>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            The list includes <strong>imported projects</strong> and <strong>folders in this workspace</strong>{' '}
            (multi-root). Use <strong>Projects</strong> to import or scan; linking here does not require import.
            When Copilot replies with JSON, select your new draft and use <strong>Apply AI Result</strong> below.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="studio-toolbar card" style={{ padding: '12px 16px', marginBottom: 4 }}>
        <div className="action-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ marginRight: 8 }}>New PBI</strong>
          <select
            value={newScope}
            onChange={(e) => setNewScope(e.target.value)}
            title="Link new items to a repo or workspace folder (required)"
            style={{ maxWidth: 200 }}
            disabled={linkTargets.length === 0}
          >
            {linkTargets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            disabled={!canCreateLinked}
            onClick={quickCreateBlank}
          >
            + New PBI
          </button>
          <button
            className="btn btn-sm"
            disabled={!canCreateLinked}
            onClick={() => {
              send({
                type: 'CREATE_PBI_DRAFT',
                payload: {
                  projectId: newScope,
                  openCopilotChat: 'newStory',
                  seedIdea: undefined
                }
              });
            }}
          >
            + New &amp; Copilot Chat
          </button>
        </div>
      </div>

      {active && adoSyncingThis && (
        <LoadingBar label={adoMessage} ariaLabel={`Azure DevOps: ${adoMessage}`} />
      )}

      <div className="studio">
        <aside className="studio-list">
          <div className="searchbar">
            <input
              placeholder="Search drafts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              title="Filter by project"
            >
              <option value="all">All</option>
              {linkTargets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={STANDALONE_PROJECT_ID}>Standalone</option>
              <option value="bulk">(Bulk)</option>
            </select>
          </div>
          {filtered.map((draft) => (
            <button
              type="button"
              key={draft.id}
              className={`studio-item ${activeId === draft.id ? 'active' : ''}`}
              onClick={() => setActiveId(draft.id)}
            >
              <div className="title">{draft.title}</div>
              <div className="meta">
                <span>{projectName(linkTargets, draft.projectId)}</span>
                <span
                  className={`chip ${
                    draft.status === 'pushed' ? 'success' : 'info'
                  }`}
                >
                  {draft.status === 'pushed'
                    ? `#${draft.adoWorkItemId ?? '??'}`
                    : draft.workItemType ?? 'PBI'}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="hint">No matching drafts.</div>}
        </aside>

        <section className="studio-editor">
          {!active && <div className="empty">Select a draft to edit.</div>}
          {active && (
            <>
              {active.status === 'pushed' && active.adoWorkItemUrl && (
                <div className="pushed-banner">
                  <span>Pushed to ADO as #{active.adoWorkItemId}.</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      send({ type: 'OPEN_EXTERNAL', payload: { url: active.adoWorkItemUrl! } })
                    }
                  >
                    Open in browser
                  </button>
                </div>
              )}

              <article className="card">
                <div className="section-header" onClick={() => setOpenEditItem((o) => !o)}>
                  <h3 style={{ margin: 0 }}>Edit item</h3>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="action-row">
                      <button className="btn btn-sm" onClick={save} disabled={adoSyncingThis}>
                        Save
                      </button>
                      {isLinkedToAdo ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={updateInAdo}
                          disabled={adoSyncingThis}
                        >
                          Update in ADO
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={pushOne}
                          disabled={adoSyncingThis}
                        >
                          Push to ADO
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmDelete(active.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <span className={`section-chevron ${openEditItem ? 'open' : ''}`}>▾</span>
                  </div>
                </div>

                <div className={`section-body ${openEditItem ? '' : 'collapsed'}`}>
                <div className="field-row">
                  <label className="field" style={{ gridColumn: '1 / -1' }}>
                    Title
                    <input
                      value={active.title}
                      onChange={(e) =>
                        setWorking({ ...active, title: e.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    Linked project (required)
                    <select
                      value={
                        linkTargets.some((t) => t.id === active.projectId)
                          ? active.projectId
                          : linkTargets[0]?.id ?? active.projectId
                      }
                      title="Repo or workspace folder this item is associated with"
                      onChange={(e) =>
                        setWorking({ ...active, projectId: e.target.value })
                      }
                      disabled={linkTargets.length === 0}
                    >
                      {linkTargets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="hint" style={{ marginTop: 6 }}>
                      Refine, full-story AI, and Copilot Chat scan this folder (README, layout,
                      package.json, and last Projects scan when present) so descriptions match the
                      Product Manager rulebook and your codebase. Azure DevOps push requires a linked
                      project.
                    </p>
                  </label>
                  <label className="field">
                    Work Item Type
                    <select
                      value={active.workItemType ?? 'Product Backlog Item'}
                      onChange={(e) =>
                        setWorking({
                          ...active,
                          workItemType: e.target.value as PbiDraft['workItemType']
                        })
                      }
                    >
                      {WORK_ITEM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Effort (days)
                    <select
                      value={active.effortDays}
                      onChange={(e) =>
                        setWorking({
                          ...active,
                          effortDays: Number(e.target.value) as PbiDraft['effortDays']
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Iteration
                    {state.adoSettings?.iterationPath ? (
                      <select
                        value={active.iteration}
                        onChange={(e) =>
                          setWorking({ ...active, iteration: e.target.value })
                        }
                      >
                        <option value="">Select iteration...</option>
                        {[
                          state.adoSettings.iterationPath,
                          ...(['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Backlog'].map(
                            (s) => `${state.adoSettings!.projectName}\\${s}`
                          ))
                        ].map((iteration) => (
                          <option key={iteration} value={iteration}>
                            {iteration}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={active.iteration}
                        onChange={(e) =>
                          setWorking({ ...active, iteration: e.target.value })
                        }
                        placeholder="Configure ADO settings to use dropdown"
                      />
                    )}
                  </label>
                </div>

                <label className="field">
                  Description
                  <textarea
                    value={active.description}
                    onChange={(e) =>
                      setWorking({ ...active, description: e.target.value })
                    }
                  />
                </label>

                <ListEditor
                  label="Acceptance Criteria"
                  values={active.acceptanceCriteria}
                  placeholder="Given ... when ... then ..."
                  onChange={(next) =>
                    setWorking({ ...active, acceptanceCriteria: next })
                  }
                />

                <ListEditor
                  label="Test Scenarios"
                  values={active.testScenarios}
                  placeholder="Describe a test scenario"
                  onChange={(next) => setWorking({ ...active, testScenarios: next })}
                />

                <input
                  ref={fileAttachInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.gif,.svg,.pdf,.md,.mmd,.txt,text/plain,image/*"
                  onChange={(e) => void onPickAttachments(e)}
                />
                <div className="field-row" style={{ marginTop: 12 }}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <strong>Attachments (upload on Push / Update in ADO)</strong>
                    <p className="hint" style={{ margin: '4px 0 8px' }}>
                      Diagrams, Mermaid exports, or specs appear under the work item in Azure DevOps.
                      Pending files clear after a successful sync.
                    </p>
                    <div className="action-row" style={{ flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => fileAttachInputRef.current?.click()}
                      >
                        Add files…
                      </button>
                      <button type="button" className="btn btn-sm" onClick={addMermaidFromDescription}>
                        Add Mermaid from Description
                      </button>
                    </div>
                    <ul className="attachment-chips" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {(active.attachments ?? []).map((a) => (
                        <li key={a.id} style={{ marginBottom: 4 }}>
                          <span style={{ marginRight: 8 }}>{a.fileName}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => removeAttachment(a.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                    {(active.attachments ?? []).length === 0 && (
                      <p className="hint" style={{ marginTop: 6 }}>
                        No pending attachments.
                      </p>
                    )}
                  </div>
                </div>
                </div>{/* end section-body */}
              </article>

              <div className="pbi-type-selector-wrap">
                <div className="pbi-type-selector">
                  <button
                    type="button"
                    className={`pbi-type-btn${pbiType === 'feature' ? ' active' : ''}`}
                    onClick={() => setPbiType('feature')}
                  >
                    🆕 New Feature
                  </button>
                  <button
                    type="button"
                    className={`pbi-type-btn${pbiType === 'bug' ? ' active' : ''}`}
                    onClick={() => setPbiType('bug')}
                  >
                    🐛 Bug
                  </button>
                </div>
              </div>

              {pbiType === 'feature' ? (
                <UserStoryWizard
                  key={`feature-${active.id}`}
                  draftId={active.id}
                  aiBusy={aiBusy}
                  onGenerate={handleWizardGenerate}
                  onOpenInChat={handleWizardOpenInChat}
                />
              ) : (
                <BugReportWizard
                  key={`bug-${active.id}`}
                  onGenerate={handleBugGenerate}
                  onOpenInChat={handleBugOpenInChat}
                />
              )}

              {pbiType === 'bug' && (
                <article className="card">
                  <div className="section-header" onClick={() => setOpenBugRefinement((o) => !o)}>
                    <h3 style={{ margin: 0 }}>Bug Refinement Details</h3>
                    <span className={`section-chevron ${openBugRefinement ? 'open' : ''}`}>▾</span>
                  </div>

                  <div className={`section-body ${openBugRefinement ? '' : 'collapsed'}`}>
                    <p className="card-subtitle">
                      Document the root cause, expected behavior, and actual behavior to help developers
                      understand and fix the issue faster. These details complement the reproduction steps.
                    </p>

                    <label className="field">
                      Root Cause Analysis (optional)
                      <textarea
                        rows={3}
                        value={active.bugRootCause || ''}
                        onChange={(e) =>
                          setWorking({ ...active, bugRootCause: e.target.value })
                        }
                        placeholder="e.g. The loan verification API returns a 500 error when the loan number contains special characters. The backend is not sanitizing input before querying the database."
                      />
                    </label>

                    <label className="field">
                      Expected Behavior
                      <textarea
                        rows={2}
                        value={active.bugExpectedBehavior || ''}
                        onChange={(e) =>
                          setWorking({ ...active, bugExpectedBehavior: e.target.value })
                        }
                        placeholder="e.g. The system accepts loan numbers with hyphens and special characters, sanitizes them, and returns a 200 response with valid verification data."
                      />
                    </label>

                    <label className="field">
                      Actual Behavior
                      <textarea
                        rows={2}
                        value={active.bugActualBehavior || ''}
                        onChange={(e) =>
                          setWorking({ ...active, bugActualBehavior: e.target.value })
                        }
                        placeholder="e.g. When entering a loan number with a hyphen (e.g. 12345-67890), the system returns a 500 error with the message 'Internal Server Error' and no verification occurs."
                      />
                    </label>

                    <ListEditor
                      label="Reproduction Steps (detailed)"
                      values={active.bugReproductionSteps || []}
                      placeholder="Step 1: ..., Step 2: ..., etc."
                      onChange={(next) =>
                        setWorking({ ...active, bugReproductionSteps: next })
                      }
                    />
                  </div>
                </article>
              )}

              <article className="card">
                <div className="section-header" onClick={() => setOpenFullStory((o) => !o)}>
                  <h3 style={{ margin: 0 }}>Generate full story in-panel (no Chat paste)</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {aiBusy && <span className="chip info">Generating…</span>}
                    <span className={`section-chevron ${openFullStory ? 'open' : ''}`}>▾</span>
                  </div>
                </div>
                <div className={`section-body ${openFullStory ? '' : 'collapsed'}`}>
                <p className="card-subtitle">
                  Uses the same GitHub Copilot <strong>language model inside VS Code</strong> (not Copilot
                  Chat). This path <strong>applies title, description, acceptance criteria, and tests
                  automatically</strong> — no copy/paste. Prompts favor <strong>4–7 sharp, testable
                  criteria</strong> instead of long vague lists. Copilot Chat cannot inject replies into
                  this panel (VS Code limitation); use this for a one-click workflow.
                </p>
                <label className="field">
                  Business context for AI (optional)
                  <textarea
                    rows={4}
                    value={fullStorySeed}
                    onChange={(e) => setFullStorySeed(e.target.value)}
                    placeholder="Goals, actors, constraints, integrations, or compliance notes — or leave empty to expand from the Description field above."
                  />
                </label>
                <div className="action-row">
                  <button
                    className="btn btn-primary"
                    disabled={aiBusy}
                    onClick={() =>
                      send({
                        type: 'GENERATE_FULL_STORY_AI',
                        payload: {
                          draftId: active.id,
                          seedText:
                            fullStorySeed.trim() ||
                            active.description.trim() ||
                            undefined
                        }
                      })
                    }
                  >
                    Generate full story &amp; apply
                  </button>
                </div>
                </div>{/* end section-body */}
              </article>

              <article className="card">
                <div className="section-header" onClick={() => setOpenCopilotChat((o) => !o)}>
                  <h3 style={{ margin: 0 }}>VS Code Copilot Chat</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {aiBusy && <span className="chip info">Copilot is thinking...</span>}
                    <span className={`section-chevron ${openCopilotChat ? 'open' : ''}`}>▾</span>
                  </div>
                </div>
                <div className={`section-body ${openCopilotChat ? '' : 'collapsed'}`}>
                <p className="card-subtitle">
                  <strong>Build story</strong> opens Chat with a prompt to draft the user story and
                  acceptance criteria from scratch (or your seed). <strong>Refine</strong> improves
                  what is already in the fields below.
                </p>
                <div className="action-row" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      send({
                        type: 'OPEN_IN_COPILOT_CHAT',
                        payload: { draftId: active.id, mode: 'newStory' }
                      })
                    }
                  >
                    Build story in Copilot Chat
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      send({
                        type: 'OPEN_IN_COPILOT_CHAT',
                        payload: { draftId: active.id, mode: 'refine' }
                      })
                    }
                  >
                    Refine in Copilot Chat
                  </button>
                </div>
                </div>{/* end section-body */}
              </article>

              <article className="card">
                <div className="section-header" onClick={() => setOpenRefineAI((o) => !o)}>
                  <h3 style={{ margin: 0 }}>Refine with AI (in panel)</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {aiBusy && <span className="chip info">Working...</span>}
                    <span className={`section-chevron ${openRefineAI ? 'open' : ''}`}>▾</span>
                  </div>
                </div>
                <div className={`section-body ${openRefineAI ? '' : 'collapsed'}`}>
                <p className="card-subtitle">
                  Runs Copilot inside the extension. Review each field before applying.
                </p>
                <label className="field">
                  PO notes for refinement (optional — prioritized when filled)
                  <textarea
                    rows={3}
                    placeholder="e.g. compliance must mention NACHA; mobile-first; keep scope to guest pay only"
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                  />
                </label>
                <div className="action-row">
                  <button className="btn btn-primary" disabled={aiBusy} onClick={refine}>
                    Refine with AI
                  </button>
                </div>

                {suggestion && (
                  <div className="ai-suggestion">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap'
                      }}
                    >
                      <h4 style={{ margin: 0 }}>AI suggestion — review per field</h4>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDismissSuggestion(active.id)}
                      >
                        Dismiss all
                      </button>
                    </div>
                    {typeof suggestion.title === 'string' && (
                      <>
                        <div className="diff-block">{suggestion.title}</div>
                        <div className="diff-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptSuggestedField('title')}
                          >
                            Apply title
                          </button>
                        </div>
                      </>
                    )}
                    {typeof suggestion.description === 'string' && (
                      <>
                        <div className="diff-block">{suggestion.description}</div>
                        <div className="diff-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptSuggestedField('description')}
                          >
                            Apply description
                          </button>
                        </div>
                      </>
                    )}
                    {suggestion.acceptanceCriteria && (
                      <>
                        <div className="diff-block">
                          {suggestion.acceptanceCriteria.map((item, i) => `• ${item}\n`).join('')}
                        </div>
                        <div className="diff-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptSuggestedField('acceptanceCriteria')}
                          >
                            Apply acceptance criteria
                          </button>
                        </div>
                      </>
                    )}
                    {suggestion.testScenarios && (
                      <>
                        <div className="diff-block">
                          {suggestion.testScenarios.map((item, i) => `• ${item}\n`).join('')}
                        </div>
                        <div className="diff-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptSuggestedField('testScenarios')}
                          >
                            Apply test scenarios
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="apply-ai-box">
                  <div className="card-header" style={{ padding: 0, marginBottom: 6 }}>
                    <strong>Apply JSON from Copilot Chat</strong>
                  </div>
                  <p className="hint" style={{ marginTop: 0 }}>
                    When <strong>Auto-apply</strong> is on, pasting Copilot&apos;s reply or returning to
                    this tab after copying JSON will merge title, description, acceptance criteria, and
                    tests into the selected item. Extra text (e.g. &quot;GitHub&quot; or link junk) is
                    ignored when possible.
                  </p>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      marginBottom: 8
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoApplyEnabled}
                      onChange={(e) => persistAutoApply(e.target.checked)}
                    />
                    Auto-apply JSON from paste and when this panel gets focus (uses clipboard)
                  </label>
                  {autoApplyNotice && (
                    <div className="pushed-banner" style={{ marginBottom: 8 }}>
                      {autoApplyNotice}
                    </div>
                  )}
                  <span className="hint">Or paste below and click Apply JSON</span>
                  <textarea
                    value={pastedAi}
                    placeholder={
                      '{\n  "title": "Optional better title",\n  "description": "...",\n  "acceptanceCriteria": ["..."],\n  "testScenarios": ["..."]\n}'
                    }
                    onChange={(e) => setPastedAi(e.target.value)}
                    onPaste={onPasteApplyBox}
                    rows={6}
                  />
                  <div className="action-row">
                    <button
                      className="btn btn-sm"
                      disabled={!pastedAi.trim()}
                      onClick={applyPastedAi}
                    >
                      Apply JSON
                    </button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={importFromClipboard}>
                      Import from clipboard
                    </button>
                  </div>
                </div>
                </div>{/* end section-body */}
              </article>
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        destructive
        title="Delete draft?"
        message="This removes the draft from the dashboard. If it was already pushed, the ADO work item is unaffected."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            send({ type: 'DELETE_PBI_DRAFT', payload: { draftId: confirmDelete } });
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
