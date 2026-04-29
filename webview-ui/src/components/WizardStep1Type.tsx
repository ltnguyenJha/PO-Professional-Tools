import { useState, useRef } from 'react';
import type { PbiDraft } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
}

export function WizardStep1Type({ draft, onNext }: Props) {
  const [selectedType, setSelectedType] = useState<'Feature' | 'Bug'>(
    (draft.workItemType === 'Bug' ? 'Bug' : 'Feature') as 'Feature' | 'Bug'
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleNext = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onNext(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showConfirmation) {
      setShowConfirmation(false);
    }
    if (e.key === 'Enter' && !showConfirmation) {
      handleNext();
    }
  };

  return (
    <div className="wizard-step" onKeyDown={handleKeyDown}>
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">What are you creating?</h2>
        <p className="wizard-step-description">
          Choose whether you're creating a new Feature or reporting a Bug. This choice sets the
          structure of the wizard steps.
        </p>
      </div>

      <div className="wizard-toggle-group" role="radiogroup" aria-label="Work item type selection">
        <button
          className={`wizard-toggle-button ${selectedType === 'Feature' ? 'selected' : ''}`}
          onClick={() => setSelectedType('Feature')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              setSelectedType('Bug');
            }
          }}
          role="radio"
          aria-checked={selectedType === 'Feature'}
          aria-label="Feature: New capability or enhancement"
        >
          <span>✨ Feature</span>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            New capability or enhancement
          </div>
        </button>
        <button
          className={`wizard-toggle-button ${selectedType === 'Bug' ? 'selected' : ''}`}
          onClick={() => setSelectedType('Bug')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              setSelectedType('Feature');
            }
          }}
          role="radio"
          aria-checked={selectedType === 'Bug'}
          aria-label="Bug: Issue or defect to fix"
        >
          <span>🐛 Bug</span>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            Issue or defect to fix
          </div>
        </button>
      </div>

      <div className="wizard-actions">
        <button 
          className="wizard-btn wizard-btn-primary" 
          onClick={handleNext}
          aria-label={`Proceed to next step: ${selectedType} configuration`}
        >
          Next
        </button>
      </div>

      {showConfirmation && (
        <div 
          className="wizard-dialog-overlay" 
          onClick={() => setShowConfirmation(false)}
          role="presentation"
        >
          <div 
            className="wizard-dialog" 
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
          >
            <h3 className="wizard-dialog-title" id="confirm-title">Confirm Your Choice</h3>
            <p className="wizard-dialog-description" id="confirm-description">
              You selected <strong>{selectedType}</strong>. This cannot be changed later. Continue?
            </p>
            <div className="wizard-dialog-actions">
              <button 
                className="wizard-btn wizard-btn-secondary" 
                onClick={() => setShowConfirmation(false)}
                aria-label="Cancel and return to selection"
              >
                Cancel
              </button>
              <button 
                className="wizard-btn wizard-btn-primary" 
                onClick={handleConfirm}
                ref={confirmButtonRef}
                autoFocus
                aria-label={`Confirm ${selectedType} selection and proceed`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
