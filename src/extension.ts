import * as vscode from 'vscode';
import { DashboardPanel } from './panels/DashboardPanel';
import { RepoImportService } from './services/repoImportService';

export function activate(context: vscode.ExtensionContext): void {
  const importService = new RepoImportService(context);

  const openDashboard = vscode.commands.registerCommand('po-tools.openDashboard', () => {
    DashboardPanel.createOrShow(context, importService);
  });

  context.subscriptions.push(openDashboard);
}

export function deactivate(): void {
  // No-op
}
