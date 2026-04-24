import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  AdoProgressPayload,
  AdoSettings,
  BugReportInput,
  BulkBreakdownRequest,
  BulkChildInput,
  ExtensionEvent,
  ImportedProject,
  PbiDraft,
  WebviewRequest
} from '../shared/messages';
import { iterationLeafFromPath } from '../shared/iterationUtils';
import { buildLinkedProjectContext } from '../services/linkedProjectContext';
import { AdoService } from '../services/adoService';
import { CodeAnalyzer } from '../services/codeAnalyzer';
import { CopilotService } from '../services/copilotService';
import { PbiDraftService, STANDALONE_PROJECT_ID } from '../services/pbiDraftService';
import { RepoImportService } from '../services/repoImportService';
import { SecretStorageService } from '../services/secretStorageService';
import { SettingsService } from '../services/settingsService';

export class DashboardPanel {
  private static currentPanel: DashboardPanel | undefined;

  public static createOrShow(
    context: vscode.ExtensionContext,
    importService: RepoImportService
  ): void {
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'poToolsDashboard',
      'PO Professional Tools',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, context, importService);
  }

  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly importService: RepoImportService,
    private readonly analyzer: CodeAnalyzer = new CodeAnalyzer(),
    private readonly draftService: PbiDraftService = new PbiDraftService(),
    private readonly secretStorage: SecretStorageService = new SecretStorageService(context),
    private readonly settingsService: SettingsService = new SettingsService(context),
    private readonly adoService: AdoService = new AdoService(),
    private readonly copilotService: CopilotService = new CopilotService(context)
  ) {
    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewRequest) => {
        try {
          await this.handleMessage(message);
        } catch (error) {
          const text = error instanceof Error ? error.message : 'Unexpected error';
          this.postToast('error', text);
        }
      },
      null,
      this.disposables
    );

    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        void this.postState();
      })
    );
  }

  private async handleMessage(message: WebviewRequest): Promise<void> {
    switch (message.type) {
      case 'APP_READY':
        await this.postState();
        return;
      case 'IMPORT_PROJECT':
        await this.handleImport();
        return;
      case 'REMOVE_PROJECT':
        await this.handleRemoveProject(message.payload.projectId);
        return;
      case 'SCAN_PROJECT':
        await this.handleScan(message.payload.projectId);
        return;
      case 'GENERATE_PBI_DRAFTS':
        await this.handleGenerate(message.payload.projectId);
        return;
      case 'CREATE_PBI_DRAFT':
        await this.handleCreatePbiDraft(message.payload);
        return;
      case 'UPDATE_PBI_DRAFT':
        await this.handleUpdateDraft(message.payload.draft);
        return;
      case 'DELETE_PBI_DRAFT':
        await this.handleDeleteDraft(message.payload.draftId);
        return;
      case 'PUSH_PBI_TO_ADO':
        await this.handlePushSingle(message.payload.draftId, message.payload.draft);
        return;
      case 'UPDATE_PBI_IN_ADO':
        await this.handleUpdateInAdo(message.payload.draftId, message.payload.draft);
        return;
      case 'PUSH_PROJECT_TO_ADO':
        await this.handlePushProject(message.payload.projectId, message.payload.draftIds);
        return;
      case 'SAVE_ADO_SETTINGS':
        await this.handleSaveAdoSettings(message.payload);
        return;
      case 'TEST_ADO_CONNECTION':
        await this.handleTestConnection(message.payload);
        return;
      case 'REFINE_PBI_WITH_AI':
        await this.handleRefine(message.payload.draftId, message.payload.instruction);
        return;
      case 'GENERATE_FULL_STORY_AI':
        await this.handleGenerateFullStory(message.payload.draftId, message.payload.seedText);
        return;
      case 'OPEN_IN_COPILOT_CHAT':
        await this.handleOpenInChat(message.payload);
        return;
      case 'APPLY_AI_SUGGESTION':
        await this.handleApplySuggestion(
          message.payload.draftId,
          message.payload.suggestion
        );
        return;
      case 'GENERATE_FROM_INVEST_WIZARD':
        await this.handleGenerateFromInvestWizard(
          message.payload.draftId,
          message.payload.wizard
        );
        return;
      case 'OPEN_INVEST_WIZARD_IN_CHAT':
        await this.handleOpenInvestWizardInChat(
          message.payload.draftId,
          message.payload.wizard
        );
        return;
      case 'GENERATE_BUG_REPORT':
        await this.handleGenerateBugReport(message.payload);
        return;
      case 'OPEN_BUG_REPORT_IN_CHAT':
        await this.handleOpenBugReportInChat(message.payload);
        return;
      case 'AI_SUGGEST_BREAKDOWN':
        await this.handleSuggestBreakdown(
          message.payload.prefix,
          message.payload.description,
          message.payload.count,
          message.payload.projectId
        );
        return;
      case 'BULK_CREATE_DRAFTS':
        await this.handleBulkCreate(message.payload);
        return;
      case 'BULK_PUSH_TO_ADO':
        await this.handleBulkPush(message.payload);
        return;
      case 'OPEN_EXTERNAL':
        await vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
        return;
      case 'SET_THEME':
        await this.settingsService.setTheme(message.payload.theme);
        await this.postState();
        return;
      default:
        return;
    }
  }

  private async handleImport(): Promise<void> {
    const imported = await this.importService.importProjectFromFolderPicker();
    if (!imported) {
      this.postToast('info', 'No new project was imported.');
    } else {
      this.postToast('success', `Imported project: ${imported.name}`);
    }
    await this.postState();
  }

  private async handleRemoveProject(projectId: string): Promise<void> {
    const removed = await this.importService.removeProject(projectId);
    if (!removed) {
      this.postToast('error', 'Project not found.');
      return;
    }
    await this.draftService.deleteByProject(this.context.globalState, projectId);
    this.postToast('success', `Removed ${removed.name} and its drafts.`);
    await this.postState();
  }

  private async handleScan(projectId: string): Promise<void> {
    const project = this.findProject(projectId);
    if (!project) {
      this.postToast('error', 'Project not found.');
      return;
    }
    const summary = this.analyzer.analyzeProject(project.path);
    await this.importService.markScanned(projectId, summary);
    this.postToast(
      'info',
      `Scan complete for ${project.name}: ${summary.routes.length} routes, ${summary.apiEndpoints.length} APIs, ${summary.sqlObjects.length} SQL.`
    );
    await this.postState();
  }

  private async handleCreatePbiDraft(payload: {
    projectId?: string;
    title?: string;
    openCopilotChat?: 'newStory';
    seedIdea?: string;
  }): Promise<void> {
    const targets = await this.importService.getLinkTargets();
    if (targets.length === 0) {
      this.postToast(
        'error',
        'Open a workspace folder or import a project on the Projects tab before creating a PBI.'
      );
      return;
    }
    const raw = payload.projectId?.trim();
    if (!raw || raw === STANDALONE_PROJECT_ID) {
      this.postToast('error', 'Choose a linked project so AI can use your codebase.');
      return;
    }
    const match = targets.find((p) => p.id === raw);
    if (!match) {
      this.postToast('error', 'Pick a valid linked project from the list.');
      return;
    }
    const projectId = match.id;

    const ado = this.settingsService.getAdoSettings();
    const draft = this.draftService.createBlankDraft({
      projectId,
      title: payload.title,
      defaultWorkItemType: ado?.defaultWorkItemType,
      iteration: iterationLeafFromPath(ado?.iterationPath)
    });

    await this.draftService.upsert(this.context.globalState, draft);
    this.post({ type: 'DRAFT_CREATED', payload: { draftId: draft.id } });

    if (payload.openCopilotChat === 'newStory') {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(projectId);
      await this.copilotService.openNewStoryInCopilotChat(
        draft,
        payload.seedIdea,
        linkedProjectContext
      );
      this.postToast(
        'info',
        'Copilot Chat opened. Tip: use PBI Studio → Generate full story in-panel for one-click apply without pasting JSON.'
      );
    } else {
      this.postToast(
        'success',
        `Created "${draft.title}". Use Generate full story in-panel or edit manually.`
      );
    }
    await this.postState();
  }

  private async handleGenerate(projectId: string): Promise<void> {
    const project = this.findProject(projectId);
    if (!project) {
      this.postToast('error', 'Project not found.');
      return;
    }
    const ado = this.settingsService.getAdoSettings();
    const drafts = this.draftService.buildDrafts(project, {
      iteration: iterationLeafFromPath(ado?.iterationPath)
    });
    const existing = this.draftService.getAll(this.context.globalState);
    const filtered = existing.filter((draft) => draft.projectId !== project.id);
    await this.draftService.saveAll(this.context.globalState, [...filtered, ...drafts]);
    this.postToast('success', `Generated ${drafts.length} draft(s) for ${project.name}.`);
    await this.postState();
  }

  private async handleUpdateDraft(draft: PbiDraft): Promise<void> {
    await this.draftService.upsert(this.context.globalState, draft);
    this.postToast('success', `Saved "${draft.title}".`);
    await this.postState();
  }

  private async handleDeleteDraft(draftId: string): Promise<void> {
    await this.draftService.deleteById(this.context.globalState, draftId);
    this.postToast('info', 'Draft deleted.');
    await this.postState();
  }

  private async handlePushSingle(draftId: string, draftFromWebview?: PbiDraft): Promise<void> {
    if (draftFromWebview) {
      await this.draftService.upsert(this.context.globalState, draftFromWebview);
    }
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    if (!(await this.ensureDraftLinkedProject(draft))) {
      return;
    }
    if (draft.adoWorkItemId != null && draft.status === 'pushed') {
      this.postToast(
        'info',
        'This item is already in Azure DevOps. Use "Update in ADO" to sync your changes.'
      );
      return;
    }
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }
    try {
      this.postAdoProgress({
        busy: true,
        message: 'Preparing work item (diagram, fields)…',
        scope: 'single',
        draftId
      });
      const toPush = await this.mergeAutoMermaidForAdo(draft);
      this.postAdoProgress({
        busy: true,
        message: 'Pushing to Azure DevOps…',
        scope: 'single',
        draftId
      });
      const result = await this.adoService.pushDrafts(ctx.settings, ctx.pat, [toPush]);
      await this.applyPushResult(result.created, result.errors);
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'single' });
    }
  }

  private async handleUpdateInAdo(draftId: string, draftFromWebview?: PbiDraft): Promise<void> {
    if (draftFromWebview) {
      await this.draftService.upsert(this.context.globalState, draftFromWebview);
    }
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    if (!(await this.ensureDraftLinkedProject(draft))) {
      return;
    }
    if (draft.adoWorkItemId == null || draft.status !== 'pushed') {
      this.postToast(
        'error',
        'Update in ADO is only available after a successful push. Use "Push to ADO" first.'
      );
      return;
    }
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }
    try {
      this.postAdoProgress({
        busy: true,
        message: 'Preparing update (diagram, fields)…',
        scope: 'single',
        draftId
      });
      const toSync = await this.mergeAutoMermaidForAdo(draft);
      this.postAdoProgress({
        busy: true,
        message: 'Updating work item in Azure DevOps…',
        scope: 'single',
        draftId
      });
      await this.adoService.updateDraftInAdo(
        ctx.settings,
        ctx.pat,
        toSync,
        draft.adoWorkItemId
      );
      const cleared: PbiDraft = {
        ...draft,
        attachments: [],
        updatedAt: new Date().toISOString()
      };
      await this.draftService.upsert(this.context.globalState, cleared);
      this.postToast('success', `Updated work item #${draft.adoWorkItemId} in Azure DevOps.`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.postToast('error', `Update failed: ${messageText}`);
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'single' });
    }
    await this.postState();
  }

  private async handlePushProject(projectId: string, draftIds?: string[]): Promise<void> {
    const drafts = this.draftService
      .getAll(this.context.globalState)
      .filter((draft) => draft.projectId === projectId)
      .filter((draft) => (draftIds ? draftIds.includes(draft.id) : true));

    if (drafts.length === 0) {
      this.postToast('error', 'No drafts to push for this project.');
      return;
    }
    for (const d of drafts) {
      if (!(await this.ensureDraftLinkedProject(d))) {
        return;
      }
    }
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }
    try {
      this.postAdoProgress({
        busy: true,
        message: `Preparing ${drafts.length} draft(s)…`,
        scope: 'project',
        projectId
      });
      const prepared: PbiDraft[] = [];
      for (const d of drafts) {
        prepared.push(await this.mergeAutoMermaidForAdo(d));
      }
      this.postAdoProgress({
        busy: true,
        message: 'Pushing to Azure DevOps…',
        scope: 'project',
        projectId
      });
      const result = await this.adoService.pushDrafts(ctx.settings, ctx.pat, prepared);
      await this.applyPushResult(result.created, result.errors);
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'project' });
    }
  }

  /** Repo or workspace folder link required for AI context and ADO push. */
  private async ensureDraftLinkedProject(draft: PbiDraft): Promise<boolean> {
    if (draft.projectId === STANDALONE_PROJECT_ID) {
      this.postToast(
        'error',
        'Link this backlog item to a project (repo or workspace folder) in PBI Studio before syncing to Azure DevOps.'
      );
      return false;
    }
    const targets = await this.importService.getLinkTargets();
    if (!targets.some((t) => t.id === draft.projectId)) {
      this.postToast(
        'error',
        'Linked project is missing or invalid. Choose a project from the Linked project list.'
      );
      return false;
    }
    return true;
  }

  /** Adds an AI-generated Mermaid file to pending attachments when Copilot can produce one. */
  private async mergeAutoMermaidForAdo(draft: PbiDraft): Promise<PbiDraft> {
    const token = new vscode.CancellationTokenSource().token;
    const generated = await this.copilotService.tryGenerateMermaidAttachment(draft, token);
    if (!generated) {
      return draft;
    }
    const existing = draft.attachments ?? [];
    return { ...draft, attachments: [...existing, generated] };
  }

  private postAdoProgress(payload: AdoProgressPayload): void {
    this.post({ type: 'ADO_PROGRESS', payload });
  }

  private async handleSaveAdoSettings(payload: BulkSaveInput): Promise<void> {
    const { pat, ...rest } = payload;
    if (pat && pat.trim().length > 0) {
      await this.secretStorage.saveAdoPat(pat.trim());
    }
    const adoSettings: AdoSettings = {
      orgUrl: rest.orgUrl,
      projectName: rest.projectName,
      areaPath: rest.areaPath || undefined,
      iterationPath: rest.iterationPath || undefined,
      defaultWorkItemType: rest.defaultWorkItemType || 'Product Backlog Item'
    };
    await this.settingsService.saveAdoSettings(adoSettings);
    this.postToast('success', 'Azure DevOps settings saved.');
    await this.postState();
  }

  private async handleTestConnection(
    payload?: { orgUrl: string; projectName: string; pat?: string }
  ): Promise<void> {
    const saved = this.settingsService.getAdoSettings();
    const orgUrl = (payload?.orgUrl ?? saved?.orgUrl ?? '').trim();
    const projectName = (payload?.projectName ?? saved?.projectName ?? '').trim();
    const patFromForm = payload?.pat?.trim();
    const patFromSecret = await this.secretStorage.getAdoPat();
    const pat = patFromForm && patFromForm.length > 0 ? patFromForm : patFromSecret;

    if (!orgUrl || !projectName) {
      this.postToast('error', 'Organization URL and Project name are required to test.');
      this.post({
        type: 'ADO_CONNECTION_RESULT',
        payload: { ok: false, message: 'Missing Organization URL or Project.' }
      });
      return;
    }
    if (!pat) {
      this.postToast(
        'error',
        'A Personal Access Token is required. Paste your PAT in the field (use Update if one is already saved), then click Test Connection.'
      );
      this.post({
        type: 'ADO_CONNECTION_RESULT',
        payload: { ok: false, message: 'PAT missing — paste token or save settings first.' }
      });
      return;
    }

    const settings: AdoSettings = {
      orgUrl,
      projectName,
      areaPath: saved?.areaPath,
      iterationPath: saved?.iterationPath,
      defaultWorkItemType: saved?.defaultWorkItemType ?? 'Product Backlog Item'
    };

    try {
      await this.adoService.testConnection(settings, pat);
      this.post({
        type: 'ADO_CONNECTION_RESULT',
        payload: { ok: true, message: `Connected to project "${projectName}".` }
      });
      this.postToast('success', 'Azure DevOps connection OK.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'ADO_CONNECTION_RESULT', payload: { ok: false, message } });
      this.postToast('error', `Connection failed: ${message}`);
    }
  }

  private async buildLinkedContextForProjectId(
    projectId: string | undefined
  ): Promise<string | undefined> {
    if (!projectId || projectId === STANDALONE_PROJECT_ID) {
      return undefined;
    }
    const targets = await this.importService.getLinkTargets();
    const t = targets.find((p) => p.id === projectId);
    if (!t) {
      return undefined;
    }
    return buildLinkedProjectContext({
      rootPath: t.path,
      projectName: t.name,
      scanSummary: t.scanSummary
    });
  }

  private async handleRefine(draftId: string, instruction?: string): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Scanning linked project & refining with Copilot...', busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
      const suggestion = await this.copilotService.refineDraft(draft, instruction, token, {
        linkedProjectContext
      });
      this.post({
        type: 'AI_SUGGESTION_READY',
        payload: { draftId, suggestion }
      });
      this.postToast('success', 'AI suggestion ready. Review & apply per field.');
    } finally {
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
  }

  private async handleGenerateFullStory(draftId: string, seedText?: string): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Scanning linked project & generating full story...', busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
      const suggestion = await this.copilotService.generateFullStoryFromSeed(
        draft,
        seedText,
        token,
        { linkedProjectContext }
      );
      await this.handleApplySuggestion(draftId, suggestion, { skipToast: true });
      this.postToast(
        'success',
        'Full story generated and applied. Review fields above, then Save or Push to ADO.'
      );
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', messageText);
    } finally {
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
  }

  private async handleOpenInChat(payload: {
    draftId: string;
    mode?: 'refine' | 'newStory';
    seedIdea?: string;
  }): Promise<void> {
    const draft = this.findDraft(payload.draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
    await this.copilotService.openInCopilotChat(draft, {
      mode: payload.mode,
      seedIdea: payload.seedIdea,
      linkedProjectContext
    });
    this.postToast(
      'info',
      payload.mode === 'newStory'
        ? 'Copilot Chat opened. Build your story; paste JSON into Apply AI Result when done.'
        : 'Copilot Chat opened with the refinement prompt. Paste JSON back in Apply AI Result.'
    );
  }

  private async handleGenerateFromInvestWizard(
    draftId: string,
    wizard: import('../shared/messages').InvestWizardInput
  ): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Generating full story from INVEST wizard answers…', busy: true }
    });
    const cts = new vscode.CancellationTokenSource();
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
      const suggestion = await this.copilotService.generateFromInvestWizard(
        draft,
        wizard,
        cts.token,
        { linkedProjectContext }
      );
      await this.handleApplySuggestion(draftId, suggestion, { skipToast: true });
      this.postToast(
        'success',
        'Full story generated from your INVEST answers and applied. Review the fields above, then Save or Push to ADO.'
      );
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', messageText);
    } finally {
      cts.dispose();
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
  }

  private async handleOpenInvestWizardInChat(
    draftId: string,
    wizard: import('../shared/messages').InvestWizardInput
  ): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
    await this.copilotService.openInvestWizardInChat(draft, wizard, linkedProjectContext);
    this.postToast(
      'info',
      'Copilot Chat opened with your INVEST wizard context. Collaborate with the agent, then paste JSON into Apply AI Result.'
    );
  }

  private async handleGenerateBugReport(input: BugReportInput): Promise<void> {
    this.post({
      type: 'LOADING',
      payload: { message: 'Generating bug report...', busy: true }
    });
    const cts = new vscode.CancellationTokenSource();
    try {
      const result = await this.copilotService.generateBugReport(input, cts.token);
      this.post({ type: 'AI_SUGGESTION', payload: { suggestion: result } });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', messageText);
    } finally {
      cts.dispose();
      this.post({
        type: 'LOADING',
        payload: { message: '', busy: false }
      });
    }
  }

  private async handleOpenBugReportInChat(input: BugReportInput): Promise<void> {
    await this.copilotService.openBugReportInChat(input);
    this.postToast(
      'info',
      'Copilot Chat opened with your bug report context. Collaborate with the agent, then paste JSON into Apply AI Result.'
    );
  }

  private async handleApplySuggestion(
    draftId: string,
    suggestion: {
      title?: string;
      description?: string;
      acceptanceCriteria?: string[];
      testScenarios?: string[];
    },
    options?: { skipToast?: boolean }
  ): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    const updated: PbiDraft = {
      ...draft,
      title: suggestion.title?.trim() ? suggestion.title.trim() : draft.title,
      description: suggestion.description ?? draft.description,
      acceptanceCriteria: suggestion.acceptanceCriteria ?? draft.acceptanceCriteria,
      testScenarios: suggestion.testScenarios ?? draft.testScenarios
    };
    await this.draftService.upsert(this.context.globalState, updated);
    if (!options?.skipToast) {
      this.postToast('success', 'AI suggestion applied.');
    }
    await this.postState();
  }

  private async handleSuggestBreakdown(
    prefix: string,
    description: string,
    count: number | undefined,
    projectId?: string
  ): Promise<void> {
    this.post({
      type: 'AI_PROGRESS',
      payload: { message: `Scanning project & breaking down "${prefix}"...`, busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(projectId);
      const children = await this.copilotService.suggestBreakdown(
        prefix,
        description,
        count ?? 5,
        token,
        { linkedProjectContext }
      );
      this.post({
        type: 'AI_BREAKDOWN_READY',
        payload: { prefix, children }
      });
      this.postToast('success', `AI suggested ${children.length} child item(s).`);
    } finally {
      this.post({
        type: 'AI_PROGRESS',
        payload: { message: '', busy: false }
      });
    }
  }

  private async handleBulkCreate(request: BulkBreakdownRequest): Promise<void> {
    const targets = await this.importService.getLinkTargets();
    const pid = request.projectId?.trim();
    if (!pid || pid === STANDALONE_PROJECT_ID || !targets.some((t) => t.id === pid)) {
      this.postToast('error', 'Choose “Attach to project” before creating bulk drafts.');
      return;
    }
    const drafts = this.buildBulkDrafts(request);
    const existing = this.draftService.getAll(this.context.globalState);
    await this.draftService.saveAll(this.context.globalState, [...existing, ...drafts]);
    this.postToast('success', `Created ${drafts.length} draft(s) with prefix "${request.prefix}".`);
    await this.postState();
  }

  private async handleBulkPush(
    request: BulkBreakdownRequest & { draftIds: string[] }
  ): Promise<void> {
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }

    const allDrafts = this.draftService.getAll(this.context.globalState);
    const children = allDrafts.filter((draft) => request.draftIds.includes(draft.id));
    if (children.length === 0) {
      this.postToast('error', 'No drafts selected for bulk push.');
      return;
    }
    for (const d of children) {
      if (!(await this.ensureDraftLinkedProject(d))) {
        return;
      }
    }

    try {
      this.postAdoProgress({
        busy: true,
        message: `Preparing ${children.length} backlog item(s)…`,
        scope: 'bulk'
      });
      const preparedChildren: PbiDraft[] = [];
      for (const d of children) {
        preparedChildren.push(await this.mergeAutoMermaidForAdo(d));
      }
      this.postAdoProgress({
        busy: true,
        message: request.parentWorkItemType
          ? 'Creating parent and children in Azure DevOps…'
          : 'Pushing to Azure DevOps…',
        scope: 'bulk'
      });

      if (request.parentWorkItemType) {
        const bulk = await this.adoService.pushWithParent(
          ctx.settings,
          ctx.pat,
          {
            title: request.prefix,
            description:
              request.parentDescription ||
              `Parent for ${preparedChildren.length} child items generated by PO Tools.`,
            workItemType: request.parentWorkItemType,
            iteration: request.iteration
          },
          preparedChildren
        );
        await this.applyPushResult(bulk.created, bulk.errors);
        if (bulk.parent) {
          this.postToast(
            'success',
            `Parent "${request.prefix}" created as #${bulk.parent.workItemId} with ${bulk.created.length} child(ren).`
          );
        }
      } else {
        const result = await this.adoService.pushDrafts(ctx.settings, ctx.pat, preparedChildren);
        await this.applyPushResult(result.created, result.errors);
      }
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'bulk' });
    }
  }

  private buildBulkDrafts(request: BulkBreakdownRequest): PbiDraft[] {
    const separator = request.separator || ' - ';
    const projectId = request.projectId || 'bulk';
    const iteration = request.iteration || this.defaultIteration();
    return request.children
      .filter((child) => child.suffix && child.suffix.trim().length > 0)
      .map((child) => ({
        id: this.draftService.newId(),
        projectId,
        title: `${request.prefix}${separator}${child.suffix.trim()}`,
        description:
          child.description ||
          `Child item of "${request.prefix}" focused on: ${child.suffix.trim()}.`,
        effortDays: child.effortDays ?? 2,
        iteration,
        status: 'draft',
        workItemType: request.childWorkItemType,
        acceptanceCriteria:
          child.acceptanceCriteria && child.acceptanceCriteria.length > 0
            ? child.acceptanceCriteria
            : [
                `Given the ${child.suffix.trim()} flow, when exercised, then the expected outcome is delivered.`,
                'Validation and error states are clear and actionable.',
                'Happy path is documented and testable.'
              ],
        testScenarios:
          child.testScenarios && child.testScenarios.length > 0
            ? child.testScenarios
            : [
                `${child.suffix.trim()} happy path test`,
                `${child.suffix.trim()} validation failure test`,
                `${child.suffix.trim()} error fallback test`
              ]
      }));
  }

  private defaultIteration(): string {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    return `${month} Sprint ${Math.max(1, Math.ceil(now.getDate() / 14))}`;
  }

  private async applyPushResult(
    created: Array<{ draftId: string; workItemId: number; workItemUrl?: string }>,
    errors: Array<{ draftId: string; message: string }>
  ): Promise<void> {
    if (created.length > 0) {
      const all = this.draftService.getAll(this.context.globalState);
      const nowIso = new Date().toISOString();
      const updated = all.map((draft) => {
        const match = created.find((c) => c.draftId === draft.id);
        if (!match) {
          return draft;
        }
        const hadError = errors.some((e) => e.draftId === draft.id);
        return {
          ...draft,
          status: 'pushed' as const,
          adoWorkItemId: match.workItemId,
          adoWorkItemUrl: match.workItemUrl,
          updatedAt: nowIso,
          attachments: hadError ? draft.attachments : []
        };
      });
      await this.draftService.saveAll(this.context.globalState, updated);
    }

    if (errors.length > 0) {
      this.postToast('error', `${errors.length} item(s) failed to push. See output for details.`);
      for (const err of errors) {
        // eslint-disable-next-line no-console
        console.error(`[PO Tools] Push failed for ${err.draftId}: ${err.message}`);
      }
    }

    if (created.length > 0) {
      this.postToast(
        'success',
        `Pushed ${created.length} item(s) to Azure DevOps.`
      );
    }
    await this.postState();
  }

  private async requireAdoContext(): Promise<{ settings: AdoSettings; pat: string } | null> {
    const settings = this.settingsService.getAdoSettings();
    if (!settings || !settings.orgUrl || !settings.projectName) {
      this.postToast('error', 'Azure DevOps settings are incomplete. Open Settings to configure.');
      return null;
    }
    const pat = await this.secretStorage.getAdoPat();
    if (!pat) {
      this.postToast('error', 'Azure DevOps PAT is missing. Save your PAT in Settings.');
      return null;
    }
    return { settings, pat };
  }

  private findProject(projectId: string): ImportedProject | undefined {
    return this.importService.getProjects().find((item) => item.id === projectId);
  }

  private findDraft(draftId: string): PbiDraft | undefined {
    return this.draftService
      .getAll(this.context.globalState)
      .find((item) => item.id === draftId);
  }

  private async postState(): Promise<void> {
    const pat = await this.secretStorage.getAdoPat();
    const payload: ExtensionEvent = {
      type: 'STATE_UPDATED',
      payload: {
        projects: this.importService.getProjects(),
        linkTargets: await this.importService.getLinkTargets(),
        pbiDrafts: this.draftService.getAll(this.context.globalState),
        adoSettings: this.settingsService.getAdoSettings(),
        uiSettings: this.settingsService.getUiSettings(),
        hasAdoPat: Boolean(pat && pat.length > 0)
      }
    };
    this.panel.webview.postMessage(payload);
  }

  private postToast(level: 'info' | 'error' | 'success', message: string): void {
    this.post({ type: 'TOAST', payload: { level, message } });
  }

  private post(event: ExtensionEvent): void {
    this.panel.webview.postMessage(event);
  }

  private getHtml(): string {
    const webviewDist = path.join(this.context.extensionPath, 'webview-ui', 'dist');
    const indexPath = path.join(webviewDist, 'index.html');

    if (!fs.existsSync(indexPath)) {
      return `<!DOCTYPE html>
<html lang="en">
  <body>
    <h2>PO Professional Tools</h2>
    <p>Webview build not found. Run: npm run build</p>
  </body>
</html>`;
    }

    let html = fs.readFileSync(indexPath, 'utf8');
    const assetsDir = vscode.Uri.file(path.join(webviewDist, 'assets'));
    const assetsUri = this.panel.webview.asWebviewUri(assetsDir).toString();

    html = html.replaceAll('/assets/', `${assetsUri}/`);
    return html;
  }

  private dispose(): void {
    DashboardPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const item = this.disposables.pop();
      item?.dispose();
    }
  }
}

type BulkSaveInput = {
  orgUrl: string;
  projectName: string;
  areaPath?: string;
  iterationPath?: string;
  defaultWorkItemType?: AdoSettings['defaultWorkItemType'];
  pat?: string;
};
