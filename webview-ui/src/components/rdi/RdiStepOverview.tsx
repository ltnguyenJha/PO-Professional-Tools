import type { RdiDraft } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
}

export function RdiStepOverview({ draft, onNext, onSave }: Props) {
  const handleBlur = (key: keyof RdiDraft, value: string) => {
    onSave({ [key]: value } as Partial<RdiDraft>);
  };

  const handleNext = () => {
    onSave({
      workItemTitle: draft.workItemTitle,
      iterationPath: draft.iterationPath,
      areaPath: draft.areaPath,
      assignedTo: draft.assignedTo,
      targetReleaseDate: draft.targetReleaseDate,
    });
    onNext(1);
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Release Overview</h2>
        <p className="wizard-step-description">
          Provide the core details for this Release Deployment Item. Work item type will be set to
          <strong> Release Deployment Item</strong> in ADO.
        </p>
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-title" className="wizard-field-label">
          Title <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          id="rdi-title"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. Release 2.5.0 — Payment Service Upgrade"
          defaultValue={draft.workItemTitle}
          onBlur={(e) => handleBlur('workItemTitle', e.target.value)}
          required
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-iteration" className="wizard-field-label">
          Iteration Path
        </label>
        <input
          id="rdi-iteration"
          type="text"
          className="wizard-field-input"
          placeholder="Auto-filled from default iteration"
          defaultValue={draft.iterationPath}
          onBlur={(e) => handleBlur('iterationPath', e.target.value)}
        />
        <span className="wizard-field-hint">Pre-filled from your default iteration — override if needed.</span>
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-area" className="wizard-field-label">
          Area Path
        </label>
        <input
          id="rdi-area"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. MyProject\\Team"
          defaultValue={draft.areaPath}
          onBlur={(e) => handleBlur('areaPath', e.target.value)}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-assigned" className="wizard-field-label">
          Assigned To
        </label>
        <input
          id="rdi-assigned"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. john.doe@company.com"
          defaultValue={draft.assignedTo}
          onBlur={(e) => handleBlur('assignedTo', e.target.value)}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-date" className="wizard-field-label">
          Target Release Date
        </label>
        <input
          id="rdi-date"
          type="date"
          className="wizard-field-input"
          defaultValue={draft.targetReleaseDate}
          onBlur={(e) => handleBlur('targetReleaseDate', e.target.value)}
        />
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-primary" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
