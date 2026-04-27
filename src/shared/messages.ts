export interface ProjectScanSummary {
  routes: string[];
  apiEndpoints: string[];
  sqlObjects: string[];
}

export interface ImportedProject {
  id: string;
  name: string;
  path: string;
  detectedStack: string[];
  lastScannedAt?: string;
  scanSummary?: ProjectScanSummary;
}

export type AdoWorkItemType =
  | 'Product Backlog Item'
  | 'User Story'
  | 'Feature'
  | 'Epic'
  | 'Task'
  | 'Bug';

export type PbiStatus = 'draft' | 'ready' | 'pushed';

/** Files to upload as Azure DevOps work item attachments (diagrams, mermaid, etc.). */
export interface PbiAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  /** Base64-encoded file bytes (no data: URL prefix). */
  dataBase64: string;
}

export interface PbiDraft {
  id: string;
  projectId: string;
  title: string;
  description: string;
  effortDays: 1 | 2 | 3 | 4 | 5;
  acceptanceCriteria: string[];
  testScenarios: string[];
  iteration: string;
  workItemType?: AdoWorkItemType;
  status?: PbiStatus;
  adoWorkItemId?: number;
  adoWorkItemUrl?: string;
  updatedAt?: string;
  /** Pending uploads on next Push / Update in ADO; cleared after successful sync. */
  attachments?: PbiAttachment[];
}

export interface AdoSettings {
  orgUrl: string;
  projectName: string;
  areaPath?: string;
  iterationPath?: string;
  defaultWorkItemType?: AdoWorkItemType;
}

export interface AdoSettingsInput extends AdoSettings {
  pat?: string;
}

export type ThemePreference = 'light' | 'dark' | 'auto';

export interface UiSettings {
  theme: ThemePreference;
}

export interface AppStatePayload {
  /** Manually imported repos (Projects tab). */
  projects: ImportedProject[];
  /** Imported + open workspace folders — use for linking PBIs to a repo without importing each. */
  linkTargets?: ImportedProject[];
  pbiDrafts: PbiDraft[];
  adoSettings?: AdoSettings;
  uiSettings: UiSettings;
  hasAdoPat: boolean;
}

export interface AiSuggestion {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  testScenarios?: string[];
}

export interface BulkChildInput {
  suffix: string;
  description?: string;
  acceptanceCriteria?: string[];
  testScenarios?: string[];
  effortDays?: 1 | 2 | 3 | 4 | 5;
}

export interface BulkBreakdownRequest {
  prefix: string;
  separator: string;
  projectId?: string;
  iteration?: string;
  childWorkItemType: AdoWorkItemType;
  parentWorkItemType?: AdoWorkItemType;
  parentDescription?: string;
  children: BulkChildInput[];
}

export type WebviewRequest =
  | { type: 'APP_READY' }
  | { type: 'IMPORT_PROJECT' }
  | { type: 'REMOVE_PROJECT'; payload: { projectId: string } }
  | { type: 'SCAN_PROJECT'; payload: { projectId: string } }
  | { type: 'GENERATE_PBI_DRAFTS'; payload: { projectId: string } }
  | {
      type: 'CREATE_PBI_DRAFT';
      payload: {
        projectId?: string;
        title?: string;
        openCopilotChat?: 'newStory';
        seedIdea?: string;
      };
    }
  | { type: 'UPDATE_PBI_DRAFT'; payload: { draft: PbiDraft } }
  | { type: 'DELETE_PBI_DRAFT'; payload: { draftId: string } }
  | {
      type: 'PUSH_PBI_TO_ADO';
      payload: { draftId: string; draft?: PbiDraft };
    }
  | {
      type: 'UPDATE_PBI_IN_ADO';
      payload: { draftId: string; draft?: PbiDraft };
    }
  | { type: 'PUSH_PROJECT_TO_ADO'; payload: { projectId: string; draftIds?: string[] } }
  | { type: 'SAVE_ADO_SETTINGS'; payload: AdoSettingsInput }
  | {
      type: 'TEST_ADO_CONNECTION';
      payload?: { orgUrl: string; projectName: string; pat?: string };
    }
  | { type: 'REFINE_PBI_WITH_AI'; payload: { draftId: string; instruction?: string } }
  | { type: 'GENERATE_FULL_STORY_AI'; payload: { draftId: string; seedText?: string } }
  | {
      type: 'OPEN_IN_COPILOT_CHAT';
      payload: {
        draftId: string;
        mode?: 'refine' | 'newStory';
        seedIdea?: string;
      };
    }
  | { type: 'APPLY_AI_SUGGESTION'; payload: { draftId: string; suggestion: AiSuggestion } }
  | {
      type: 'AI_SUGGEST_BREAKDOWN';
      payload: { prefix: string; description: string; count?: number; projectId?: string };
    }
  | { type: 'BULK_CREATE_DRAFTS'; payload: BulkBreakdownRequest }
  | { type: 'BULK_PUSH_TO_ADO'; payload: BulkBreakdownRequest & { draftIds: string[] } }
  | { type: 'OPEN_EXTERNAL'; payload: { url: string } }
  | { type: 'SET_THEME'; payload: { theme: ThemePreference } };

export type AdoProgressScope = 'single' | 'bulk' | 'project';

export interface AdoProgressPayload {
  busy: boolean;
  message: string;
  scope: AdoProgressScope;
  draftId?: string;
  projectId?: string;
}

export type ExtensionEvent =
  | { type: 'DRAFT_CREATED'; payload: { draftId: string } }
  | { type: 'STATE_UPDATED'; payload: AppStatePayload }
  | { type: 'TOAST'; payload: { level: 'info' | 'error' | 'success'; message: string } }
  | { type: 'AI_PROGRESS'; payload: { draftId?: string; message: string; busy: boolean } }
  | { type: 'ADO_PROGRESS'; payload: AdoProgressPayload }
  | { type: 'AI_SUGGESTION_READY'; payload: { draftId: string; suggestion: AiSuggestion } }
  | { type: 'AI_BREAKDOWN_READY'; payload: { prefix: string; children: BulkChildInput[] } }
  | { type: 'ADO_CONNECTION_RESULT'; payload: { ok: boolean; message: string } };
