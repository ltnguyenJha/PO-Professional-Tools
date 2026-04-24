import { useState } from 'react';
import type { InvestWizardInput } from '../types';

interface Props {
  draftId: string;
  aiBusy: boolean;
  onGenerate: (wizard: InvestWizardInput) => void;
  onOpenInChat: (wizard: InvestWizardInput) => void;
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

export function UserStoryWizard({ draftId: _draftId, aiBusy, onGenerate, onOpenInChat }: Props): JSX.Element {
  const [step, setStep] = useState(0);
  const [background, setBackground] = useState('');
  const [why, setWhy] = useState('');
  const [how, setHow] = useState('');
  const [persona, setPersona] = useState('');
  const [want, setWant] = useState('');
  const [benefit, setBenefit] = useState('');
  const [expanded, setExpanded] = useState(true);

  const wizard: Partial<InvestWizardInput> = { background, why, how, persona, want, benefit };
  const score = investScore(wizard);
  const complete = isComplete(wizard);

  const currentStep = STEPS[step]!;

  const handleNext = (): void => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
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
    return persona.trim().length > 0 && want.trim().length > 0 && benefit.trim().length > 0;
  };

  const handleGenerate = (): void => {
    if (complete) {
      onGenerate({ background, why, how, persona, want, benefit });
    }
  };

  const handleOpenChat = (): void => {
    if (complete) {
      onOpenInChat({ background, why, how, persona, want, benefit });
    }
  };

  return (
    <article className="card wizard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="wizard-icon">🧙</span>
          <div>
            <h3 style={{ margin: 0 }}>User Story Wizard</h3>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Answer four guided questions — the agent builds your story using INVEST criteria.
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
          {/* Step indicator */}
          <div className="wizard-steps">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={`wizard-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => setStep(i)}
                title={s.label}
              >
                <span className="wizard-step-num">{i < step ? '✓' : i + 1}</span>
                <span className="wizard-step-label">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="wizard-body">
            <div className="invest-hint">
              <span className="chip info" style={{ fontSize: '0.72rem' }}>
                INVEST: {currentStep.invest.hint}
              </span>
              <span className="invest-hint-text">{currentStep.invest.text}</span>
            </div>

            <div className="wizard-question">
              <strong>{currentStep.title}</strong>
              <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                {currentStep.description}
              </p>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="field">
                  As a…
                  <input
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="e.g. guest user who needs to pay a loan without an account"
                    autoFocus
                  />
                </label>
                <label className="field">
                  I want…
                  <input
                    value={want}
                    onChange={(e) => setWant(e.target.value)}
                    placeholder="e.g. to submit a payment using only my account number"
                  />
                </label>
                <label className="field">
                  So that…
                  <input
                    value={benefit}
                    onChange={(e) => setBenefit(e.target.value)}
                    placeholder="e.g. I can complete the transaction without registering"
                  />
                </label>

                {persona.trim() && want.trim() && benefit.trim() && (
                  <div className="wizard-preview">
                    <span className="chip success">Preview</span>
                    <p style={{ margin: '6px 0 0', fontStyle: 'italic', fontSize: '0.88rem' }}>
                      "As a <strong>{persona}</strong>, I want <strong>{want}</strong>, so that{' '}
                      <strong>{benefit}</strong>."
                    </p>
                  </div>
                )}
              </div>
            )}

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
                    <span className="invest-status">{ok ? '✓' : '?'}</span>
                  </div>
                ))}
              </div>
              <p className="hint" style={{ marginTop: 4 }}>
                INVEST is advisory — ? means the answer may need more detail, not that it's wrong.
              </p>
              <div className="action-row">
                <button
                  className="btn btn-primary"
                  disabled={aiBusy}
                  onClick={handleGenerate}
                >
                  {aiBusy ? 'Generating…' : 'Generate full story & apply'}
                </button>
                <button
                  className="btn"
                  disabled={aiBusy}
                  onClick={handleOpenChat}
                >
                  Refine in Copilot Chat
                </button>
              </div>
              <p className="hint">
                <strong>Generate full story</strong> applies title, description, acceptance criteria, and tests
                directly. <strong>Refine in Copilot Chat</strong> opens a guided conversation so you can
                collaborate before applying.
              </p>
            </div>
          )}
        </>
      )}
    </article>
  );
}
