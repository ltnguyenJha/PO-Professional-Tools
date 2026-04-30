import { useState, useEffect, useRef } from 'react';
import { useVsCodeApi } from '../utils/useVsCodeApi';
import type { PbiDraft } from '../types';
import { WizardStep1Type } from './WizardStep1Type';
import { WizardStep2Identity } from './WizardStep2Identity';
import { WizardStep3Story } from './WizardStep3Story';
import { WizardStepFeatureDefinition } from './WizardStepFeatureDefinition';
import { WizardStep3p5BusinessRules } from './WizardStep3p5BusinessRules';
import { WizardStep4Details } from './WizardStep4Details';
import { WizardStep6TechnicalConsiderations } from './WizardStep6TechnicalConsiderations';

interface Props {
  draftId: string;
}

type StepName = 'Type' | 'Identity' | 'Story' | 'Feature Definition' | 'Business Rules' | 'Details' | 'Technical Considerations';

export function FeatureWizard({ draftId }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<PbiDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousStep, setPreviousStep] = useState(-1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const vscode = useVsCodeApi();
  const announcementRef = useRef<HTMLDivElement>(null);

  const steps: StepName[] = ['Type', 'Identity', 'Story', 'Feature Definition', 'Business Rules', 'Details', 'Technical Considerations'];

  // Announce step changes to screen readers
  useEffect(() => {
    if (announcementRef.current && currentStep >= 0 && previousStep !== currentStep) {
      const stepName = steps[currentStep];
      const message = `Step ${currentStep + 1} of ${steps.length}: ${stepName}`;
      announcementRef.current.textContent = message;
      announcementRef.current.setAttribute('role', 'status');
      announcementRef.current.setAttribute('aria-live', 'polite');
      announcementRef.current.setAttribute('aria-atomic', 'true');
      setPreviousStep(currentStep);
    }
  }, [currentStep, previousStep, steps]);

  // Listen for AI progress events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'AI_PROGRESS') {
        setAiGenerating(message.payload.busy);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load draft on mount
  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadDraft = () => {
      vscode.postMessage({
        type: 'WIZARD_DRAFT_LOAD',
        payload: { draftId },
      });
    };

    loadDraft();

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'WIZARD_DRAFT_LOADED') {
        const { draft: loadedDraft, currentStep: savedStep } = message.payload;
        setDraft(loadedDraft);
        setCurrentStep(savedStep || 0);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [draftId, vscode]);

  const handleStepChange = (nextStep: number) => {
    if (nextStep < 0 || nextStep > steps.length - 1) {
      setError('Invalid step');
      return;
    }

    vscode.postMessage({
      type: 'WIZARD_STEP_CHANGE',
      payload: { draftId, targetStep: nextStep },
    });

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'WIZARD_STEP_CHANGED') {
        const { currentStep: newStep, draft: updatedDraft } = message.payload;
        setCurrentStep(newStep);
        setDraft(updatedDraft);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  };

  const handleSave = (partialDraft: Partial<PbiDraft>) => {
    vscode.postMessage({
      type: 'WIZARD_DRAFT_SAVE',
      payload: {
        draftId,
        partialDraft,
        currentStep,
      },
    });
  };

  const handleGenerateAI = () => {
    vscode.postMessage({
      type: 'GENERATE_FULL_STORY_AI',
      payload: { draftId },
    });
  };

  const handleOpenInChat = () => {
    vscode.postMessage({
      type: 'OPEN_IN_COPILOT_CHAT',
      payload: { draftId, mode: 'refine' },
    });
  };

  const handleGenerateTechnicalConsiderations = () => {
    vscode.postMessage({
      type: 'GENERATE_TECHNICAL_CONSIDERATIONS',
      payload: { draftId },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-xl)' }} role="status" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            borderRadius: '50%', 
            border: '2px solid var(--accent)',
            borderTopColor: 'transparent',
            animation: 'spin 600ms linear infinite'
          }} />
          Loading wizard...
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div style={{ padding: 'var(--space-xl)', color: 'var(--danger)' }} role="alert">
        Error: {error || 'Draft not found'}
      </div>
    );
  }

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef} 
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <div className="wizard-container">
        {/* Progress indicator */}
        <div className="wizard-progress" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
          {steps.map((stepName, idx) => (
            <button
              key={idx}
              onClick={() => idx <= currentStep && handleStepChange(idx)}
              className={`wizard-progress-step ${idx === currentStep ? 'active' : ''} ${
                idx < currentStep ? 'completed' : ''
              } ${idx > currentStep || (draft.workItemType === 'Bug' && idx === 0) ? 'disabled' : ''}`}
              disabled={idx > currentStep || (draft.workItemType === 'Bug' && idx === 0)}
              aria-label={`Step ${idx + 1}: ${stepName}${idx < currentStep ? ' (completed)' : idx === currentStep ? ' (current)' : ''}`}
            >
              <div className="wizard-progress-step-indicator" aria-hidden="true">{idx + 1}</div>
              <div className="wizard-progress-step-label">{stepName}</div>
            </button>
          ))}
        </div>

        {/* Step content */}
        {currentStep === 0 && (
          <WizardStep1Type
            draft={draft}
            onNext={(next) => handleStepChange(next)}
          />
        )}
        {currentStep === 1 && (
          <WizardStep2Identity
            draft={draft}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
          />
        )}
        {currentStep === 2 && (
          <WizardStep3Story
            draft={draft}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
            onSave={handleSave}
            onGenerateAI={handleGenerateAI}
            onOpenInChat={handleOpenInChat}
          />
        )}
        {currentStep === 3 && (
          <WizardStepFeatureDefinition
            draft={draft}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
            onSave={handleSave}
          />
        )}
        {currentStep === 4 && (
          <WizardStep3p5BusinessRules
            draft={draft}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
            onSave={handleSave}
          />
        )}
        {currentStep === 5 && (
          <WizardStep4Details
            draft={draft}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
            onSave={handleSave}
          />
        )}
        {currentStep === 6 && (
          <WizardStep6TechnicalConsiderations
            draft={draft}
            isLoading={aiGenerating}
            onNext={(next) => handleStepChange(next)}
            onBack={(prev) => handleStepChange(prev)}
            onSave={handleSave}
            onGenerate={handleGenerateTechnicalConsiderations}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </>
  );
}
