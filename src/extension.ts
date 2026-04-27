import * as vscode from 'vscode';
import { DashboardPanel } from './panels/DashboardPanel';
import { RepoImportService } from './services/repoImportService';

export function activate(context: vscode.ExtensionContext): void {
  const importService = new RepoImportService(context);

  const openDashboard = vscode.commands.registerCommand('po-tools.openDashboard', () => {
    DashboardPanel.createOrShow(context, importService);
  });

  const openPbiStudio = vscode.commands.registerCommand('po-tools.openPbiStudio', () => {
    DashboardPanel.createOrShow(context, importService);
  });

  const openBulkBreakdown = vscode.commands.registerCommand('po-tools.openBulkBreakdown', () => {
    DashboardPanel.createOrShow(context, importService);
  });

  context.subscriptions.push(openDashboard, openPbiStudio, openBulkBreakdown);
}

export function deactivate(): void {
  // No-op
}
