// Minimal vscode mock for unit tests
const vscode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  ExtensionContext: jest.fn(),
  Uri: {
    file: jest.fn((p: string) => ({ fsPath: p })),
    joinPath: jest.fn(),
  },
  ViewColumn: { One: 1 },
  workspace: {
    getConfiguration: jest.fn(() => ({ get: jest.fn() })),
  },
};

module.exports = vscode;
