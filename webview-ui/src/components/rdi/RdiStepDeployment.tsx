import { useState } from 'react';
import type { RdiDraft, RdiDeploymentDetail } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onBack: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
}

const emptyRow = (): RdiDeploymentDetail => ({
  application: '',
  repoUrl: '',
  buildUrl: '',
  version: '',
});

export function RdiStepDeployment({ draft, onNext, onBack, onSave }: Props) {
  const [rows, setRows] = useState<RdiDeploymentDetail[]>(
    draft.deploymentDetails?.length ? draft.deploymentDetails : [emptyRow()]
  );
  const [applications, setApplications] = useState(draft.applications ?? '');

  const updateRow = (idx: number, key: keyof RdiDeploymentDetail, value: string) => {
    const updated = rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r));
    setRows(updated);
  };

  const saveAll = (updatedRows = rows, updatedApps = applications) => {
    onSave({ deploymentDetails: updatedRows, applications: updatedApps });
  };

  const addRow = () => {
    const updated = [...rows, emptyRow()];
    setRows(updated);
  };

  const removeRow = (idx: number) => {
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    saveAll(updated);
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Deployment Details</h2>
        <p className="wizard-step-description">
          List the deployment artifacts, repositories, and build references for this release.
        </p>
      </div>

      <div className="wizard-field">
        <label className="wizard-field-label">Deployment Artifacts</label>
        <div style={{ overflowX: 'auto' }}>
          <table className="rdi-deployment-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Repo URL</th>
                <th>Build URL</th>
                <th>Version</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      className="wizard-field-input"
                      placeholder="App name"
                      value={row.application}
                      onChange={(e) => updateRow(idx, 'application', e.target.value)}
                      onBlur={() => saveAll()}
                      style={{ margin: 0 }}
                    />
                  </td>
                  <td>
                    <input
                      type="url"
                      className="wizard-field-input"
                      placeholder="https://github.com/…"
                      value={row.repoUrl}
                      onChange={(e) => updateRow(idx, 'repoUrl', e.target.value)}
                      onBlur={() => saveAll()}
                      style={{ margin: 0 }}
                    />
                  </td>
                  <td>
                    <input
                      type="url"
                      className="wizard-field-input"
                      placeholder="https://dev.azure.com/…"
                      value={row.buildUrl}
                      onChange={(e) => updateRow(idx, 'buildUrl', e.target.value)}
                      onBlur={() => saveAll()}
                      style={{ margin: 0 }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="wizard-field-input"
                      placeholder="1.0.0"
                      value={row.version}
                      onChange={(e) => updateRow(idx, 'version', e.target.value)}
                      onBlur={() => saveAll()}
                      style={{ margin: 0 }}
                    />
                  </td>
                  <td>
                    <button
                      className="wizard-btn wizard-btn-secondary"
                      onClick={() => removeRow(idx)}
                      aria-label="Remove row"
                      disabled={rows.length === 1}
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={addRow}
          style={{ marginTop: 'var(--space-3)' }}
        >
          + Add Row
        </button>
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-applications" className="wizard-field-label">
          Applications (comma-separated)
        </label>
        <input
          id="rdi-applications"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. PaymentService, AuthService, Gateway"
          value={applications}
          onChange={(e) => setApplications(e.target.value)}
          onBlur={(e) => saveAll(rows, e.target.value)}
        />
        <span className="wizard-field-hint">Free-text list of affected applications.</span>
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(2)}>
          Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={() => {
            saveAll();
            onNext(4);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
