export interface ProjectScanSummary {
  routes: string[];
  apiEndpoints: string[];
  sqlObjects: string[];
}

export type AdoWorkItemType =
  | 'Product Backlog Item'
  | 'User Story'
  | 'Feature'
  | 'Epic'
  | 'Task'
  | 'Bug';

export const WORK_ITEM_TYPES: AdoWorkItemType[] = [
  'Product Backlog Item',
  'User Story',
  'Feature',
  'Epic',
  'Task',
  'Bug'
];

export type PbiStatus = 'draft' | 'ready' | 'pushed';

export interface PbiAttachment {
  id: string;
  fileName: string;
  mimeType: string;
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
  attachments?: PbiAttachment[];
  // Bug-specific fields (optional, used when workItemType is 'Bug')
  bugRootCause?: string;
  bugExpectedBehavior?: string;
  bugActualBehavior?: string;
  bugReproductionSteps?: string[];
  // Technical considerations (optional)
  technicalConsiderations?: TechnicalConsiderations;
  // User story statement (optional)
  userStoryStatement?: string;
  // Business rules and assumptions (optional)
  businessRulesAndAssumptions?: string;
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

export interface ImportedProject {
  id: string;
  name: string;
  path: string;
  detectedStack: string[];
  lastScannedAt?: string;
  scanSummary?: ProjectScanSummary;
}

export type ThemePreference = 'light' | 'dark' | 'auto';

export interface UiSettings {
  theme: ThemePreference;
}

export const STANDALONE_PROJECT_ID = 'standalone';

export interface AiSuggestion {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  testScenarios?: string[];
  userStoryStatement?: string;
  businessRulesAndAssumptions?: string;
}

export interface InvestWizardInput {
  background: string;
  why: string;
  how: string;
  persona: string;
  want: string;
  benefit: string;
  businessRulesAndAssumptions?: string;
}

export interface TechnicalConsiderations {
  technicalDetails: string;
  scopedFiles: string[];
  architectureNotes: string;
}

export interface BugReportInput {
  whereLocation: string;
  howToReproduce: string;
  acceptanceCriteria: string;
  independent: boolean;
  negotiable: boolean;
  valuable: boolean;
  estimable: boolean;
  small: boolean;
  testable: boolean;
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

export interface AppStatePayload {
  projects: ImportedProject[];
  /** When omitted (older sessions), treat as `projects`. */
  linkTargets?: ImportedProject[];
  pbiDrafts: PbiDraft[];
  adoSettings?: AdoSettings;
  uiSettings: UiSettings;
  hasAdoPat: boolean;
}

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
  | { type: 'ADO_CONNECTION_RESULT'; payload: { ok: boolean; message: string } }
  | { type: 'WIZARD_DRAFT_LOADED'; payload: { draft: PbiDraft; currentStep: number } }
  | { type: 'WIZARD_STEP_CHANGED'; payload: { currentStep: number; draft: PbiDraft } };

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
  | { type: 'PUSH_PBI_TO_ADO'; payload: { draftId: string; draft?: PbiDraft } }
  | { type: 'UPDATE_PBI_IN_ADO'; payload: { draftId: string; draft?: PbiDraft } }
  | { type: 'PUSH_PROJECT_TO_ADO'; payload: { projectId: string; draftIds?: string[] } }
  | { type: 'SAVE_ADO_SETTINGS'; payload: AdoSettingsInput }
  | {
      type: 'TEST_ADO_CONNECTION';
      payload?: { orgUrl: string; projectName: string; pat?: string };
    }
  | { type: 'REFINE_PBI_WITH_AI'; payload: { draftId: string; instruction?: string } }
  | { type: 'GENERATE_FULL_STORY_AI'; payload: { draftId: string; seedText?: string } }
  | { type: 'GENERATE_TECHNICAL_CONSIDERATIONS'; payload: { draftId: string } }
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
  | { type: 'SET_THEME'; payload: { theme: ThemePreference } }
  | {
      type: 'GENERATE_FROM_INVEST_WIZARD';
      payload: { draftId: string; wizard: InvestWizardInput };
    }
  | {
      type: 'OPEN_INVEST_WIZARD_IN_CHAT';
      payload: { draftId: string; wizard: InvestWizardInput };
    }
  | { type: 'GENERATE_BUG_REPORT'; payload: BugReportInput }
  | { type: 'OPEN_BUG_REPORT_IN_CHAT'; payload: BugReportInput }
  | { type: 'WIZARD_DRAFT_LOAD'; payload: { draftId: string } }
  | { type: 'WIZARD_STEP_CHANGE'; payload: { draftId: string; targetStep: number } }
  | { type: 'WIZARD_DRAFT_SAVE'; payload: { draftId: string; partialDraft: Partial<PbiDraft>; currentStep: number } };

interface VsCodeApi {
  postMessage(message: WebviewRequest): void;
  getState<T = unknown>(): T | undefined;
  setState<T = unknown>(state: T): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

export {};
