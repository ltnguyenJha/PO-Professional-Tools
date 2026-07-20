export type ViewId = 'dashboard' | 'projects' | 'drafts' | 'studio' | 'bulk' | 'rdis' | 'settings' | 'epic-creation';

interface NavEntry {
  id: ViewId;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavEntry[];
}

/** IA §13.1 — Plan | Create | Manage | Configure */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Plan',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '▣' },
      { id: 'epic-creation', label: 'Epics', icon: '◈' },
    ],
  },
  {
    label: 'Create',
    items: [
      { id: 'studio', label: 'PBI Studio', icon: '✎' },
      { id: 'bulk', label: 'Feature Creation', icon: '≡' },
      { id: 'rdis', label: 'RDIs', icon: '⬆' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'projects', label: 'Projects', icon: '❏' },
      { id: 'drafts', label: 'My Drafts', icon: '◨' },
    ],
  },
  {
    label: 'Configure',
    items: [{ id: 'settings', label: 'Settings', icon: '⚙' }],
  },
];

interface Props {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function Sidebar({ active, onNavigate }: Props): JSX.Element {
  return (
    <aside
      className="sidebar border-r border-tw-border bg-tw-bg-alt shadow-tw-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="brand brand-energy">
        <div className="brand-text">
          <span className="brand-company">Jack Henry</span>
          <h1>
            <span className="brand-full">PO Pro</span>
            <span className="brand-compact" aria-hidden="true">PO</span>
          </h1>
        </div>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="nav-group">
            <span className="nav-group-label" aria-hidden="true">
              {group.label}
            </span>
            {group.items.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="nav-item focus-tw-ring-inset"
                data-navid={entry.id}
                aria-current={active === entry.id ? 'page' : undefined}
                aria-label={`Navigate to ${entry.label}`}
                onClick={() => onNavigate(entry.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {entry.icon}
                </span>
                <span className="nav-label">{entry.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
