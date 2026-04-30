import { useState } from 'react';
import type { RdiDraft, RdiPbiLink } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onBack: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
}

export function RdiStepPbiLinks({ draft, onNext, onBack, onSave }: Props) {
  const [links, setLinks] = useState<RdiPbiLink[]>(draft.pbiLinks ?? []);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const save = (updated: RdiPbiLink[]) => {
    onSave({ pbiLinks: updated });
  };

  const handleAdd = () => {
    if (!newId.trim()) return;
    const updated = [...links, { pbiId: newId.trim(), pbiTitle: newTitle.trim() || undefined }];
    setLinks(updated);
    setNewId('');
    setNewTitle('');
    save(updated);
  };

  const handleRemove = (idx: number) => {
    const updated = links.filter((_, i) => i !== idx);
    setLinks(updated);
    save(updated);
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">PBI Links</h2>
        <p className="wizard-step-description">
          Link associated Product Backlog Items to this RDI.
        </p>
      </div>

      <div className="rdi-pbi-hint">
        These will be created as <strong>ADO parent-child relations</strong> when pushed to Azure DevOps.
      </div>

      {links.map((link, idx) => (
        <div key={idx} className="rdi-pbi-row">
          <div className="rdi-pbi-row-inputs">
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary-default)' }}>
              #{link.pbiId}
            </span>
            {link.pbiTitle && (
              <span style={{ color: 'var(--color-neutral-450)', fontSize: 'var(--font-size-sm)' }}>
                — {link.pbiTitle}
              </span>
            )}
          </div>
          <button
            className="wizard-btn wizard-btn-secondary"
            onClick={() => handleRemove(idx)}
            aria-label={`Remove PBI ${link.pbiId}`}
            style={{ padding: '2px 8px', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
        <div className="wizard-field" style={{ flex: '0 0 120px', marginBottom: 0 }}>
          <label className="wizard-field-label">PBI ID</label>
          <input
            type="text"
            className="wizard-field-input"
            placeholder="e.g. 1234"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="wizard-field" style={{ flex: 1, marginBottom: 0 }}>
          <label className="wizard-field-label">Title (optional)</label>
          <input
            type="text"
            className="wizard-field-input"
            placeholder="e.g. User Login Story"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={handleAdd}
          disabled={!newId.trim()}
          style={{ flexShrink: 0 }}
        >
          Add PBI
        </button>
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(0)}>
          Back
        </button>
        <button className="wizard-btn wizard-btn-primary" onClick={() => onNext(2)}>
          Next
        </button>
      </div>
    </div>
  );
}
