import { useState, useEffect } from 'react';
import type { AppStatePayload, PbiDraft, WebviewRequest, FeatureDraft } from '../types';
import type { ViewId } from '../components/Sidebar';
import { LoadingBar } from '../components/LoadingBar';

// ─── Local types ─────────────────────────────────────────────────────────────
interface FeaturePushProgress {
  featureId: string;
  phase: 'feature' | 'children';
  current: number;
  total: number;
  message: string;
}

interface FeaturePushedResult {
  featureId: string;
  adoWorkItemId?: number;
  childCount: number;
  failedIds?: string[];
}

interface LocalPbiEdit {
  title: string;
  effortDays: 1 | 2 | 3 | 5 | 8 | 13;
  included: boolean;
  confirmRemove: boolean;
}

const EFFORT_OPTIONS: Array<1 | 2 | 3 | 5 | 8 | 13> = [1, 2, 3, 5, 8, 13];

const STEPS = [
  { num: 1, label: 'Feature Details' },
  { num: 2, label: 'Context & Repos' },
  { num: 3, label: 'AI Generation' },
  { num: 4, label: 'Story Review' },
  { num: 5, label: 'Save & Push' },
];

// ─── Props ───────────────────────────────────────────────────────────────────
export interface FeatureCreationWizardProps {
  appState: AppStatePayload;
  send: (message: WebviewRequest) => void;
  onNavigate: (view: ViewId) => void;
  generatedPbiIds?: string[];
  onClearGeneratedPbiIds: () => void;
  pushProgress?: FeaturePushProgress | null;
  pushResult?: FeaturePushedResult | null;
  onClearPushResult: () => void;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-6" role="list" aria-label="Wizard steps">
      {STEPS.map((step, idx) => {
        const isDone = step.num < current;
        const isActive = step.num === current;
        return (
          <div key={step.num} className="flex items-center gap-1" role="listitem">
            {idx > 0 && (
              <div
                className="h-px w-4 shrink-0"
                style={{ background: isDone ? 'var(--tw-vscode-accent)' : 'var(--tw-vscode-border)' }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                style={{
                  background: isDone || isActive ? 'var(--tw-vscode-accent)' : 'var(--tw-vscode-bg-alt)',
                  color: isDone || isActive ? 'var(--tw-vscode-accent-fg)' : 'var(--tw-vscode-fg-muted)',
                  border: isDone || isActive ? 'none' : '1.5px solid var(--tw-vscode-border)',
                }}
                aria-label={`Step ${step.num}: ${step.label}${isDone ? ' (completed)' : isActive ? ' (current)' : ''}`}
              >
                {isDone ? '✓' : step.num}
              </div>
              <span
                className="text-xs hidden panel-wide:block whitespace-nowrap"
                style={{
                  color: isActive ? 'var(--tw-vscode-fg)' : 'var(--tw-vscode-fg-muted)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Work Item Hierarchy Info Box ─────────────────────────────────────────────
function WorkItemHierarchyBox() {
  return (
    <div
      className="rounded-md px-3 py-2.5 flex items-start gap-2 border text-sm"
      style={{
        background: 'var(--tw-vscode-bg-alt)',
        borderColor: 'var(--tw-vscode-border)',
        color: 'var(--tw-vscode-fg-muted)',
      }}
    >
      <span className="mt-0.5 shrink-0">📋</span>
      <div>
        <div className="font-semibold mb-0.5" style={{ color: 'var(--tw-vscode-fg)' }}>
          Work Item Hierarchy
        </div>
        <div>
          Parent:{' '}
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
          >
            Feature
          </span>{' '}
          → Children:{' '}
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
          >
            Product Backlog Items
          </span>
        </div>
        <div className="text-xs mt-1 opacity-75">(These types are fixed and cannot be changed)</div>
      </div>
    </div>
  );
}

// ─── Step 1: Feature Details ──────────────────────────────────────────────────
function Step1Details({
  title, setTitle,
  description, setDescription,
  why, setWhy,
  userFlow, setUserFlow,
  businessRules, setBusinessRules,
  touched, setTouched,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  why: string; setWhy: (v: string) => void;
  userFlow: string; setUserFlow: (v: string) => void;
  businessRules: string; setBusinessRules: (v: string) => void;
  touched: Set<string>;
  setTouched: (fn: (prev: Set<string>) => Set<string>) => void;
}) {
  const titleError = touched.has('title') && title.trim().length < 3 ? 'Title must be at least 3 characters' : undefined;
  const descError = touched.has('description') && description.trim().length < 10 ? 'Description must be at least 10 characters' : undefined;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
          Feature Title <span style={{ color: 'var(--tw-vscode-error)' }}>*</span>
        </label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1"
          style={{
            borderColor: titleError ? 'var(--tw-vscode-error)' : 'var(--tw-vscode-border)',
            color: 'var(--tw-vscode-fg)',
          }}
          value={title}
          placeholder="e.g. Guest Checkout — Card on File"
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched((p) => new Set([...p, 'title']))}
        />
        <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          Keep it short: a verb phrase that names the outcome.
        </p>
        {titleError && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-error)' }}>
            ⚠ {titleError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
          Description <span style={{ color: 'var(--tw-vscode-error)' }}>*</span>
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 resize-y"
          style={{
            borderColor: descError ? 'var(--tw-vscode-error)' : 'var(--tw-vscode-border)',
            color: 'var(--tw-vscode-fg)',
            minHeight: '72px',
          }}
          rows={3}
          value={description}
          placeholder="High-level description of this feature and what it delivers."
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched((p) => new Set([...p, 'description']))}
        />
        {descError && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-error)' }}>
            ⚠ {descError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
          Why / Business Value
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(optional)</span>
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 resize-y"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)', minHeight: '64px' }}
          rows={3}
          value={why}
          placeholder="The business case in 2–3 sentences. Why are we building this?"
          maxLength={1000}
          onChange={(e) => setWhy(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
          User Flow
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(optional)</span>
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 resize-y"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)', minHeight: '80px' }}
          rows={4}
          value={userFlow}
          placeholder="What is the primary user journey? (numbered steps or free prose)"
          maxLength={1000}
          onChange={(e) => setUserFlow(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
          Business Rules / Constraints
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(optional)</span>
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 resize-y"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)', minHeight: '64px' }}
          rows={3}
          value={businessRules}
          placeholder="What constraints or rules apply? (compliance, out-of-scope, technical constraints)"
          maxLength={800}
          onChange={(e) => setBusinessRules(e.target.value)}
        />
      </div>

      <WorkItemHierarchyBox />
    </div>
  );
}

// ─── Step 2: Context & Repos ──────────────────────────────────────────────────
function Step2Context({
  linkTargets,
  epicDrafts,
  selectedRepoIds, setSelectedRepoIds,
  parentEpicId, setParentEpicId,
}: {
  linkTargets: AppStatePayload['linkTargets'];
  epicDrafts: Array<{ id: string; title: string }>;
  selectedRepoIds: string[];
  setSelectedRepoIds: (ids: string[]) => void;
  parentEpicId: string | undefined;
  setParentEpicId: (id: string | undefined) => void;
}) {
  const repos = linkTargets ?? [];
  const [repoSearch, setRepoSearch] = useState('');

  const filtered = repoSearch.trim()
    ? repos.filter(
        (r) =>
          r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
          r.path.toLowerCase().includes(repoSearch.toLowerCase())
      )
    : repos;

  const toggleRepo = (id: string) => {
    setSelectedRepoIds(
      selectedRepoIds.includes(id)
        ? selectedRepoIds.filter((x) => x !== id)
        : [...selectedRepoIds, id]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
            Select repos for AI context
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedRepoIds(repos.map((r) => r.id))}
            >
              Select all
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedRepoIds([])}
            >
              Clear all
            </button>
          </div>
        </div>
        <p className="text-xs mb-2" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          Selected repos will give the AI more context for generating user stories.
        </p>
        <input
          className="w-full rounded-md border px-3 py-1.5 text-sm bg-transparent outline-none mb-2"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
          placeholder="🔍 Search repos..."
          value={repoSearch}
          onChange={(e) => setRepoSearch(e.target.value)}
        />
        <div
          className="rounded-md border overflow-y-auto"
          style={{ borderColor: 'var(--tw-vscode-border)', maxHeight: '200px' }}
        >
          {repos.length === 0 ? (
            <p className="px-3 py-4 text-xs text-center" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              No repos imported yet.{' '}
              <span style={{ color: 'var(--tw-vscode-accent)' }}>Import a project</span> in the Projects view.
              <br />
              You can still generate stories without codebase context.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-center" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              No repos match "{repoSearch}".{' '}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRepoSearch('')}>
                Clear search
              </button>
            </p>
          ) : (
            filtered.map((repo) => (
              <label
                key={repo.id}
                className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--tw-vscode-border)' }}
                title={repo.path}
              >
                <input
                  type="checkbox"
                  checked={selectedRepoIds.includes(repo.id)}
                  onChange={() => toggleRepo(repo.id)}
                  className="shrink-0"
                />
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
                    {repo.name}
                  </span>
                  <span className="text-xs block truncate" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                    {repo.path}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {selectedRepoIds.length} selected
        </p>
      </div>

      {epicDrafts.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
            Assign to Epic
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(optional)</span>
          </label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
            value={parentEpicId ?? ''}
            onChange={(e) => setParentEpicId(e.target.value || undefined)}
          >
            <option value="">── No Epic (standalone feature) ──</option>
            {epicDrafts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Links this Feature under an existing Epic.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: AI Generation ────────────────────────────────────────────────────
function Step3Generate({
  featureTitle,
  generationBusy,
  generationError,
  generatedPbis,
  onGenerate,
  onRegenerate,
  onDeletePbi,
}: {
  featureTitle: string;
  generationBusy: boolean;
  generationError?: string;
  generatedPbis: PbiDraft[];
  onGenerate: () => void;
  onRegenerate: () => void;
  onDeletePbi: (id: string) => void;
}) {
  const hasResults = generatedPbis.length > 0;

  if (generationBusy) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="text-2xl select-none">✨</div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
            Generating User Stories…
          </p>
          <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            AI is analyzing your feature and generating user stories for:<br />
            <strong>"{featureTitle}"</strong>
          </p>
        </div>
        <div className="w-full max-w-xs">
          <LoadingBar label="Generating user stories…" />
        </div>
        <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          This usually takes 10–20 seconds.
        </p>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md px-3 py-3 border flex items-start gap-2"
          style={{ borderColor: 'var(--tw-vscode-error)', background: 'var(--tw-vscode-error-bg)' }}
        >
          <span className="shrink-0">⚠</span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--tw-vscode-error)' }}>
              Generation failed
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              {generationError}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={onGenerate}>
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md px-3 py-3 border text-sm"
          style={{ background: 'var(--tw-vscode-bg-alt)', borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg-muted)' }}
        >
          <p className="font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>Ready to generate</p>
          <p>
            AI will analyze your feature details and generate User Stories as{' '}
            <span className="font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>Product Backlog Items</span>.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onGenerate}>
          ✨ Generate User Stories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
          ✅ Generated {generatedPbis.length} Product Backlog Item{generatedPbis.length !== 1 ? 's' : ''}
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRegenerate}>
          🔄 Regenerate
        </button>
      </div>
      <div className="space-y-2">
        {generatedPbis.map((pbi) => (
          <div
            key={pbi.id}
            className="flex items-start gap-2 rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--tw-vscode-border)', background: 'var(--tw-vscode-bg)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
                {pbi.title}
              </p>
              {pbi.description && (
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                  {pbi.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pbi.effortDays && (
                <span
                  className="text-xs rounded px-1.5 py-0.5 font-medium"
                  style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
                >
                  {pbi.effortDays}pt
                </span>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                style={{ color: 'var(--tw-vscode-error)' }}
                onClick={() => onDeletePbi(pbi.id)}
                title="Remove this story"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Story Review ─────────────────────────────────────────────────────
function Step4Review({
  generatedPbis,
  localEdits,
  onUpdateEdit,
  onDeletePbi,
  onEditInStudio,
  onAddStory,
}: {
  generatedPbis: PbiDraft[];
  localEdits: Record<string, LocalPbiEdit>;
  onUpdateEdit: (id: string, update: Partial<LocalPbiEdit>) => void;
  onDeletePbi: (id: string) => void;
  onEditInStudio: (pbiId: string) => void;
  onAddStory: () => void;
}) {
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());

  const toggleDesc = (id: string) => {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const includedCount = generatedPbis.filter((p) => localEdits[p.id]?.included !== false).length;

  return (
    <div className="space-y-3">
      {/* Parent-child type banner */}
      <div
        className="text-xs rounded px-2.5 py-1.5 border flex items-center gap-1.5"
        style={{ background: 'var(--tw-vscode-bg-alt)', borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg-muted)' }}
      >
        <span
          className="rounded px-1.5 py-0.5 font-medium text-xs"
          style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
        >
          Feature
        </span>
        <span>→</span>
        <span
          className="rounded px-1.5 py-0.5 font-medium text-xs"
          style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
        >
          Product Backlog Items
        </span>
        <span className="ml-1 opacity-60">(types are fixed)</span>
      </div>

      <div className="space-y-2">
        {generatedPbis.map((pbi, idx) => {
          const edit = localEdits[pbi.id];
          const included = edit?.included !== false;
          const title = edit?.title ?? pbi.title;
          const effort = edit?.effortDays ?? (pbi.effortDays as LocalPbiEdit['effortDays']) ?? 3;
          const confirmRemove = edit?.confirmRemove === true;
          const isDescExpanded = expandedDesc.has(pbi.id);

          return (
            <div
              key={pbi.id}
              className="rounded-md border transition-opacity"
              style={{
                borderColor: 'var(--tw-vscode-border)',
                background: included ? 'var(--tw-vscode-bg)' : 'var(--tw-vscode-bg-alt)',
                opacity: included ? 1 : 0.6,
              }}
            >
              <div className="flex items-start gap-2 px-3 pt-2.5">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={() => onUpdateEdit(pbi.id, { included: !included })}
                  className="mt-0.5 shrink-0"
                  title={included ? 'Exclude from push' : 'Include in push'}
                />
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                  [{idx + 1}]
                </span>
                <div className="flex-1 min-w-0">
                  {included ? (
                    <textarea
                      className="w-full text-sm bg-transparent border-b outline-none resize-none pb-0.5"
                      style={{
                        borderColor: 'var(--tw-vscode-border)',
                        color: 'var(--tw-vscode-fg)',
                        minHeight: '1.5rem',
                      }}
                      value={title}
                      maxLength={200}
                      rows={1}
                      onChange={(e) => onUpdateEdit(pbi.id, { title: e.target.value })}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                    />
                  ) : (
                    <p className="text-sm truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
                      {title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {confirmRemove ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span style={{ color: 'var(--tw-vscode-fg-muted)' }}>Remove?</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-xs"
                        style={{ color: 'var(--tw-vscode-error)' }}
                        onClick={() => onDeletePbi(pbi.id)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-xs"
                        onClick={() => onUpdateEdit(pbi.id, { confirmRemove: false })}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--tw-vscode-fg-muted)' }}
                      onClick={() => onUpdateEdit(pbi.id, { confirmRemove: true })}
                      title="Remove story"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {included && (
                <div className="px-3 pb-2.5 mt-2 space-y-2">
                  {pbi.description && (
                    <div>
                      <button
                        type="button"
                        className="text-xs flex items-center gap-1"
                        style={{ color: 'var(--tw-vscode-fg-muted)' }}
                        onClick={() => toggleDesc(pbi.id)}
                      >
                        <span style={{ transform: isDescExpanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                        Description
                      </button>
                      {isDescExpanded && (
                        <p className="text-xs mt-1 pl-4" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                          {pbi.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                        Effort
                      </label>
                      <select
                        className="text-xs rounded border px-1.5 py-0.5 bg-transparent"
                        style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                        value={effort}
                        onChange={(e) =>
                          onUpdateEdit(pbi.id, { effortDays: Number(e.target.value) as LocalPbiEdit['effortDays'] })
                        }
                      >
                        {EFFORT_OPTIONS.map((v) => (
                          <option key={v} value={v}>{v} pt{v !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => onEditInStudio(pbi.id)}
                      title="Open this story in PBI Studio for full editing"
                    >
                      ✏ Edit in PBI Studio
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onAddStory}>
          + Add story
        </button>
        <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {includedCount} of {generatedPbis.length} selected
        </p>
      </div>

      {includedCount === 0 && (
        <div
          className="rounded-md border px-3 py-2 text-xs flex items-center gap-1.5"
          style={{ borderColor: 'var(--tw-vscode-warning)', background: 'var(--tw-vscode-warning-bg)', color: 'var(--tw-vscode-warning)' }}
        >
          ⚠ No stories selected — Push to ADO will only create the Feature parent.
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Save & Push ──────────────────────────────────────────────────────
function Step5SavePush({
  featureTitle,
  childPbiIds,
  pushProgress,
  pushResult,
  onSaveAsDraft,
  onPushToAdo,
  onDone,
}: {
  featureTitle: string;
  childPbiIds: string[];
  pushProgress?: FeaturePushProgress | null;
  pushResult?: FeaturePushedResult | null;
  onSaveAsDraft: () => void;
  onPushToAdo: () => void;
  onDone: () => void;
}) {
  const isPushing = Boolean(pushProgress && !pushResult);
  const isSuccess = Boolean(pushResult && !pushResult.failedIds?.length);
  const isPartial = Boolean(pushResult?.failedIds?.length);

  if (pushResult) {
    return (
      <div className="space-y-4">
        {isSuccess ? (
          <div
            className="rounded-md border px-4 py-4 flex items-start gap-3"
            style={{ borderColor: 'var(--tw-vscode-success)', background: 'var(--tw-vscode-success-bg)' }}
          >
            <span className="text-xl shrink-0">✅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--tw-vscode-success)' }}>
                Feature and {pushResult.childCount} PBI{pushResult.childCount !== 1 ? 's' : ''} pushed to ADO
              </p>
              {pushResult.adoWorkItemId && (
                <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                  Feature #{pushResult.adoWorkItemId}
                </p>
              )}
            </div>
          </div>
        ) : isPartial ? (
          <div
            className="rounded-md border px-4 py-3"
            style={{ borderColor: 'var(--tw-vscode-warning)', background: 'var(--tw-vscode-warning-bg)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--tw-vscode-warning)' }}>
              ⚠ Partial push — {pushResult.failedIds?.length} item(s) failed
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              Successfully pushed items have been created in ADO. Retry to push the remaining items.
            </p>
          </div>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done — back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-md border px-3 py-3"
        style={{ background: 'var(--tw-vscode-bg-alt)', borderColor: 'var(--tw-vscode-border)' }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--tw-vscode-fg-muted)' }}>Ready to save or push to ADO:</p>
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-xs font-medium shrink-0"
            style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
          >
            Feature
          </span>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
            {featureTitle}
          </span>
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {childPbiIds.length} Product Backlog Item{childPbiIds.length !== 1 ? 's' : ''} will be linked as children
        </p>
      </div>

      {isPushing && pushProgress && (
        <div className="space-y-2">
          <LoadingBar
            label={pushProgress.message || (pushProgress.phase === 'feature' ? 'Creating Feature in ADO…' : `Creating PBI ${pushProgress.current}/${pushProgress.total}…`)}
          />
          <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            {pushProgress.phase === 'feature'
              ? 'Creating Feature in ADO…'
              : `Creating PBI ${pushProgress.current} of ${pushProgress.total}… Linking relationships…`}
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={isPushing}
          onClick={onSaveAsDraft}
        >
          💾 Save as Draft
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isPushing}
          onClick={onPushToAdo}
        >
          🚀 Push to ADO
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export function FeatureCreationWizard({
  appState,
  send,
  onNavigate,
  generatedPbiIds,
  onClearGeneratedPbiIds,
  pushProgress,
  pushResult,
  onClearPushResult,
}: FeatureCreationWizardProps): JSX.Element {
  const linkTargets = appState.linkTargets ?? appState.projects;
  const epicDrafts = appState.epicDrafts ?? [];

  // Stable ID for this wizard session
  const [featureDraftId] = useState(
    () => `feature-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [why, setWhy] = useState('');
  const [userFlow, setUserFlow] = useState('');
  const [businessRules, setBusinessRules] = useState('');
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Step 2 fields
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [parentEpicId, setParentEpicId] = useState<string | undefined>();

  // Step 3 AI generation
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [deletedPbiIds, setDeletedPbiIds] = useState<Set<string>>(new Set());

  // Step 4 local edits
  const [localEdits, setLocalEdits] = useState<Record<string, LocalPbiEdit>>({});
  const [manualStories, setManualStories] = useState<PbiDraft[]>([]);

  // Cancel confirm dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Compute generated PBIs from appState.pbiDrafts filtered by generatedPbiIds
  const generatedPbis: PbiDraft[] = [
    ...(generatedPbiIds ?? [])
      .filter((id) => !deletedPbiIds.has(id))
      .map((id) => appState.pbiDrafts.find((d) => d.id === id))
      .filter((d): d is PbiDraft => Boolean(d)),
    ...manualStories.filter((s) => !deletedPbiIds.has(s.id)),
  ];

  // When generation results arrive, transition to step 4
  useEffect(() => {
    if (generatedPbiIds && generatedPbiIds.length > 0 && generationBusy) {
      setGenerationBusy(false);
      setGenerationError(undefined);
      setLocalEdits((prev) => {
        const next = { ...prev };
        for (const id of generatedPbiIds) {
          if (!next[id]) {
            const pbi = appState.pbiDrafts.find((d) => d.id === id);
            if (pbi) {
              next[id] = {
                title: pbi.title,
                effortDays: (pbi.effortDays as LocalPbiEdit['effortDays']) ?? 3,
                included: true,
                confirmRemove: false,
              };
            }
          }
        }
        return next;
      });
      setStep(4);
    }
  }, [generatedPbiIds, generationBusy, appState.pbiDrafts]);

  // When push result arrives, ensure we're on step 5
  useEffect(() => {
    if (pushResult) {
      setStep(5);
    }
  }, [pushResult]);

  const step1Valid = title.trim().length >= 3 && description.trim().length >= 10;

  const handleGenerate = () => {
    setGenerationBusy(true);
    setGenerationError(undefined);
    onClearGeneratedPbiIds();
    send({
      type: 'GENERATE_USER_STORIES_FROM_FEATURE',
      payload: {
        featureId: featureDraftId,
        title: title.trim(),
        description: description.trim(),
        why: why.trim() || undefined,
        userFlow: userFlow.trim() || undefined,
        businessRules: businessRules.trim() || undefined,
        repoIds: selectedRepoIds,
      },
    });
  };

  const handleDeletePbi = (id: string) => {
    setDeletedPbiIds((prev) => new Set([...prev, id]));
    setManualStories((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateEdit = (id: string, update: Partial<LocalPbiEdit>) => {
    setLocalEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update },
    }));
  };

  const handleAddStory = () => {
    const newId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPbi: PbiDraft = {
      id: newId,
      projectId: 'standalone',
      title: '',
      description: '',
      effortDays: 3,
      acceptanceCriteria: [],
      testScenarios: [],
      iteration: '',
      workItemType: 'Product Backlog Item',
      status: 'draft',
      parentFeatureId: featureDraftId,
    };
    setManualStories((prev) => [...prev, newPbi]);
    setLocalEdits((prev) => ({
      ...prev,
      [newId]: { title: '', effortDays: 3, included: true, confirmRemove: false },
    }));
  };

  const handleEditInStudio = (_pbiId: string) => {
    onNavigate('studio');
  };

  const getChildPbiIds = (): string[] => {
    return generatedPbis
      .filter((p) => localEdits[p.id]?.included !== false)
      .map((p) => p.id);
  };

  const handleSaveAsDraft = () => {
    send({
      type: 'CREATE_FEATURE_DRAFT',
      payload: {
        id: featureDraftId,
        title: title.trim(),
        description: description.trim(),
        why: why.trim() || undefined,
        userFlow: userFlow.trim() || undefined,
        businessRules: businessRules.trim() || undefined,
        repoIds: selectedRepoIds,
        parentEpicId,
        childPbiIds: getChildPbiIds(),
      },
    });
    onNavigate('dashboard');
  };

  const handlePushToAdo = () => {
    send({
      type: 'PUSH_FEATURE_TO_ADO',
      payload: {
        featureId: featureDraftId,
        title: title.trim(),
        description: description.trim(),
        why: why.trim() || undefined,
        userFlow: userFlow.trim() || undefined,
        businessRules: businessRules.trim() || undefined,
        repoIds: selectedRepoIds,
        parentEpicId,
        childPbiIds: getChildPbiIds(),
        includeChildren: true,
      },
    });
  };

  const handleCancel = () => {
    const hasContent = title.trim() || description.trim() || why.trim();
    if (hasContent) {
      setShowCancelConfirm(true);
    } else {
      onNavigate('dashboard');
    }
  };

  const canGoNext = (): boolean => {
    if (step === 1) return step1Valid;
    if (step === 2) return true;
    if (step === 3) return generatedPbis.length > 0 && !generationBusy;
    if (step === 4) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="content">
      <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
        <StepIndicator current={step} />

        <div className="mb-4">
          <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--tw-vscode-fg)' }}>
            {STEPS[step - 1].label}
          </h2>
          <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Step {step} of {STEPS.length}
          </p>
        </div>

        <div className="min-h-[200px]">
          {step === 1 && (
            <Step1Details
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              why={why} setWhy={setWhy}
              userFlow={userFlow} setUserFlow={setUserFlow}
              businessRules={businessRules} setBusinessRules={setBusinessRules}
              touched={touched} setTouched={setTouched}
            />
          )}
          {step === 2 && (
            <Step2Context
              linkTargets={linkTargets}
              epicDrafts={epicDrafts}
              selectedRepoIds={selectedRepoIds}
              setSelectedRepoIds={setSelectedRepoIds}
              parentEpicId={parentEpicId}
              setParentEpicId={setParentEpicId}
            />
          )}
          {step === 3 && (
            <Step3Generate
              featureTitle={title}
              generationBusy={generationBusy}
              generationError={generationError}
              generatedPbis={generatedPbis}
              onGenerate={handleGenerate}
              onRegenerate={() => {
                setDeletedPbiIds(new Set());
                onClearGeneratedPbiIds();
                handleGenerate();
              }}
              onDeletePbi={handleDeletePbi}
            />
          )}
          {step === 4 && (
            <Step4Review
              generatedPbis={generatedPbis}
              localEdits={localEdits}
              onUpdateEdit={handleUpdateEdit}
              onDeletePbi={handleDeletePbi}
              onEditInStudio={handleEditInStudio}
              onAddStory={handleAddStory}
            />
          )}
          {step === 5 && (
            <Step5SavePush
              featureTitle={title}
              childPbiIds={getChildPbiIds()}
              pushProgress={pushProgress}
              pushResult={pushResult}
              onSaveAsDraft={handleSaveAsDraft}
              onPushToAdo={handlePushToAdo}
              onDone={() => {
                onClearPushResult();
                onNavigate('dashboard');
              }}
            />
          )}
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--tw-vscode-border)' }}>
          <div className="flex gap-2">
            {step > 1 && step < 5 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack}>
                ← Back
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          {step < 5 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!canGoNext()}
              onClick={handleNext}
            >
              {step === 4 ? 'Continue to Save & Push →' : 'Next →'}
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="rounded-lg border p-5 max-w-sm w-full shadow-lg"
            style={{ background: 'var(--tw-vscode-bg)', borderColor: 'var(--tw-vscode-border)' }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--tw-vscode-fg)' }}>
              Discard feature?
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              You have unsaved content. Are you sure you want to cancel and return to the Dashboard?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--tw-vscode-error)', color: '#fff' }}
                onClick={() => onNavigate('dashboard')}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
