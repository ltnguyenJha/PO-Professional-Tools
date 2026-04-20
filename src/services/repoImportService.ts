import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { ImportedProject, ProjectScanSummary } from '../shared/messages';

const PROJECTS_KEY = 'poTools.projects';

/** Skip noisy dirs when scanning for nested git repos under a workspace root. */
const LINK_SCAN_SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'bin',
  'obj',
  '__pycache__',
  'vendor',
  'packages'
]);

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
      lastScannedAt: undefined
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

  /**
   * Imported repos plus git repos under the VS Code workspace (roots, siblings, and one nested level).
   * Opening a parent folder only adds one workspace root, so we scan for `.git` under each root.
   */
  public async getLinkTargets(): Promise<ImportedProject[]> {
    const imported = this.getProjects();
    const seen = new Set(imported.map((p) => p.path.toLowerCase()));
    const result: ImportedProject[] = [...imported];

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const discovered = await this.collectGitReposUnderFolder(folder.uri.fsPath, folder.name);
      for (const proj of discovered) {
        const key = proj.path.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push(proj);
      }
    }
    return result;
  }

  /** Git repo at `workspaceRoot`, immediate children with `.git`, and grandchildren (depth 2). */
  private async collectGitReposUnderFolder(
    workspaceRoot: string,
    workspaceLabel: string
  ): Promise<ImportedProject[]> {
    const out: ImportedProject[] = [];
    const add = (fsPath: string, name: string): void => {
      out.push({
        id: this.createId(fsPath),
        name,
        path: fsPath,
        detectedStack: [],
        lastScannedAt: undefined
      });
    };

    if (await this.pathHasGit(workspaceRoot)) {
      add(workspaceRoot, path.basename(workspaceRoot));
    }

    const depth1 = await this.readLinkScanDirs(workspaceRoot);
    for (const d of depth1) {
      if (await this.pathHasGit(d.fullPath)) {
        add(d.fullPath, d.name);
      }
    }

    for (const d of depth1) {
      if (await this.pathHasGit(d.fullPath)) {
        continue;
      }
      const depth2 = await this.readLinkScanDirs(d.fullPath);
      for (const d2 of depth2) {
        if (await this.pathHasGit(d2.fullPath)) {
          add(d2.fullPath, `${d.name} / ${d2.name}`);
        }
      }
    }

    if (out.length === 0 && !(await this.pathHasGit(workspaceRoot))) {
      add(workspaceRoot, workspaceLabel);
    }

    return out;
  }

  private async pathHasGit(dirPath: string): Promise<boolean> {
    try {
      const st = await fs.stat(path.join(dirPath, '.git'));
      return st.isFile() || st.isDirectory();
    } catch {
      return false;
    }
  }

  private async readLinkScanDirs(
    dirPath: string
  ): Promise<Array<{ name: string; fullPath: string }>> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const out: Array<{ name: string; fullPath: string }> = [];
      for (const ent of entries) {
        if (!ent.isDirectory()) {
          continue;
        }
        if (ent.name.startsWith('.')) {
          continue;
        }
        if (LINK_SCAN_SKIP.has(ent.name)) {
          continue;
        }
        out.push({ name: ent.name, fullPath: path.join(dirPath, ent.name) });
      }
      return out;
    } catch {
      return [];
    }
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

  public async removeProject(projectId: string): Promise<ImportedProject | undefined> {
    const projects = this.getProjects();
    const removed = projects.find((p) => p.id === projectId);
    if (!removed) {
      return undefined;
    }
    const updated = projects.filter((project) => project.id !== projectId);
    await this.context.globalState.update(PROJECTS_KEY, updated);
    return removed;
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
