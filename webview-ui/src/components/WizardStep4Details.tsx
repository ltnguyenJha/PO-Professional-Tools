import { useState, useEffect } from 'react';
import type { PbiDraft, PbiAttachment } from '../types';

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export function WizardStep4Details({ draft, onNext, onBack, onSave, onGenerate, isGenerating = false }: Props) {
  const [technicalDetails, setTechnicalDetails] = useState(
    draft.technicalConsiderations?.technicalDetails || ''
  );
  const [scopedFiles, setScopedFiles] = useState<string[]>(
    draft.technicalConsiderations?.scopedFiles || []
  );
  const [newFile, setNewFile] = useState('');
  const [attachments] = useState<PbiAttachment[]>(draft.attachments || []);
  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  // Sync when AI updates draft.technicalConsiderations from parent
  useEffect(() => {
    if (draft.technicalConsiderations?.technicalDetails !== undefined) {
      setTechnicalDetails(draft.technicalConsiderations.technicalDetails);
    }
  }, [draft.technicalConsiderations?.technicalDetails]);

  const savePayload = () => ({
    technicalConsiderations: {
      technicalDetails,
      scopedFiles,
      architectureNotes: draft.technicalConsiderations?.architectureNotes ?? '',
    },
    attachments,
  });

  const handleFieldBlur = () => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => { onSave(savePayload()); }, 500);
    setSaveTimer(timer);
  };

  const handleNext = () => {
    if (saveTimer) clearTimeout(saveTimer);
    onSave(savePayload());
    onNext(4);
  };

  const handleAddFile = () => {
    if (newFile.trim()) {
      setScopedFiles([...scopedFiles, newFile.trim()]);
      setNewFile('');
    }
  };

  const handleRemoveFile = (index: number) => {
    setScopedFiles(scopedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Technical Details</h2>
        <p className="wizard-step-description">
          Add technical considerations and affected files for this work item.
        </p>
      </div>

      {/* Technical Considerations */}
      <div className="wizard-field">
        <label htmlFor="technical" className="wizard-field-label">
          Technical Considerations
        </label>
        <textarea
          id="technical"
          className="wizard-field-textarea"
          placeholder="Implementation patterns, risk points, key design decisions..."
          value={technicalDetails}
          onChange={(e) => setTechnicalDetails(e.target.value)}
          onBlur={handleFieldBlur}
        />
        {onGenerate && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <button
              className="wizard-btn wizard-btn-secondary"
              onClick={onGenerate}
              disabled={isGenerating}
              aria-label={isGenerating ? 'Generating technical considerations...' : 'Generate technical considerations with AI'}
            >
              {isGenerating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 600ms linear infinite',
                  }} />
                  Generating...
                </span>
              ) : '✨ AI Generate'}
            </button>
            {isGenerating && (
              <p style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--ink-muted)',
                fontStyle: 'italic',
              }}>
                Scanning codebase and generating technical considerations — this may take a moment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Affected Files */}
      <div className="wizard-field">
        <label className="wizard-field-label">Affected Files</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            className="wizard-field-input"
            placeholder="e.g. src/components/Login.tsx"
            value={newFile}
            onChange={(e) => setNewFile(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFile()}
            onBlur={handleFieldBlur}
            style={{ flex: 1 }}
          />
          <button className="wizard-btn wizard-btn-secondary" onClick={handleAddFile}>
            Add
          </button>
        </div>
        {scopedFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {scopedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-neutral-250)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span>{file}</span>
                <button
                  className="wizard-btn wizard-btn-secondary"
                  onClick={() => handleRemoveFile(idx)}
                  style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(2)}>
          Back
        </button>
        <button className="wizard-btn wizard-btn-primary" onClick={handleNext}>
          Next
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}