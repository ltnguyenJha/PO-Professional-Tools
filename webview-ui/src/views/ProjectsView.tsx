import { useState } from 'react';
import type { ImportedProject, WebviewRequest } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Props {
  projects: ImportedProject[];
  send: (message: WebviewRequest) => void;
}

export function ProjectsView({ projects, send }: Props): JSX.Element {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const target = projects.find((p) => p.id === confirmId);

  return (
    <div className="content">
      <div className="section-title">
        <h3>Projects</h3>
        <span className="muted">{projects.length} imported</span>
      </div>

      {projects.length === 0 && (
        <div className="empty">
          <h3>No projects imported</h3>
          <p>
            Click <strong>Add Project</strong> in the topbar to select a local cloned repository.
          </p>
        </div>
      )}

      <section className="grid-auto">
        {projects.map((project) => (
          <article className="card project-card" key={project.id}>
            <header>
              <div>
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                <p className="path">{project.path}</p>
              </div>
              <span className="chip info">
                {project.detectedStack[0] ?? 'Unknown'}
                {project.detectedStack.length > 1 ? ` +${project.detectedStack.length - 1}` : ''}
              </span>
            </header>

            <div className="summary">
              <span>Routes: {project.scanSummary?.routes.length ?? 0}</span>
              <span>APIs: {project.scanSummary?.apiEndpoints.length ?? 0}</span>
              <span>SQL: {project.scanSummary?.sqlObjects.length ?? 0}</span>
            </div>

            <div className="action-row">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => send({ type: 'SCAN_PROJECT', payload: { projectId: project.id } })}
              >
                Scan
              </button>
              <button
                className="btn btn-sm"
                onClick={() =>
                  send({ type: 'GENERATE_PBI_DRAFTS', payload: { projectId: project.id } })
                }
              >
                Generate PBIs
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  send({ type: 'PUSH_PROJECT_TO_ADO', payload: { projectId: project.id } })
                }
              >
                Push all to ADO
              </button>
              <span className="spacer" />
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(project.id)}>
                Remove
              </button>
            </div>

            <footer>
              Last scanned:{' '}
              {project.lastScannedAt
                ? new Date(project.lastScannedAt).toLocaleString()
                : 'Never'}
            </footer>
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={!!target}
        destructive
        title={`Remove ${target?.name ?? 'project'}?`}
        message="This removes the project from the list along with its generated drafts. The folder on disk is not touched."
        confirmLabel="Remove"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (target) {
            send({ type: 'REMOVE_PROJECT', payload: { projectId: target.id } });
          }
          setConfirmId(null);
        }}
      />
    </div>
  );
}
