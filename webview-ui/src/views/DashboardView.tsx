import type { AppStatePayload } from '../types';

interface Props {
  state: AppStatePayload;
  onNavigate: (view: 'projects' | 'studio' | 'bulk' | 'settings') => void;
}

export function DashboardView({ state, onNavigate }: Props): JSX.Element {
  const { projects, pbiDrafts, adoSettings, hasAdoPat } = state;

  const routeCount = projects.reduce((acc, p) => acc + (p.scanSummary?.routes.length ?? 0), 0);
  const apiCount = projects.reduce((acc, p) => acc + (p.scanSummary?.apiEndpoints.length ?? 0), 0);
  const pushedCount = pbiDrafts.filter((d) => d.status === 'pushed').length;
  const draftCount = pbiDrafts.length - pushedCount;

  const recent = [...pbiDrafts]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 5);

  const adoReady = Boolean(adoSettings?.orgUrl && adoSettings?.projectName && hasAdoPat);

  return (
    <div className="content">
      <section className="kpi-grid">
        <article className="kpi">
          <div className="label">Projects</div>
          <div className="value">{projects.length}</div>
          <div className="trend">{routeCount} routes / {apiCount} APIs scanned</div>
        </article>
        <article className="kpi">
          <div className="label">Drafts</div>
          <div className="value">{draftCount}</div>
          <div className="trend">{pbiDrafts.length} total backlog items</div>
        </article>
        <article className="kpi">
          <div className="label">Pushed</div>
          <div className="value">{pushedCount}</div>
          <div className="trend">Sent to Azure DevOps</div>
        </article>
        <article className="kpi">
          <div className="label">ADO</div>
          <div className="value">{adoReady ? 'Ready' : 'Setup'}</div>
          <div className="trend">
            {adoReady
              ? adoSettings?.projectName
              : 'Fill in Organization URL, Project, and PAT in Settings.'}
          </div>
        </article>
      </section>

      <section className="grid-auto">
        <article className="card">
          <div className="card-header">
            <h3>Get started</h3>
          </div>
          <p className="card-subtitle">
            A quick path from a local repo to Azure DevOps work items.
          </p>
          <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('projects')}>
                Add a project
              </button>{' '}
              and scan it.
            </li>
            <li>
              Jump to{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('studio')}>
                PBI Studio
              </button>{' '}
              to review, edit, or refine with AI.
            </li>
            <li>
              Use{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('bulk')}>
                Bulk Breakdown
              </button>{' '}
              to split a big feature into many prefixed items.
            </li>
            <li>
              Configure ADO in{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('settings')}>
                Settings
              </button>{' '}
              and push.
            </li>
          </ol>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Recent drafts</h3>
          </div>
          {recent.length === 0 && (
            <p className="card-subtitle">No drafts yet. Generate some from the Projects view.</p>
          )}
          {recent.map((draft) => (
            <div key={draft.id} className="studio-item" onClick={() => onNavigate('studio')}>
              <div className="title">{draft.title}</div>
              <div className="meta">
                <span>{draft.iteration}</span>
                <span className={`chip ${draft.status === 'pushed' ? 'success' : 'info'}`}>
                  {draft.status === 'pushed'
                    ? `Pushed #${draft.adoWorkItemId ?? ''}`
                    : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
