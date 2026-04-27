import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: Props): JSX.Element {
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        {subtitle && <div className="hint">{subtitle}</div>}
      </div>
      <div className="topbar-actions">{actions}</div>
    </header>
  );
}
