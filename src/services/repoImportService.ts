import * as path from 'path';
import * as vscode from 'vscode';
import { ImportedProject, ProjectScanSummary } from '../shared/messages';

const PROJECTS_KEY = 'poTools.projects';

export class RepoImportService {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public async importProjectFromFolderPicker(): Promise<ImportedProject | null> {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Import Project Folder'
    });

    if (!selection || selection.length === 0) {
      return null;
    }

    const folder = selection[0];
    const project: ImportedProject = {
      id: this.createId(folder.fsPath),
      name: path.basename(folder.fsPath),
      path: folder.fsPath,
      detectedStack: await this.detectTechStack(folder),
      lastScannedAt: new Date().toISOString()
    };

    const current = this.getProjects();
    const exists = current.some((p) => p.path.toLowerCase() === project.path.toLowerCase());
    if (exists) {
      return null;
    }

    const updated = [...current, project];
    await this.context.globalState.update(PROJECTS_KEY, updated);
    return project;
  }

  public getProjects(): ImportedProject[] {
    return this.context.globalState.get<ImportedProject[]>(PROJECTS_KEY, []);
  }

  public async markScanned(projectId: string, scanSummary: ProjectScanSummary): Promise<void> {
    const projects = this.getProjects();
    const updated = projects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            lastScannedAt: new Date().toISOString(),
            scanSummary
          }
        : project
    );
    await this.context.globalState.update(PROJECTS_KEY, updated);
  }

  private createId(rawPath: string): string {
    return Buffer.from(rawPath).toString('base64url').slice(0, 24);
  }

  private async detectTechStack(folder: vscode.Uri): Promise<string[]> {
    const stack = new Set<string>();
    const checks: Array<[string, string]> = [
      ['package.json', 'JavaScript/TypeScript'],
      ['*.sln', '.NET'],
      ['*.csproj', '.NET'],
      ['*.sql', 'SQL']
    ];

    for (const [pattern, label] of checks) {
      const results = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, `**/${pattern}`),
        '**/node_modules/**',
        1
      );
      if (results.length > 0) {
        stack.add(label);
      }
    }

    if (stack.size === 0) {
      stack.add('Unknown');
    }

    return [...stack];
  }
}
