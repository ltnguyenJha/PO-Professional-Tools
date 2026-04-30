import type { ThemePreference } from '../types';

export type ViewId = 'dashboard' | 'projects' | 'studio' | 'bulk' | 'settings';

interface NavEntry {
  id: ViewId;
  label: string;
  icon: string;
}

const NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'projects', label: 'Projects', icon: '❏' },
  { id: 'studio', label: 'PBI Studio', icon: '✎' },
  { id: 'bulk', label: 'Feature Creation', icon: '≡' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
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
        <div className="brand-mark" aria-hidden="true">PO</div>
        <div className="brand-text">
          <h1>PO Pro Tools</h1>
          <span>Jack Henry Edition</span>
        </div>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        {NAV.map((entry) => (
          <button
            key={entry.id}
            className="nav-item"
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
