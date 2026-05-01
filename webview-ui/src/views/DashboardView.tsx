import { useState } from 'react';
import type { AppStatePayload, PbiDraft, FeatureDraft, EpicDraft, HierarchyStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { vscodeApi } from '../utils/useVsCodeApi';

interface Props {
  state: AppStatePayload;
  onNavigate: (view: 'projects' | 'studio' | 'bulk' | 'settings' | 'epic-creation') => void;
  onNavigateToStudio?: (draftId?: string) => void;
  onNavigateToEpicCreation?: (epicId?: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AdoStatusChip({
  adoReady,
  projectName,
  onNavigate,
}: {
  adoReady: boolean;
  projectName?: string;
  onNavigate: Props['onNavigate'];
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 min-h-[44px] text-xs font-medium transition-colors duration-200 hover:opacity-80 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
      style={{
        background: adoReady ? 'var(--tw-vscode-success-bg)' : 'var(--tw-vscode-warning-bg)',
        color: adoReady ? 'var(--tw-vscode-success)' : 'var(--tw-vscode-warning)',
      }}
      onClick={() => onNavigate('settings')}
      title={adoReady ? `Connected to ${projectName}` : 'Click to configure ADO in Settings'}
      aria-label={adoReady ? `ADO connected to ${projectName}. Click to open settings.` : 'ADO setup required. Click to configure in Settings.'}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: 'currentColor' }}
      />
      {adoReady ? `ADO · ${projectName}` : 'ADO · Setup required'}
    </button>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="shrink-0 transition-transform duration-200"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
      aria-hidden="true"
    >
      <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccordionHeader({
  open,
  onClick,
  label,
  labelMuted,
  badge,
  count,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  labelMuted?: boolean;
  badge?: JSX.Element;
  count?: number;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-left transition-colors duration-200 hover:opacity-80 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
      style={{ background: 'var(--tw-vscode-bg-alt)', color: 'var(--tw-vscode-fg-muted)' }}
      onClick={onClick}
      aria-expanded={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <ChevronIcon open={open} />
      <span
        className="flex-1 text-sm truncate font-medium"
        style={{ color: labelMuted ? 'var(--tw-vscode-fg-muted)' : 'var(--tw-vscode-fg)' }}
      >
        {label}
      </span>
      {badge}
      {count !== undefined && (
        <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {count}
        </span>
      )}
    </button>
  );
}

function EpicAccordion({
  epic,
  features,
  expanded,
  onToggle,
  onNavigate,
}: {
  epic: PbiDraft;
  features: PbiDraft[];
  expanded: boolean;
  onToggle: () => void;
  onNavigate: Props['onNavigate'];
}) {
  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)' }}
    >
      <AccordionHeader
        open={expanded}
        onClick={onToggle}
        label={epic.title}
        badge={<StatusBadge status={epic.status ?? 'draft'} />}
        count={features.length > 0 ? features.length : undefined}
      />
      <div
        className={`overflow-hidden transition-all duration-200 ease-out border-t ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ borderColor: 'var(--tw-vscode-border)' }}
        aria-hidden={!expanded}
      >
        {features.length > 0 ? (
          <div className="px-3 py-2 space-y-2">
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} storyCount={0} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <p className="px-3 py-2 text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            No features linked to this epic yet.
          </p>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  storyCount,
  onNavigate,
}: {
  feature: PbiDraft;
  storyCount: number;
  onNavigate: Props['onNavigate'];
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-md px-2.5 py-2 border"
      style={{
        borderColor: 'var(--tw-vscode-border)',
        background: 'var(--tw-vscode-bg)',
      }}
    >
      <span className="flex-1 text-sm truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
        {feature.title}
      </span>
      <StatusBadge status={feature.status ?? 'draft'} />
      {storyCount > 0 && (
        <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {storyCount} {storyCount === 1 ? 'story' : 'stories'}
        </span>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm shrink-0 min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
        onClick={() => onNavigate('bulk')}
        title="Open in Feature Creation"
      >
        Open
      </button>
    </div>
  );
}

function FeatureGroup({
  label,
  features,
  storyCountFor,
  onNavigate,
}: {
  label: string;
  features: PbiDraft[];
  storyCountFor: (featureId: string) => number;
  onNavigate: Props['onNavigate'];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)' }}
    >
      <AccordionHeader
        open={open}
        onClick={() => setOpen(!open)}
        label={label}
        labelMuted
        count={features.length}
      />
      <div
        className={`overflow-hidden transition-all duration-200 ease-out border-t ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ borderColor: 'var(--tw-vscode-border)' }}
        aria-hidden={!open}
      >
        <div className="px-3 py-2 space-y-2">
          {features.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              storyCount={storyCountFor(f.id)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StandaloneStories({
  stories,
  onNavigate,
}: {
  stories: PbiDraft[];
  onNavigate: Props['onNavigate'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)' }}
    >
      <AccordionHeader
        open={open}
        onClick={() => setOpen(!open)}
        label="Standalone Stories"
        labelMuted
        count={stories.length}
      />
      <div
        className={`overflow-hidden transition-all duration-200 ease-out border-t ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ borderColor: 'var(--tw-vscode-border)' }}
        aria-hidden={!open}
      >
        {stories.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] border-b last:border-b-0 hover:opacity-80 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
            style={{ borderColor: 'var(--tw-vscode-border)' }}
            onClick={() => onNavigate('studio')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('studio')}
            aria-label={`Open "${s.title}" in PBI Studio`}
          >
            <span className="flex-1 text-sm truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
              {s.title}
            </span>
            <StatusBadge status={s.status ?? 'draft'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({
  items,
  onNavigate,
}: {
  items: PbiDraft[];
  onNavigate: Props['onNavigate'];
}) {
  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)' }}
    >
      <div
        className="px-3 py-2 border-b"
        style={{
          background: 'var(--tw-vscode-bg-alt)',
          borderColor: 'var(--tw-vscode-border)',
        }}
      >
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--tw-vscode-fg-muted)' }}
        >
          Recent Activity
        </h3>
      </div>
      <div>
        {items.map((item) => (
          <div
            key={item.id}
            className="px-3 py-2 min-h-[44px] border-b last:border-b-0 hover:opacity-80 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
            style={{ borderColor: 'var(--tw-vscode-border)' }}
            onClick={() => onNavigate('studio')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('studio')}
            aria-label={`Open "${item.title}" in PBI Studio`}
          >
            <div className="flex items-start gap-1.5">
              <span
                className="text-xs truncate flex-1 leading-4"
                style={{ color: 'var(--tw-vscode-fg)' }}
              >
                {item.title}
              </span>
              <StatusBadge status={item.status ?? 'draft'} size="xs" />
            </div>
            {item.updatedAt && (
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                {new Date(item.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HierarchyStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; text: string }> = {
    draft: { label: 'Draft', bg: 'var(--tw-vscode-warning-bg)', text: 'var(--tw-vscode-warning)' },
    ready: { label: 'Ready', bg: 'var(--tw-vscode-info-bg)', text: 'var(--tw-vscode-info)' },
    pushed: { label: 'Pushed', bg: 'var(--tw-vscode-success-bg)', text: 'var(--tw-vscode-success)' },
    partial: { label: 'Partial', bg: 'var(--tw-vscode-warning-bg)', text: 'var(--tw-vscode-warning)' },
  };
  const cfg = configs[status] ?? configs.draft;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Epic status badge (spec: draft=gray, ready=blue, partial=amber, pushed=green)
function EpicStatusBadge({ status }: { status: HierarchyStatus }) {
  const configs: Record<HierarchyStatus, { label: string; bg: string; text: string }> = {
    draft:   { label: 'Draft',   bg: 'var(--tw-vscode-badge-bg)',   text: 'var(--tw-vscode-muted)' },
    ready:   { label: 'Ready',   bg: 'var(--tw-vscode-info-bg)',    text: 'var(--tw-vscode-info)' },
    partial: { label: 'Partial', bg: 'var(--tw-vscode-warning-bg)', text: 'var(--tw-vscode-warning)' },
    pushed:  { label: 'Pushed',  bg: 'var(--tw-vscode-success-bg)', text: 'var(--tw-vscode-success)' },
  };
  const cfg = configs[status] ?? configs.draft;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Feature mini-card inside an Epic accordion ───────────────────────────────
function FeatureMiniCard({
  feature,
  pbiCount,
}: {
  feature: FeatureDraft;
  pbiCount: number;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-md px-2.5 py-2 border ml-4"
      style={{
        borderColor: 'var(--tw-vscode-border)',
        background: 'var(--tw-vscode-bg)',
        borderLeft: '2px solid var(--tw-vscode-info)',
      }}
    >
      <span
        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium shrink-0"
        style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
      >
        Feature
      </span>
      <span className="flex-1 text-xs truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
        {feature.title}
      </span>
      <HierarchyStatusBadge status={feature.hierarchyStatus ?? 'draft'} />
      {pbiCount > 0 && (
        <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
          {pbiCount} PBI{pbiCount !== 1 ? 's' : ''}
        </span>
      )}
      {feature.adoWorkItemUrl && (
        <button
          type="button"
          className="text-xs shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)] rounded border-0 bg-transparent cursor-pointer p-0"
          style={{ color: 'var(--tw-vscode-fg-muted)' }}
          title="View in Azure DevOps"
          onClick={(e) => { e.stopPropagation(); vscodeApi?.postMessage({ type: 'OPEN_EXTERNAL', payload: { url: feature.adoWorkItemUrl! } }); }}
          aria-label="View Feature in Azure DevOps"
        >
          ↗
        </button>
      )}
    </div>
  );
}

// ─── EpicDraftCard — proper EpicDraft accordion with nested Feature mini-cards
function EpicDraftCard({
  epic,
  linkedFeatures,
  pbiDrafts,
  expanded,
  onToggle,
  onEditEpic,
  onPushEpic,
}: {
  epic: EpicDraft;
  linkedFeatures: FeatureDraft[];
  pbiDrafts: PbiDraft[];
  expanded: boolean;
  onToggle: () => void;
  onEditEpic: () => void;
  onPushEpic: () => void;
}) {
  const featureCount = linkedFeatures.length;

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)', borderLeftWidth: '4px', borderLeftColor: 'var(--tw-epic)' }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-left transition-colors duration-200 hover:opacity-80 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
        style={{ background: 'var(--tw-vscode-bg-alt)' }}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${epic.title} — ${expanded ? 'collapse' : 'expand'} epic details`}
      >
        <ChevronIcon open={expanded} />
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium shrink-0"
          style={{ background: 'var(--tw-epic-bg)', color: 'var(--tw-epic)' }}
        >
          Epic
        </span>
        <span
          className="flex-1 text-sm truncate font-medium"
          style={{ color: 'var(--tw-vscode-fg)' }}
        >
          {epic.title}
        </span>
        <EpicStatusBadge status={epic.status} />
        {featureCount > 0 && (
          <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            {featureCount} Feature{featureCount !== 1 ? 's' : ''}
          </span>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0 text-xs min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          onClick={(e) => { e.stopPropagation(); onEditEpic(); }}
          title={`Edit Epic: ${epic.title}`}
          aria-label={`Edit Epic: ${epic.title}`}
        >
          ✏ Edit
        </button>
        {epic.adoUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0 text-xs min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            onClick={(e) => { e.stopPropagation(); vscodeApi?.postMessage({ type: 'OPEN_EXTERNAL', payload: { url: epic.adoUrl! } }); }}
            title="View Epic in Azure DevOps"
            aria-label={`View Epic in Azure DevOps: ${epic.title}`}
          >
            ↗ ADO
          </button>
        )}
        {epic.status !== 'pushed' && (
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0 text-xs min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            onClick={(e) => { e.stopPropagation(); onPushEpic(); }}
            title={`Push Epic to ADO: ${epic.title}`}
            aria-label={`Push Epic to ADO: ${epic.title}`}
          >
            ⬆ Push
          </button>
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out border-t ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ borderColor: 'var(--tw-vscode-border)' }}
        aria-hidden={!expanded}
      >
        {linkedFeatures.length === 0 ? (
          <p className="px-3 py-2 text-xs italic" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            No features yet — Edit Epic to add features.
          </p>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {linkedFeatures.map((feature) => {
              const pbiCount = pbiDrafts.filter(
                (p) => p.parentFeatureId === feature.id,
              ).length;
              return (
                <FeatureMiniCard key={feature.id} feature={feature} pbiCount={pbiCount} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Epics section (top of dashboard) ────────────────────────────────────────
function EpicsSection({
  epicDrafts,
  featureDrafts,
  pbiDrafts,
  expandedEpicIds,
  onToggleEpic,
  onEditEpic,
  onPushEpic,
  onCreateEpic,
}: {
  epicDrafts: EpicDraft[];
  featureDrafts: FeatureDraft[];
  pbiDrafts: PbiDraft[];
  expandedEpicIds: Set<string>;
  onToggleEpic: (id: string) => void;
  onEditEpic: (id: string) => void;
  onPushEpic: (id: string) => void;
  onCreateEpic: () => void;
}) {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h2
          className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: 'var(--tw-epic)' }}
        >
          <span aria-hidden="true">⬟</span> Epics
        </h2>
        <button
          type="button"
          className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
          style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
          onClick={onCreateEpic}
          aria-label="Create a new Epic"
        >
          + Create Epic
        </button>
      </div>

      {epicDrafts.length === 0 ? (
        <div
          className="rounded-lg border px-4 py-5 flex flex-col items-center text-center"
          style={{ borderColor: 'var(--tw-epic-border)', background: 'var(--tw-epic-bg)' }}
        >
          <div className="text-3xl mb-2 select-none" aria-hidden="true" style={{ color: 'var(--tw-epic)', opacity: 0.4 }}>⬟</div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
            No Epics yet
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            Create an Epic to group related Features into strategic initiatives.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            style={{ background: 'var(--tw-epic)', borderColor: 'transparent', color: 'var(--tw-epic-fg)' }}
            onClick={onCreateEpic}
          >
            Create Epic
          </button>
        </div>
      ) : (
        epicDrafts.map((epic) => {
          const linked = featureDrafts.filter(
            (f) => f.parentEpicId === epic.id || epic.linkedFeatureIds.includes(f.id),
          );
          return (
            <EpicDraftCard
              key={epic.id}
              epic={epic}
              linkedFeatures={linked}
              pbiDrafts={pbiDrafts}
              expanded={expandedEpicIds.has(epic.id)}
              onToggle={() => onToggleEpic(epic.id)}
              onEditEpic={() => onEditEpic(epic.id)}
              onPushEpic={() => onPushEpic(epic.id)}
            />
          );
        })
      )}
    </div>
  );
}


function FeatureDraftCard({
  feature,
  childPbis,
  onNavigate,
  onNavigateToStudio,
}: {
  feature: FeatureDraft;
  childPbis: PbiDraft[];
  onNavigate: Props['onNavigate'];
  onNavigateToStudio: (draftId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pushedCount = childPbis.filter((p) => p.status === 'pushed').length;
  const draftCount = childPbis.filter((p) => p.status !== 'pushed').length;
  const hierarchyStatus = feature.hierarchyStatus ?? 'draft';

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--tw-vscode-border)' }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-left transition-colors duration-200 hover:opacity-80 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] focus-visible:ring-inset"
        style={{ background: 'var(--tw-vscode-bg-alt)' }}
        onClick={() => setExpanded((o) => !o)}
        aria-expanded={expanded}
        aria-label={`${feature.title} — ${expanded ? 'collapse' : 'expand'} details`}
      >
        <ChevronIcon open={expanded} />
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium shrink-0"
          style={{ background: 'var(--tw-vscode-info-bg)', color: 'var(--tw-vscode-info)' }}
        >
          Feature
        </span>
        <span className="flex-1 text-sm truncate font-medium" style={{ color: 'var(--tw-vscode-fg)' }}>
          {feature.title}
        </span>
        <HierarchyStatusBadge status={hierarchyStatus} />
        {childPbis.length > 0 && (
          <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            {childPbis.length} PBI{childPbis.length !== 1 ? 's' : ''}
          </span>
        )}
        {(hierarchyStatus === 'draft' || hierarchyStatus === 'partial') && (
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0 text-xs min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('bulk');
            }}
            title="Push to ADO"
            aria-label={`Push ${feature.title} to ADO`}
          >
            ⬆ Push
          </button>
        )}
        {feature.adoWorkItemUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0 text-xs min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
            onClick={(e) => { e.stopPropagation(); vscodeApi?.postMessage({ type: 'OPEN_EXTERNAL', payload: { url: feature.adoWorkItemUrl! } }); }}
            title="View Feature in Azure DevOps"
            aria-label={`View Feature in Azure DevOps: ${feature.title}`}
          >
            ↗ ADO
          </button>
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out border-t ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ borderColor: 'var(--tw-vscode-border)' }}
        aria-hidden={!expanded}
      >
        {childPbis.length === 0 ? (
          <p className="px-3 py-2 text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
            No Product Backlog Items yet.
          </p>
        ) : (
          <div>
            <div className="px-3 py-1.5 flex items-center gap-2 border-b" style={{ borderColor: 'var(--tw-vscode-border)' }}>
              <span className="text-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                {pushedCount > 0 && `${pushedCount} pushed`}
                {pushedCount > 0 && draftCount > 0 && ' · '}
                {draftCount > 0 && `${draftCount} draft`}
              </span>
            </div>
            {childPbis.map((pbi) => (
              <div
                key={pbi.id}
                className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0"
                style={{ borderColor: 'var(--tw-vscode-border)', paddingLeft: '2rem' }}
              >
                <span className="flex-1 text-xs truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
                  {pbi.title}
                </span>
                {pbi.effortDays && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
                    {pbi.effortDays}pt
                  </span>
                )}
                <StatusBadge status={pbi.status ?? 'draft'} size="xs" />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0 min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]"
                  style={{ fontSize: '0.65rem' }}
                  onClick={() => onNavigateToStudio(pbi.id)}
                  title="Edit in PBI Studio"
                  aria-label={`Edit "${pbi.title}" in PBI Studio`}
                >
                  ✏ Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: Props['onNavigate'] }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border text-center"
      style={{
        borderColor: 'var(--tw-vscode-border)',
        background: 'var(--tw-vscode-bg-alt)',
      }}
    >
      <div className="text-4xl mb-3 select-none">📋</div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--tw-vscode-fg)' }}>
        No work items yet
      </h3>
      <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--tw-vscode-fg-muted)' }}>
        Create Features or User Stories to build your product backlog hierarchy.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]" onClick={() => onNavigate('bulk')}>
          Create Feature
        </button>
        <button type="button" className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]" onClick={() => onNavigate('studio')}>
          Open PBI Studio
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardView({ state, onNavigate, onNavigateToStudio, onNavigateToEpicCreation }: Props): JSX.Element {
  const { pbiDrafts, adoSettings, hasAdoPat, featureDrafts: rawFeatureDrafts, epicDrafts: rawEpicDrafts } = state;
  const featureDrafts = rawFeatureDrafts ?? [];
  const epicDrafts = rawEpicDrafts ?? [];

  // Derive hierarchy groups from the flat draft list using workItemType
  const epics = pbiDrafts.filter((d) => d.workItemType === 'Epic');
  const features = pbiDrafts.filter((d) => d.workItemType === 'Feature');
  const stories = pbiDrafts.filter(
    (d) =>
      d.workItemType === 'User Story' ||
      d.workItemType === 'Product Backlog Item' ||
      !d.workItemType,
  );

  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const adoReady = Boolean(adoSettings?.orgUrl && adoSettings?.projectName && hasAdoPat);

  const recent = [...pbiDrafts]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 5);

  const hasContent = epics.length > 0 || features.length > 0 || stories.length > 0 || featureDrafts.length > 0 || epicDrafts.length > 0;

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  // Orphaned features: no parentEpicId or parentEpicId not found in epicDrafts
  const epicIds = new Set(epicDrafts.map((e) => e.id));
  const orphanedFeatureDrafts = featureDrafts.filter(
    (f) => !f.parentEpicId || !epicIds.has(f.parentEpicId),
  );

  const navigateToStudio = (draftId?: string) => {
    if (draftId && onNavigateToStudio) {
      onNavigateToStudio(draftId);
    } else {
      onNavigate('studio');
    }
  };

  const handleCreateEpic = () => {
    if (onNavigateToEpicCreation) {
      onNavigateToEpicCreation();
    } else {
      onNavigate('epic-creation');
    }
  };

  const handleEditEpic = (epicId: string) => {
    if (onNavigateToEpicCreation) {
      onNavigateToEpicCreation(epicId);
    } else {
      onNavigate('epic-creation');
    }
  };

  const handlePushEpic = (_epicId: string) => {
    onNavigate('epic-creation');
  };

  return (
    <div className="content">
      {/* ── Top bar: ADO status indicator ─────────────────────────────── */}
      <div className="flex items-center justify-end mb-4">
        <AdoStatusChip
          adoReady={adoReady}
          projectName={adoSettings?.projectName}
          onNavigate={onNavigate}
        />
      </div>

      {/* ── Main layout: hierarchy + recent activity ───────────────────── */}
      {/* panel-wide (700px+): side-by-side. Narrower: stacked. */}
      <div className="flex flex-col panel-wide:flex-row gap-4">

        {/* Hierarchy — grows to fill available width */}
        <div className="flex-1 min-w-0">
          {!hasContent ? (
            <EmptyState onNavigate={onNavigate} />
          ) : (
            <div className="space-y-2">
              {/* ── Epics section (always shown) ───────────────────────── */}
              <EpicsSection
                epicDrafts={epicDrafts}
                featureDrafts={featureDrafts}
                pbiDrafts={pbiDrafts}
                expandedEpicIds={expandedEpics}
                onToggleEpic={toggleEpic}
                onEditEpic={handleEditEpic}
                onPushEpic={handlePushEpic}
                onCreateEpic={handleCreateEpic}
              />

              {/* Epics from pbiDrafts workItemType='Epic' (legacy) */}
              {epics.map((epic) => (
                <EpicAccordion
                  key={epic.id}
                  epic={epic}
                  features={[]}
                  expanded={expandedEpics.has(epic.id)}
                  onToggle={() => toggleEpic(epic.id)}
                  onNavigate={onNavigate}
                />
              ))}

              {/* Uncategorized Features (old-style pbiDrafts with workItemType='Feature') */}
              {features.length > 0 && (
                <FeatureGroup
                  label="Uncategorized Features"
                  features={features}
                  storyCountFor={() => 0}
                  onNavigate={onNavigate}
                />
              )}

              {/* FeatureDrafts — orphaned (no parent epic) or all when no epics */}
              {orphanedFeatureDrafts.length > 0 && (
                <div className="space-y-2">
                  {epicDrafts.length > 0 && (
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider px-1"
                      style={{ color: 'var(--tw-vscode-fg-muted)' }}
                    >
                      Standalone Features
                    </h3>
                  )}
                  {orphanedFeatureDrafts.map((feature) => {
                    const childPbis = feature.childPbiIds
                      .map((id) => pbiDrafts.find((d) => d.id === id))
                      .filter((d): d is PbiDraft => Boolean(d));
                    return (
                      <FeatureDraftCard
                        key={feature.id}
                        feature={feature}
                        childPbis={childPbis}
                        onNavigate={onNavigate}
                        onNavigateToStudio={navigateToStudio}
                      />
                    );
                  })}
                </div>
              )}

              {/* CTA when no features/epics but stories exist */}
              {featureDrafts.length === 0 && features.length === 0 && epics.length === 0 && epicDrafts.length === 0 && stories.length > 0 && (
                <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: 'var(--tw-vscode-border)', background: 'var(--tw-vscode-bg-alt)', color: 'var(--tw-vscode-fg-muted)' }}>
                  No features yet.{' '}
                  <button type="button" className="btn btn-ghost btn-sm min-h-[44px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)]" onClick={() => onNavigate('bulk')}>
                    Create your first feature
                  </button>{' '}
                  to break work into stories.
                </div>
              )}

              {/* Standalone Stories — shown only when no Features/Epics exist yet */}
              {stories.length > 0 && features.length === 0 && epics.length === 0 && epicDrafts.length === 0 && (
                <StandaloneStories stories={stories} onNavigate={onNavigate} />
              )}
            </div>
          )}
        </div>

        {/* Recent Activity — fixed width sidebar */}
        {recent.length > 0 && (
          <aside className="panel-wide:w-52 shrink-0">
            <RecentActivity items={recent} onNavigate={onNavigate} />
          </aside>
        )}
      </div>
    </div>
  );
}

