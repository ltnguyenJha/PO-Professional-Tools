import type { ReactNode } from 'react';
import type { ThemePreference } from '../types';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_OPTIONS = ['light', 'dark', 'auto'] as const;

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

export function Topbar({ title, subtitle, actions, theme, onThemeChange }: Props): JSX.Element {
  return (
    <header
      className="topbar topbar-energy-accent sticky top-0 z-10 border-b border-tw-border bg-tw-bg-alt shadow-tw-sm"
      role="banner"
    >
      <div className="topbar-content">
        <div className="min-w-0">
          <h2 className="text-tw-fg text-lg font-semibold leading-snug">{title}</h2>
          {subtitle && (
            <div className="hint text-contrast-muted text-sm mt-0.5" role="doc-subtitle">
              {subtitle}
            </div>
          )}
        </div>
        <div className="topbar-actions shrink-0" role="toolbar" aria-label="Page actions">
          {actions}
          <div className="theme-toggle" role="group" aria-label="Theme selection">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="focus-tw-ring-inset"
                aria-pressed={theme === option}
                aria-label={`Switch to ${option} theme`}
                onClick={() => onThemeChange(option)}
              >
                {THEME_LABELS[option]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
