import { useState } from 'react';
import type { PbiDraft } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
}

export function WizardStep5TestCases({ draft, onNext, onBack, onSave }: Props) {
  const [scenarios, setScenarios] = useState<string[]>(
    draft.testScenarios?.length ? draft.testScenarios : ['']
  );
  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  const save = (next: string[]) => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      onSave({ testScenarios: next.filter((s) => s.trim()) });
    }, 400);
    setSaveTimer(timer);
  };

  const update = (idx: number, value: string) => {
    const next = scenarios.map((s, i) => (i === idx ? value : s));
    setScenarios(next);
    save(next);
  };

  const add = () => setScenarios([...scenarios, '']);

  const remove = (idx: number) => {
    const next = scenarios.filter((_, i) => i !== idx);
    setScenarios(next.length ? next : ['']);
    save(next);
  };

  const handleNext = () => {
    if (saveTimer) clearTimeout(saveTimer);
    onSave({ testScenarios: scenarios.filter((s) => s.trim()) });
    onNext(5);
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Test Cases</h2>
        <p className="wizard-step-description">
          Review and edit the test scenarios for this work item. AI-generated scenarios from the
          Story step will appear here automatically.
        </p>
      </div>

      <div className="wizard-field">
        <label className="wizard-field-label">Test Scenarios</label>
        {scenarios.map((scenario, idx) => (
          <div
            key={idx}
            style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}
          >
            <textarea
              className="wizard-field-textarea"
              rows={2}
              placeholder="e.g. Given a logged-in user, when they click Submit, then the form saves successfully."
              value={scenario}
              onChange={(e) => update(idx, e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button
              className="wizard-btn wizard-btn-secondary"
              onClick={() => remove(idx)}
              style={{ alignSelf: 'flex-start', padding: 'var(--space-1) var(--space-2)', fontSize: '12px' }}
              aria-label={`Remove scenario ${idx + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={add}
          style={{ marginTop: 'var(--space-2)' }}
        >
          + Add Scenario
        </button>
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(3)}>
          Back
        </button>
        <button className="wizard-btn wizard-btn-primary" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
