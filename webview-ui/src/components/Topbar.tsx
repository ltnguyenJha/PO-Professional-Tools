import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: Props): JSX.Element {
  return (
    <header
      className="topbar topbar-energy-accent sticky top-0 z-10 border-b border-tw-border bg-tw-bg-alt shadow-tw-sm"
      role="banner"
    >
      <div className="topbar-content">
        <div className="min-w-0">
          <h2 className="text-tw-fg text-lg font-semibold leading-snug">{title}</h2>
          {subtitle && (
            <div className="hint text-contrast-muted text-sm mt-0.5" role="doc-subtitle">
              {subtitle}
            </div>
          )}
        </div>
        <div className="topbar-actions shrink-0" role="toolbar" aria-label="Page actions">
          {actions}
        </div>
      </div>
    </header>
  );
}
