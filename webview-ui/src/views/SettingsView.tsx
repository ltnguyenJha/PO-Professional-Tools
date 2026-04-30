import { useEffect, useState } from 'react';
import type {
  AdoSettings,
  AdoSettingsInput,
  AdoWorkItemType,
  ThemePreference,
  WebviewRequest,
  ExtensionEvent
} from '../types';
import { WORK_ITEM_TYPES } from '../types';
import { DropdownWithFallback } from '../components/DropdownWithFallback';

interface Props {
  adoSettings?: AdoSettings;
  hasAdoPat: boolean;
  send: (message: WebviewRequest) => void;
  lastConnectionResult?: { ok: boolean; message: string };
}

interface DropdownState {
  teams: string[];
  teamsLoading: boolean;
  teamsError?: string;
  iterations: string[];
  iterationsLoading: boolean;
  iterationsError?: string;
}

interface PatValidationState {
  validated: boolean;
  validating: boolean;
  error?: string;
}

export function SettingsView({
  adoSettings,
  hasAdoPat,
  send,
  lastConnectionResult
}: Props): JSX.Element {
  const [form, setForm] = useState<AdoSettingsInput>({
    orgUrl: '',
    projectName: '',
    team: '',
    iterationPath: '',
    defaultWorkItemType: 'Product Backlog Item',
    pat: ''
  });
  const [editPat, setEditPat] = useState<boolean>(false);
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    teams: [],
    teamsLoading: false,
    iterations: [],
    iterationsLoading: false
  });
  const [patValidationState, setPatValidationState] = useState<PatValidationState>({
    validated: false,
    validating: false
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  const [openConnection, setOpenConnection] = useState<boolean>(true);
  const [openDefaults, setOpenDefaults] = useState<boolean>(true);

  // Load settings from adoSettings
  useEffect(() => {
    if (adoSettings) {
      setForm((existing) => ({
        ...existing,
        orgUrl: adoSettings.orgUrl ?? '',
        projectName: adoSettings.projectName ?? '',
        team: adoSettings.team ?? '',
        iterationPath: adoSettings.iterationPath ?? '',
        defaultWorkItemType: adoSettings.defaultWorkItemType ?? 'Product Backlog Item'
      }));
      // Reset dirty state when settings load
      setHasUnsavedChanges(false);
    }
  }, [adoSettings]);

  // Detect changes to form
  useEffect(() => {
    if (!adoSettings) {
      setHasUnsavedChanges(false);
      return;
    }
    
    const hasChanges =
      form.orgUrl !== (adoSettings.orgUrl ?? '') ||
      form.projectName !== (adoSettings.projectName ?? '') ||
      form.team !== (adoSettings.team ?? '') ||
      form.iterationPath !== (adoSettings.iterationPath ?? '') ||
      form.defaultWorkItemType !== (adoSettings.defaultWorkItemType ?? 'Product Backlog Item') ||
      (form.pat && form.pat.trim().length > 0);
    
    setHasUnsavedChanges(hasChanges);
  }, [form, adoSettings]);

  // On Settings tab load, if PAT exists, validate it
  useEffect(() => {
    if (hasAdoPat && !patValidationState.validated && !patValidationState.validating) {
      setPatValidationState((prev) => ({ ...prev, validating: true, error: undefined }));
      send({ type: 'VALIDATE_PAT_SCOPES' });
    }
  }, [hasAdoPat, send]);

  // Listen for dropdown and validation data from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionEvent>): void => {
      const message = event.data;
      if (message.type === 'PAT_VALIDATION_RESULT') {
        setPatValidationState({
          validated: message.payload.valid,
          validating: false,
          error: message.payload.valid ? undefined : message.payload.error
        });
      } else if (message.type === 'ADO_TEAMS_RESULT') {
        if (Array.isArray(message.payload)) {
          setDropdownState((prev) => ({
            ...prev,
            teams: message.payload as string[],
            teamsLoading: false,
            teamsError: undefined
          }));
        } else {
          setDropdownState((prev) => ({
            ...prev,
            teams: [],
            teamsLoading: false,
            teamsError: message.payload.error
          }));
        }
      } else if (message.type === 'ADO_ITERATIONS_RESULT') {
        if (Array.isArray(message.payload)) {
          setDropdownState((prev) => ({
            ...prev,
            iterations: message.payload as string[],
            iterationsLoading: false,
            iterationsError: undefined
          }));
        } else {
          setDropdownState((prev) => ({
            ...prev,
            iterations: [],
            iterationsLoading: false,
            iterationsError: message.payload.error
          }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch teams when project changes - ONLY if validated
  useEffect(() => {
    if (form.projectName.trim() && hasAdoPat && patValidationState.validated) {
      setDropdownState((prev) => ({
        ...prev,
        teamsLoading: true,
        teamsError: undefined,
        teams: []
      }));
      send({ type: 'FETCH_ADO_TEAMS' });
    }
  }, [form.projectName, hasAdoPat, patValidationState.validated, send]);

  // Fetch iterations when team changes - ONLY if validated
  useEffect(() => {
    if (form.team?.trim() && hasAdoPat && patValidationState.validated) {
      setDropdownState((prev) => ({
        ...prev,
        iterationsLoading: true,
        iterationsError: undefined,
        iterations: []
      }));
      send({ type: 'FETCH_ADO_ITERATIONS', payload: { team: form.team } });
    }
  }, [form.team, hasAdoPat, patValidationState.validated, send]);

  const save = (): void => {
    setSavingSettings(true);
    setSaveSuccess(false);
    const payload: AdoSettingsInput = {
      orgUrl: form.orgUrl.trim(),
      projectName: form.projectName.trim(),
      team: form.team?.trim() || undefined,
      iterationPath: form.iterationPath?.trim() || undefined,
      defaultWorkItemType: form.defaultWorkItemType
    };
    if (form.pat && form.pat.trim().length > 0) {
      payload.pat = form.pat.trim();
    }
    send({ type: 'SAVE_ADO_SETTINGS', payload });
    // After save, trigger validation automatically
    setPatValidationState({ validated: false, validating: true, error: undefined });
    send({ type: 'VALIDATE_PAT_SCOPES' });
    setEditPat(false);
    setForm((prev) => ({ ...prev, pat: '' }));
    
    // Show success feedback and clear dirty state
    setTimeout(() => {
      setSavingSettings(false);
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const handleProjectChange = (value: string): void => {
    setForm({
      ...form,
      projectName: value,
      team: '',
      iterationPath: ''
    });
    setDropdownState({
      teams: [],
      teamsLoading: false,
      iterations: [],
      iterationsLoading: false
    });
  };

  const handleTeamChange = (value: string): void => {
    setForm({
      ...form,
      team: value,
      iterationPath: ''
    });
    setDropdownState((prev) => ({
      ...prev,
      iterations: [],
      iterationsLoading: false
    }));
  };

  const handlePatEdit = (): void => {
    // Clear validation when PAT field is edited
    setPatValidationState({ validated: false, validating: false });
  };

  return (
    <div className="content">
      {/* Azure DevOps Connection Section */}
      <section className="card settings-section">
        <div className="section-header" onClick={() => setOpenConnection((o) => !o)}>
          <div>
            <h3 className="settings-section-title">Azure DevOps Connection</h3>
            <p className="settings-section-subtitle">Configure your Azure DevOps organization and project</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`status-badge ${hasAdoPat ? 'status-success' : 'status-warning'}`}>
              {hasAdoPat ? '✓ PAT Saved' : '⚠ PAT Missing'}
            </span>
            <span className={`section-chevron ${openConnection ? 'open' : ''}`}>▾</span>
          </div>
        </div>

        <div className={`section-body ${openConnection ? '' : 'collapsed'}`}>
        {/* PAT Validation Status Banner */}
        {hasAdoPat && (
          <div className="validation-status-container">
            {patValidationState.validating && (
              <div className="validation-banner validation-banner-info">
                <span className="validation-icon">⏳</span>
                <span>Validating PAT scopes...</span>
              </div>
            )}
            {patValidationState.validated && !patValidationState.error && !patValidationState.validating && (
              <div className="validation-banner validation-banner-success">
                <span className="validation-icon">✅</span>
                <span>PAT valid and ready for use</span>
              </div>
            )}
            {!patValidationState.validated && patValidationState.error && !patValidationState.validating && (
              <div className="validation-banner validation-banner-error">
                <span className="validation-icon">⚠️</span>
                <span>PAT validation failed: {patValidationState.error}</span>
              </div>
            )}
          </div>
        )}

        <div className="field-row">
          <label className="field">
            <span className="field-label">Organization URL</span>
            <input
              value={form.orgUrl}
              onChange={(e) => setForm({ ...form, orgUrl: e.target.value })}
              placeholder="https://dev.azure.com/your-org"
              className="smooth-input"
            />
          </label>
          <label className="field">
            <span className="field-label">Project Name</span>
            <input
              value={form.projectName}
              onChange={(e) => handleProjectChange(e.target.value)}
              placeholder="Your Project"
              className="smooth-input"
            />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span className="field-label">Personal Access Token</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <input
                  type="password"
                  value={form.pat ?? ''}
                  placeholder={hasAdoPat ? '•••••••••• (securely stored)' : 'Paste your PAT here'}
                  disabled={!editPat && hasAdoPat}
                  className="smooth-input"
                  onChange={(e) => {
                    setForm({ ...form, pat: e.target.value });
                    if (hasAdoPat && patValidationState.validated) {
                      handlePatEdit();
                    }
                  }}
                />
                {hasAdoPat && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditPat((v) => !v);
                      if (patValidationState.validated) {
                        handlePatEdit();
                      }
                    }}
                  >
                    {editPat ? 'Cancel' : 'Update'}
                  </button>
                )}
              </div>
              <small className="field-hint">
                Stored securely in VS Code Secret Storage. Never leaves your machine.
              </small>
            </div>
          </label>
        </div>

        <div className="action-row" style={{ marginTop: 16 }}>
          <button
            className="btn"
            type="button"
            disabled={
              !form.orgUrl.trim() ||
              !form.projectName.trim() ||
              (!hasAdoPat && !(form.pat?.trim()))
            }
            onClick={() =>
              send({
                type: 'TEST_ADO_CONNECTION',
                payload: {
                  orgUrl: form.orgUrl.trim(),
                  projectName: form.projectName.trim(),
                  pat: form.pat?.trim() || undefined
                }
              })
            }
          >
            Test Connection
          </button>
          {lastConnectionResult && (
            <span className={`chip ${lastConnectionResult.ok ? 'success' : 'danger'}`}>
              {lastConnectionResult.message}
            </span>
          )}
        </div>
        </div>
      </section>

      {/* Team & Defaults Section */}
      <section className="card settings-section">
        <div className="section-header" onClick={() => setOpenDefaults((o) => !o)}>
          <div>
            <h3 className="settings-section-title">Team & Defaults</h3>
            <p className="settings-section-subtitle">Configure team-specific settings and work item defaults</p>
          </div>
          <span className={`section-chevron ${openDefaults ? 'open' : ''}`}>▾</span>
        </div>

        <div className={`section-body ${openDefaults ? '' : 'collapsed'}`}>
        {/* First Row: Team and Iteration Path */}
        <div className="field-row">
          <DropdownWithFallback
            label="Team"
            value={form.team ?? ''}
            options={dropdownState.teams}
            loading={dropdownState.teamsLoading}
            error={dropdownState.teamsError}
            disabled={!form.projectName.trim() || !hasAdoPat}
            placeholder="Select team"
            helperText={
              !form.projectName.trim() || !hasAdoPat
                ? 'Save project and PAT first'
                : patValidationState.validating
                  ? 'Validating PAT...'
                  : !patValidationState.validated
                    ? 'PAT validation pending'
                    : undefined
            }
            onChange={handleTeamChange}
          />
          <DropdownWithFallback
            label="Iteration Path"
            value={form.iterationPath ?? ''}
            options={dropdownState.iterations}
            loading={dropdownState.iterationsLoading}
            error={dropdownState.iterationsError}
            disabled={!form.team?.trim()}
            placeholder="Select iteration"
            searchable={true}
            helperText={
              !form.team?.trim() 
                ? 'Select team first' 
                : undefined
            }
            onChange={(value) => setForm({ ...form, iterationPath: value })}
          />
        </div>

        {/* Second Row: Default Work Item Type (full width) */}
        <div className="field-row" style={{ marginTop: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <DropdownWithFallback
              label="Default Work Item Type"
              value={form.defaultWorkItemType ?? 'Product Backlog Item'}
              options={WORK_ITEM_TYPES}
              loading={false}
              disabled={false}
              placeholder="Select work item type"
              searchable={true}
              helperText="Used when creating new work items"
              onChange={(value) =>
                setForm({ ...form, defaultWorkItemType: value as AdoWorkItemType })
              }
            />
          </div>
        </div>
        </div>
      </section>

      {/* Save Settings Button - After Team & Defaults Section */}
      {(hasUnsavedChanges || saveSuccess) && (
        <div style={{ 
          marginTop: '24px',
          padding: '16px',
          background: 'var(--panel)',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            className={`btn btn-primary ${saveSuccess ? 'btn-success' : ''}`}
            onClick={save} 
            disabled={savingSettings}
          >
            {savingSettings ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Settings'}
          </button>
          {saveSuccess && (
            <span className="chip success">
              Settings saved successfully
            </span>
          )}
          {hasUnsavedChanges && !saveSuccess && (
            <small style={{ color: 'var(--ink-muted)' }}>
              You have unsaved changes
            </small>
          )}
        </div>
      )}
    </div>
  );
}
