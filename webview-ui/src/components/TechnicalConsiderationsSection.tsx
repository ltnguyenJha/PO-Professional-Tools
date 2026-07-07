import { useState, useRef } from 'react';
import type { PbiDraft, PbiAttachment, TechnicalConsiderations } from '../types';

interface TechnicalConsiderationsSectionProps {
  draft: PbiDraft;
  isLoading?: boolean;
  onUpdate?: (updatedDraft: PbiDraft) => void;
  onGenerate?: () => void;
}

export function TechnicalConsiderationsSection({
  draft,
  isLoading = false,
  onUpdate,
  onGenerate
}: TechnicalConsiderationsSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const techData: TechnicalConsiderations = {
    technicalDetails: draft.technicalConsiderations?.technicalDetails ?? '',
    scopedFiles: draft.technicalConsiderations?.scopedFiles ?? [],
    architectureNotes: draft.technicalConsiderations?.architectureNotes ?? ''
  };

  const handleFieldChange = (field: keyof TechnicalConsiderations, value: string | string[]): void => {
    const updated: PbiDraft = {
      ...draft,
      technicalConsiderations: {
        ...techData,
        [field]: value
      }
    };
    onUpdate?.(updated);
  };

  const toggleEdit = (): void => {
    setIsEditing(!isEditing);
  };

  const handleGenerate = (): void => {
    onGenerate?.();
  };

  const handleDocumentPick = (): void => {
    fileInputRef.current?.click();
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
        ...(draft.attachments ?? []).filter((a) => a.id !== draft.technicalDetailsDocument?.id),
        { id: newDoc.id, fileName: newDoc.fileName, mimeType: newDoc.mimeType, dataBase64: newDoc.dataBase64 },
      ];
      onUpdate?.({ ...draft, technicalDetailsDocument: newDoc, attachments: nextAttachments });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDocumentRemove = (): void => {
    const nextAttachments = (draft.attachments ?? []).filter(
      (a) => a.id !== draft.technicalDetailsDocument?.id
    );
    onUpdate?.({ ...draft, technicalDetailsDocument: undefined, attachments: nextAttachments });
  };

  return (
    <article className="card">
      <div className="section-header" onClick={() => setIsOpen((o) => !o)}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔧 Technical Considerations
            {isLoading && <span className="hint" style={{ fontSize: '0.75rem' }}>(generating...)</span>}
          </h3>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerate}
            disabled={isLoading}
            title="Generate technical considerations using AI"
          >
            {isLoading ? 'Generating...' : techData.technicalDetails || techData.scopedFiles.length > 0 || techData.architectureNotes ? 'Regenerate' : 'Generate'}
          </button>
          <button
            className="btn btn-sm"
            onClick={toggleEdit}
            disabled={isLoading}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
          <span className={`section-chevron ${isOpen ? 'open' : ''}`}>▾</span>
        </div>
      </div>

      <div className={`section-body ${isOpen ? '' : 'collapsed'}`}>
        {/* Reference document attachment */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>Reference Document</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginLeft: 8 }}>(optional — PDF or MD)</span>
          <div style={{ marginTop: 'var(--space-sm)' }}>
            {draft.technicalDetailsDocument ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'var(--color-neutral-100)',
                borderRadius: 'var(--radius-2)',
                border: '1px solid var(--color-neutral-300)',
                fontSize: '0.85rem',
              }}>
                <span>{draft.technicalDetailsDocument.mimeType === 'application/pdf' ? '📄' : '📝'}</span>
                <span style={{ flex: 1, wordBreak: 'break-all' }}>{draft.technicalDetailsDocument.fileName}</span>
                <button
                  className="btn btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleDocumentRemove(); }}
                  title="Remove document"
                  style={{ flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm"
                onClick={(e) => { e.stopPropagation(); handleDocumentPick(); }}
                title="Attach a PDF or Markdown file for AI context"
              >
                📎 Attach document
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md"
            style={{ display: 'none' }}
            onChange={handleDocumentChange}
          />
        </div>

        {isLoading && !isEditing ? (
          <div className="tech-loading-state">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner"></div>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
                AI is analyzing your codebase and generating technical guidance...
              </span>
            </div>
          </div>
        ) : isEditing ? (
          <div className="tech-edit-mode" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <label className="field">
              <strong style={{ color: 'var(--ink)' }}>Key Technical Details</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginTop: '4px' }}>
                Implementation specifics, tech stack choices, dependencies
              </span>
              <textarea
                value={techData.technicalDetails}
                onChange={(e) => handleFieldChange('technicalDetails', e.target.value)}
                placeholder="e.g. Implement using React Context for state management. Requires Node 18+. No breaking changes to existing APIs."
                style={{ marginTop: 'var(--space-sm)' }}
              />
            </label>

            <label className="field">
              <strong style={{ color: 'var(--ink)' }}>Scoped Files</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginTop: '4px' }}>
                Files affected by this work (one per line or comma-separated)
              </span>
              <textarea
                value={techData.scopedFiles.join('\n')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const files = raw.includes('\n')
                    ? raw.split('\n').map(f => f.trim()).filter(Boolean)
                    : raw.split(',').map(f => f.trim()).filter(Boolean);
                  handleFieldChange('scopedFiles', files);
                }}
                placeholder="e.g. src/components/Payment/index.tsx&#10;src/services/checkout.ts&#10;tests/checkout.spec.ts"
                style={{ marginTop: 'var(--space-sm)', minHeight: '120px' }}
              />
            </label>

            <label className="field">
              <strong style={{ color: 'var(--ink)' }}>Architecture Notes</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginTop: '4px' }}>
                Decisions, patterns, gotchas, and guidance for developers
              </span>
              <textarea
                value={techData.architectureNotes}
                onChange={(e) => handleFieldChange('architectureNotes', e.target.value)}
                placeholder="e.g. Use the shared PaymentContext, not Redux. See docs/PAYMENT_FLOW.md. Avoid direct DOM manipulation in components."
                style={{ marginTop: 'var(--space-sm)' }}
              />
            </label>
          </div>
        ) : (
          <div className="tech-view-mode" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {techData.technicalDetails && (
              <div>
                <h4 style={{ margin: '0 0 var(--space-sm)', color: 'var(--ink)' }}>Key Technical Details</h4>
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {techData.technicalDetails}
                </div>
              </div>
            )}

            {techData.scopedFiles.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 var(--space-sm)', color: 'var(--ink)' }}>Scoped Files</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {techData.scopedFiles.map((file, idx) => (
                    <li key={idx} style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {techData.architectureNotes && (
              <div>
                <h4 style={{ margin: '0 0 var(--space-sm)', color: 'var(--ink)' }}>Architecture Notes</h4>
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {techData.architectureNotes}
                </div>
              </div>
            )}

            {!techData.technicalDetails && techData.scopedFiles.length === 0 && !techData.architectureNotes && (
              <div className="hint">No technical considerations yet. Click "Edit" to add them, or generate them with AI.</div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
