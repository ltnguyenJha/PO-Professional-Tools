import { useState } from 'react';
import type { PbiDraft, PbiAttachment } from '../types';

interface TestCase {
  id: string;
  description: string;
  expected: string;
  actual: string;
}

interface Props {
  draft: PbiDraft;
  onNext: (nextStep: number) => void;
  onBack: (prevStep: number) => void;
  onSave: (partialDraft: Partial<PbiDraft>) => void;
}

export function WizardStep4Details({ draft, onNext, onBack, onSave }: Props) {
  const [technicalDetails, setTechnicalDetails] = useState(
    draft.technicalConsiderations?.technicalDetails || ''
  );
  const [scopedFiles, setScopedFiles] = useState(
    draft.technicalConsiderations?.scopedFiles || []
  );
  const [newFile, setNewFile] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', description: '', expected: '', actual: '' },
  ]);
  const [attachments, setAttachments] = useState<PbiAttachment[]>(draft.attachments || []);

  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  const handleFieldBlur = () => {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      onSave({
        technicalConsiderations: {
          technicalDetails,
          scopedFiles,
          architectureNotes: '',
        },
        testScenarios: testCases.map((tc) => `${tc.description} → ${tc.expected}`),
        attachments,
      });
    }, 500);
    setSaveTimer(timer);
  };

  const handleNext = () => {
    if (saveTimer) clearTimeout(saveTimer);
    onSave({
      technicalConsiderations: {
        technicalDetails,
        scopedFiles,
        architectureNotes: '',
      },
      testScenarios: testCases.map((tc) => `${tc.description} → ${tc.expected}`),
      attachments,
    });
    onNext(4); // Would go to summary or submit
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

  const handleUpdateTestCase = (id: string, field: keyof TestCase, value: string) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      { id: String(Date.now()), description: '', expected: '', actual: '' },
    ]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases(testCases.filter((tc) => tc.id !== id));
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Technical Details</h2>
        <p className="wizard-step-description">
          Add technical considerations, affected files, and test cases for this work item.
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
      </div>

      {/* Scoped Files */}
      <div className="wizard-field">
        <label className="wizard-field-label">Affected Files</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            className="wizard-field-input"
            placeholder="e.g. src/components/Login.tsx"
            value={newFile}
            onChange={(e) => setNewFile(e.target.value)}
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

      {/* Test Cases */}
      <div className="wizard-field">
        <label className="wizard-field-label">Test Cases</label>
        <table className="wizard-test-cases-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Expected Result</th>
              <th>Actual Result</th>
              <th style={{ width: '80px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id}>
                <td>
                  <input
                    type="text"
                    className="wizard-test-cases-input"
                    placeholder="What are you testing?"
                    value={tc.description}
                    onChange={(e) => handleUpdateTestCase(tc.id, 'description', e.target.value)}
                    onBlur={handleFieldBlur}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="wizard-test-cases-input"
                    placeholder="What should happen?"
                    value={tc.expected}
                    onChange={(e) => handleUpdateTestCase(tc.id, 'expected', e.target.value)}
                    onBlur={handleFieldBlur}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="wizard-test-cases-input"
                    placeholder="What actually happened?"
                    value={tc.actual}
                    onChange={(e) => handleUpdateTestCase(tc.id, 'actual', e.target.value)}
                    onBlur={handleFieldBlur}
                  />
                </td>
                <td>
                  <button
                    className="wizard-btn wizard-btn-secondary"
                    onClick={() => handleRemoveTestCase(tc.id)}
                    style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={handleAddTestCase}
          style={{ marginTop: 'var(--space-3)' }}
        >
          Add Test Case
        </button>
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn-secondary" onClick={() => onBack(2)}>
          Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={() => {
            if (saveTimer) clearTimeout(saveTimer);
            onSave({
              technicalConsiderations: {
                technicalDetails,
                scopedFiles,
                architectureNotes: '',
              },
              testScenarios: testCases.map((tc) => `${tc.description} → ${tc.expected}`),
              attachments,
            });
            onNext(4); // Submit/complete
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
