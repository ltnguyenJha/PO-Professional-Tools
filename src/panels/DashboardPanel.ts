import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionEvent, WebviewRequest } from '../shared/messages';
import { AdoService } from '../services/adoService';
import { CodeAnalyzer } from '../services/codeAnalyzer';
import { PbiDraftService } from '../services/pbiDraftService';
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
    private readonly adoService: AdoService = new AdoService()
  ) {
    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewRequest) => {
        await this.handleMessage(message);
      },
      null,
      this.disposables
    );
  }

  private async handleMessage(message: WebviewRequest): Promise<void> {
    switch (message.type) {
      case 'APP_READY': {
        this.postState();
        return;
      }
      case 'IMPORT_PROJECT': {
        const imported = await this.importService.importProjectFromFolderPicker();
        if (!imported) {
          this.postToast('info', 'No new project was imported.');
        } else {
          this.postToast('info', `Imported project: ${imported.name}`);
        }
        this.postState();
        return;
      }
      case 'SCAN_PROJECT': {
        const project = this.importService
          .getProjects()
          .find((item) => item.id === message.payload.projectId);

        if (!project) {
          this.postToast('error', 'Project not found.');
          return;
        }

        const summary = this.analyzer.analyzeProject(project.path);
        await this.importService.markScanned(message.payload.projectId, summary);
        this.postToast(
          'info',
          `Scan completed. Found ${summary.routes.length} routes, ${summary.apiEndpoints.length} API endpoints, and ${summary.sqlObjects.length} SQL objects.`
        );
        this.postState();
        return;
      }
      case 'GENERATE_PBI_DRAFTS': {
        const project = this.importService
          .getProjects()
          .find((item) => item.id === message.payload.projectId);

        if (!project) {
          this.postToast('error', 'Project not found.');
          return;
        }

        const drafts = this.draftService.buildDrafts(project);
        const existing = this.draftService.getAll(this.context.globalState);
        const filtered = existing.filter((draft) => draft.projectId !== project.id);
        await this.draftService.saveAll(this.context.globalState, [...filtered, ...drafts]);

        this.postToast('info', `Generated ${drafts.length} concise PBI drafts for ${project.name}.`);
        this.postState();
        return;
      }
      case 'SAVE_ADO_SETTINGS': {
        const { pat, ...rest } = message.payload;
        if (pat && pat.trim().length > 0) {
          await this.secretStorage.saveAdoPat(pat.trim());
        }
        await this.settingsService.saveAdoSettings(rest);
        this.postToast('info', 'Azure DevOps settings saved.');
        this.postState();
        return;
      }
      case 'PUSH_PROJECT_TO_ADO': {
        const project = this.importService
          .getProjects()
          .find((item) => item.id === message.payload.projectId);
        if (!project) {
          this.postToast('error', 'Project not found.');
          return;
        }

        const settings = this.settingsService.getAdoSettings();
        if (!settings?.orgUrl || !settings.projectName) {
          this.postToast('error', 'Azure DevOps settings are incomplete.');
          return;
        }

        const pat = await this.secretStorage.getAdoPat();
        if (!pat) {
          this.postToast('error', 'Azure DevOps PAT is missing. Save settings with PAT first.');
          return;
        }

        const drafts = this.draftService
          .getAll(this.context.globalState)
          .filter((draft) => draft.projectId === project.id);

        if (drafts.length === 0) {
          this.postToast('error', 'No PBI drafts found for this project.');
          return;
        }

        try {
          const result = await this.adoService.pushDrafts(settings, pat, drafts);
          this.postToast('info', `Pushed ${result.createdIds.length} work items to Azure DevOps.`);
        } catch (error) {
          const messageText = error instanceof Error ? error.message : 'Unknown error';
          this.postToast('error', `Failed to push to Azure DevOps: ${messageText}`);
        }

        this.postState();
        return;
      }
      default:
        return;
    }
  }

  private postState(): void {
    const payload: ExtensionEvent = {
      type: 'STATE_UPDATED',
      payload: {
        projects: this.importService.getProjects(),
        pbiDrafts: this.draftService.getAll(this.context.globalState),
        adoSettings: this.settingsService.getAdoSettings()
      }
    };
    this.panel.webview.postMessage(payload);
  }

  private postToast(level: 'info' | 'error', message: string): void {
    const payload: ExtensionEvent = {
      type: 'TOAST',
      payload: { level, message }
    };
    this.panel.webview.postMessage(payload);
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
