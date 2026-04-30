import { useState } from 'react';
import type { InvestWizardInput } from '../types';

interface Props {
  draftId: string;
  aiBusy: boolean;
  onGenerate: (wizard: InvestWizardInput) => void;
  onOpenInChat: (wizard: InvestWizardInput) => void;
  onSave?: (description: string, userStoryStatement: string, businessRulesAndAssumptions?: string) => void;
}

const STEPS = [
  {
    key: 'background' as const,
    label: 'Background',
    title: 'What is the context?',
    description: 'Describe the problem, opportunity, or situation this story addresses.',
    placeholder:
      'e.g. Currently, guest users cannot pay without creating an account, causing drop-offs at checkout.',
    invest: {
      hint: 'Independent',
      text: 'Focus on one self-contained problem. Avoid bundling multiple unrelated issues here.',
    },
  },
  {
    key: 'why' as const,
    label: 'Why',
    title: 'Why does this matter?',
    description: 'State the business value and the outcome this enables.',
    placeholder:
      'e.g. Reduces guest checkout abandonment by 20%, directly increasing loan application starts.',
    invest: {
      hint: 'Valuable',
      text: 'The "why" is your value statement. Make it concrete — avoid vague phrases like "improve UX".',
    },
  },
  {
    key: 'how' as const,
    label: 'How',
    title: 'How will it work?',
    description: 'Describe the user flow or the interaction from the user\'s perspective.',
    placeholder:
      'e.g. Guest taps "Pay as Guest", enters loan/account number + payment details, confirms, and sees a receipt.',
    invest: {
      hint: 'Estimable · Small',
      text: 'Keep the flow narrow enough to estimate in 1–5 days. If it reads like multiple features, split it.',
    },
  },
  {
    key: 'businessRules' as const,
    label: 'Business Rules',
    title: 'Business Rules & Assumptions',
    description: 'Define specific criteria, conditions, and preconditions for story completion. (Optional)',
    placeholder:
      'e.g. Only users with verified email can access this feature; Assumes payment gateway is already integrated; Data must be encrypted at rest...',
    invest: {
      hint: 'Testable',
      text: 'Clear business rules make acceptance criteria easier to write and help prevent scope creep.',
    },
  },
  {
    key: 'story' as const,
    label: 'User Story',
    title: 'Write the user story',
    description: 'Complete the story template. Be specific about the persona and the outcome.',
    invest: {
      hint: 'Negotiable · Testable',
      text: 'Stories are a conversation starter, not a contract. The "so that" anchors testability — it should be verifiable.',
    },
  },
];

function investScore(wizard: Partial<InvestWizardInput>): number {
  let score = 0;
  if (wizard.background && wizard.background.trim().length > 20) {
    score++;
  }
  if (wizard.why && wizard.why.trim().length > 20) {
    score++;
  }
  if (wizard.how && wizard.how.trim().length > 20) {
    score++;
  }
  if (wizard.persona && wizard.persona.trim().length > 3) {
    score++;
  }
  if (wizard.want && wizard.want.trim().length > 10) {
    score++;
  }
  if (wizard.benefit && wizard.benefit.trim().length > 10) {
    score++;
  }
  return score;
}

function isComplete(wizard: Partial<InvestWizardInput>): wizard is InvestWizardInput {
  return (
    Boolean(wizard.background?.trim()) &&
    Boolean(wizard.why?.trim()) &&
    Boolean(wizard.how?.trim()) &&
    Boolean(wizard.persona?.trim()) &&
    Boolean(wizard.want?.trim()) &&
    Boolean(wizard.benefit?.trim())
  );
}

export function UserStoryWizard({ draftId: _draftId, aiBusy, onGenerate, onOpenInChat, onSave }: Props): JSX.Element {
  const [step, setStep] = useState(0);
  const [background, setBackground] = useState('');
  const [why, setWhy] = useState('');
  const [how, setHow] = useState('');
  const [businessRules, setBusinessRules] = useState('');
  const [persona, setPersona] = useState('');
  const [want, setWant] = useState('');
  const [benefit, setBenefit] = useState('');
  const [expanded, setExpanded] = useState(true);

  const wizard: Partial<InvestWizardInput> = { 
    background, 
    why, 
    how, 
    persona, 
    want, 
    benefit,
    businessRulesAndAssumptions: businessRules 
  };
  const score = investScore(wizard);
  const complete = isComplete(wizard);

  const composedDescription = `As a ${persona}\nI want ${want}\nSo that ${benefit}`;

  const saveDescription = (): void => {
    if (complete && onSave) {
      onSave(composedDescription, composedDescription, businessRules.trim() || undefined);
    }
  };

  const currentStep = STEPS[step]!;

  const handleNext = (): void => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
    saveDescription();
  };

  const handleBack = (): void => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canNext = (): boolean => {
    if (step === 0) {
      return background.trim().length > 0;
    }
    if (step === 1) {
      return why.trim().length > 0;
    }
    if (step === 2) {
      return how.trim().length > 0;
    }
    if (step === 3) {
      // Business Rules step is optional
      return true;
    }
    return persona.trim().length > 0 && want.trim().length > 0 && benefit.trim().length > 0;
  };

  const handleGenerate = (): void => {
    if (complete) {
      saveDescription();
      onGenerate({ 
        background, 
        why, 
        how, 
        persona, 
        want, 
        benefit,
        businessRulesAndAssumptions: businessRules 
      });
    }
  };

  const handleOpenChat = (): void => {
    if (complete) {
      saveDescription();
      onOpenInChat({ 
        background, 
        why, 
        how, 
        persona, 
        want, 
        benefit,
        businessRulesAndAssumptions: businessRules 
      });
    }
  };

  return (
    <article className="card wizard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="wizard-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
          </span>
          <div>
            <h3 style={{ margin: 0 }}>User Story Wizard</h3>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Answer six guided questions — the agent builds your story using INVEST criteria.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {score > 0 && (
            <span className="chip info" title="INVEST completeness (6 = fully complete)">
              {score}/6 complete
            </span>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            {expanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Step progress rail */}
          <div className="wizard-steps">
            {STEPS.map((s, i) => (
              <div key={s.key} className="wizard-step-item">
                {i > 0 && (
                  <div className={`wizard-step-connector${i <= step ? ' filled' : ''}`} />
                )}
                <button
                  type="button"
                  className={`wizard-step-node${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
                  onClick={() => setStep(i)}
                  title={s.label}
                >
                  {i < step ? '✓' : i + 1}
                </button>
                <span className={`wizard-step-label${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="wizard-body">
            <div className="wizard-step-caption">Step {step + 1} of {STEPS.length}</div>

            <div className="wizard-question">
              <div className="wizard-question-title">{currentStep.title}</div>
              {currentStep.description && (
                <p className="card-subtitle" style={{ margin: '4px 0 0' }}>
                  {currentStep.description}
                </p>
              )}
            </div>

            {step === 0 && (
              <label className="field">
                Background
                <textarea
                  rows={3}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 1 && (
              <label className="field">
                Why / Business value
                <textarea
                  rows={3}
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 2 && (
              <label className="field">
                How / User flow
                <textarea
                  rows={3}
                  value={how}
                  onChange={(e) => setHow(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 3 && (
              <label className="field">
                Business Rules & Assumptions (Optional)
                <textarea
                  rows={4}
                  value={businessRules}
                  onChange={(e) => setBusinessRules(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
                <span className="hint" style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                  This step is optional. Skip if you don't have specific rules or constraints to document.
                </span>
              </label>
            )}

            {step === 4 && (
              <div className="wizard-story-inputs">
                <div className="wizard-story-field">
                  <span className="wizard-story-prefix">As a</span>
                  <input
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="e.g. guest user who needs to pay a loan without an account"
                    autoFocus
                  />
                </div>
                <div className="wizard-story-field">
                  <span className="wizard-story-prefix">I want</span>
                  <input
                    value={want}
                    onChange={(e) => setWant(e.target.value)}
                    placeholder="e.g. to submit a payment using only my account number"
                  />
                </div>
                <div className="wizard-story-field">
                  <span className="wizard-story-prefix">So that</span>
                  <input
                    value={benefit}
                    onChange={(e) => setBenefit(e.target.value)}
                    placeholder="e.g. I can complete the transaction without registering"
                  />
                </div>

                {persona.trim() && want.trim() && benefit.trim() && (
                  <blockquote className="wizard-preview">
                    <p>
                      "As a <strong>{persona}</strong>, I want <strong>{want}</strong>, so that{' '}
                      <strong>{benefit}</strong>."
                    </p>
                  </blockquote>
                )}
              </div>
            )}

            {/* INVEST hint — subtle, at bottom of body */}
            <div className="invest-hint">
              <span className="chip info" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                INVEST: {currentStep.invest.hint}
              </span>
              <span className="invest-hint-text">{currentStep.invest.text}</span>
            </div>

            {/* Navigation */}
            <div className="action-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleBack}
                disabled={step === 0}
              >
                ← Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleNext}
                  disabled={!canNext()}
                >
                  Next →
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>

          {/* Summary & actions — shown when all steps have input */}
          {complete && (
            <div className="wizard-summary">
              <div className="card-divider" />
              <div className="wizard-invest-grid">
                {[
                  { letter: 'I', label: 'Independent', ok: background.trim().length > 20 },
                  { letter: 'N', label: 'Negotiable', ok: true },
                  { letter: 'V', label: 'Valuable', ok: why.trim().length > 20 },
                  { letter: 'E', label: 'Estimable', ok: how.trim().length > 20 },
                  { letter: 'S', label: 'Small', ok: how.trim().length < 600 },
                  { letter: 'T', label: 'Testable', ok: benefit.trim().length > 10 },
                ].map(({ letter, label, ok }) => (
                  <div key={letter} className={`invest-cell ${ok ? 'ok' : 'warn'}`}>
                    <span className="invest-letter">{letter}</span>
                    <span className="invest-label">{label}</span>
                    <span className="invest-status">{ok ? '✓' : '⚠'}</span>
                  </div>
                ))}
              </div>
              <p className="hint" style={{ marginTop: 2 }}>
                INVEST is advisory — ⚠ means the answer may need more detail, not that it's wrong.
              </p>
              <div className="wizard-actions">
                <div className="wizard-action-item">
                  <button
                    className="btn btn-primary wizard-btn-generate"
                    disabled={aiBusy}
                    onClick={handleGenerate}
                  >
                    {aiBusy ? 'Generating…' : 'Generate full story & apply'}
                  </button>
                  <span className="hint">Applies title, ACs &amp; tests</span>
                </div>
                <div className="wizard-action-item">
                  <button
                    className="btn wizard-btn-chat"
                    disabled={aiBusy}
                    onClick={handleOpenChat}
                  >
                    Refine in Copilot Chat
                  </button>
                  <span className="hint">Collaborate before applying</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
