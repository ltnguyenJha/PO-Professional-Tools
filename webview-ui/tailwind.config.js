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
      // Usage: bg-tw-bg, text-tw-fg, bg-tw-surface, border-tw-border, etc.
      colors: {
        'tw-bg':          'var(--tw-vscode-bg)',
        'tw-bg-alt':      'var(--tw-vscode-bg-alt)',
        'tw-surface':     'var(--tw-vscode-surface)',
        'tw-fg':          'var(--tw-vscode-fg)',
        'tw-fg-muted':    'var(--tw-vscode-fg-muted)',
        'tw-muted':       'var(--tw-vscode-muted)',
        'tw-border':      'var(--tw-vscode-border)',
        'tw-accent':      'var(--tw-vscode-accent)',
        'tw-accent-fg':   'var(--tw-vscode-accent-fg)',
        'tw-success':     'var(--tw-vscode-success)',
        'tw-success-bg':  'var(--tw-vscode-success-bg)',
        'tw-warning':     'var(--tw-vscode-warning)',
        'tw-warning-bg':  'var(--tw-vscode-warning-bg)',
        'tw-info':        'var(--tw-vscode-info)',
        'tw-info-bg':     'var(--tw-vscode-info-bg)',
        'tw-error':       'var(--tw-vscode-error)',
        'tw-error-bg':    'var(--tw-vscode-error-bg)',
        // ─── WCAG AA interactive tokens ──────────────────────────────────
        'tw-input-bg':    'var(--tw-vscode-input-bg)',
        'tw-input-fg':    'var(--tw-vscode-input-fg)',
        'tw-input-border': 'var(--tw-vscode-input-border)',
        'tw-hover':       'var(--tw-vscode-hover)',
        'tw-selected':    'var(--tw-vscode-selected)',
        'tw-selected-fg': 'var(--tw-vscode-selected-fg)',
        'tw-badge-bg':    'var(--tw-vscode-badge-bg)',
        'tw-badge-fg':    'var(--tw-vscode-badge-fg)',
      },

      // ─── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--vscode-font-family)', 'system-ui', 'sans-serif'],
        mono: ['var(--vscode-editor-font-family)', 'monospace'],
      },

      // ─── Font Size Scale (VS Code webview optimised) ─────────────────────
      fontSize: {
        'xs':   ['11px', { lineHeight: '1.4' }],
        'sm':   ['12px', { lineHeight: '1.5' }],
        'base': ['13px', { lineHeight: '1.6' }],
        'md':   ['14px', { lineHeight: '1.6' }],
        'lg':   ['16px', { lineHeight: '1.5' }],
        'xl':   ['18px', { lineHeight: '1.4' }],
        '2xl':  ['20px', { lineHeight: '1.3' }],
        '3xl':  ['24px', { lineHeight: '1.2' }],
      },

      // ─── Spacing Scale (4px base, modular) ──────────────────────────────
      spacing: {
        '0.5': '2px',  '1': '4px',   '1.5': '6px',  '2': '8px',   '2.5': '10px',
        '3':   '12px', '3.5': '14px','4': '16px',   '5': '20px',  '6': '24px',
        '7':   '28px', '8': '32px',  '9': '36px',   '10': '40px', '11': '44px',
        '12':  '48px', '14': '56px', '16': '64px',  '20': '80px', '24': '96px',
      },

      // ─── Touch Target Minimums (WCAG 2.1 SC 2.5.5 — 44×44px) ───────────
      minHeight: { 'touch': '44px' },
      minWidth:  { 'touch': '44px' },

      // ─── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        'none': '0',   'sm': '2px',  DEFAULT: '4px', 'md': '6px',
        'lg':   '8px', 'xl': '12px', '2xl': '16px',  'full': '9999px',
      },

      // ─── Box Shadows (subtle, VS Code native feel) ───────────────────────
      boxShadow: {
        'sm':     '0 1px 2px rgba(0,0,0,0.08)',
        DEFAULT:  '0 2px 4px rgba(0,0,0,0.12)',
        'md':     '0 4px 8px rgba(0,0,0,0.16)',
        'lg':     '0 8px 16px rgba(0,0,0,0.20)',
        'focus':  '0 0 0 2px var(--vscode-focusBorder)',
        'none':   'none',
      },

      // ─── Transitions (purposeful, ≤300ms) ───────────────────────────────
      transitionDuration: {
        DEFAULT: '200ms',
        fast:    '150ms',
        base:    '200ms',
        slow:    '300ms',
      },
      transitionTimingFunction: {
        DEFAULT:      'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Animation Presets ───────────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 200ms ease-out',
        'slide-down': 'slideDown 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up':   'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'spin-slow':  'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)',  opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },

      // ─── Screens (responsive breakpoints) ───────────────────────────────
      // panel-wide: two-column layout threshold for VS Code webview panels
      screens: {
        'sm':         '480px',
        'md':         '640px',
        'lg':         '768px',
        'xl':         '1024px',
        '2xl':        '1280px',
        'panel-wide': '700px',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
  ],
};
