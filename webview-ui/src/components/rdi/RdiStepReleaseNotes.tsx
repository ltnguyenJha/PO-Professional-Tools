import { useState } from 'react';
import type { RdiDraft } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onBack: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
}

export function RdiStepReleaseNotes({ draft, onNext, onBack, onSave }: Props) {
  const [notes, setNotes] = useState(draft.releaseNotes ?? '');

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Release Notes</h2>
        <p className="wizard-step-description">
          Describe the changes included in this release for documentation and stakeholder communication.
        </p>
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-release-notes" className="wizard-field-label">
          Release Notes
        </label>
        <textarea
          id="rdi-release-notes"
          className="wizard-field-textarea"
          placeholder="Describe what is changing, why, and any known impacts..."
          value={notes}
          rows={10}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => onSave({ releaseNotes: e.target.value })}
        />
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(1)}>
          Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={() => {
            onSave({ releaseNotes: notes });
            onNext(3);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
