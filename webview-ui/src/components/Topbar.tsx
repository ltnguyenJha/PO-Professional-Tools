import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: Props): JSX.Element {
  return (
    <header className="topbar" role="banner">
      <div>
        <h2>{title}</h2>
        {subtitle && <div className="hint" role="doc-subtitle">{subtitle}</div>}
      </div>
      <div className="topbar-actions" role="toolbar" aria-label="Page actions">{actions}</div>
    </header>
  );
}
