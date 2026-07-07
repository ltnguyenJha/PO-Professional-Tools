import { useState, useEffect, useRef } from 'react';
import type { PbiDraft, PbiAttachment } from '../types';

interface AiModelOption {
  id: string;
  name: string;
  family: string;
}

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
  onGenerate?: (modelFamily?: string) => void;
  isGenerating?: boolean;
  availableModels?: AiModelOption[];
}

export function WizardStep4Details({ draft, onNext, onBack, onSave, onGenerate, isGenerating = false, availableModels = [] }: Props) {
  const [technicalDetails, setTechnicalDetails] = useState(
    draft.technicalConsiderations?.technicalDetails || ''
  );
  const [scopedFiles, setScopedFiles] = useState<string[]>(
    draft.technicalConsiderations?.scopedFiles || []
  );
  const [newFile, setNewFile] = useState('');
  const [attachments, setAttachments] = useState<PbiAttachment[]>(draft.attachments || []);
  const [saveTimer, setSaveTimer] = useState<number | null>(null);
  const [selectedModelFamily, setSelectedModelFamily] = useState('');
  const [technicalDocument, setTechnicalDocument] = useState(draft.technicalDetailsDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when AI updates draft.technicalConsiderations from parent
  useEffect(() => {
    if (draft.technicalConsiderations?.technicalDetails !== undefined) {
      setTechnicalDetails(draft.technicalConsiderations.technicalDetails);
    }
  }, [draft.technicalConsiderations?.technicalDetails]);

  const savePayload = (
    overrides?: Partial<{ technicalDocument: typeof technicalDocument; attachments: PbiAttachment[] }>
  ) => ({
    technicalConsiderations: {
      technicalDetails,
      scopedFiles,
      architectureNotes: draft.technicalConsiderations?.architectureNotes ?? '',
    },
    attachments: overrides?.attachments ?? attachments,
    technicalDetailsDocument: overrides?.technicalDocument !== undefined
      ? overrides.technicalDocument
      : technicalDocument,
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

  const handleDocumentPick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      const newDoc = {
        id: `techDoc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        mimeType: file.type || (file.name.endsWith('.md') ? 'text/markdown' : 'application/pdf'),
        dataBase64: base64,
      };
      // Also queue in attachments so it gets uploaded when the ADO ticket is pushed
      const nextAttachments: PbiAttachment[] = [
        ...attachments.filter((a) => a.id !== technicalDocument?.id),
        { id: newDoc.id, fileName: newDoc.fileName, mimeType: newDoc.mimeType, dataBase64: newDoc.dataBase64 },
      ];
      setTechnicalDocument(newDoc);
      setAttachments(nextAttachments);
      onSave(savePayload({ technicalDocument: newDoc, attachments: nextAttachments }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDocumentRemove = () => {
    const nextAttachments = attachments.filter((a) => a.id !== technicalDocument?.id);
    setAttachments(nextAttachments);
    setTechnicalDocument(undefined);
    onSave(savePayload({ technicalDocument: undefined, attachments: nextAttachments }));
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {availableModels.length > 0 && (
                <select
                  className="wizard-select"
                  value={selectedModelFamily}
                  onChange={(e) => setSelectedModelFamily(e.target.value)}
                  disabled={isGenerating}
                  aria-label="Select AI model for generation"
                >
                  <option value="">Auto (best available)</option>
                  {availableModels.map((m) => (
                    <option key={m.family} value={m.family}>{m.name}</option>
                  ))}
                </select>
              )}
              <button
                className="wizard-btn wizard-btn-secondary"
                onClick={() => onGenerate(selectedModelFamily || undefined)}
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
            </div>
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

      {/* Reference Document */}
      <div className="wizard-field">
        <label className="wizard-field-label">
          Reference Document <span style={{ fontWeight: 'normal', color: 'var(--ink-muted)' }}>(optional)</span>
        </label>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--ink-muted)', margin: '0 0 var(--space-2)' }}>
          Attach a <strong>.md</strong> or <strong>.pdf</strong> file (e.g. design spec, architecture doc).
          The AI will use it when generating technical details, and it will be attached to the ADO ticket.
        </p>

        {technicalDocument ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-neutral-250)',
            borderRadius: 'var(--radius-2)',
            border: '1px solid var(--color-neutral-300)',
          }}>
            <span style={{ fontSize: '1rem' }}>
              {technicalDocument.mimeType === 'application/pdf' ? '📄' : '📝'}
            </span>
            <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', wordBreak: 'break-all' }}>
              {technicalDocument.fileName}
            </span>
            <button
              className="wizard-btn wizard-btn-secondary"
              onClick={handleDocumentRemove}
              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '12px', flexShrink: 0 }}
              title="Remove document"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <button
            className="wizard-btn wizard-btn-secondary"
            onClick={handleDocumentPick}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            📎 Attach document
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md"
          style={{ display: 'none' }}
          onChange={handleDocumentChange}
        />
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