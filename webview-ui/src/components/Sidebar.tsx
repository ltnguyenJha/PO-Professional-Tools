import type { ThemePreference } from '../types';
import jackHenryLogo from '../assets/jack-henry-logo.png';

export type ViewId = 'dashboard' | 'projects' | 'studio' | 'bulk' | 'rdis' | 'settings' | 'epic-creation';

interface NavEntry {
  id: ViewId;
  label: string;
  icon: string;
}

const NAV: NavEntry[] = [
  { id: 'dashboard',     label: 'Dashboard',        icon: '▣' },
  { id: 'epic-creation', label: 'Epics',             icon: '◈' },
  { id: 'projects',      label: 'Projects',          icon: '❏' },
  { id: 'studio',        label: 'PBI Studio',        icon: '✎' },
  { id: 'bulk',          label: 'Feature Creation',  icon: '≡' },
  { id: 'rdis',          label: 'RDIs',              icon: '⬆' },
  { id: 'settings',      label: 'Settings',          icon: '⚙' },
];

interface Props {
  active: ViewId;
  theme: ThemePreference;
  onNavigate: (view: ViewId) => void;
  onThemeChange: (theme: ThemePreference) => void;
}

export function Sidebar({ active, theme, onNavigate, onThemeChange }: Props): JSX.Element {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="brand">
        <div className="sidebar-logo-wrap">
          <img
            src={jackHenryLogo}
            alt="Jack Henry"
            className="sidebar-logo"
          />
        </div>
        <div className="brand-text">
          <h1>PO Pro</h1>
        </div>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        {NAV.map((entry) => (
          <button
            key={entry.id}
            className="nav-item"
            data-navid={entry.id}
            aria-current={active === entry.id ? 'page' : undefined}
            aria-label={`Navigate to ${entry.label}`}
            onClick={() => onNavigate(entry.id)}
          >
            <span className="nav-icon" aria-hidden="true">
              {entry.icon}
            </span>
            <span>{entry.label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-footer">
        <div className="theme-toggle" role="group" aria-label="Theme selection">
          {(['light', 'dark', 'auto'] as const).map((option) => (
            <button
              key={option}
              aria-pressed={theme === option}
              aria-label={`Switch to ${option} theme`}
              onClick={() => onThemeChange(option)}
            >
              {option === 'auto' ? 'Auto' : option === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
