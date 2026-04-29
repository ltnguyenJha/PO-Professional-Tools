import { useState, useEffect, useRef } from 'react';
import type { PbiDraft } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
}

export function WizardStep3p5BusinessRules({
  draft,
  onNext,
  onBack,
  onSave,
}: Props) {
  const [businessRules, setBusinessRules] = useState(
    draft.businessRulesAndAssumptions || ''
  );
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFieldBlur = () => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      onSave({ businessRulesAndAssumptions: businessRules });
    }, 500);
    setSaveTimer(timer);
  };

  const handleNext = () => {
    if (saveTimer) clearTimeout(saveTimer);
    onSave({ businessRulesAndAssumptions: businessRules });
    onNext(4);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="wizard-step" onKeyDown={handleKeyDown}>
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Business Rules & Assumptions</h2>
        <p className="wizard-step-description">
          Define specific criteria, conditions, and preconditions for story completion. This step is optional — you can skip it if not needed.
        </p>
      </div>

      <div className="wizard-field">
        <label htmlFor="businessRules" className="wizard-field-label">
          Business Rules & Assumptions (Optional)
        </label>
        <textarea
          id="businessRules"
          ref={textareaRef}
          className="wizard-field-textarea"
          placeholder="e.g. Only users with verified email can access this feature; Assumes payment gateway is already integrated; Data must be encrypted at rest..."
          value={businessRules}
          onChange={(e) => setBusinessRules(e.target.value)}
          onBlur={handleFieldBlur}
          rows={8}
          aria-describedby="businessRules-help"
        />
        <small id="businessRules-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          Include conditions, constraints, or assumptions that must be true for this story to be considered complete.
        </small>
      </div>

      <div className="wizard-actions">
        <button 
          className="wizard-btn wizard-btn-secondary" 
          onClick={() => onBack(2)}
          aria-label="Go back to previous step"
        >
          Back
        </button>
        <button 
          className="wizard-btn wizard-btn-primary" 
          onClick={handleNext}
          aria-label="Proceed to next step (Ctrl+Enter)"
        >
          Next
        </button>
      </div>
    </div>
  );
}
