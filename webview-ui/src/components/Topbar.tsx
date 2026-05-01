import type { ReactNode } from 'react';
import anniversaryBanner from '../assets/jh-anniversary-banner.png';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: Props): JSX.Element {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-banner" aria-hidden="true">
        <img
          src={anniversaryBanner}
          alt=""
          className="topbar-banner-img"
        />
        <div className="topbar-banner-fade" />
      </div>
      <div className="topbar-content">
        <div>
          <h2>{title}</h2>
          {subtitle && <div className="hint" role="doc-subtitle">{subtitle}</div>}
        </div>
        <div className="topbar-actions" role="toolbar" aria-label="Page actions">{actions}</div>
      </div>
    </header>
  );
}
