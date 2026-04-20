import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AiSuggestion,
  AppStatePayload,
  BulkChildInput,
  ExtensionEvent,
  ThemePreference,
  WebviewRequest
} from './types';
import { Sidebar, type ViewId } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ThemeEffect } from './components/ThemeProvider';
import { DashboardView } from './views/DashboardView';
import { ProjectsView } from './views/ProjectsView';
import { PbiStudio } from './views/PbiStudio';
import { BulkBreakdownView } from './views/BulkBreakdownView';
import { SettingsView } from './views/SettingsView';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : undefined;

function sendMessage(message: WebviewRequest): void {
  vscode?.postMessage(message);
}

interface Toast {
  id: number;
  level: 'info' | 'error' | 'success';
  message: string;
}

const EMPTY_STATE: AppStatePayload = {
  projects: [],
  pbiDrafts: [],
  adoSettings: undefined,
  uiSettings: { theme: 'auto' },
  hasAdoPat: false
};

export function App(): JSX.Element {
  const [state, setState] = useState<AppStatePayload>(EMPTY_STATE);
  const [view, setView] = useState<ViewId>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [aiBusyDraftId, setAiBusyDraftId] = useState<string | undefined>(undefined);
  const [breakdownBusy, setBreakdownBusy] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Record<string, AiSuggestion>>({});
  const [suggestedChildren, setSuggestedChildren] = useState<BulkChildInput[] | undefined>();
  const [connectionResult, setConnectionResult] = useState<
    { ok: boolean; message: string } | undefined
  >();
  const [focusDraftId, setFocusDraftId] = useState<string | undefined>(undefined);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionEvent>) => {
      const message = event.data;
      switch (message.type) {
        case 'DRAFT_CREATED':
          setFocusDraftId(message.payload.draftId);
          return;
        case 'STATE_UPDATED':
          setState(message.payload);
          return;
        case 'TOAST':
          pushToast({ level: message.payload.level, message: message.payload.message });
          return;
        case 'AI_PROGRESS':
          if (message.payload.draftId) {
            setAiBusyDraftId(message.payload.busy ? message.payload.draftId : undefined);
          } else {
            setBreakdownBusy(message.payload.busy);
          }
          return;
        case 'AI_SUGGESTION_READY':
          setSuggestions((prev) => ({
            ...prev,
            [message.payload.draftId]: message.payload.suggestion
          }));
          return;
        case 'AI_BREAKDOWN_READY':
          setSuggestedChildren(message.payload.children);
          return;
        case 'ADO_CONNECTION_RESULT':
          setConnectionResult(message.payload);
          return;
        default:
          return;
      }
    };

    window.addEventListener('message', handler);
    sendMessage({ type: 'APP_READY' });
    return () => window.removeEventListener('message', handler);
  }, [pushToast]);

  const onThemeChange = useCallback((theme: ThemePreference) => {
    setState((prev) => ({ ...prev, uiSettings: { ...prev.uiSettings, theme } }));
    sendMessage({ type: 'SET_THEME', payload: { theme } });
  }, []);

  const dismissSuggestion = useCallback((draftId: string) => {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  }, []);

  const consumeSuggestedChildren = useCallback(() => {
    setSuggestedChildren(undefined);
  }, []);

  const header = useMemo(() => {
    switch (view) {
      case 'dashboard':
        return {
          title: 'Workspace',
          subtitle: 'Your PO workstation at a glance.',
          actions: (
            <>
              <button className="btn btn-primary" onClick={() => sendMessage({ type: 'IMPORT_PROJECT' })}>
                + Add Project
              </button>
            </>
          )
        };
      case 'projects':
        return {
          title: 'Projects',
          subtitle: 'Import, scan, generate, and prune.',
          actions: (
            <>
              <button className="btn btn-primary" onClick={() => sendMessage({ type: 'IMPORT_PROJECT' })}>
                + Add Project
              </button>
            </>
          )
        };
      case 'studio':
        return { title: 'PBI Studio', subtitle: 'Edit drafts. Refine with Copilot. Push to ADO.' };
      case 'bulk':
        return {
          title: 'Bulk Breakdown',
          subtitle: 'Split a big feature into many prefixed child items.'
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Azure DevOps connection, PAT, theme, and defaults.'
        };
      default:
        return { title: 'PO Tools' };
    }
  }, [view]);

  return (
    <div className="app">
      <ThemeEffect theme={state.uiSettings.theme} />

      <Sidebar
        active={view}
        theme={state.uiSettings.theme}
        onNavigate={setView}
        onThemeChange={onThemeChange}
      />

      <div className="main">
        <Topbar title={header.title} subtitle={header.subtitle} actions={header.actions} />

        {view === 'dashboard' && (
          <DashboardView state={state} onNavigate={(target) => setView(target)} />
        )}
        {view === 'projects' && (
          <ProjectsView projects={state.projects} send={sendMessage} />
        )}
        {view === 'studio' && (
          <PbiStudio
            state={state}
            suggestions={suggestions}
            aiBusyDraftId={aiBusyDraftId}
            focusDraftId={focusDraftId}
            onConsumedFocusDraft={() => setFocusDraftId(undefined)}
            send={sendMessage}
            onDismissSuggestion={dismissSuggestion}
          />
        )}
        {view === 'bulk' && (
          <BulkBreakdownView
            projects={state.projects}
            drafts={state.pbiDrafts}
            adoSettings={state.adoSettings}
            aiBusy={breakdownBusy}
            suggestedChildren={suggestedChildren}
            onConsumeSuggestion={consumeSuggestedChildren}
            send={sendMessage}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            adoSettings={state.adoSettings}
            hasAdoPat={state.hasAdoPat}
            theme={state.uiSettings.theme}
            send={sendMessage}
            onThemeChange={onThemeChange}
            lastConnectionResult={connectionResult}
          />
        )}
      </div>

      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item level-${toast.level}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
