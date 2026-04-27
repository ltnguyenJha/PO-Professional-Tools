import * as vscode from 'vscode';
import { AdoSettings, ThemePreference, UiSettings } from '../shared/messages';

const ADO_SETTINGS_KEY = 'poTools.ado.settings';
const UI_SETTINGS_KEY = 'poTools.ui.settings';

const DEFAULT_UI: UiSettings = { theme: 'auto' };

export class SettingsService {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public getAdoSettings(): AdoSettings | undefined {
    return this.context.globalState.get<AdoSettings | undefined>(ADO_SETTINGS_KEY, undefined);
  }

  public async saveAdoSettings(settings: AdoSettings): Promise<void> {
    await this.context.globalState.update(ADO_SETTINGS_KEY, settings);
  }

  public getUiSettings(): UiSettings {
    return this.context.globalState.get<UiSettings>(UI_SETTINGS_KEY, DEFAULT_UI);
  }

  public async setTheme(theme: ThemePreference): Promise<void> {
    const current = this.getUiSettings();
    await this.context.globalState.update(UI_SETTINGS_KEY, { ...current, theme });
  }
}
