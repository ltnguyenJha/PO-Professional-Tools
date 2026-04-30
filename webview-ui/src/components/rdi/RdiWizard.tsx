import { useEffect, useRef, useState } from 'react';
import { vscodeApi } from '../../utils/useVsCodeApi';
import type { RdiDraft } from '../../types';
import { RdiStepOverview } from './RdiStepOverview';
import { RdiStepPbiLinks } from './RdiStepPbiLinks';
import { RdiStepReleaseNotes } from './RdiStepReleaseNotes';
import { RdiStepDeployment } from './RdiStepDeployment';
import { RdiStepBackout } from './RdiStepBackout';
import { RdiStepDbChanges } from './RdiStepDbChanges';
import './rdi-wizard.css';

interface Props {
  draftId: string;
  onClose: () => void;
}

type StepName = 'Overview' | 'PBI Links' | 'Release Notes' | 'Deployment' | 'Backout' | 'DB Changes & Review';

const STEPS: StepName[] = [
  'Overview',
  'PBI Links',
  'Release Notes',
  'Deployment',
  'Backout',
  'DB Changes & Review',
];

export function RdiWizard({ draftId, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RdiDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const prevStep = useRef(-1);

  // Announce step changes for screen readers
  useEffect(() => {
    if (announcementRef.current && prevStep.current !== step) {
      announcementRef.current.textContent = `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`;
      prevStep.current = step;
    }
  }, [step]);

  // Bootstrap: load draft + default iteration
  useEffect(() => {
    setLoading(true);
    vscodeApi?.postMessage({ type: 'loadRdiDraft', id: draftId } as never);
    vscodeApi?.postMessage({ type: 'getDefaultIteration' } as never);
  }, [draftId]);

  // Message listener
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      switch (msg.type) {
        case 'rdiDraftLoaded':
        case 'rdiDraftCreated':
          setDraft(msg.draft as RdiDraft);
          setLoading(false);
          break;
        case 'rdiDraftSaved':
          setDraft((prev) => prev ? { ...prev, ...(msg.draft as RdiDraft) } : prev);
          break;
        case 'defaultIterationLoaded':
          setDraft((prev) =>
            prev && !prev.iterationPath
              ? { ...prev, iterationPath: msg.iterationPath as string }
              : prev
          );
          break;
        case 'rdiPushed':
          setDraft((prev) => prev ? { ...prev, status: 'pushed' } : prev);
          setIsPushing(false);
          break;
        case 'rdiError':
          setPushError(msg.message as string);
          setError(msg.message as string);
          setIsPushing(false);
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSave = (partial: Partial<RdiDraft>) => {
    if (!draft) return;
    const updated = { ...draft, ...partial };
    setDraft(updated);
    vscodeApi?.postMessage({ type: 'saveRdiDraft', draft: updated } as never);
  };

  const handlePush = () => {
    if (!draft) return;
    setIsPushing(true);
    setPushError(null);
    vscodeApi?.postMessage({ type: 'pushRdi', id: draft.id } as never);
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-xl)' }} role="status" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span className="rdi-spinner" aria-hidden="true" />
          Loading…
        </div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div style={{ padding: 'var(--space-xl)', color: 'var(--color-danger)' }} role="alert">
        {error}
      </div>
    );
  }

  if (!draft) return null;

  return (
    <>
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      <div className="wizard-container">
        {/* Back to list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="wizard-btn wizard-btn-secondary" onClick={onClose} style={{ fontSize: '12px' }}>
            ← Back to RDIs
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-450)' }}>
            {draft.workItemTitle || 'New RDI'}
          </span>
        </div>

        {/* Progress indicator */}
        <div
          className="wizard-progress"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="RDI wizard progress"
        >
          {STEPS.map((name, idx) => (
            <button
              key={idx}
              className={`wizard-progress-step ${idx === step ? 'active' : ''} ${idx < step ? 'completed' : ''} ${idx > step ? 'disabled' : ''}`}
              disabled={idx > step}
              onClick={() => idx <= step && setStep(idx)}
              aria-label={`Step ${idx + 1}: ${name}${idx < step ? ' (completed)' : idx === step ? ' (current)' : ''}`}
            >
              <div className="wizard-progress-step-indicator" aria-hidden="true">{idx + 1}</div>
              <div className="wizard-progress-step-label">{name}</div>
            </button>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <RdiStepOverview draft={draft} onNext={setStep} onSave={handleSave} />
        )}
        {step === 1 && (
          <RdiStepPbiLinks draft={draft} onNext={setStep} onBack={setStep} onSave={handleSave} />
        )}
        {step === 2 && (
          <RdiStepReleaseNotes draft={draft} onNext={setStep} onBack={setStep} onSave={handleSave} />
        )}
        {step === 3 && (
          <RdiStepDeployment draft={draft} onNext={setStep} onBack={setStep} onSave={handleSave} />
        )}
        {step === 4 && (
          <RdiStepBackout draft={draft} onNext={setStep} onBack={setStep} onSave={handleSave} />
        )}
        {step === 5 && (
          <RdiStepDbChanges
            draft={draft}
            onNext={setStep}
            onBack={setStep}
            onSave={handleSave}
            onPush={handlePush}
            isPushing={isPushing}
            pushError={pushError}
          />
        )}
      </div>

      <style>{`
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
