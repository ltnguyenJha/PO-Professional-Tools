export type WebviewRequest =
  | { type: 'APP_READY' }
  | { type: 'IMPORT_PROJECT' }
  | { type: 'SCAN_PROJECT'; payload: { projectId: string } }
  | { type: 'GENERATE_PBI_DRAFTS'; payload: { projectId: string } }
  | { type: 'SAVE_ADO_SETTINGS'; payload: AdoSettingsInput }
  | { type: 'PUSH_PROJECT_TO_ADO'; payload: { projectId: string } };

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

export interface PbiDraft {
  id: string;
  projectId: string;
  title: string;
  description: string;
  effortDays: 1 | 2 | 3 | 4 | 5;
  acceptanceCriteria: string[];
  testScenarios: string[];
  iteration: string;
}

export interface AdoSettings {
  orgUrl: string;
  projectName: string;
  areaPath?: string;
  iterationPath?: string;
}

export interface AdoSettingsInput extends AdoSettings {
  pat?: string;
}

export interface AppStatePayload {
  projects: ImportedProject[];
  pbiDrafts: PbiDraft[];
  adoSettings?: AdoSettings;
}

export type ExtensionEvent =
  | { type: 'STATE_UPDATED'; payload: AppStatePayload }
  | { type: 'TOAST'; payload: { level: 'info' | 'error'; message: string } };
