import { useEffect, useState } from 'react';
import type {
  AdoSettings,
  AdoSettingsInput,
  AdoWorkItemType,
  ThemePreference,
  WebviewRequest
} from '../types';
import { WORK_ITEM_TYPES } from '../types';

interface Props {
  adoSettings?: AdoSettings;
  hasAdoPat: boolean;
  theme: ThemePreference;
  send: (message: WebviewRequest) => void;
  onThemeChange: (theme: ThemePreference) => void;
  lastConnectionResult?: { ok: boolean; message: string };
}

export function SettingsView({
  adoSettings,
  hasAdoPat,
  theme,
  send,
  onThemeChange,
  lastConnectionResult
}: Props): JSX.Element {
  const [form, setForm] = useState<AdoSettingsInput>({
    orgUrl: '',
    projectName: '',
    areaPath: '',
    iterationPath: '',
    defaultWorkItemType: 'Product Backlog Item',
    pat: ''
  });
  const [editPat, setEditPat] = useState<boolean>(false);

  useEffect(() => {
    if (adoSettings) {
      setForm((existing) => ({
        ...existing,
        orgUrl: adoSettings.orgUrl ?? '',
        projectName: adoSettings.projectName ?? '',
        areaPath: adoSettings.areaPath ?? '',
        iterationPath: adoSettings.iterationPath ?? '',
        defaultWorkItemType: adoSettings.defaultWorkItemType ?? 'Product Backlog Item'
      }));
    }
  }, [adoSettings]);

  const save = (): void => {
    const payload: AdoSettingsInput = {
      orgUrl: form.orgUrl.trim(),
      projectName: form.projectName.trim(),
      areaPath: form.areaPath?.trim() || undefined,
      iterationPath: form.iterationPath?.trim() || undefined,
      defaultWorkItemType: form.defaultWorkItemType
    };
    // Always persist a non-empty PAT from the field (first-time save). When a PAT is already
    // stored, the field is disabled until "Update"; editPat is not required for that case.
    if (form.pat && form.pat.trim().length > 0) {
      payload.pat = form.pat.trim();
    }
    send({ type: 'SAVE_ADO_SETTINGS', payload });
    setEditPat(false);
    setForm((prev) => ({ ...prev, pat: '' }));
  };

  return (
    <div className="content">
      <section className="card">
        <div className="card-header">
          <h3>Azure DevOps</h3>
          <span className={`chip ${hasAdoPat ? 'success' : 'warning'}`}>
            {hasAdoPat ? 'PAT saved' : 'PAT missing'}
          </span>
        </div>
        <p className="card-subtitle">
          These fields are used when pushing work items. The PAT is stored in VS Code Secret
          Storage; it never leaves your machine.
        </p>
        <div className="field-row">
          <label className="field">
            Organization URL
            <input
              value={form.orgUrl}
              onChange={(e) => setForm({ ...form, orgUrl: e.target.value })}
              placeholder="https://dev.azure.com/your-org"
            />
          </label>
          <label className="field">
            Project
            <input
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              placeholder="Project Name"
            />
          </label>
          <label className="field">
            Area Path (optional)
            <input
              value={form.areaPath ?? ''}
              onChange={(e) => setForm({ ...form, areaPath: e.target.value })}
              placeholder="Project\\Area"
            />
          </label>
          <label className="field">
            Iteration Path
            <input
              value={form.iterationPath ?? ''}
              onChange={(e) => setForm({ ...form, iterationPath: e.target.value })}
              placeholder="Project\\Iteration\\Sprint 1"
            />
          </label>
          <label className="field">
            Default Work Item Type
            <select
              value={form.defaultWorkItemType ?? 'Product Backlog Item'}
              onChange={(e) =>
                setForm({ ...form, defaultWorkItemType: e.target.value as AdoWorkItemType })
              }
            >
              {WORK_ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Personal Access Token
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="password"
                value={form.pat ?? ''}
                placeholder={hasAdoPat ? '•••••••••• (saved)' : 'Paste PAT to save'}
                disabled={!editPat && hasAdoPat}
                onChange={(e) => setForm({ ...form, pat: e.target.value })}
              />
              {hasAdoPat && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditPat((v) => !v)}
                >
                  {editPat ? 'Cancel' : 'Update'}
                </button>
              )}
            </div>
          </label>
        </div>

        <div className="action-row" style={{ marginTop: 6 }}>
          <button className="btn btn-primary" onClick={save}>
            Save Settings
          </button>
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
        <p className="hint" style={{ marginTop: 10 }}>
          Test uses the <strong>Organization URL</strong> and <strong>Project</strong> shown above. You
          can test <strong>before</strong> saving: paste a PAT in the field (or click <strong>Update</strong>{' '}
          if one is already stored), then Test Connection. Trailing slashes on the org URL are trimmed
          automatically.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Appearance</h3>
        </div>
        <p className="card-subtitle">Choose a theme for the dashboard.</p>
        <div className="tabs" role="group" aria-label="Theme">
          {(['light', 'dark', 'auto'] as const).map((option) => (
            <button
              key={option}
              aria-pressed={theme === option}
              onClick={() => onThemeChange(option)}
            >
              {option === 'auto' ? 'Auto (follow VS Code)' : option === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
