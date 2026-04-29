import { useState, useEffect, useRef } from 'react';
import type { PbiDraft, AdoWorkItemType } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
}

export function WizardStep2Identity({ draft, onNext, onBack }: Props) {
  const [selectedType, setSelectedType] = useState<AdoWorkItemType>(
    draft.workItemType || 'User Story'
  );
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const identityOptions: { value: AdoWorkItemType; label: string; description: string }[] = [
    {
      value: 'Epic',
      label: 'Epic',
      description: 'Large initiative spanning multiple stories (roadmap level)',
    },
    {
      value: 'Feature',
      label: 'Feature',
      description: 'Major feature or capability requiring multiple stories',
    },
    {
      value: 'User Story',
      label: 'User Story',
      description: 'Single story to implement in one sprint (typical work item)',
    },
  ];

  useEffect(() => {
    // Auto-focus first radio button when step loads
    firstFieldRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' && index < identityOptions.length - 1) {
      e.preventDefault();
      setSelectedType(identityOptions[index + 1].value);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      setSelectedType(identityOptions[index - 1].value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleNext = () => {
    onNext(2);
  };

  const selectedIndex = identityOptions.findIndex(opt => opt.value === selectedType);

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">What type of work item?</h2>
        <p className="wizard-step-description">
          Classify your work item to set the scope and hierarchy level.
        </p>
      </div>

      <div className="wizard-radio-group" role="radiogroup" aria-label="Work item type classification">
        {identityOptions.map((option, index) => (
          <label key={option.value} className="wizard-radio-option">
            <input
              type="radio"
              name="identity"
              value={option.value}
              checked={selectedType === option.value}
              onChange={() => setSelectedType(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={index === 0 ? firstFieldRef : null}
              aria-describedby={`identity-${option.value}-description`}
            />
            <div className="wizard-radio-label">
              <p className="wizard-radio-label-title">{option.label}</p>
              <p 
                className="wizard-radio-label-description"
                id={`identity-${option.value}-description`}
              >
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="wizard-actions">
        <button 
          className="wizard-btn wizard-btn-secondary" 
          onClick={() => onBack(0)}
          aria-label="Go back to previous step"
        >
          Back
        </button>
        <button 
          className="wizard-btn wizard-btn-primary" 
          onClick={handleNext}
          aria-label={`Proceed to next step with ${selectedType} selected`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
