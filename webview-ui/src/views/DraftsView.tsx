import { useEffect, useMemo, useState } from 'react';
import type { AppStatePayload, ImportedProject, WebviewRequest } from '../types';
import { STANDALONE_PROJECT_ID } from '../types';

interface Props {
  state: AppStatePayload;
  send: (message: WebviewRequest) => void;
  onNavigateToStudio: (draftId?: string) => void;
}

function projectDisplayName(projects: ImportedProject[], id: string): string {
  if (id === STANDALONE_PROJECT_ID) return 'Standalone';
  return projects.find((p) => p.id === id)?.name ?? 'Unassigned';
}

export function DraftsView({ state, send, onNavigateToStudio }: Props): JSX.Element {
  const { pbiDrafts, linkTargets: linkTargetsState, projects } = state;
  const linkTargets = linkTargetsState ?? projects;

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newScope, setNewScope] = useState<string>(linkTargets[0]?.id ?? '');

  useEffect(() => {
    if (linkTargets.length === 0) return;
    setNewScope((prev) => {
      if (prev && linkTargets.some((p) => p.id === prev)) return prev;
      return linkTargets[0]!.id;
    });
  }, [linkTargets]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pbiDrafts.filter((draft) => {
      if (filterProject !== 'all' && draft.projectId !== filterProject) return false;
      if (!term) return true;
      return (
        draft.title.toLowerCase().includes(term) ||
        draft.description.toLowerCase().includes(term)
      );
    });
  }, [pbiDrafts, search, filterProject]);

  const pushedCount = pbiDrafts.filter((d) => d.status === 'pushed').length;
  const canCreate =
    linkTargets.length > 0 && Boolean(newScope) && linkTargets.some((p) => p.id === newScope);

  const handleCreate = (openChat: boolean): void => {
    if (!canCreate) {
      window.alert(
        'Open a workspace folder or import a project on the Projects tab, then pick a linked project.'
      );
      return;
    }
    send({
      type: 'CREATE_PBI_DRAFT',
      payload: {
        projectId: newScope,
        openCopilotChat: openChat ? 'newStory' : undefined,
      },
    });
    onNavigateToStudio();
  };

  return (
    <div className="content">
      {/* Creation toolbar */}
      <div className="card card-modern" style={{ padding: '12px 16px' }}>
        <div className="action-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ marginRight: 8 }}>New PBI</strong>
          <select
            value={newScope}
            onChange={(e) => setNewScope(e.target.value)}
            title="Link new items to a repo or workspace folder (required)"
            aria-label="Link new PBI to project"
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
            type="button"
            className="btn-energy btn-sm focus-tw-ring"
            disabled={!canCreate}
            onClick={() => handleCreate(false)}
          >
            + New PBI
          </button>
          <button
            type="button"
            className="btn-energy btn-energy-ai btn-sm focus-tw-ring"
            disabled={!canCreate}
            onClick={() => handleCreate(true)}
          >
            ✨ New &amp; Copilot Chat
          </button>
        </div>
        <div className="studio-toolbar-stats">
          <span>
            {pbiDrafts.length} draft{pbiDrafts.length !== 1 ? 's' : ''}
          </span>
          {pushedCount > 0 && (
            <span className="chip-energy chip-energy-green">
              {pushedCount} pushed ✓
            </span>
          )}
        </div>
      </div>

      {/* Search & filter */}
      <div className="drafts-view">
        <div className="drafts-searchbar">
          <input
            placeholder="Search drafts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search PBI drafts"
          />
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            title="Filter by project"
            aria-label="Filter by project"
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

        <div className="drafts-list">
          {filtered.map((draft) => {
            const parentFeature = draft.parentFeatureId
              ? (state.featureDrafts ?? []).find((f) => f.id === draft.parentFeatureId)
              : undefined;
            return (
              <button
                type="button"
                key={draft.id}
                className="card-modern card-modern-interactive draft-tile hover-lift focus-tw-ring"
                onClick={() => onNavigateToStudio(draft.id)}
              >
                <div className="font-semibold text-sm text-tw-fg line-clamp-2">{draft.title}</div>
                <div className="flex justify-between items-center gap-2 mt-1 text-xs text-contrast-muted">
                  <span>{projectDisplayName(linkTargets, draft.projectId)}</span>
                  <span className={`chip-energy ${draft.status === 'pushed' ? 'chip-energy-green' : 'chip-energy-violet'}`}>
                    {draft.status === 'pushed'
                      ? `#${draft.adoWorkItemId ?? '??'}`
                      : (draft.workItemType ?? 'PBI')}
                  </span>
                </div>
                {parentFeature && (
                  <div
                    className="mt-0.5 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--tw-vscode-info-bg)',
                      color: 'var(--tw-vscode-info)',
                    }}
                    title={`Part of Feature: ${parentFeature.title}`}
                  >
                    📦{' '}
                    {parentFeature.title.length > 28
                      ? parentFeature.title.slice(0, 28) + '…'
                      : parentFeature.title}
                  </div>
                )}
              </button>
            );
          })}

          {pbiDrafts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">✨</div>
              <h3>A blank canvas — let&apos;s write your first story</h3>
              <p>
                Draft PBIs here, refine with AI, then push to Azure DevOps when you&apos;re ready.
                Use the toolbar above to get started.
              </p>
            </div>
          )}

          {pbiDrafts.length > 0 && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🔍</div>
              <h3>Nothing matched — try a wider search</h3>
              <p>Clear filters or create a new draft to keep momentum going.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
