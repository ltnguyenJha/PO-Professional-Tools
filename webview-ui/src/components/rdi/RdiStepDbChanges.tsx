import { useState } from 'react';
import type { RdiDraft, RdiManualDbChange } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onBack: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
  onPush: () => void;
  isPushing: boolean;
  pushError: string | null;
}

const emptyChange = (): RdiManualDbChange => ({
  description: '',
  script: '',
  rollbackScript: '',
});

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rdi-review-row">
      <span className="rdi-review-label">{label}</span>
      <span className="rdi-review-value">{value || <em style={{ opacity: 0.5 }}>—</em>}</span>
    </div>
  );
}

export function RdiStepDbChanges({ draft, onBack, onSave, onPush, isPushing, pushError }: Props) {
  const [hasChanges, setHasChanges] = useState(draft.hasManualDbChanges ?? false);
  const [changes, setChanges] = useState<RdiManualDbChange[]>(
    draft.manualDbChanges?.length ? draft.manualDbChanges : [emptyChange()]
  );

  const updateChange = (idx: number, key: keyof RdiManualDbChange, value: string) => {
    const updated = changes.map((c, i) => (i === idx ? { ...c, [key]: value } : c));
    setChanges(updated);
  };

  const saveChanges = (updatedChanges = changes, updatedHas = hasChanges) => {
    onSave({ hasManualDbChanges: updatedHas, manualDbChanges: updatedChanges });
  };

  const addChange = () => setChanges([...changes, emptyChange()]);

  const removeChange = (idx: number) => {
    const updated = changes.filter((_, i) => i !== idx);
    setChanges(updated);
    saveChanges(updated);
  };

  const canPush = !!draft.workItemTitle?.trim() && !!draft.iterationPath?.trim();

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">DB Changes &amp; Review</h2>
        <p className="wizard-step-description">
          Document any manual database changes, then review and push the RDI to Azure DevOps.
        </p>
      </div>

      {/* DB Changes section */}
      <div className="wizard-field">
        <label className="wizard-field-label" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={hasChanges}
            onChange={(e) => {
              setHasChanges(e.target.checked);
              saveChanges(changes, e.target.checked);
            }}
          />
          This release includes manual database changes
        </label>
      </div>

      {hasChanges && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {changes.map((change, idx) => (
            <div key={idx} className="rdi-db-row">
              <div className="rdi-db-row-header">
                <span>Change #{idx + 1}</span>
                <button
                  className="wizard-btn wizard-btn-secondary"
                  onClick={() => removeChange(idx)}
                  disabled={changes.length === 1}
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
              <div className="wizard-field" style={{ marginBottom: 0 }}>
                <label className="wizard-field-label">Description *</label>
                <textarea
                  className="wizard-field-textarea"
                  placeholder="What does this change do?"
                  value={change.description}
                  rows={2}
                  onChange={(e) => updateChange(idx, 'description', e.target.value)}
                  onBlur={() => saveChanges()}
                />
              </div>
              <div className="wizard-field" style={{ marginBottom: 0 }}>
                <label className="wizard-field-label">SQL Script (optional)</label>
                <textarea
                  className="wizard-field-textarea"
                  placeholder="ALTER TABLE …"
                  value={change.script ?? ''}
                  rows={3}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  onChange={(e) => updateChange(idx, 'script', e.target.value)}
                  onBlur={() => saveChanges()}
                />
              </div>
              <div className="wizard-field" style={{ marginBottom: 0 }}>
                <label className="wizard-field-label">Rollback Script (optional)</label>
                <textarea
                  className="wizard-field-textarea"
                  placeholder="-- undo the change"
                  value={change.rollbackScript ?? ''}
                  rows={2}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  onChange={(e) => updateChange(idx, 'rollbackScript', e.target.value)}
                  onBlur={() => saveChanges()}
                />
              </div>
            </div>
          ))}
          <button className="wizard-btn wizard-btn-secondary" onClick={addChange} style={{ alignSelf: 'flex-start' }}>
            + Add DB Change
          </button>
        </div>
      )}

      {/* Review panel */}
      <div className="rdi-review-panel">
        <h3 className="rdi-review-section-title" style={{ margin: 0, paddingBottom: 'var(--space-2)' }}>
          Review Before Push
        </h3>

        <div className="rdi-review-section">
          <h4 className="rdi-review-section-title">Overview</h4>
          <ReviewRow label="Title" value={draft.workItemTitle} />
          <ReviewRow label="Iteration" value={draft.iterationPath} />
          <ReviewRow label="Area Path" value={draft.areaPath} />
          <ReviewRow label="Assigned To" value={draft.assignedTo} />
          <ReviewRow label="Target Date" value={draft.targetReleaseDate} />
        </div>

        <div className="rdi-review-section">
          <h4 className="rdi-review-section-title">PBI Links</h4>
          {draft.pbiLinks?.length ? (
            draft.pbiLinks.map((l, i) => (
              <div key={i} className="rdi-review-row">
                <span className="rdi-review-label">PBI #{l.pbiId}</span>
                <span className="rdi-review-value">{l.pbiTitle || '—'}</span>
              </div>
            ))
          ) : (
            <div className="rdi-review-row">
              <span className="rdi-review-value" style={{ opacity: 0.5 }}>No PBIs linked</span>
            </div>
          )}
        </div>

        <div className="rdi-review-section">
          <h4 className="rdi-review-section-title">Release Notes</h4>
          <div className="rdi-review-row">
            <span className="rdi-review-value" style={{ whiteSpace: 'pre-wrap' }}>
              {draft.releaseNotes || <em style={{ opacity: 0.5 }}>—</em>}
            </span>
          </div>
        </div>

        <div className="rdi-review-section">
          <h4 className="rdi-review-section-title">Deployment</h4>
          <ReviewRow label="Applications" value={draft.applications} />
          {draft.deploymentDetails?.filter(d => d.application).map((d, i) => (
            <div key={i} className="rdi-review-row">
              <span className="rdi-review-label">{d.application}</span>
              <span className="rdi-review-value">v{d.version} · {d.repoUrl}</span>
            </div>
          ))}
        </div>

        <div className="rdi-review-section">
          <h4 className="rdi-review-section-title">Backout</h4>
          <ReviewRow label="Owner" value={draft.backoutOwner} />
          <ReviewRow label="Est. Time" value={draft.estimatedBackoutTime} />
          <ReviewRow label="Strategy" value={draft.backoutStrategy} />
        </div>
      </div>

      {/* Push result */}
      {draft.status === 'pushed' && (
        <div className="rdi-push-result" role="alert">
          <strong>✓ Pushed to Azure DevOps</strong>
          <span style={{ color: 'var(--color-neutral-450)', fontSize: 'var(--font-size-sm)' }}>
            The RDI was successfully created in ADO.
          </span>
        </div>
      )}

      {pushError && (
        <div
          style={{
            padding: 'var(--space-3)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-3)',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
          }}
          role="alert"
        >
          {pushError}
        </div>
      )}

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(4)}>
          Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={onPush}
          disabled={!canPush || isPushing || draft.status === 'pushed'}
          aria-busy={isPushing}
        >
          {isPushing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="rdi-spinner" aria-hidden="true" />
              Pushing…
            </span>
          ) : draft.status === 'pushed' ? (
            '✓ Pushed'
          ) : (
            'Push to ADO'
          )}
        </button>
      </div>
      {!canPush && (
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)', margin: 0 }}>
          Title and Iteration Path are required before pushing.
        </p>
      )}
    </div>
  );
}
