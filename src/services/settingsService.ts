import * as vscode from 'vscode';
import { AdoSettings } from '../shared/messages';

const ADO_SETTINGS_KEY = 'poTools.ado.settings';

export class SettingsService {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public getAdoSettings(): AdoSettings | undefined {
    return this.context.globalState.get<AdoSettings | undefined>(ADO_SETTINGS_KEY, undefined);
  }

  public async saveAdoSettings(settings: AdoSettings): Promise<void> {
    await this.context.globalState.update(ADO_SETTINGS_KEY, settings);
  }
}
