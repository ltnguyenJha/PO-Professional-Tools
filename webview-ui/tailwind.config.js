/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  // Disable Tailwind's base reset — VS Code controls root styles in webviews.
  // Enabling preflight would override VS Code's injected element styling.
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      // ─── VS Code Bridge Color Tokens ────────────────────────────────────
      // These reference CSS custom properties defined in src/styles/tailwind.css
      // that in turn map to VS Code's --vscode-* theme variables.
      // Usage: bg-tw-bg, text-tw-fg, border-tw-border, etc.
      colors: {
        'tw-bg':         'var(--tw-vscode-bg)',
        'tw-bg-alt':     'var(--tw-vscode-bg-alt)',
        'tw-fg':         'var(--tw-vscode-fg)',
        'tw-fg-muted':   'var(--tw-vscode-fg-muted)',
        'tw-border':     'var(--tw-vscode-border)',
        'tw-accent':     'var(--tw-vscode-accent)',
        'tw-accent-fg':  'var(--tw-vscode-accent-fg)',
        'tw-success':    'var(--tw-vscode-success)',
        'tw-success-bg': 'var(--tw-vscode-success-bg)',
        'tw-warning':    'var(--tw-vscode-warning)',
        'tw-warning-bg': 'var(--tw-vscode-warning-bg)',
        'tw-info':       'var(--tw-vscode-info)',
        'tw-info-bg':    'var(--tw-vscode-info-bg)',
        'tw-error':      'var(--tw-vscode-error)',
        'tw-error-bg':   'var(--tw-vscode-error-bg)',
      },

      // ─── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--vscode-font-family)', 'system-ui', 'sans-serif'],
        mono: ['var(--vscode-editor-font-family)', 'monospace'],
      },

      // ─── Custom Breakpoints ─────────────────────────────────────────────
      // panel-wide: two-column layout threshold for VS Code webview panels
      screens: {
        'panel-wide': '700px',
      },
    },
  },

  plugins: [],
};
