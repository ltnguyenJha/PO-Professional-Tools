import { useEffect } from 'react';
import type { ThemePreference } from '../types';

function resolveAutoTheme(): 'light' | 'dark' {
  const body = document.body;
  if (body.classList.contains('vscode-dark') || body.classList.contains('vscode-high-contrast')) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  const effective = preference === 'auto' ? resolveAutoTheme() : preference;
  root.setAttribute('data-theme', effective);
}

interface Props {
  theme: ThemePreference;
}

export function ThemeEffect({ theme }: Props): null {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'auto') {
      return;
    }
    const observer = new MutationObserver(() => applyTheme('auto'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  return null;
}
