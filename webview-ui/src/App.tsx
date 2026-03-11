import { useEffect, useMemo, useState } from 'react';
import type {
  AdoSettingsInput,
  ExtensionEvent,
  ImportedProject,
  PbiDraft,
  WebviewRequest
} from './types';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : undefined;

function send(message: WebviewRequest): void {
  vscode?.postMessage(message);
}

export function App(): JSX.Element {
  const [projects, setProjects] = useState<ImportedProject[]>([]);
  const [pbiDrafts, setPbiDrafts] = useState<PbiDraft[]>([]);
  const [toast, setToast] = useState<string>('Ready to import local projects.');
  const [adoForm, setAdoForm] = useState<AdoSettingsInput>({
    orgUrl: '',
    projectName: '',
    areaPath: '',
    iterationPath: '',
    pat: ''
  });

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionEvent>) => {
      const message = event.data;
      if (message.type === 'STATE_UPDATED') {
        setProjects(message.payload.projects);
        setPbiDrafts(message.payload.pbiDrafts);
        if (message.payload.adoSettings) {
          setAdoForm((existing) => ({
            ...existing,
            ...message.payload.adoSettings
          }));
        }
      }
      if (message.type === 'TOAST') {
        setToast(message.payload.message);
      }
    };

    window.addEventListener('message', handler);
    send({ type: 'APP_READY' });

    return () => window.removeEventListener('message', handler);
  }, []);

  const stats = useMemo(() => {
    const projectCount = projects.length;
    const stackCount = new Set(projects.flatMap((project) => project.detectedStack)).size;
    const routeCount = projects.reduce((count, project) => count + (project.scanSummary?.routes.length ?? 0), 0);
    return { projectCount, stackCount, routeCount };
  }, [projects]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Jack Henry PO Tools</h1>
        <p>Local project analysis and concise PBI generation.</p>
        <button className="primary" onClick={() => send({ type: 'IMPORT_PROJECT' })}>
          Add Project
        </button>
      </aside>

      <main className="content">
        <header className="hero">
          <div>
            <h2>Project Workspace</h2>
            <p>Import cloned repositories and prepare high-quality backlog stories.</p>
          </div>
          <div className="stats">
            <div className="stat-card">
              <strong>{stats.projectCount}</strong>
              <span>Projects</span>
            </div>
            <div className="stat-card">
              <strong>{stats.stackCount}</strong>
              <span>Stacks</span>
            </div>
            <div className="stat-card">
              <strong>{stats.routeCount}</strong>
              <span>Routes</span>
            </div>
          </div>
        </header>

        <section className="toast" role="status">
          {toast}
        </section>

        <section className="settings-card">
          <h3>Azure DevOps Setup</h3>
          <div className="settings-grid">
            <label>
              Organization URL
              <input
                value={adoForm.orgUrl}
                onChange={(event) => setAdoForm({ ...adoForm, orgUrl: event.target.value })}
                placeholder="https://dev.azure.com/your-org"
              />
            </label>
            <label>
              Project Name
              <input
                value={adoForm.projectName}
                onChange={(event) => setAdoForm({ ...adoForm, projectName: event.target.value })}
                placeholder="Project Name"
              />
            </label>
            <label>
              Area Path
              <input
                value={adoForm.areaPath}
                onChange={(event) => setAdoForm({ ...adoForm, areaPath: event.target.value })}
                placeholder="Project\\Area"
              />
            </label>
            <label>
              Iteration Path (optional)
              <input
                value={adoForm.iterationPath}
                onChange={(event) => setAdoForm({ ...adoForm, iterationPath: event.target.value })}
                placeholder="Project\\Iteration"
              />
            </label>
            <label>
              PAT
              <input
                type="password"
                value={adoForm.pat}
                onChange={(event) => setAdoForm({ ...adoForm, pat: event.target.value })}
                placeholder="Paste PAT to save/update"
              />
            </label>
          </div>
          <button
            className="primary inline"
            onClick={() => send({ type: 'SAVE_ADO_SETTINGS', payload: adoForm })}
          >
            Save ADO Settings
          </button>
        </section>

        <section className="project-grid">
          {projects.length === 0 && (
            <article className="empty-card">
              <h3>No projects imported</h3>
              <p>Use Add Project to select local repo folders from your machine.</p>
            </article>
          )}

          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <header>
                <h3>{project.name}</h3>
                <div className="action-row">
                  <button
                    className="ghost"
                    onClick={() => send({ type: 'SCAN_PROJECT', payload: { projectId: project.id } })}
                  >
                    Scan
                  </button>
                  <button
                    className="ghost"
                    onClick={() => send({ type: 'GENERATE_PBI_DRAFTS', payload: { projectId: project.id } })}
                  >
                    Generate PBIs
                  </button>
                  <button
                    className="ghost"
                    onClick={() => send({ type: 'PUSH_PROJECT_TO_ADO', payload: { projectId: project.id } })}
                  >
                    Push to ADO
                  </button>
                </div>
              </header>
              <p className="path">{project.path}</p>
              <div className="tags">
                {project.detectedStack.map((stack) => (
                  <span className="tag" key={`${project.id}-${stack}`}>
                    {stack}
                  </span>
                ))}
              </div>
              <div className="summary-row">
                <span>Routes: {project.scanSummary?.routes.length ?? 0}</span>
                <span>APIs: {project.scanSummary?.apiEndpoints.length ?? 0}</span>
                <span>SQL: {project.scanSummary?.sqlObjects.length ?? 0}</span>
              </div>
              <footer>
                Last scanned: {project.lastScannedAt ? new Date(project.lastScannedAt).toLocaleString() : 'Never'}
              </footer>
            </article>
          ))}
        </section>

        <section className="pbi-section">
          <h2>Draft PBIs</h2>
          {pbiDrafts.length === 0 && (
            <article className="empty-card">
              <h3>No drafts yet</h3>
              <p>Scan a project, then generate PBIs to review concise story drafts here.</p>
            </article>
          )}

          {pbiDrafts.map((draft) => (
            <article className="pbi-card" key={draft.id}>
              <header>
                <h3>{draft.title}</h3>
                <span className="effort">{draft.effortDays} day(s)</span>
              </header>
              <p>{draft.description}</p>
              <div className="tags">
                <span className="tag">Iteration: {draft.iteration}</span>
              </div>
              <h4>Acceptance Criteria</h4>
              <ul>
                {draft.acceptanceCriteria.map((item) => (
                  <li key={`${draft.id}-${item}`}>{item}</li>
                ))}
              </ul>
              <h4>Test Scenarios</h4>
              <ul>
                {draft.testScenarios.map((item) => (
                  <li key={`${draft.id}-test-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
