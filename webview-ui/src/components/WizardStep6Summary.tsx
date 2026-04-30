import { useVsCodeApi } from '../utils/useVsCodeApi';
import type { PbiDraft } from '../types';

interface Props {
  draft: PbiDraft;
  onBack: (prevStep: number) => void;
  onFinish: () => void;
  isPushing?: boolean;
  adoUrl?: string;
}

function Row({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value?.trim()) return null;
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-neutral-450)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
      </div>
      <div style={{ color: 'var(--color-neutral-500)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}

function ListRow({ label, items }: { label: string; items: string[] | undefined }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-neutral-450)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-neutral-500)', lineHeight: 1.6 }}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

export function WizardStep6Summary({ draft, onBack, onFinish, isPushing = false, adoUrl }: Props) {
  const vscode = useVsCodeApi();
  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Summary</h2>
        <p className="wizard-step-description">
          Review everything before pushing to ADO. Go back to make any changes.
        </p>
      </div>

      {/* Success banner */}
      {adoUrl && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--success-soft)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-3)',
            marginBottom: 'var(--space-4)',
          }}
          role="status"
        >
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <div>
            <strong style={{ color: 'var(--success)' }}>Successfully pushed to ADO!</strong>
            <div style={{ marginTop: 'var(--space-1)' }}>
              <a
                href={adoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'underline', fontSize: '0.85rem' }}
                onClick={(e) => {
                  e.preventDefault();
                  vscode.postMessage({ type: 'OPEN_EXTERNAL', payload: { url: adoUrl } });
                }}
              >
                View in Azure DevOps →
              </a>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--color-neutral-200)',
          border: '1px solid var(--color-neutral-300)',
          borderRadius: 'var(--radius-2)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Row label="Title" value={draft.title} />
        <Row label="Description" value={draft.description} />
        <Row label="Why does this matter" value={draft.featureWhy} />
        <Row label="User flow" value={draft.featureUserFlow} />
        <Row label="Business rules & assumptions" value={draft.businessRulesAndAssumptions} />
        <Row label="User story statement" value={draft.userStoryStatement} />
        <Row label="Technical considerations" value={draft.technicalConsiderations?.technicalDetails} />
        <Row label="Architecture notes" value={draft.technicalConsiderations?.architectureNotes} />
        <ListRow label="Affected files" items={draft.technicalConsiderations?.scopedFiles} />
        <ListRow label="Acceptance criteria" items={draft.acceptanceCriteria} />
        <ListRow label="Test scenarios" items={draft.testScenarios} />

        {/* Empty state */}
        {!draft.title && !draft.description && (
          <p style={{ color: 'var(--color-neutral-450)', fontStyle: 'italic' }}>
            Nothing to preview yet — go back and fill in the wizard steps.
          </p>
        )}
      </div>

      <div className="wizard-actions">
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={() => onBack(4)}
          disabled={isPushing}
        >
          Back
        </button>
        {adoUrl ? (
          <button
            className="wizard-btn wizard-btn-secondary"
            onClick={() => onBack(4)}
          >
            ← Edit
          </button>
        ) : (
          <button
            className="wizard-btn wizard-btn-primary"
            onClick={onFinish}
            disabled={isPushing}
            aria-label={isPushing ? 'Pushing to ADO...' : 'Finish and push to ADO'}
          >
            {isPushing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 600ms linear infinite',
                }} />
                Pushing to ADO...
              </span>
            ) : 'Finish & Save'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
