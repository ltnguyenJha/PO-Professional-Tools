import { useEffect, useState } from 'react';
import { vscodeApi } from '../../utils/useVsCodeApi';
import type { RdiDraft } from '../../types';
import './rdi-wizard.css';

interface Props {
  onOpen: (draftId: string) => void;
  onNew: () => void;
}

function StatusBadge({ status }: { status: RdiDraft['status'] }) {
  const labels: Record<RdiDraft['status'], string> = {
    draft: 'Draft',
    pushed: 'Pushed',
    error: 'Error',
  };
  return <span className={`rdi-status-badge ${status}`}>{labels[status]}</span>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function RdiList({ onOpen, onNew }: Props) {
  const [drafts, setDrafts] = useState<RdiDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    vscodeApi?.postMessage({ type: 'loadRdiList' } as never);

    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'rdiListLoaded') {
        setDrafts(msg.drafts as RdiDraft[]);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Delete RDI "${title}"?`)) return;
    vscodeApi?.postMessage({ type: 'deleteRdiDraft', payload: { id } } as never);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="rdi-list">
      <div className="rdi-list-header">
        <h2 className="rdi-list-title">Release Deployment Items</h2>
        <button className="wizard-btn wizard-btn-primary" onClick={onNew}>
          + New RDI
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)' }} role="status">
          <span className="rdi-spinner" aria-hidden="true" />
          Loading…
        </div>
      ) : drafts.length === 0 ? (
        <div className="rdi-list-empty">
          No RDIs yet. Click <strong>+ New RDI</strong> to create one.
        </div>
      ) : (
        <div className="rdi-list-items">
          {drafts.map((d) => (
            <div key={d.id} className="rdi-list-row">
              <div className="rdi-list-row-info">
                <div className="rdi-list-row-title">{d.workItemTitle || d.title || 'Untitled RDI'}</div>
                <div className="rdi-list-row-meta">Created {formatDate(d.createdAt)}</div>
              </div>
              <StatusBadge status={d.status} />
              <div className="rdi-list-row-actions">
                <button
                  className="wizard-btn wizard-btn-secondary"
                  onClick={() => onOpen(d.id)}
                  aria-label={`Open RDI: ${d.workItemTitle || d.title}`}
                >
                  Open
                </button>
                <button
                  className="wizard-btn wizard-btn-secondary"
                  onClick={() => handleDelete(d.id, d.workItemTitle || d.title || 'Untitled')}
                  aria-label={`Delete RDI: ${d.workItemTitle || d.title}`}
                  style={{ color: 'var(--color-danger)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
