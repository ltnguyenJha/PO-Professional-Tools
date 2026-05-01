import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  AdoProgressPayload,
  AdoSettings,
  BugReportInput,
  BulkBreakdownRequest,
  EpicDraft,
  ExtensionEvent,
  FeatureDraft,
  HierarchyStatus,
  ImportedProject,
  PbiDraft,
  RdiDraft,
  WebviewRequest
} from '../shared/messages';
import { iterationLeafFromPath } from '../shared/iterationUtils';
import { buildLinkedProjectContext } from '../services/linkedProjectContext';
import { AdoService } from '../services/adoService';
import { CodeAnalyzer } from '../services/codeAnalyzer';
import { CopilotService } from '../services/copilotService';
import { PbiDraftService, STANDALONE_PROJECT_ID } from '../services/pbiDraftService';
import { RdiDraftService } from '../services/rdiDraftService';
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
  private patValidatedThisSession: boolean = false;
  private readonly rdiDraftService: RdiDraftService = new RdiDraftService();
  private readonly acGenerationInFlight = new Set<string>();

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
       case 'VALIDATE_PAT_SCOPES':
         await this.handleValidatePatScopes();
         return;
      case 'FETCH_ADO_TEAMS':
        await this.handleFetchTeams();
        return;
      case 'FETCH_ADO_AREA_PATHS':
        await this.handleFetchAreaPaths(message.payload?.team);
        return;
      case 'FETCH_ADO_ITERATIONS':
        await this.handleFetchIterations(message.payload?.team);
        return;
      case 'REFINE_PBI_WITH_AI':
        await this.handleRefine(message.payload.draftId, message.payload.instruction);
        return;
      case 'GENERATE_FULL_STORY_AI':
        await this.handleGenerateFullStory(message.payload.draftId, message.payload.seedText);
        return;
      case 'GENERATE_FEATURE_DEFINITION':
        await this.handleGenerateFeatureDefinition(message.payload.draftId);
        return;
      case 'GENERATE_TECHNICAL_CONSIDERATIONS':
        await this.handleGenerateTechnicalConsiderations(message.payload.draftId);
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
      case 'WIZARD_DRAFT_LOAD':
        await this.handleWizardDraftLoad(message.payload.draftId);
        return;
      case 'WIZARD_STEP_CHANGE':
        await this.handleWizardStepChange(message.payload.draftId, message.payload.targetStep);
        return;
      case 'WIZARD_DRAFT_SAVE':
        await this.handleWizardDraftSave(
          message.payload.draftId,
          message.payload.partialDraft,
          message.payload.currentStep
        );
        return;
      // RDI handlers
      case 'createRdiDraft':
        await this.handleCreateRdiDraft();
        return;
      case 'loadRdiDraft':
        await this.handleLoadRdiDraft(message.id);
        return;
      case 'saveRdiDraft':
        await this.handleSaveRdiDraft(message.draft);
        return;
      case 'deleteRdiDraft':
        await this.handleDeleteRdiDraft(message.id);
        return;
      case 'pushRdi':
        await this.handlePushRdi(message.id);
        return;
      case 'loadRdiList':
        await this.handleLoadRdiList();
        return;
      case 'getDefaultIteration':
        await this.handleGetDefaultIteration();
        return;
      // Feature draft handlers
      case 'CREATE_FEATURE_DRAFT':
        await this.handleCreateFeatureDraft(message.payload);
        return;
      case 'UPDATE_FEATURE_DRAFT':
        await this.handleUpdateFeatureDraft(message.payload);
        return;
      case 'DELETE_FEATURE_DRAFT':
        await this.handleDeleteFeatureDraft(message.payload.featureId);
        return;
      case 'GENERATE_USER_STORIES_FROM_FEATURE':
        await this.handleGenerateUserStoriesFromFeature(message.payload);
        return;
      case 'PUSH_FEATURE_TO_ADO':
        await this.handlePushFeatureToAdo(message.payload.featureId, message.payload.includeChildren, message.payload.targetDate);
        return;
      // Epic draft handlers
      case 'CREATE_EPIC_DRAFT':
        await this.handleCreateEpicDraft(message.payload);
        return;
      case 'UPDATE_EPIC_DRAFT':
        await this.handleUpdateEpicDraft(message.payload);
        return;
      case 'DELETE_EPIC_DRAFT':
        await this.handleDeleteEpicDraft(message.payload.epicId);
        return;
      case 'LINK_FEATURE_TO_EPIC':
        await this.handleLinkFeatureToEpic(message.payload.epicId, message.payload.featureId);
        return;
      case 'UNLINK_FEATURE_FROM_EPIC':
        await this.handleUnlinkFeatureFromEpic(message.payload.epicId, message.payload.featureId);
        return;
      case 'PUSH_EPIC_TO_ADO':
        await this.handlePushEpicToAdo(message.payload.epicId, message.payload.pushChildren);
        return;
      case 'GENERATE_FEATURES_FROM_EPIC':
        await this.handleGenerateFeaturesFromEpic(message.payload);
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
      team: rest.team || undefined,
      areaPath: rest.areaPath || undefined,
      iterationPath: rest.iterationPath || undefined,
      defaultWorkItemType: rest.defaultWorkItemType || 'Product Backlog Item'
    };
    await this.settingsService.saveAdoSettings(adoSettings);
    await this.clearAdoCache();
    this.patValidatedThisSession = false;
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

  private async handleValidatePatScopes(): Promise<void> {
    const settings = this.settingsService.getAdoSettings();
    if (!settings || !settings.orgUrl || !settings.projectName) {
      this.post({
        type: 'PAT_VALIDATION_RESULT',
        payload: { valid: false, error: 'Azure DevOps settings are incomplete.' }
      });
      return;
    }
    const pat = await this.secretStorage.getAdoPat();
    if (!pat) {
      this.post({
        type: 'PAT_VALIDATION_RESULT',
        payload: { valid: false, error: 'PAT missing. Save your PAT in Settings first.' }
      });
      return;
    }

    try {
      await this.adoService.testConnection(settings, pat);
      this.patValidatedThisSession = true;
      this.post({
        type: 'PAT_VALIDATION_RESULT',
        payload: { valid: true }
      });
      this.postToast('success', 'PAT scopes validated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'PAT_VALIDATION_RESULT', payload: { valid: false, error: message } });
      this.postToast('error', `PAT validation failed: ${message}`);
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

  private async handleGenerateTechnicalConsiderations(draftId: string): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Scanning codebase & generating technical considerations...', busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
      const considerations = await this.copilotService.generateTechnicalConsiderations(
        draft,
        token,
        { linkedProjectContext }
      );
      const updated: PbiDraft = {
        ...draft,
        technicalConsiderations: considerations,
        updatedAt: new Date().toISOString()
      };
      await this.draftService.upsert(this.context.globalState, updated);
      this.postToast('success', 'Technical considerations generated and saved.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', messageText);
    } finally {
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
    await this.postState();
  }

  private async handleGenerateFeatureDefinition(draftId: string): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Generating feature definition...', busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const linkedProjectContext = await this.buildLinkedContextForProjectId(draft.projectId);
      const featureDefinition = await this.copilotService.generateFeatureDefinition(
        draft,
        token,
        { linkedProjectContext }
      );
      const updated: PbiDraft = {
        ...draft,
        featureWhy: featureDefinition.why,
        featureUserFlow: featureDefinition.userFlow,
        featureBusinessRules: featureDefinition.businessRules,
        featureUserStoryStatement: featureDefinition.userStoryStatement,
        updatedAt: new Date().toISOString()
      };
      await this.draftService.upsert(this.context.globalState, updated);
      this.postToast('success', 'Feature definition generated and saved.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', messageText);
    } finally {
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
    await this.postState();
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
      // Persist the "As a…, I want…, so that…" sentence independently of the AI-generated
      // description so it is never overwritten by future AI refinements or re-generations.
      const userStoryStatement = `As a ${wizard.persona}, I want ${wizard.want}, so that ${wizard.benefit}.`;
      await this.draftService.upsert(this.context.globalState, { ...draft, userStoryStatement });
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
      userStoryStatement?: string;
      businessRulesAndAssumptions?: string;
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
      testScenarios: suggestion.testScenarios ?? draft.testScenarios,
      userStoryStatement: suggestion.userStoryStatement ?? draft.userStoryStatement,
      businessRulesAndAssumptions: suggestion.businessRulesAndAssumptions ?? draft.businessRulesAndAssumptions
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
    const featureDef = request.featureDefinition;

    return request.children
      .filter((child) => child.suffix && child.suffix.trim().length > 0)
      .map((child) => {
        // Build base description with feature context if available
        let baseDescription = child.description ||
          `Child item of "${request.prefix}" focused on: ${child.suffix.trim()}.`;

        if (featureDef && (featureDef.why || featureDef.userFlow || featureDef.businessRules || featureDef.userStoryStatement)) {
          const contextParts: string[] = [];
          if (featureDef.why) {
            contextParts.push(`**Feature Why:** ${featureDef.why}`);
          }
          if (featureDef.userFlow) {
            contextParts.push(`**User Flow:** ${featureDef.userFlow}`);
          }
          if (featureDef.businessRules) {
            contextParts.push(`**Business Rules:** ${featureDef.businessRules}`);
          }
          if (featureDef.userStoryStatement) {
            contextParts.push(`**Feature User Story:** ${featureDef.userStoryStatement}`);
          }
          if (contextParts.length > 0) {
            baseDescription = `${contextParts.join('\n\n')}\n\n---\n\n${baseDescription}`;
          }
        }

        return {
          id: this.draftService.newId(),
          projectId,
          title: `${request.prefix}${separator}${child.suffix.trim()}`,
          description: baseDescription,
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
                ],
          // Propagate feature definition fields to child draft
          ...(featureDef && {
            featureWhy: featureDef.why,
            featureUserFlow: featureDef.userFlow,
            featureBusinessRules: featureDef.businessRules,
            featureUserStoryStatement: featureDef.userStoryStatement
          })
        };
      });
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

  private async handleWizardDraftLoad(draftId: string): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    const currentStep = this.getWizardStep(draftId);
    this.post({
      type: 'WIZARD_DRAFT_LOADED',
      payload: { draft, currentStep }
    });
  }

  private async handleWizardStepChange(draftId: string, targetStep: number): Promise<void> {
    const draft = this.findDraft(draftId);
    if (!draft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    this.setWizardStep(draftId, targetStep);
    this.post({
      type: 'WIZARD_STEP_CHANGED',
      payload: { currentStep: targetStep, draft }
    });
  }

  private async handleWizardDraftSave(
    draftId: string,
    partialDraft: Partial<PbiDraft>,
    currentStep: number
  ): Promise<void> {
    const existingDraft = this.findDraft(draftId);
    if (!existingDraft) {
      this.postToast('error', 'Draft not found.');
      return;
    }
    // Merge strategy preserves all fields including technicalConsiderations (Step 6), userStoryStatement (Step 2),
    // businessRulesAndAssumptions (Step 3), and other fields. Technical Considerations automatically clear on
    // new story via PbiDraft initialization in createBlankDraft().
    const mergedDraft = { ...existingDraft, ...partialDraft };
    await this.draftService.upsert(this.context.globalState, mergedDraft);
    this.setWizardStep(draftId, currentStep);
    await this.postState();

    // Auto-generate Gherkin acceptance criteria in the background when
    // the user saves the Feature Definition step and no AC exists yet.
    // Step 1 (Feature Definition) is preferred over step 0 because it provides
    // featureUserStoryStatement + featureWhy — richer, unambiguous context for AC.
    const storyStatement = mergedDraft.featureUserStoryStatement?.trim() ?? '';
    const descriptionWords = (mergedDraft.description?.trim() ?? '').split(/\s+/).filter(Boolean);
    const hasContent = storyStatement.length > 0 || descriptionWords.length >= 8;
    const hasNoAc = !mergedDraft.acceptanceCriteria?.length;
    if (currentStep === 1 && hasContent && hasNoAc) {
      void this.handleGenerateAcceptanceCriteria(draftId);
    }
  }

  private async handleGenerateAcceptanceCriteria(draftId: string): Promise<void> {
    if (this.acGenerationInFlight.has(draftId)) {
      return;
    }
    this.acGenerationInFlight.add(draftId);

    const draft = this.findDraft(draftId);
    if (!draft) {
      this.acGenerationInFlight.delete(draftId);
      return;
    }
    this.post({
      type: 'AI_PROGRESS',
      payload: { draftId, message: 'Generating acceptance criteria in Gherkin format...', busy: true }
    });
    const token = new vscode.CancellationTokenSource().token;
    try {
      const result = await this.copilotService.generateAcceptanceCriteria(draft, token);

      // Re-read the latest draft before writing to detect concurrent manual edits
      const latestDraft = this.findDraft(draftId);
      if (!latestDraft || latestDraft.acceptanceCriteria?.length) {
        return; // Draft deleted or user already added AC manually — don't overwrite
      }

      if (result.acceptanceCriteria.length || result.testScenarios.length) {
        const updated: PbiDraft = {
          ...latestDraft,
          acceptanceCriteria: result.acceptanceCriteria.length
            ? result.acceptanceCriteria
            : latestDraft.acceptanceCriteria,
          testScenarios: result.testScenarios.length
            ? result.testScenarios
            : latestDraft.testScenarios,
          updatedAt: new Date().toISOString()
        };
        await this.draftService.upsert(this.context.globalState, updated);
        await this.postState();
      }
    } catch {
      // Silent failure — AC generation is best-effort; don't surface errors to the user
    } finally {
      this.acGenerationInFlight.delete(draftId);
      this.post({
        type: 'AI_PROGRESS',
        payload: { draftId, message: '', busy: false }
      });
    }
  }


  private getWizardStep(draftId: string): number {
    const wizardState = this.context.globalState.get<Record<string, number>>(
      'poTools.wizardSteps',
      {}
    );
    return wizardState[draftId] ?? 0;
  }

  private setWizardStep(draftId: string, step: number): void {
    const wizardState = this.context.globalState.get<Record<string, number>>(
      'poTools.wizardSteps',
      {}
    );
    wizardState[draftId] = step;
    void this.context.globalState.update('poTools.wizardSteps', wizardState);
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

  // ─── RDI Handlers ──────────────────────────────────────────────────────────

  private async handleCreateRdiDraft(): Promise<void> {
    const draft = this.rdiDraftService.createDraft(this.context.globalState);
    this.post({ type: 'rdiDraftCreated', draft });
    await this.postState();
  }

  private async handleLoadRdiDraft(id: string): Promise<void> {
    const draft = this.rdiDraftService.getDraft(this.context.globalState, id);
    if (!draft) {
      this.post({ type: 'rdiError', message: `RDI draft not found: ${id}` });
      return;
    }
    this.post({ type: 'rdiDraftLoaded', draft });
  }

  private async handleSaveRdiDraft(draft: RdiDraft): Promise<void> {
    await this.rdiDraftService.saveDraft(this.context.globalState, draft);
    const saved = this.rdiDraftService.getDraft(this.context.globalState, draft.id);
    if (saved) {
      this.post({ type: 'rdiDraftSaved', draft: saved });
    }
    await this.postState();
  }

  private async handleDeleteRdiDraft(id: string): Promise<void> {
    await this.rdiDraftService.deleteDraft(this.context.globalState, id);
    this.post({ type: 'rdiDraftDeleted', id });
    await this.postState();
  }

  private async handlePushRdi(id: string): Promise<void> {
    const draft = this.rdiDraftService.getDraft(this.context.globalState, id);
    if (!draft) {
      this.post({ type: 'rdiError', message: `RDI draft not found: ${id}` });
      return;
    }
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      this.post({ type: 'rdiError', message: 'Azure DevOps settings not configured.' });
      return;
    }
    this.post({
      type: 'ADO_PROGRESS',
      payload: { busy: true, message: 'Pushing RDI to Azure DevOps…', scope: 'single' }
    });
    try {
      const result = await this.adoService.pushRdi(ctx.settings, ctx.pat, draft);
      const pushed: RdiDraft = { ...draft, status: 'pushed', updatedAt: new Date().toISOString() };
      await this.rdiDraftService.saveDraft(this.context.globalState, pushed);
      this.post({ type: 'rdiPushed', id, adoUrl: result.url });
      this.postToast('success', `RDI pushed to ADO — work item #${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'rdiError', message });
      this.postToast('error', `Failed to push RDI: ${message}`);
    } finally {
      this.post({
        type: 'ADO_PROGRESS',
        payload: { busy: false, message: '', scope: 'single' }
      });
    }
    await this.postState();
  }

  private async handleLoadRdiList(): Promise<void> {
    const drafts = this.rdiDraftService.listDrafts(this.context.globalState);
    this.post({ type: 'rdiListLoaded', drafts });
  }

  private async handleGetDefaultIteration(): Promise<void> {
    const ctx = await this.requireAdoContext();
    if (!ctx) {
      this.post({ type: 'rdiError', message: 'Azure DevOps settings not configured.' });
      return;
    }
    try {
      const iterationPath = await this.adoService.getDefaultIteration(ctx.settings, ctx.pat);
      this.post({ type: 'defaultIterationLoaded', iterationPath });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'rdiError', message });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ─── Feature Draft Persistence ───────────────────────────────────────────

  private getFeatureDrafts(): FeatureDraft[] {
    return this.context.globalState.get<FeatureDraft[]>('featureDrafts', []);
  }

  private async saveFeatureDrafts(features: FeatureDraft[]): Promise<void> {
    await this.context.globalState.update('featureDrafts', features);
  }

  // ─── Epic Draft Persistence ───────────────────────────────────────────────

  private getEpicDrafts(): EpicDraft[] {
    return this.context.globalState.get<EpicDraft[]>('epicDrafts', []);
  }

  private async saveEpicDrafts(epics: EpicDraft[]): Promise<void> {
    await this.context.globalState.update('epicDrafts', epics);
  }

  // ─── Epic Draft Handlers ──────────────────────────────────────────────────

  private async handleCreateEpicDraft(
    payload: {
      title: string;
      description: string;
      objectives: string[];
      scope: string;
      linkedFeatureIds: string[];
      selectedRepoIds: string[];
      estimatedVelocity?: number;
      targetDate?: string;
      aiGeneratedFeatures?: boolean;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const epic: EpicDraft = {
      ...payload,
      id: Date.now().toString(),
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
    const epics = this.getEpicDrafts();
    await this.saveEpicDrafts([...epics, epic]);
    this.post({ type: 'EPIC_DRAFT_CREATED', payload: epic });
    await this.postState();
  }

  private async handleUpdateEpicDraft(epic: EpicDraft): Promise<void> {
    const updated: EpicDraft = { ...epic, updatedAt: new Date().toISOString() };
    const epics = this.getEpicDrafts();
    const idx = epics.findIndex((e) => e.id === updated.id);
    if (idx === -1) {
      this.postToast('error', 'Epic draft not found.');
      return;
    }
    epics[idx] = updated;
    await this.saveEpicDrafts(epics);
    this.post({ type: 'EPIC_DRAFT_UPDATED', payload: updated });
    await this.postState();
  }

  private async handleDeleteEpicDraft(epicId: string): Promise<void> {
    const epics = this.getEpicDrafts().filter((e) => e.id !== epicId);
    await this.saveEpicDrafts(epics);

    // Clear parentEpicId on any linked features
    const features = this.getFeatureDrafts().map((f) =>
      f.parentEpicId === epicId ? { ...f, parentEpicId: undefined } : f
    );
    await this.saveFeatureDrafts(features);

    this.post({ type: 'EPIC_DRAFT_DELETED', payload: { epicId } });
    await this.postState();
  }

  private async handleLinkFeatureToEpic(epicId: string, featureId: string): Promise<void> {
    const epics = this.getEpicDrafts();
    const epicIdx = epics.findIndex((e) => e.id === epicId);
    if (epicIdx === -1) {
      this.postToast('error', 'Epic draft not found.');
      return;
    }
    const epic = epics[epicIdx];
    if (!epic.linkedFeatureIds.includes(featureId)) {
      epics[epicIdx] = {
        ...epic,
        linkedFeatureIds: [...epic.linkedFeatureIds, featureId],
        updatedAt: new Date().toISOString()
      };
      await this.saveEpicDrafts(epics);
    }

    const features = this.getFeatureDrafts().map((f) =>
      f.id === featureId ? { ...f, parentEpicId: epicId, updatedAt: new Date().toISOString() } : f
    );
    await this.saveFeatureDrafts(features);

    this.post({ type: 'FEATURE_LINKED_TO_EPIC', payload: { epicId, featureId } });
    await this.postState();
  }

  private async handleUnlinkFeatureFromEpic(epicId: string, featureId: string): Promise<void> {
    const epics = this.getEpicDrafts();
    const epicIdx = epics.findIndex((e) => e.id === epicId);
    if (epicIdx !== -1) {
      const epic = epics[epicIdx];
      epics[epicIdx] = {
        ...epic,
        linkedFeatureIds: epic.linkedFeatureIds.filter((id) => id !== featureId),
        updatedAt: new Date().toISOString()
      };
      await this.saveEpicDrafts(epics);
    }

    const features = this.getFeatureDrafts().map((f) =>
      f.id === featureId ? { ...f, parentEpicId: undefined, updatedAt: new Date().toISOString() } : f
    );
    await this.saveFeatureDrafts(features);

    this.post({ type: 'FEATURE_UNLINKED_FROM_EPIC', payload: { epicId, featureId } });
    await this.postState();
  }

  private async handleGenerateFeaturesFromEpic(
    payload: {
      epicId: string;
      title: string;
      description: string;
      objectives: string[];
      scope: string;
      selectedRepoIds: string[];
      featureCount?: number;
    }
  ): Promise<void> {
    const { epicId, title, description, objectives, scope, featureCount } = payload;

    this.post({ type: 'AI_PROGRESS', payload: { message: 'Generating features from epic…', busy: true } });
    const cts = new vscode.CancellationTokenSource();
    try {
      const rawSuggestions = await this.copilotService.generateFeaturesFromEpic(
        { title, description, objectives, scope },
        cts.token,
        { featureCount }
      );

      const suggestions = rawSuggestions.map((item, idx) => ({
        clientId: `${Date.now()}_${idx}`,
        title: item.title,
        description: item.description
      }));

      this.post({ type: 'EPIC_GENERATION_COMPLETE', payload: { epicId, suggestions } });
      this.postToast('success', `Generated ${suggestions.length} feature suggestions.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error generating features';
      this.post({ type: 'EPIC_GENERATION_ERROR', payload: { epicId, message } });
      this.postToast('error', message);
    } finally {
      cts.dispose();
      this.post({ type: 'AI_PROGRESS', payload: { message: '', busy: false } });
    }
  }

  private async handlePushEpicToAdo(epicId: string, pushChildren: boolean): Promise<void> {
    const epic = this.getEpicDrafts().find((e) => e.id === epicId);
    if (!epic) {
      this.postToast('error', 'Epic draft not found.');
      return;
    }

    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }

    const { settings, pat } = ctx;
    const orgUrl = settings.orgUrl.endsWith('/') ? settings.orgUrl.slice(0, -1) : settings.orgUrl;

    try {
      this.post({
        type: 'EPIC_PUSH_PROGRESS',
        payload: { epicId, phase: 'epic', current: 0, total: 1, message: 'Creating Epic in Azure DevOps…' }
      });
      this.postAdoProgress({ busy: true, message: 'Pushing Epic to Azure DevOps…', scope: 'single' });

      const result = await this.adoService.pushEpicHierarchy(
        settings,
        pat,
        epic,
        pushChildren ? this.getFeatureDrafts().filter((f) => epic.linkedFeatureIds.includes(f.id)) : [],
        pushChildren
      );

      const now = new Date().toISOString();
      const allFeaturesLinked = epic.linkedFeatureIds.length === 0 || result.featureResults.length >= epic.linkedFeatureIds.length;
      const hierarchyStatus: HierarchyStatus =
        epic.linkedFeatureIds.length === 0
          ? 'pushed'
          : result.featureErrors.length === 0 && allFeaturesLinked
          ? 'pushed'
          : 'partial';

      const updatedEpic: EpicDraft = {
        ...epic,
        adoId: result.epicWorkItemId,
        adoUrl: result.epicWorkItemUrl,
        status: hierarchyStatus,
        updatedAt: now
      };

      const epics = this.getEpicDrafts().map((e) => e.id === epicId ? updatedEpic : e);
      await this.saveEpicDrafts(epics);

      // Update feature ADO IDs from results
      if (result.featureResults.length > 0) {
        const features = this.getFeatureDrafts().map((f) => {
          const fr = result.featureResults.find((r) => r.featureId === f.id);
          if (!fr) { return f; }
          return { ...f, adoWorkItemId: fr.adoWorkItemId, hierarchyStatus: 'pushed' as HierarchyStatus, updatedAt: now };
        });
        await this.saveFeatureDrafts(features);
      }

      const linkedFeatureAdoIds: Record<string, number> = {};
      for (const fr of result.featureResults) {
        linkedFeatureAdoIds[fr.featureId] = fr.adoWorkItemId;
      }

      this.post({
        type: 'EPIC_PUSHED',
        payload: {
          epicId,
          adoWorkItemId: result.epicWorkItemId,
          adoWorkItemUrl: result.epicWorkItemUrl,
          linkedFeatureAdoIds,
          hierarchyStatus
        }
      });

      if (result.featureErrors.length > 0) {
        this.postToast('error', `Epic pushed as #${result.epicWorkItemId}. ${result.featureErrors.length} feature(s) failed.`);
      } else {
        this.postToast('success', `Epic pushed as #${result.epicWorkItemId} with ${result.featureResults.length} feature(s).`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'EPIC_PUSH_ERROR', payload: { epicId, message } });
      this.postToast('error', `Epic push failed: ${message}`);
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'single' });
    }
    await this.postState();
  }

  // ─── Feature Draft Handlers ───────────────────────────────────────────────

  private async handleCreateFeatureDraft(
    payload: Omit<FeatureDraft, 'id' | 'createdAt' | 'updatedAt' | 'hierarchyStatus'> & { hierarchyStatus?: HierarchyStatus }
  ): Promise<void> {
    const now = new Date().toISOString();
    const feature: FeatureDraft = {
      ...payload,
      id: Date.now().toString(),
      hierarchyStatus: payload.hierarchyStatus ?? 'draft',
      createdAt: now,
      updatedAt: now
    };
    const features = this.getFeatureDrafts();
    await this.saveFeatureDrafts([...features, feature]);
    this.post({ type: 'FEATURE_DRAFT_CREATED', payload: feature });
    await this.postState();
  }

  private async handleUpdateFeatureDraft(feature: FeatureDraft): Promise<void> {
    const updated: FeatureDraft = { ...feature, updatedAt: new Date().toISOString() };
    const features = this.getFeatureDrafts();
    const idx = features.findIndex((f) => f.id === updated.id);
    if (idx === -1) {
      this.postToast('error', 'Feature draft not found.');
      return;
    }
    features[idx] = updated;
    await this.saveFeatureDrafts(features);
    this.post({ type: 'FEATURE_DRAFT_UPDATED', payload: updated });
    await this.postState();
  }

  private async handleDeleteFeatureDraft(featureId: string): Promise<void> {
    const features = this.getFeatureDrafts().filter((f) => f.id !== featureId);
    await this.saveFeatureDrafts(features);

    // Clear parentFeatureId on any child PBIs
    const allDrafts = this.draftService.getAll(this.context.globalState);
    const cleared = allDrafts.map((d) =>
      d.parentFeatureId === featureId ? { ...d, parentFeatureId: undefined } : d
    );
    await this.draftService.saveAll(this.context.globalState, cleared);

    this.post({ type: 'FEATURE_DRAFT_DELETED', payload: { featureId } });
    await this.postState();
  }

  private async handleGenerateUserStoriesFromFeature(
    payload: { featureId: string; title: string; description: string; why?: string; userFlow?: string; businessRules?: string; repoIds: string[]; storyCount?: number; targetDate?: string }
  ): Promise<void> {
    const { featureId, storyCount } = payload;

    // Use inline payload data; fall back to global state if the feature is already saved
    const saved = this.getFeatureDrafts().find((f) => f.id === featureId);
    const now = new Date().toISOString();
    const feature: FeatureDraft = saved ?? {
      id: featureId,
      title: payload.title,
      description: payload.description,
      why: payload.why,
      userFlow: payload.userFlow,
      businessRules: payload.businessRules,
      repoIds: payload.repoIds,
      childPbiIds: [],
      hierarchyStatus: 'draft',
      createdAt: now,
      updatedAt: now,
      targetDate: payload.targetDate,
    };

    this.post({
      type: 'AI_PROGRESS',
      payload: { message: 'Generating user stories from feature…', busy: true }
    });
    const cts = new vscode.CancellationTokenSource();
    try {
      // Gather repo context from the first linked repo if available
      let linkedProjectContext: string | undefined;
      if (feature.repoIds.length > 0) {
        linkedProjectContext = await this.buildLinkedContextForProjectId(feature.repoIds[0]);
      }

      const stories = await this.copilotService.generateUserStoriesFromFeature(
        feature,
        cts.token,
        { storyCount, linkedProjectContext }
      );

      if (stories.length === 0) {
        this.post({ type: 'FEATURE_GENERATION_ERROR', payload: { featureId, message: 'AI did not generate any stories. Add more feature context and retry.' } });
        this.postToast('error', 'AI did not generate any stories. Add more feature context and retry.');
        return;
      }

      const ado = this.settingsService.getAdoSettings();
      const pbiNow = new Date().toISOString();
      const newPbis: PbiDraft[] = stories.map((s) => ({
        id: this.draftService.newId(),
        projectId: feature.repoIds[0] ?? 'standalone',
        title: s.title,
        description: s.description,
        effortDays: (Math.min(5, Math.max(1, s.effort)) as 1 | 2 | 3 | 4 | 5),
        acceptanceCriteria: [],
        testScenarios: [],
        iteration: iterationLeafFromPath(ado?.iterationPath) ?? this.defaultIteration(),
        workItemType: 'Product Backlog Item' as const,
        status: 'draft' as const,
        parentFeatureId: feature.id,
        updatedAt: pbiNow
      }));

      // Save new PBIs
      const existingDrafts = this.draftService.getAll(this.context.globalState);
      await this.draftService.saveAll(this.context.globalState, [...existingDrafts, ...newPbis]);

      // Upsert the feature in global state so child PBI IDs are persisted
      const updatedFeature: FeatureDraft = {
        ...feature,
        childPbiIds: [...feature.childPbiIds, ...newPbis.map((p) => p.id)],
        updatedAt: pbiNow
      };
      const existingFeatures = this.getFeatureDrafts();
      const featureIdx = existingFeatures.findIndex((f) => f.id === featureId);
      const updatedFeatures =
        featureIdx === -1
          ? [...existingFeatures, updatedFeature]
          : existingFeatures.map((f) => (f.id === featureId ? updatedFeature : f));
      await this.saveFeatureDrafts(updatedFeatures);

      this.post({ type: 'USER_STORIES_GENERATED', payload: { featureId, generatedDraftIds: newPbis.map((p) => p.id) } });
      this.postToast('success', `Generated ${newPbis.length} user stories from feature.`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error generating user stories';
      this.post({ type: 'FEATURE_GENERATION_ERROR', payload: { featureId, message: messageText } });
      this.postToast('error', messageText);
    } finally {
      cts.dispose();
      this.post({ type: 'AI_PROGRESS', payload: { message: '', busy: false } });
    }
    await this.postState();
  }

  private async handlePushFeatureToAdo(
    featureId: string,
    includeChildren: boolean,
    targetDate?: string
  ): Promise<void> {
    const feature = this.getFeatureDrafts().find((f) => f.id === featureId);
    if (!feature) {
      this.postToast('error', 'Feature draft not found.');
      return;
    }

    const ctx = await this.requireAdoContext();
    if (!ctx) {
      return;
    }

    const allDrafts = this.draftService.getAll(this.context.globalState);
    const childPbis = includeChildren
      ? allDrafts.filter((d) => feature.childPbiIds.includes(d.id))
      : [];
    const total = childPbis.length;

    try {
      this.postAdoProgress({ busy: true, message: 'Pushing feature to Azure DevOps…', scope: 'single' });

      // Emit progress for each child PBI
      let progress = 0;
      for (const pbi of childPbis) {
        this.post({
          type: 'FEATURE_PUSH_PROGRESS',
          payload: { featureId, phase: 'children', current: progress, total, message: `Pushing "${pbi.title}"…` }
        });
        progress++;
      }

      const result = await this.adoService.pushFeatureHierarchy(
        ctx.settings,
        ctx.pat,
        feature,
        childPbis,
        targetDate ?? feature.targetDate
      );

      // Persist updated feature
      const now = new Date().toISOString();
      const hierarchyStatus: HierarchyStatus =
        result.errors.length === 0
          ? 'pushed'
          : result.childResults.length > 0
          ? 'partial'
          : 'partial';

      const updatedFeature: FeatureDraft = {
        ...feature,
        adoWorkItemId: result.featureWorkItemId,
        adoWorkItemUrl: result.featureWorkItemUrl,
        hierarchyStatus,
        updatedAt: now
      };
      const features = this.getFeatureDrafts().map((f) =>
        f.id === featureId ? updatedFeature : f
      );
      await this.saveFeatureDrafts(features);

      // Persist updated child PBIs
      if (result.childResults.length > 0) {
        const childAdoIds: Record<string, number> = {};
        const updatedDrafts = allDrafts.map((d) => {
          const match = result.childResults.find((r) => r.draftId === d.id);
          if (!match) { return d; }
          childAdoIds[d.id] = match.workItemId;
          return {
            ...d,
            adoWorkItemId: match.workItemId,
            adoWorkItemUrl: match.workItemUrl,
            status: 'pushed' as const,
            updatedAt: now
          };
        });
        await this.draftService.saveAll(this.context.globalState, updatedDrafts);
      }

      const childAdoIds: Record<string, number> = {};
      for (const r of result.childResults) {
        childAdoIds[r.draftId] = r.workItemId;
      }

      this.post({
        type: 'FEATURE_PUSHED',
        payload: {
          featureId,
          adoWorkItemId: result.featureWorkItemId,
          adoWorkItemUrl: result.featureWorkItemUrl,
          childAdoIds,
          hierarchyStatus
        }
      });

      if (result.errors.length > 0) {
        this.postToast(
          'error',
          `Feature pushed as #${result.featureWorkItemId}. ${result.errors.length} child(ren) failed.`
        );
      } else {
        this.postToast(
          'success',
          `Feature pushed as #${result.featureWorkItemId} with ${result.childResults.length} child(ren).`
        );
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';
      this.postToast('error', `Feature push failed: ${messageText}`);
    } finally {
      this.postAdoProgress({ busy: false, message: '', scope: 'single' });
    }
    await this.postState();
  }

  // ───────────────────────────────────────────────────────────────────────────

  private async postState(): Promise<void> {
    const pat = await this.secretStorage.getAdoPat();
    const payload: ExtensionEvent = {
      type: 'STATE_UPDATED',
      payload: {
        projects: this.importService.getProjects(),
        linkTargets: await this.importService.getLinkTargets(),
        pbiDrafts: this.draftService.getAll(this.context.globalState),
        rdiDrafts: this.rdiDraftService.listDrafts(this.context.globalState),
        featureDrafts: this.getFeatureDrafts(),
        epicDrafts: this.getEpicDrafts(),
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

  private async handleFetchTeams(): Promise<void> {
    if (!this.patValidatedThisSession) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'teams', error: 'Please validate PAT in Settings first.' }
      });
      return;
    }

    const ctx = await this.requireAdoContext();
    if (!ctx) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'teams', error: 'Azure DevOps settings not configured' }
      });
      return;
    }

    try {
      const cached = await this.getCachedData('ado.cache.teams');
      if (cached) {
        this.post({ type: 'ADO_TEAMS_RESULT', payload: cached });
        return;
      }

      const teams = await this.adoService.fetchTeams(ctx.settings, ctx.pat);
      await this.setCachedData('ado.cache.teams', teams);
      this.post({ type: 'ADO_TEAMS_RESULT', payload: teams });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'FETCH_FAILED', payload: { type: 'teams', error: message } });
    }
  }

  private async handleFetchAreaPaths(teamId?: string): Promise<void> {
    if (!this.patValidatedThisSession) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'areas', error: 'Please validate PAT in Settings first.' }
      });
      return;
    }

    const ctx = await this.requireAdoContext();
    if (!ctx) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'areas', error: 'Azure DevOps settings not configured' }
      });
      return;
    }

    try {
      const cached = await this.getCachedData('ado.cache.areas');
      if (cached) {
        this.post({ type: 'ADO_AREA_PATHS_RESULT', payload: cached });
        return;
      }

      const areas = await this.adoService.fetchAreaPaths(ctx.settings, ctx.pat, teamId);
      await this.setCachedData('ado.cache.areas', areas);
      this.post({ type: 'ADO_AREA_PATHS_RESULT', payload: areas });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'FETCH_FAILED', payload: { type: 'areas', error: message } });
    }
  }

  private async handleFetchIterations(teamId?: string): Promise<void> {
    if (!this.patValidatedThisSession) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'iterations', error: 'Please validate PAT in Settings first.' }
      });
      return;
    }

    const ctx = await this.requireAdoContext();
    if (!ctx) {
      this.post({
        type: 'FETCH_FAILED',
        payload: { type: 'iterations', error: 'Azure DevOps settings not configured' }
      });
      return;
    }

    try {
      const cached = await this.getCachedData('ado.cache.iterations');
      if (cached) {
        this.post({ type: 'ADO_ITERATIONS_RESULT', payload: cached });
        return;
      }

      const iterations = await this.adoService.fetchIterations(ctx.settings, ctx.pat, teamId);
      await this.setCachedData('ado.cache.iterations', iterations);
      this.post({ type: 'ADO_ITERATIONS_RESULT', payload: iterations });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.post({ type: 'FETCH_FAILED', payload: { type: 'iterations', error: message } });
    }
  }

  private async getCachedData(key: string): Promise<string[] | null> {
    const cached = this.context.globalState.get<{ data: string[]; fetchedAt: number }>(key);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.fetchedAt;
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (age < thirtyMinutes) {
      return cached.data;
    }

    return null;
  }

  private async setCachedData(key: string, data: string[]): Promise<void> {
    await this.context.globalState.update(key, {
      data,
      fetchedAt: Date.now()
    });
  }

  public async clearAdoCache(): Promise<void> {
    await this.context.globalState.update('ado.cache.teams', undefined);
    await this.context.globalState.update('ado.cache.areas', undefined);
    await this.context.globalState.update('ado.cache.iterations', undefined);
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
  team?: string;
  areaPath?: string;
  iterationPath?: string;
  defaultWorkItemType?: AdoSettings['defaultWorkItemType'];
  pat?: string;
};

