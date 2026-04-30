import { useState } from 'react';
import type { BugReportInput } from '../types';

interface BugReportWizardProps {
  onGenerate: (input: BugReportInput) => void;
  onOpenInChat: (input: BugReportInput) => void;
}

const BUG_STEPS = [
  {
    key: 'where' as const,
    label: 'Where',
    title: 'What area, page, or component is affected?',
    placeholder: 'e.g. Guest payment checkout — loan verification page',
    invest: {
      hint: 'Independent',
      text: 'Can the fix be worked on without blocking other stories?',
    },
  },
  {
    key: 'reproduce' as const,
    label: 'Reproduce',
    title: 'What are the steps to reproduce this bug?',
    placeholder:
      '1. Navigate to checkout\n2. Enter loan number\n3. Click "Verify"\n4. Observe error message',
    invest: {
      hint: 'Negotiable',
      text: 'Are workarounds acceptable, or must it be fixed exactly this way?',
    },
  },
  {
    key: 'acceptance' as const,
    label: 'Acceptance',
    title: "What does 'fixed' look like? What are the acceptance criteria?",
    placeholder:
      'Given a valid loan number, when the user clicks Verify, then no error appears and the payment form advances.',
    invest: {
      hint: 'Testable',
      text: 'Can a tester verify the fix with these criteria?',
    },
  },
  {
    key: 'invest' as const,
    label: 'INVEST',
    title: 'INVEST Self-Check',
    placeholder: '',
    invest: { hint: '', text: '' },
  },
];

const INVEST_CELLS = [
  { key: 'independent' as const, letter: 'I', label: 'Independent' },
  { key: 'negotiable' as const, letter: 'N', label: 'Negotiable' },
  { key: 'valuable' as const, letter: 'V', label: 'Valuable' },
  { key: 'estimable' as const, letter: 'E', label: 'Estimable' },
  { key: 'small' as const, letter: 'S', label: 'Small' },
  { key: 'testable' as const, letter: 'T', label: 'Testable' },
];

export function BugReportWizard({ onGenerate, onOpenInChat }: BugReportWizardProps): JSX.Element {
  const [step, setStep] = useState(0);
  const [whereLocation, setWhereLocation] = useState('');
  const [howToReproduce, setHowToReproduce] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [invest, setInvest] = useState({
    independent: false,
    negotiable: false,
    valuable: false,
    estimable: false,
    small: false,
    testable: false,
  });
  const [expanded, setExpanded] = useState(true);

  const score = Object.values(invest).filter(Boolean).length;
  const currentStep = BUG_STEPS[step]!;

  const canNext = (): boolean => {
    if (step === 0) return whereLocation.trim().length > 0;
    if (step === 1) return howToReproduce.trim().length > 0;
    if (step === 2) return acceptanceCriteria.trim().length > 0;
    return true;
  };

  const toggleInvest = (key: keyof typeof invest): void => {
    setInvest((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = (): void => {
    onGenerate({ whereLocation, howToReproduce, acceptanceCriteria, ...invest });
  };

  const handleOpenChat = (): void => {
    onOpenInChat({ whereLocation, howToReproduce, acceptanceCriteria, ...invest });
  };

  return (
    <article className="card wizard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="wizard-icon" style={{ fontSize: '1.25rem' }}>🐛</span>
          <div>
            <h3 style={{ margin: 0 }}>Bug Report Wizard</h3>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Answer six guided questions — the agent builds a structured bug report using INVEST criteria.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {score > 0 && (
            <span className="chip info" title="INVEST self-check (6 = fully verified)">
              {score}/6 checked
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
            {BUG_STEPS.map((s, i) => (
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
                <span
                  className={`wizard-step-label${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="wizard-body">
            <div className="wizard-step-caption">Step {step + 1} of {BUG_STEPS.length}</div>

            <div className="wizard-question">
              <div className="wizard-question-title">{currentStep.title}</div>
            </div>

            {step === 0 && (
              <label className="field">
                Affected area
                <textarea
                  rows={3}
                  value={whereLocation}
                  onChange={(e) => setWhereLocation(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 1 && (
              <label className="field">
                Steps to reproduce
                <textarea
                  rows={4}
                  value={howToReproduce}
                  onChange={(e) => setHowToReproduce(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 2 && (
              <label className="field">
                Acceptance criteria (definition of fixed)
                <textarea
                  rows={3}
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
              </label>
            )}

            {step === 3 && (
              <blockquote className="wizard-preview" style={{ fontStyle: 'normal' }}>
                <div className="bug-preview-title">🐛 Bug Report</div>
                <div className="bug-preview-row">
                  <span className="bug-preview-label">Where:</span>
                  <span>{whereLocation}</span>
                </div>
                {howToReproduce && (
                  <div className="bug-preview-row">
                    <span className="bug-preview-label">Reproduce:</span>
                    <span>
                      {howToReproduce.slice(0, 80)}
                      {howToReproduce.length > 80 ? '…' : ''}
                    </span>
                  </div>
                )}
                {acceptanceCriteria && (
                  <div className="bug-preview-row">
                    <span className="bug-preview-label">Acceptance:</span>
                    <span>
                      {acceptanceCriteria.slice(0, 80)}
                      {acceptanceCriteria.length > 80 ? '…' : ''}
                    </span>
                  </div>
                )}
              </blockquote>
            )}

            {step < 3 && currentStep.invest.text && (
              <div className="invest-hint">
                <span className="chip info" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                  INVEST: {currentStep.invest.hint}
                </span>
                <span className="invest-hint-text">{currentStep.invest.text}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="action-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                ← Back
              </button>
              {step < BUG_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                >
                  Next →
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>

          {/* INVEST grid + actions — shown on final step */}
          {step === 3 && (
            <div className="wizard-summary">
              <div className="card-divider" />
              <div className="wizard-invest-grid">
                {INVEST_CELLS.map(({ key, letter, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`invest-cell ${invest[key] ? 'ok' : 'warn'}`}
                    onClick={() => toggleInvest(key)}
                    title={`Click to ${invest[key] ? 'uncheck' : 'check'} ${label}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="invest-letter">{letter}</span>
                    <span className="invest-label">{label}</span>
                    <span className="invest-status">{invest[key] ? '✓' : '⚠'}</span>
                  </button>
                ))}
              </div>
              <p className="hint" style={{ marginTop: 2 }}>
                Click each criterion to self-verify. ⚠ means unchecked — review before generating.
              </p>
              <div className="wizard-actions">
                <div className="wizard-action-item">
                  <button className="btn btn-primary wizard-btn-generate" onClick={handleGenerate}>
                    Generate bug report &amp; apply
                  </button>
                  <span className="hint">Applies structured bug report</span>
                </div>
                <div className="wizard-action-item">
                  <button className="btn wizard-btn-chat" onClick={handleOpenChat}>
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
