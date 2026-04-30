import { useState } from 'react';
import type { RdiDraft } from '../../types';

interface Props {
  draft: RdiDraft;
  onNext: (step: number) => void;
  onBack: (step: number) => void;
  onSave: (partial: Partial<RdiDraft>) => void;
}

export function RdiStepBackout({ draft, onNext, onBack, onSave }: Props) {
  const [strategy, setStrategy] = useState(draft.backoutStrategy ?? '');
  const [owner, setOwner] = useState(draft.backoutOwner ?? '');
  const [time, setTime] = useState(draft.estimatedBackoutTime ?? '');

  const saveAll = () => {
    onSave({ backoutStrategy: strategy, backoutOwner: owner, estimatedBackoutTime: time });
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Backout Strategy</h2>
        <p className="wizard-step-description">
          Define the rollback plan in case this release needs to be reverted.
        </p>
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-backout-strategy" className="wizard-field-label">
          Backout Strategy
        </label>
        <textarea
          id="rdi-backout-strategy"
          className="wizard-field-textarea"
          placeholder="Describe the steps to roll back this deployment if something goes wrong..."
          value={strategy}
          rows={6}
          onChange={(e) => setStrategy(e.target.value)}
          onBlur={(e) => onSave({ backoutStrategy: e.target.value })}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-backout-owner" className="wizard-field-label">
          Backout Owner
        </label>
        <input
          id="rdi-backout-owner"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. jane.smith@company.com"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onBlur={(e) => onSave({ backoutOwner: e.target.value })}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="rdi-backout-time" className="wizard-field-label">
          Estimated Backout Time
        </label>
        <input
          id="rdi-backout-time"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. 30 minutes, 2 hours"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onBlur={(e) => onSave({ estimatedBackoutTime: e.target.value })}
        />
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(3)}>
          Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={() => {
            saveAll();
            onNext(5);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
