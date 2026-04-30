import { useState, useEffect, useRef } from 'react';
import type { PbiDraft } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
  onGenerateAI?: () => void;
}

export function WizardStepFeatureDefinition({
  draft,
  onNext,
  onBack,
  onSave,
  onGenerateAI,
}: Props) {
  const [featureWhy, setFeatureWhy] = useState(draft.featureWhy || '');
  const [featureUserFlow, setFeatureUserFlow] = useState(draft.featureUserFlow || '');
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus first field when step loads
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const handleFieldBlur = () => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      onSave({
        featureWhy,
        featureUserFlow,
      });
    }, 500);
    setSaveTimer(timer);
  };

  const handleNext = () => {
    // Cancel pending blur save and do immediate save on step advance
    if (saveTimer) clearTimeout(saveTimer);
    onSave({
      featureWhy,
      featureUserFlow,
    });
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
        <h2 className="wizard-step-title">Feature Definition</h2>
        <p className="wizard-step-description">
          Define the feature context with two essential questions. This helps align the team on the feature's purpose and user flow. All fields are optional.
        </p>
        {onGenerateAI && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <button
              className="wizard-btn wizard-btn-secondary"
              onClick={onGenerateAI}
              aria-label="Generate feature definition with AI"
            >
              ✨ AI-Generated
            </button>
          </div>
        )}
      </div>

      <div className="wizard-field">
        <label htmlFor="featureWhy" className="wizard-field-label">
          Why does this matter?
        </label>
        <textarea
          id="featureWhy"
          ref={firstFieldRef}
          className="wizard-field-textarea"
          placeholder="e.g. This feature reduces support tickets by 30% and improves user satisfaction with payment processing..."
          value={featureWhy}
          onChange={(e) => setFeatureWhy(e.target.value)}
          onBlur={handleFieldBlur}
          rows={6}
          aria-describedby="featureWhy-help"
        />
        <small id="featureWhy-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          Explain the business impact and strategic importance. Aim for 200–500 characters.
        </small>
      </div>

      <div className="wizard-field">
        <label htmlFor="featureUserFlow" className="wizard-field-label">
          Describe the user flow
        </label>
        <textarea
          id="featureUserFlow"
          className="wizard-field-textarea"
          placeholder="e.g. 1. User navigates to dashboard\n2. Clicks 'New Payment'\n3. Selects payment method\n4. Enters amount and confirms\n5. Receives confirmation notification"
          value={featureUserFlow}
          onChange={(e) => setFeatureUserFlow(e.target.value)}
          onBlur={handleFieldBlur}
          rows={6}
          aria-describedby="featureUserFlow-help"
        />
        <small id="featureUserFlow-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          Outline the step-by-step user journey through this feature. Be specific about touchpoints and interactions.
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
