import * as vscode from 'vscode';

const ADO_PAT_KEY = 'poTools.ado.pat';

export class SecretStorageService {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public async saveAdoPat(pat: string): Promise<void> {
    await this.context.secrets.store(ADO_PAT_KEY, pat);
  }

  public async getAdoPat(): Promise<string | undefined> {
    const value = await this.context.secrets.get(ADO_PAT_KEY);
    return value ?? undefined;
  }
}
