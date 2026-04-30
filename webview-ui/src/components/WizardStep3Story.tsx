import { useState, useEffect, useRef } from 'react';
import type { PbiDraft } from '../types';
import './WizardStep3Story.css';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
  onGenerateAI?: () => void;
  onOpenInChat?: () => void;
}

type AiMode = 'Manual' | 'AI-Generated';

export function WizardStep3Story({
  draft,
  onNext,
  onBack,
  onSave,
  onGenerateAI,
  onOpenInChat,
}: Props) {
  const [aiMode, setAiMode] = useState<AiMode>('Manual');
  const [persona, setPersona] = useState('');
  const [want, setWant] = useState('');
  const [benefit, setBenefit] = useState('');
  const [investChecks, setInvestChecks] = useState({
    independent: false,
    negotiable: false,
    valuable: false,
    estimable: false,
    small: false,
    testable: false,
  });
  const [showAIToast, setShowAIToast] = useState(false);
  const [aiToastDismissed, setAiToastDismissed] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Debounce save on blur
  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  // Auto-focus first field when step loads
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Show AI toast once when AI mode is enabled for first time
  useEffect(() => {
    if (aiMode === 'AI-Generated' && !aiToastDismissed) {
      const hasSeenAIToast = localStorage.getItem('hasSeenAIToast');
      if (!hasSeenAIToast) {
        setShowAIToast(true);
        localStorage.setItem('hasSeenAIToast', 'true');
      }
    }
  }, [aiMode, aiToastDismissed]);

  const handleFieldBlur = () => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      onSave({
        description: `As a ${persona}\nI want ${want}\nSo that ${benefit}`,
      });
    }, 500);
    setSaveTimer(timer);
  };

  const handleNext = () => {
    // Cancel pending blur save and do immediate save on step advance
    if (saveTimer) clearTimeout(saveTimer);
    onSave({
      description: `As a ${persona}\nI want ${want}\nSo that ${benefit}`,
    });
    onNext(3);
  };

  const handleInvestToggle = (key: keyof typeof investChecks) => {
    setInvestChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const dismissAIToast = () => {
    setShowAIToast(false);
    setAiToastDismissed(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const storyPreview = `As a ${persona || '(role)'}\nI want ${want || '(feature)'}\nSo that ${benefit || '(benefit)'}`;

  const investKeys = [
    { key: 'independent', label: 'I', title: 'Independent' },
    { key: 'negotiable', label: 'N', title: 'Negotiable' },
    { key: 'valuable', label: 'V', title: 'Valuable' },
    { key: 'estimable', label: 'E', title: 'Estimable' },
    { key: 'small', label: 'S', title: 'Small' },
    { key: 'testable', label: 'T', title: 'Testable' },
  ] as const;

  return (
    <div className="wizard-step" onKeyDown={handleKeyDown}>
      {/* AI First-time Toast */}
      {showAIToast && (
        <div className="toast-container" role="alert" aria-live="assertive">
          <div className="toast-message">AI shortcuts enabled. Use Ctrl+Shift+P → Generate Story, or right-click any field to refine in Chat.</div>
          <button className="toast-dismiss" onClick={dismissAIToast}>Got it</button>
        </div>
      )}

      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Write Your Story</h2>
        <p className="wizard-step-description">
          Describe the work item using the user story format. Be specific about the persona, need,
          and value.
        </p>
      </div>

      {/* AI Mode Selector — at top of Story step (Decision #2) */}
      <div className="wizard-mode-selector">
        <label className="wizard-mode-selector-label">AI Mode</label>
        <div className="wizard-mode-toggle" role="radiogroup" aria-label="AI generation mode">
          <button
            className={`wizard-toggle-button ${aiMode === 'Manual' ? 'selected' : ''}`}
            onClick={() => setAiMode('Manual')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setAiMode('AI-Generated');
              }
            }}
            style={{ flex: 1 }}
            role="radio"
            aria-checked={aiMode === 'Manual'}
            aria-label="Manual story writing"
          >
            Manual
          </button>
          <button
            className={`wizard-toggle-button ${aiMode === 'AI-Generated' ? 'selected' : ''}`}
            onClick={() => setAiMode('AI-Generated')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setAiMode('Manual');
              }
            }}
            style={{ flex: 1 }}
            role="radio"
            aria-checked={aiMode === 'AI-Generated'}
            aria-label="AI-generated story writing"
          >
            AI-Generated
          </button>
        </div>
      </div>

      {/* Story inputs */}
      <div className="wizard-field">
        <label htmlFor="persona" className="wizard-field-label required">
          As a (role)
        </label>
        <input
          id="persona"
          ref={firstFieldRef}
          type="text"
          className="wizard-field-input"
          placeholder="e.g. Product Manager, Customer, Admin"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          onBlur={handleFieldBlur}
          aria-describedby="persona-help"
        />
        <small id="persona-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          Who is this story for?
        </small>
      </div>

      <div className="wizard-field">
        <label htmlFor="want" className="wizard-field-label required">
          I want (feature/capability)
        </label>
        <input
          id="want"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. to log in with single sign-on"
          value={want}
          onChange={(e) => setWant(e.target.value)}
          onBlur={handleFieldBlur}
          aria-describedby="want-help"
        />
        <small id="want-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          What feature do they need?
        </small>
      </div>

      <div className="wizard-field">
        <label htmlFor="benefit" className="wizard-field-label required">
          So that (value/benefit)
        </label>
        <input
          id="benefit"
          type="text"
          className="wizard-field-input"
          placeholder="e.g. I can access the system faster without remembering passwords"
          value={benefit}
          onChange={(e) => setBenefit(e.target.value)}
          onBlur={handleFieldBlur}
          aria-describedby="benefit-help"
        />
        <small id="benefit-help" style={{ color: 'var(--color-neutral-450)', fontSize: '0.75rem' }}>
          What value does it provide?
        </small>
      </div>

      {/* Story preview */}
      {(persona || want || benefit) && (
        <div className="wizard-story-preview" role="region" aria-label="Story preview">
          <p className="wizard-story-preview-text">{storyPreview}</p>
        </div>
      )}

      {/* INVEST checklist */}
      <div className="wizard-field">
        <label className="wizard-field-label">INVEST Checklist</label>
        <div className="wizard-invest-grid" role="group" aria-label="INVEST criteria checklist">
          {investKeys.map(({ key, label, title }) => (
            <label key={key} className="wizard-invest-checkbox" title={title}>
              <input
                type="checkbox"
                checked={investChecks[key]}
                onChange={() => handleInvestToggle(key)}
                aria-label={title}
              />
              <span className="wizard-invest-label">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI action buttons removed — now AI-Ready indicator */}
      {aiMode === 'AI-Generated' && (
        <div 
          className="ai-ready-indicator" 
          role="status" 
          aria-live="polite"
          title="Press Ctrl+Shift+P to generate, or right-click any field to refine"
        >
          <span className="ai-indicator-icon">✨</span>
          <span className="ai-indicator-text">AI-Ready</span>
        </div>
      )}

      <div className="wizard-actions">
        <button 
          className="wizard-btn wizard-btn-secondary" 
          onClick={() => onBack(1)}
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

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slide-in-top {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
