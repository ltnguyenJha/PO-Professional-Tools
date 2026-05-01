import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdoProgressPayload,
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
import { FeatureCreationWizard } from './views/FeatureCreationWizard';
import { EpicCreationWizard } from './views/EpicCreationWizard';
import { SettingsView } from './views/SettingsView';
import { RdiTab } from './components/rdi/RdiTab';

import { vscodeApi } from './utils/useVsCodeApi';

function sendMessage(message: WebviewRequest): void {
  vscodeApi?.postMessage(message);
}

interface Toast {
  id: number;
  level: 'info' | 'error' | 'success';
  message: string;
}

const EMPTY_STATE: AppStatePayload = {
  projects: [],
  linkTargets: [],
  pbiDrafts: [],
  rdiDrafts: [],
  featureDrafts: [],
  epicDrafts: [],
  adoSettings: undefined,
  uiSettings: { theme: 'auto' },
  hasAdoPat: false
};

const EMPTY_ADO_PROGRESS: AdoProgressPayload = {
  busy: false,
  message: '',
  scope: 'single'
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
  const [focusEpicId, setFocusEpicId] = useState<string | undefined>(undefined);
  const [focusFeatureId, setFocusFeatureId] = useState<string | undefined>(undefined);
  const [adoProgress, setAdoProgress] = useState<AdoProgressPayload>(EMPTY_ADO_PROGRESS);
  const [featureGeneratedPbiIds, setFeatureGeneratedPbiIds] = useState<string[] | undefined>();
  const [featurePushProgress, setFeaturePushProgress] = useState<{
    featureId: string; phase: 'feature' | 'children'; current: number; total: number; message: string;
  } | null>(null);
  const [featurePushResult, setFeaturePushResult] = useState<{
    featureId: string; adoWorkItemId?: number; childAdoIds: Record<string, number>; hierarchyStatus: import('./types').HierarchyStatus;
  } | null>(null);
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
        case 'ADO_PROGRESS':
          setAdoProgress(
            message.payload.busy
              ? message.payload
              : { ...EMPTY_ADO_PROGRESS, scope: message.payload.scope }
          );
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
        case 'FEATURE_DRAFT_CREATED':
          pushToast({ level: 'success', message: 'Feature draft created.' });
          return;
        case 'FEATURE_DRAFT_UPDATED':
          return;
        case 'USER_STORIES_GENERATED':
          setFeatureGeneratedPbiIds(message.payload.generatedDraftIds);
          return;
        case 'FEATURE_PUSH_PROGRESS':
          setFeaturePushProgress(message.payload);
          return;
        case 'FEATURE_PUSHED':
          setFeaturePushResult(message.payload);
          setFeaturePushProgress(null);
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

  const navigateToStudio = useCallback((draftId?: string) => {
    if (draftId) setFocusDraftId(draftId);
    setView('studio');
  }, []);

  const navigateToEpicCreation = useCallback((epicId?: string) => {
    setFocusEpicId(epicId);
    setView('epic-creation');
  }, []);

  const navigateToFeatureCreation = useCallback((featureId?: string) => {
    setFocusFeatureId(featureId);
    setView('bulk');
  }, []);

  const header = useMemo(() => {
    switch (view) {
      case 'dashboard':
        return {
          title: 'Workspace',
          subtitle: 'Your PO workstation at a glance.',
          actions: (
            <>
              <button type="button" className="btn btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] transition-colors duration-200" onClick={() => sendMessage({ type: 'IMPORT_PROJECT' })}>
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
              <button type="button" className="btn btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder)] transition-colors duration-200" onClick={() => sendMessage({ type: 'IMPORT_PROJECT' })}>
                + Add Project
              </button>
            </>
          )
        };
      case 'studio':
        return { title: 'PBI Studio', subtitle: 'Edit drafts. Refine with Copilot. Push to ADO.' };
      case 'bulk':
        return {
          title: 'Feature Creation',
          subtitle: 'AI-driven feature decomposition into Product Backlog Items.'
        };
      case 'epic-creation':
        return {
          title: 'Epic Creation',
          subtitle: 'Define a strategic initiative and generate linked Features.'
        };
      case 'rdis':
        return { title: 'RDIs', subtitle: 'Create and manage Release Deployment Items.' };
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
          <DashboardView
            state={state}
            onNavigate={(target) => setView(target)}
            onNavigateToStudio={navigateToStudio}
            onNavigateToEpicCreation={navigateToEpicCreation}
            onNavigateToFeatureCreation={navigateToFeatureCreation}
          />
        )}
        {view === 'projects' && (
          <ProjectsView projects={state.projects} adoProgress={adoProgress} send={sendMessage} />
        )}
        {view === 'studio' && (
          <PbiStudio
            state={state}
            suggestions={suggestions}
            aiBusyDraftId={aiBusyDraftId}
            adoProgress={adoProgress}
            focusDraftId={focusDraftId}
            onConsumedFocusDraft={() => setFocusDraftId(undefined)}
            send={sendMessage}
            onDismissSuggestion={dismissSuggestion}
          />
        )}
        {view === 'bulk' && (
          <FeatureCreationWizard
            appState={state}
            send={sendMessage}
            onNavigate={(v) => { setFocusFeatureId(undefined); setView(v); }}
            onEditInStudio={navigateToStudio}
            generatedPbiIds={featureGeneratedPbiIds}
            onClearGeneratedPbiIds={() => setFeatureGeneratedPbiIds(undefined)}
            pushProgress={featurePushProgress}
            pushResult={featurePushResult}
            onClearPushResult={() => setFeaturePushResult(null)}
            focusFeatureId={focusFeatureId}
          />
        )}
        {view === 'rdis' && <RdiTab />}
        {view === 'epic-creation' && (
          <EpicCreationWizard
            epicId={focusEpicId}
            onNavigate={(v, epicId) => {
              if (epicId) setFocusEpicId(epicId);
              setView(v as import('./components/Sidebar').ViewId);
            }}
            vscode={vscodeApi}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            adoSettings={state.adoSettings}
            hasAdoPat={state.hasAdoPat}
            send={sendMessage}
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
