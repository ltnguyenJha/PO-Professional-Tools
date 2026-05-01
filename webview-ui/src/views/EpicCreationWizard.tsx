import { useState, useEffect, useRef } from 'react';
import type {
  EpicDraft,
  ExtensionEvent,
  HierarchyStatus,
  WebviewRequest,
} from '../types';
import { LoadingBar } from '../components/LoadingBar';

// ─── Local types ─────────────────────────────────────────────────────────────

interface GeneratedFeature {
  clientId: string;
  title: string;
  description: string;
}

interface EpicDefaults {
  defaultArea: string;
  defaultIteration: string;
  defaultUrl: string;
}

const EPIC_DEFAULTS_KEY = 'po-tools:epicDefaults';

const DEFAULT_EPIC_SETTINGS: EpicDefaults = {
  defaultArea: 'iPay_Scrum\\P3 Portfolio',
  defaultIteration: 'iPay_Scrum\\P3 Portfolio',
  defaultUrl: 'https://dev.azure.com/JHA-11/iPay_Scrum/_boards/board/t/Umbrella%20Corp/Backlog%20items',
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface EpicCreationWizardProps {
  epicId?: string;
  onNavigate: (view: string, epicId?: string) => void;
  vscode: { postMessage: (message: WebviewRequest) => void } | null | undefined;
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Epic Overview' },
  { num: 2, label: 'AI Generation' },
  { num: 3, label: 'Review & Edit' },
  { num: 4, label: 'Confirm & Save' },
];

const MAX_OBJECTIVES = 7;
const MIN_OBJECTIVES = 1;

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
                style={{ background: isDone ? 'var(--tw-epic)' : 'var(--tw-vscode-border)' }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                style={{
                  background: isActive ? 'var(--tw-epic)' : isDone ? 'var(--tw-epic-muted)' : 'var(--tw-vscode-bg-alt)',
                  color: isActive ? 'var(--tw-epic-fg)' : isDone ? 'var(--tw-epic)' : 'var(--tw-vscode-fg-muted)',
                  border: isDone || isActive ? 'none' : '1.5px solid var(--tw-vscode-border)',
                }}
                aria-label={`Step ${step.num}: ${step.label}${isDone ? ' (completed)' : isActive ? ' (current)' : ''}`}
                aria-current={isActive ? 'step' : undefined}
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

// ─── Step 1: Epic Overview ────────────────────────────────────────────────────

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

function Step1Overview({
  title, setTitle,
  description, setDescription,
  scope, setScope,
  objectives, setObjectives,
  targetDate, setTargetDate,
  tShirtSize, setTShirtSize,
  effort, setEffort,
  url, setUrl,
  area, setArea,
  iteration, setIteration,
  epicDefaults, setEpicDefaults,
  touched, setTouched,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  scope: string; setScope: (v: string) => void;
  objectives: string[]; setObjectives: (v: string[]) => void;
  targetDate: string; setTargetDate: (v: string) => void;
  tShirtSize: string; setTShirtSize: (v: string) => void;
  effort: string; setEffort: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  area: string; setArea: (v: string) => void;
  iteration: string; setIteration: (v: string) => void;
  epicDefaults: EpicDefaults; setEpicDefaults: (d: EpicDefaults) => void;
  touched: Set<string>;
  setTouched: (fn: (prev: Set<string>) => Set<string>) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adoDetailsOpen, setAdoDetailsOpen] = useState(false);

  const titleError = touched.has('title') && title.trim().length < 3
    ? 'Title must be at least 3 characters'
    : undefined;
  const objectivesError = touched.has('objectives') && !objectives.some((o) => o.trim())
    ? 'At least one objective is required'
    : undefined;

  const addObjective = () => {
    if (objectives.length < MAX_OBJECTIVES) {
      setObjectives([...objectives, '']);
    }
  };

  const removeObjective = (idx: number) => {
    if (objectives.length > MIN_OBJECTIVES) {
      setObjectives(objectives.filter((_, i) => i !== idx));
    }
  };

  const updateObjective = (idx: number, value: string) => {
    const next = [...objectives];
    next[idx] = value;
    setObjectives(next);
  };

  const saveDefaults = (next: EpicDefaults) => {
    setEpicDefaults(next);
    try { localStorage.setItem(EPIC_DEFAULTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label
          htmlFor="epic-title"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--tw-vscode-fg)' }}
        >
          Epic Title <span style={{ color: 'var(--tw-vscode-error)' }} aria-hidden="true">*</span>
        </label>
        <input
          id="epic-title"
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
          style={{
            borderColor: titleError ? 'var(--tw-vscode-error)' : 'var(--tw-vscode-border)',
            color: 'var(--tw-vscode-fg)',
          }}
          value={title}
          placeholder="e.g. Mobile-First Redesign"
          maxLength={120}
          required
          aria-required="true"
          aria-invalid={!!titleError}
          aria-describedby={titleError ? 'epic-title-error' : undefined}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched((p) => new Set([...p, 'title']))}
        />
        <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          A short, outcome-focused name for this strategic initiative.
        </p>
        {titleError && (
          <p id="epic-title-error" className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-error)' }} role="alert">
            ⚠ {titleError}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="epic-description"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--tw-vscode-fg)' }}
        >
          Description <span style={{ color: 'var(--tw-vscode-error)' }} aria-hidden="true">*</span>
        </label>
        <textarea
          id="epic-description"
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none resize-y transition-colors duration-200"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)', minHeight: '80px' }}
          rows={3}
          value={description}
          placeholder="High-level narrative describing the initiative (3–5 sentences)."
          maxLength={2000}
          required
          aria-required="true"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Scope */}
      <div>
        <label
          htmlFor="epic-scope"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--tw-vscode-fg)' }}
        >
          Scope
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            (optional — in/out of scope)
          </span>
        </label>
        <textarea
          id="epic-scope"
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none resize-y transition-colors duration-200"
          style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)', minHeight: '72px' }}
          rows={3}
          value={scope}
          placeholder="What is in scope for this Epic? What is out of scope?"
          maxLength={1500}
          onChange={(e) => setScope(e.target.value)}
        />
      </div>

      {/* Objectives */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
            Objectives <span style={{ color: 'var(--tw-vscode-error)' }} aria-hidden="true">*</span>
          </label>
          <span className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            {objectives.length}/{MAX_OBJECTIVES}
          </span>
        </div>
        <p className="text-xs mb-2" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          High-level goals or OKRs for this Epic. At least one required.
        </p>
        <div className="space-y-2" role="list" aria-label="Epic objectives">
          {objectives.map((obj, idx) => (
            <div key={idx} className="flex items-center gap-2" role="listitem">
              <span className="text-xs shrink-0 w-5 text-center" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                {idx + 1}.
              </span>
              <input
                id={`epic-objective-${idx}`}
                className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                value={obj}
                placeholder={`Objective ${idx + 1}`}
                maxLength={200}
                aria-label={`Objective ${idx + 1}`}
                onChange={(e) => updateObjective(idx, e.target.value)}
                onBlur={() => setTouched((p) => new Set([...p, 'objectives']))}
              />
              {objectives.length > MIN_OBJECTIVES && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                  style={{ color: 'var(--tw-vscode-error)' }}
                  onClick={() => removeObjective(idx)}
                  aria-label={`Remove objective ${idx + 1}`}
                  title="Remove objective"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {objectivesError && (
          <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-error)' }} role="alert">
            ⚠ {objectivesError}
          </p>
        )}
        {objectives.length < MAX_OBJECTIVES && (
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2 min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            style={{ borderColor: 'var(--tw-epic)', color: 'var(--tw-epic)' }}
            onClick={addObjective}
          >
            + Add objective
          </button>
        )}
      </div>

      {/* ── ADO Details Accordion ─────────────────────────────── */}
      <div
        className="rounded-md border overflow-hidden"
        style={{ borderColor: 'var(--tw-vscode-border)' }}
      >
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
          style={{ background: 'var(--tw-vscode-bg-alt)' }}
          onClick={() => setAdoDetailsOpen(!adoDetailsOpen)}
          aria-expanded={adoDetailsOpen}
          aria-controls="epic-ado-details-panel"
        >
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            <span aria-hidden="true">📋</span>
            <span>ADO Details</span>
            {(area || epicDefaults.defaultArea) && (
              <span className="font-normal opacity-75">
                — {area || epicDefaults.defaultArea}
              </span>
            )}
            {!adoDetailsOpen && !(area || epicDefaults.defaultArea) && (
              <span className="font-normal opacity-60">(optional)</span>
            )}
          </span>
          <span
            style={{
              display: 'inline-block',
              transform: adoDetailsOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
              fontSize: '0.6rem',
              color: 'var(--tw-vscode-fg-muted)',
            }}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>
        <div
          id="epic-ado-details-panel"
          className={`overflow-hidden transition-all duration-200 ease-out ${adoDetailsOpen ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0'}`}
          aria-hidden={!adoDetailsOpen}
        >
          <div className="px-3 py-3 space-y-4 border-t" style={{ borderColor: 'var(--tw-vscode-border)' }}>

            {/* Target Date */}
            <div>
              <label htmlFor="epic-target-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                Target Date
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(sets Target Date in ADO)</span>
              </label>
              <input
                id="epic-target-date"
                type="date"
                className="rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {/* T-Shirt Size + Effort */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label htmlFor="epic-tshirt" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                  T-Shirt Size
                </label>
                <select
                  id="epic-tshirt"
                  className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                  style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                  value={tShirtSize}
                  onChange={(e) => setTShirtSize(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {T_SHIRT_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label htmlFor="epic-effort" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                  Effort <span className="text-xs font-normal" style={{ color: 'var(--tw-vscode-fg-muted)' }}>(story points)</span>
                </label>
                <input
                  id="epic-effort"
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                  style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                  value={effort}
                  placeholder="e.g. 40"
                  onChange={(e) => setEffort(e.target.value)}
                />
              </div>
            </div>

            {/* Area */}
            <div>
              <label htmlFor="epic-area" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                Area Path
              </label>
              <input
                id="epic-area"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                value={area}
                placeholder={epicDefaults.defaultArea || 'e.g. MyProject\\Team'}
                maxLength={300}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            {/* Iteration */}
            <div>
              <label htmlFor="epic-iteration" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                Iteration Path
              </label>
              <input
                id="epic-iteration"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                value={iteration}
                placeholder={epicDefaults.defaultIteration || 'e.g. MyProject\\Sprint 1'}
                maxLength={300}
                onChange={(e) => setIteration(e.target.value)}
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="epic-url" className="block text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                ADO Board URL
              </label>
              <input
                id="epic-url"
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                value={url}
                placeholder={epicDefaults.defaultUrl || 'https://dev.azure.com/...'}
                maxLength={1000}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* ── Settings sub-section ─────────────────────────── */}
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: 'var(--tw-vscode-border)' }}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
                style={{ background: 'var(--tw-vscode-bg-alt)' }}
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-expanded={settingsOpen}
                aria-controls="epic-settings-panel"
              >
                <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                  <span aria-hidden="true">⚙</span> Settings — default values
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    transform: settingsOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    fontSize: '0.6rem',
                    color: 'var(--tw-vscode-fg-muted)',
                  }}
                  aria-hidden="true"
                >
                  ▶
                </span>
              </button>
              <div
                id="epic-settings-panel"
                className={`overflow-hidden transition-all duration-200 ease-out ${settingsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!settingsOpen}
              >
                <div className="px-3 py-3 space-y-3 border-t" style={{ borderColor: 'var(--tw-vscode-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                    Defaults pre-fill Area, Iteration, and URL each time you create an Epic. Changes save automatically.
                  </p>

                  <div>
                    <label htmlFor="epic-default-area" className="block text-xs font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                      Default Area Path
                    </label>
                    <input
                      id="epic-default-area"
                      className="w-full rounded-md border px-3 py-1.5 text-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                      style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                      value={epicDefaults.defaultArea}
                      placeholder="e.g. iPay_Scrum\P3 Portfolio"
                      maxLength={300}
                      onChange={(e) => saveDefaults({ ...epicDefaults, defaultArea: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="epic-default-iteration" className="block text-xs font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                      Default Iteration Path
                    </label>
                    <input
                      id="epic-default-iteration"
                      className="w-full rounded-md border px-3 py-1.5 text-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                      style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                      value={epicDefaults.defaultIteration}
                      placeholder="e.g. iPay_Scrum\P3 Portfolio"
                      maxLength={300}
                      onChange={(e) => saveDefaults({ ...epicDefaults, defaultIteration: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="epic-default-url" className="block text-xs font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
                      Default ADO URL
                    </label>
                    <input
                      id="epic-default-url"
                      type="url"
                      className="w-full rounded-md border px-3 py-1.5 text-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                      style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                      value={epicDefaults.defaultUrl}
                      placeholder="https://dev.azure.com/..."
                      maxLength={1000}
                      onChange={(e) => saveDefaults({ ...epicDefaults, defaultUrl: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                    style={{ borderColor: 'var(--tw-epic)', color: 'var(--tw-epic)' }}
                    onClick={() => {
                      setArea(epicDefaults.defaultArea);
                      setIteration(epicDefaults.defaultIteration);
                      setUrl(epicDefaults.defaultUrl);
                    }}
                  >
                    ↓ Apply defaults to form
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: AI Feature Generation ───────────────────────────────────────────

function Step3Generation({
  epicTitle,
  generationBusy,
  generationError,
  generatedFeatures,
  setGeneratedFeatures,
  onGenerate,
}: {
  epicTitle: string;
  generationBusy: boolean;
  generationError?: string;
  generatedFeatures: GeneratedFeature[];
  setGeneratedFeatures: (features: GeneratedFeature[]) => void;
  onGenerate: () => void;
}) {
  const hasResults = generatedFeatures.length > 0;

  const removeFeature = (clientId: string) => {
    setGeneratedFeatures(generatedFeatures.filter((f) => f.clientId !== clientId));
  };

  const updateFeature = (clientId: string, field: 'title' | 'description', value: string) => {
    setGeneratedFeatures(
      generatedFeatures.map((f) => (f.clientId === clientId ? { ...f, [field]: value } : f)),
    );
  };

  const addFeatureManually = () => {
    const newFeature: GeneratedFeature = {
      clientId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      description: '',
    };
    setGeneratedFeatures([...generatedFeatures, newFeature]);
  };

  if (generationBusy) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 space-y-4"
        role="status"
        aria-live="polite"
        aria-label="Generating features from epic"
      >
        <div className="text-2xl select-none" aria-hidden="true">
          ✨
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
            Generating Features…
          </p>
          <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            AI is analyzing your Epic and generating Features for:
            <br />
            <strong>"{epicTitle}"</strong>
          </p>
        </div>
        <div className="w-full max-w-xs">
          <LoadingBar label="Generating features…" />
        </div>
        <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          This usually takes 10–20 seconds.
        </p>
        <span className="sr-only">Please wait, generating features for "{epicTitle}"</span>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="space-y-4" role="alert" aria-live="assertive">
        <div
          className="rounded-md px-3 py-3 border flex items-start gap-2"
          style={{
            borderColor: 'var(--tw-vscode-error)',
            background: 'var(--tw-vscode-error-bg)',
          }}
        >
          <span className="shrink-0" aria-hidden="true">
            ⚠
          </span>
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
          <button
            type="button"
            className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
            onClick={onGenerate}
          >
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
          style={{
            background: 'var(--tw-vscode-bg-alt)',
            borderColor: 'var(--tw-vscode-border)',
            color: 'var(--tw-vscode-fg-muted)',
          }}
        >
          <p className="font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
            Ready to generate
          </p>
          <p>
            AI will analyze your Epic details and suggest{' '}
            <span className="font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
              Features
            </span>{' '}
            to break it down.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
          onClick={onGenerate}
        >
          ✨ Generate Features
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
          ✅ Generated {generatedFeatures.length} Feature
          {generatedFeatures.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ borderColor: 'var(--tw-epic)', color: 'var(--tw-epic)' }}
          onClick={onGenerate}
        >
          🔄 Regenerate
        </button>
      </div>
      <div className="space-y-2">
        {generatedFeatures.map((feature, idx) => (
          <div
            key={feature.clientId}
            className="rounded-md border px-3 py-3 space-y-2"
            style={{ borderColor: 'var(--tw-epic-border)', background: 'var(--tw-vscode-bg)' }}
          >
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono shrink-0 mt-1"
                style={{ color: 'var(--tw-vscode-fg-muted)' }}
              >
                [{idx + 1}]
              </span>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  className="w-full text-sm rounded-md border px-2 py-1.5 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                  style={{ borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-fg)' }}
                  value={feature.title}
                  placeholder="Feature title"
                  maxLength={120}
                  aria-label={`Feature ${idx + 1} title`}
                  onChange={(e) => updateFeature(feature.clientId, 'title', e.target.value)}
                />
                <textarea
                  className="w-full text-xs rounded-md border px-2 py-1.5 bg-transparent outline-none resize-y focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:outline-none transition-colors duration-200"
                  style={{
                    borderColor: 'var(--tw-vscode-border)',
                    color: 'var(--tw-vscode-fg-muted)',
                    minHeight: '48px',
                  }}
                  rows={2}
                  value={feature.description}
                  placeholder="Feature description"
                  maxLength={500}
                  aria-label={`Feature ${idx + 1} description`}
                  onChange={(e) => updateFeature(feature.clientId, 'description', e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                style={{ color: 'var(--tw-vscode-error)' }}
                onClick={() => removeFeature(feature.clientId)}
                title="Remove this feature"
                aria-label={`Remove feature ${idx + 1}: ${feature.title || 'untitled'}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
        style={{ borderColor: 'var(--tw-epic)', color: 'var(--tw-epic)' }}
        onClick={addFeatureManually}
      >
        + Add Feature manually
      </button>
    </div>
  );
}

// ─── Step 4: Review & Edit ────────────────────────────────────────────────────

function Step4Review({
  epicTitle,
  generatedFeatures,
}: {
  epicTitle: string;
  generatedFeatures: GeneratedFeature[];
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-md px-3 py-2.5 border text-xs"
        style={{
          background: 'var(--tw-vscode-bg-alt)',
          borderColor: 'var(--tw-vscode-border)',
          color: 'var(--tw-vscode-fg-muted)',
        }}
      >
        <span
          className="rounded px-1.5 py-0.5 font-medium text-xs"
          style={{ background: 'var(--tw-epic-bg)', color: 'var(--tw-epic)' }}
        >
          Epic
        </span>
        <span className="mx-1">→</span>
        <span
          className="rounded px-1.5 py-0.5 font-medium text-xs"
          style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
        >
          Features
        </span>
        <span className="ml-1 opacity-60">(types are fixed)</span>
      </div>

      <div className="space-y-1">
        {generatedFeatures.map((feature, idx) => {
          const isExpanded = expandedIds.has(feature.clientId);
          return (
            <div
              key={feature.clientId}
              className="rounded-md overflow-hidden border"
              style={{ borderColor: 'var(--tw-vscode-border)', borderLeft: '2px solid var(--tw-epic)' }}
            >
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-left transition-colors duration-200 hover:opacity-80 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
                style={{ background: 'var(--tw-vscode-bg-alt)' }}
                onClick={() => toggle(feature.clientId)}
                aria-expanded={isExpanded}
                aria-label={`Feature ${idx + 1}: ${feature.title || 'Untitled'} — ${isExpanded ? 'collapse' : 'expand'}`}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    fontSize: '0.6rem',
                    color: 'var(--tw-vscode-fg-muted)',
                  }}
                  aria-hidden="true"
                >
                  ▶
                </span>
                <span
                  className="text-xs font-mono shrink-0"
                  style={{ color: 'var(--tw-vscode-fg-muted)' }}
                >
                  [{idx + 1}]
                </span>
                <span
                  className="flex-1 text-sm truncate font-medium"
                  style={{ color: 'var(--tw-vscode-fg)' }}
                >
                  {feature.title || <em style={{ opacity: 0.5 }}>Untitled feature</em>}
                </span>
              </button>
              {isExpanded && feature.description && (
                <div
                  className="px-3 py-2 border-t text-xs"
                  style={{
                    borderColor: 'var(--tw-vscode-border)',
                    color: 'var(--tw-vscode-fg-muted)',
                    background: 'var(--tw-vscode-bg)',
                  }}
                >
                  {feature.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-md px-3 py-2 border text-xs"
        style={{
          borderColor: 'var(--tw-vscode-border)',
          background: 'var(--tw-vscode-bg-alt)',
          color: 'var(--tw-vscode-fg-muted)',
        }}
      >
        <strong style={{ color: 'var(--tw-vscode-fg)' }}>
          {generatedFeatures.length} Feature{generatedFeatures.length !== 1 ? 's' : ''}
        </strong>{' '}
        will be created under Epic:{' '}
        <strong style={{ color: 'var(--tw-vscode-fg)' }}>"{epicTitle}"</strong>
      </div>
    </div>
  );
}

// ─── Step 5: Confirm & Save ───────────────────────────────────────────────────

function Step5Confirm({
  title,
  description,
  scope,
  objectives,
  generatedFeatures,
  saveBusy,
  saveError,
  savePhase,
  epicPushResult,
  onSaveAsDraft,
  onPushToAdo,
  onDone,
}: {
  title: string;
  description: string;
  scope: string;
  objectives: string[];
  generatedFeatures: GeneratedFeature[];
  saveBusy: boolean;
  saveError?: string;
  savePhase: string;
  epicPushResult?: { adoWorkItemId: number; adoWorkItemUrl: string; hierarchyStatus: HierarchyStatus } | null;
  onSaveAsDraft: () => void;
  onPushToAdo: () => void;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    if (epicPushResult?.adoWorkItemUrl) {
      navigator.clipboard.writeText(epicPushResult.adoWorkItemUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (epicPushResult) {
    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div
          className="rounded-md border px-4 py-4 flex items-start gap-3"
          style={{ borderColor: 'var(--tw-epic)', background: 'var(--tw-epic-bg)' }}
        >
          <span className="text-xl shrink-0" aria-hidden="true">✅</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tw-epic)' }}>
              Epic pushed to Azure DevOps
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              Work Item #{epicPushResult.adoWorkItemId}
            </p>
          </div>
        </div>

        {/* Tracking card */}
        <div
          className="rounded-md border px-4 py-3 space-y-3"
          style={{ borderColor: 'var(--tw-vscode-border)', background: 'var(--tw-vscode-bg-alt)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Tracking
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>Work Item</span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ background: 'var(--tw-epic-bg)', color: 'var(--tw-epic)' }}
            >
              #{epicPushResult.adoWorkItemId}
            </span>
          </div>
          {epicPushResult.adoWorkItemUrl ? (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={epicPushResult.adoWorkItemUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] rounded"
                style={{ color: 'var(--tw-epic)' }}
                aria-label="Open Epic in Azure DevOps"
              >
                View in Azure DevOps ↗
              </a>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs min-h-[32px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                onClick={handleCopyUrl}
                aria-label="Copy work item URL to clipboard"
              >
                {copied ? '✓ Copied' : '⎘ Copy URL'}
              </button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              URL not available
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
          onClick={onDone}
        >
          Done — back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div
        className="rounded-md border px-4 py-4 space-y-3"
        style={{ background: 'var(--tw-epic-bg)', borderColor: 'var(--tw-epic-border)', borderLeft: '4px solid var(--tw-epic)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Epic
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--tw-vscode-fg)' }}>
            {title}
          </p>
          {description && (
            <p className="text-xs mt-1" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              {description}
            </p>
          )}
        </div>

        {scope && (
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              Scope
            </p>
            <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              {scope}
            </p>
          </div>
        )}

        {objectives.filter((o) => o.trim()).length > 0 && (
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              Objectives
            </p>
            <ul className="space-y-0.5">
              {objectives.filter((o) => o.trim()).map((obj, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className="pt-2 border-t"
          style={{ borderColor: 'var(--tw-vscode-border)' }}
        >
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--tw-epic-bg)', color: 'var(--tw-epic)' }}
          >
            {generatedFeatures.length} Feature{generatedFeatures.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Saving progress */}
      {saveBusy && (
        <div>
          <LoadingBar label={savePhase || 'Saving…'} />
        </div>
      )}

      {/* Error */}
      {saveError && (
        <div
          className="rounded-md px-3 py-2 border flex items-start gap-2"
          style={{
            borderColor: 'var(--tw-vscode-error)',
            background: 'var(--tw-vscode-error-bg)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <span className="shrink-0" aria-hidden="true">⚠</span>
          <p className="text-xs" style={{ color: 'var(--tw-vscode-error)' }}>
            {saveError}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="btn btn-ghost min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ borderColor: 'var(--tw-epic)', color: 'var(--tw-epic)' }}
          disabled={saveBusy}
          onClick={onSaveAsDraft}
        >
          💾 Save as Draft
        </button>
        <button
          type="button"
          className="btn btn-primary min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
          disabled={saveBusy}
          onClick={onPushToAdo}
        >
          🚀 Push to ADO
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function EpicCreationWizard({
  epicId,
  onNavigate,
  vscode,
}: EpicCreationWizardProps): JSX.Element {
  const sendMsg = (message: WebviewRequest) => vscode?.postMessage(message);

  // Stable wizard ID for this session
  const [epicWizardId] = useState(
    () => `epic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );

  // Step
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [objectives, setObjectives] = useState(['', '', '']);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Step 1 ADO detail fields
  const [targetDate, setTargetDate] = useState('');
  const [tShirtSize, setTShirtSize] = useState('');
  const [effort, setEffort] = useState('');
  const [url, setUrl] = useState('');
  const [area, setArea] = useState('');
  const [iteration, setIteration] = useState('');

  // Epic defaults (persisted in localStorage)
  const [epicDefaults, setEpicDefaults] = useState<EpicDefaults>(() => {
    try {
      const stored = localStorage.getItem(EPIC_DEFAULTS_KEY);
      return stored ? { ...DEFAULT_EPIC_SETTINGS, ...JSON.parse(stored) } : DEFAULT_EPIC_SETTINGS;
    } catch {
      return DEFAULT_EPIC_SETTINGS;
    }
  });

  // Step 2: AI Generation
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [generatedFeatures, setGeneratedFeatures] = useState<GeneratedFeature[]>([]);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 4: Confirm & Save
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [savePhase, setSavePhase] = useState('');
  const [epicPushResult, setEpicPushResult] = useState<{
    adoWorkItemId: number;
    adoWorkItemUrl: string;
    hierarchyStatus: HierarchyStatus;
  } | null>(null);

  // Cancel confirm
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Focus management
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Refs for latest values in async message handler
  const generatedFeaturesRef = useRef<GeneratedFeature[]>([]);
  const pendingActionRef = useRef<'draft' | 'push' | null>(null);
  const prefilledRef = useRef(false);

  // Keep ref in sync with state
  generatedFeaturesRef.current = generatedFeatures;

  // Focus first element on step change
  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  // Clear generation timeout on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current !== null) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  // Message handler
  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionEvent>) => {
      const message = event.data;

      if (message.type === 'STATE_UPDATED') {
        const s = message.payload;
        // Pre-fill in edit mode (only once)
        if (epicId && !prefilledRef.current) {
          const epic = s.epicDrafts.find((e) => e.id === epicId);
          if (epic) {
            setTitle(epic.title);
            setDescription(epic.description);
            setScope(epic.scope ?? '');
            setObjectives(epic.objectives.length > 0 ? epic.objectives : ['', '', '']);
            if (epic.targetDate) setTargetDate(epic.targetDate);
            if (epic.tShirtSize) setTShirtSize(epic.tShirtSize);
            if (epic.effort != null) setEffort(String(epic.effort));
            if (epic.area) setArea(epic.area);
            if (epic.iteration) setIteration(epic.iteration);
            if (epic.epicUrl) setUrl(epic.epicUrl);
            prefilledRef.current = true;
          }
        }
        return;
      }

      if (message.type === 'EPIC_GENERATION_COMPLETE') {
        const payload = message.payload as {
          epicId: string;
          suggestions: Array<{ clientId: string; title: string; description: string }>;
        };
        if (payload.epicId === epicWizardId || payload.epicId === epicId) {
          if (generationTimeoutRef.current !== null) {
            clearTimeout(generationTimeoutRef.current);
            generationTimeoutRef.current = null;
          }
          setGenerationBusy(false);
          setGenerationError(undefined);
          setGeneratedFeatures(payload.suggestions);
          setStep(3);
        }
        return;
      }

      if (message.type === 'EPIC_GENERATION_ERROR') {
        const payload = message.payload as { epicId: string; message: string };
        if (payload.epicId === epicWizardId || payload.epicId === epicId) {
          if (generationTimeoutRef.current !== null) {
            clearTimeout(generationTimeoutRef.current);
            generationTimeoutRef.current = null;
          }
          setGenerationBusy(false);
          setGenerationError(payload.message);
        }
        return;
      }

      if (message.type === 'EPIC_DRAFT_CREATED') {
        const createdEpic = message.payload as EpicDraft;
        // Create feature drafts linked to this epic (no repo context)
        for (const feature of generatedFeaturesRef.current) {
          const featureLocalId = `feature-epic-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`;
          sendMsg({
            type: 'CREATE_FEATURE_DRAFT',
            payload: {
              id: featureLocalId,
              title: feature.title,
              description: feature.description,
              repoIds: [],
              parentEpicId: createdEpic.id,
              childPbiIds: [],
            },
          });
        }
        if (pendingActionRef.current === 'draft') {
          setSaveBusy(false);
          onNavigate('dashboard');
        } else if (pendingActionRef.current === 'push') {
          setSavePhase('Pushing Epic to ADO…');
          sendMsg({
            type: 'PUSH_EPIC_TO_ADO',
            payload: { epicId: createdEpic.id, pushChildren: true },
          });
        }
        return;
      }

      if (message.type === 'EPIC_PUSHED') {
        const p = message.payload as {
          epicId: string;
          adoWorkItemId: number;
          adoWorkItemUrl: string;
          linkedFeatureAdoIds: Record<string, number>;
          hierarchyStatus: HierarchyStatus;
        };
        setSaveBusy(false);
        setSavePhase('');
        setEpicPushResult({
          adoWorkItemId: p.adoWorkItemId,
          adoWorkItemUrl: p.adoWorkItemUrl,
          hierarchyStatus: p.hierarchyStatus,
        });
        return;
      }

      if (message.type === 'EPIC_PUSH_ERROR') {
        const payload = message.payload as { epicId: string; message: string };
        setSaveBusy(false);
        setSavePhase('');
        setSaveError(payload.message);
        return;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [epicId, epicWizardId, onNavigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived validation
  const step1Valid =
    title.trim().length >= 3 &&
    description.trim().length >= 1 &&
    objectives.some((o) => o.trim().length > 0);

  const canGoNext = (): boolean => {
    if (step === 1) return step1Valid;
    if (step === 2) return generatedFeatures.length > 0 && !generationBusy;
    if (step === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCancel = () => {
    const hasContent = title.trim() || description.trim() || objectives.some((o) => o.trim());
    if (hasContent) {
      setShowCancelConfirm(true);
    } else {
      onNavigate('dashboard');
    }
  };

  const handleGenerate = () => {
    setGenerationBusy(true);
    setGenerationError(undefined);
    setGeneratedFeatures([]);

    if (generationTimeoutRef.current !== null) {
      clearTimeout(generationTimeoutRef.current);
    }
    generationTimeoutRef.current = setTimeout(() => {
      generationTimeoutRef.current = null;
      setGenerationBusy(false);
      setGenerationError('Generation timed out — please try again');
    }, 30_000);

    sendMsg({
      type: 'GENERATE_FEATURES_FROM_EPIC',
      payload: {
        epicId: epicWizardId,
        title: title.trim(),
        description: description.trim(),
        objectives: objectives.filter((o) => o.trim()),
        scope: scope.trim(),
        selectedRepoIds: [],
      },
    });
  };

  const buildEpicPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    objectives: objectives.filter((o) => o.trim()),
    scope: scope.trim(),
    linkedFeatureIds: [],
    selectedRepoIds: [],
    aiGeneratedFeatures: generatedFeatures.length > 0,
    targetDate: targetDate || undefined,
    tShirtSize: tShirtSize || undefined,
    effort: effort ? Number(effort) : undefined,
    area: area.trim() || undefined,
    iteration: iteration.trim() || undefined,
    epicUrl: url.trim() || undefined,
  });

  const handleSaveAsDraft = () => {
    setSaveBusy(true);
    setSaveError(undefined);
    setSavePhase('Creating Epic draft…');
    pendingActionRef.current = 'draft';
    sendMsg({ type: 'CREATE_EPIC_DRAFT', payload: buildEpicPayload() });
  };

  const handlePushToAdo = () => {
    setSaveBusy(true);
    setSaveError(undefined);
    setSavePhase('Creating Epic draft…');
    pendingActionRef.current = 'push';
    sendMsg({ type: 'CREATE_EPIC_DRAFT', payload: buildEpicPayload() });
  };

  return (
    <div className="content">
      <div className="card" style={{ maxWidth: 680, margin: '0 auto', borderLeft: '4px solid var(--tw-epic)' }}>
        <StepIndicator current={step} />

        <div className="mb-4">
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-base font-semibold mb-0.5 focus-visible:outline-none"
            style={{ color: 'var(--tw-vscode-fg)' }}
          >
            {STEPS[step - 1].label}
          </h2>
          <p className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Step {step} of {STEPS.length}
          </p>
        </div>

        <div className="min-h-[200px]">
          {step === 1 && (
            <Step1Overview
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              scope={scope} setScope={setScope}
              objectives={objectives} setObjectives={setObjectives}
              targetDate={targetDate} setTargetDate={setTargetDate}
              tShirtSize={tShirtSize} setTShirtSize={setTShirtSize}
              effort={effort} setEffort={setEffort}
              url={url} setUrl={setUrl}
              area={area} setArea={setArea}
              iteration={iteration} setIteration={setIteration}
              epicDefaults={epicDefaults} setEpicDefaults={setEpicDefaults}
              touched={touched} setTouched={setTouched}
            />
          )}
          {step === 2 && (
            <Step3Generation
              epicTitle={title}
              generationBusy={generationBusy}
              generationError={generationError}
              generatedFeatures={generatedFeatures}
              setGeneratedFeatures={setGeneratedFeatures}
              onGenerate={handleGenerate}
            />
          )}
          {step === 3 && (
            <Step4Review epicTitle={title} generatedFeatures={generatedFeatures} />
          )}
          {step === 4 && (
            <Step5Confirm
              title={title}
              description={description}
              scope={scope}
              objectives={objectives}
              generatedFeatures={generatedFeatures}
              saveBusy={saveBusy}
              saveError={saveError}
              savePhase={savePhase}
              epicPushResult={epicPushResult}
              onSaveAsDraft={handleSaveAsDraft}
              onPushToAdo={handlePushToAdo}
              onDone={() => onNavigate('dashboard')}
            />
          )}
        </div>

        {/* Navigation row */}
        <div
          className="flex items-center justify-between mt-6 pt-4 border-t"
          style={{ borderColor: 'var(--tw-vscode-border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            {step > 1 && step < 4 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                onClick={handleBack}
              >
                ← Back
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                onClick={() => setStep(2)}
              >
                ← Back to Edit
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
          {step < 4 && (
            <button
              type="button"
              className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
              style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
              disabled={!canGoNext()}
              onClick={handleNext}
            >
              {step === 3 ? 'Continue to Save →' : 'Next →'}
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="epic-cancel-dialog-title"
        >
          <div
            className="rounded-lg border p-5 max-w-sm w-full shadow-lg"
            style={{ background: 'var(--tw-vscode-bg)', borderColor: 'var(--tw-vscode-border)' }}
          >
            <h3
              id="epic-cancel-dialog-title"
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--tw-vscode-fg)' }}
            >
              Discard Epic?
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
              You have unsaved content. Are you sure you want to cancel and return to the Dashboard?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
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
