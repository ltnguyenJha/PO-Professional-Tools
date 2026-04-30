import { useState } from 'react';
import type { AppStatePayload, PbiDraft } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  state: AppStatePayload;
  onNavigate: (view: 'projects' | 'studio' | 'bulk' | 'settings') => void;
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
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 border-0 cursor-pointer"
      style={{
        background: adoReady ? 'var(--tw-vscode-success-bg)' : 'var(--tw-vscode-warning-bg)',
        color: adoReady ? 'var(--tw-vscode-success)' : 'var(--tw-vscode-warning)',
      }}
      onClick={() => onNavigate('settings')}
      title={adoReady ? `Connected to ${projectName}` : 'Click to configure ADO in Settings'}
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
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-opacity hover:opacity-80 border-0 cursor-pointer"
      style={{ background: 'var(--tw-vscode-bg-alt)', color: 'var(--tw-vscode-fg-muted)' }}
      onClick={onClick}
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
      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: 'var(--tw-vscode-border)' }}
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
      )}
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
        className="btn btn-ghost btn-sm shrink-0"
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
      {open && (
        <div
          className="px-3 py-2 space-y-2 border-t"
          style={{ borderColor: 'var(--tw-vscode-border)' }}
        >
          {features.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              storyCount={storyCountFor(f.id)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
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
      {open && (
        <div className="border-t" style={{ borderColor: 'var(--tw-vscode-border)' }}>
          {stories.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:opacity-80 cursor-pointer transition-opacity"
              style={{ borderColor: 'var(--tw-vscode-border)' }}
              onClick={() => onNavigate('studio')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('studio')}
            >
              <span className="flex-1 text-sm truncate" style={{ color: 'var(--tw-vscode-fg)' }}>
                {s.title}
              </span>
              <StatusBadge status={s.status ?? 'draft'} />
            </div>
          ))}
        </div>
      )}
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
            className="px-3 py-2 border-b last:border-b-0 hover:opacity-80 cursor-pointer transition-opacity"
            style={{ borderColor: 'var(--tw-vscode-border)' }}
            onClick={() => onNavigate('studio')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('studio')}
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
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('bulk')}>
          Create Feature
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('studio')}>
          Open PBI Studio
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardView({ state, onNavigate }: Props): JSX.Element {
  const { pbiDrafts, adoSettings, hasAdoPat } = state;

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

  const hasContent = epics.length > 0 || features.length > 0 || stories.length > 0;

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  // When parent-child IDs exist on features, pass the real count.
  // For now there is no featureId on PbiDraft, so all stories are standalone.
  const storyCountFor = (_featureId: string) => 0;

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
              {/* Epics (expandable) */}
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

              {/* Uncategorized Features */}
              {features.length > 0 && (
                <FeatureGroup
                  label="Uncategorized Features"
                  features={features}
                  storyCountFor={storyCountFor}
                  onNavigate={onNavigate}
                />
              )}

              {/* Standalone Stories — shown only when no Features/Epics exist yet */}
              {stories.length > 0 && features.length === 0 && epics.length === 0 && (
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

