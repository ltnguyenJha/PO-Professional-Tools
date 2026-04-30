# Decision: CSS Consistency — Tailwind Bridge + Light Mode Audit

**Author:** Saul (UI Designer)  
**Date:** 2026-05-01  
**Status:** Implemented  
**Branch:** feature/saul-tailwind-dashboard-redesign

---

## Problem

The app runs two CSS systems side-by-side:
1. **Legacy (`styles.css`)** — `[data-theme]` data-attribute tokens used by old views
2. **Tailwind bridge (`tailwind.css`)** — `--tw-vscode-*` vars used by new Tailwind components

Additionally, the `body.vscode-light` overrides in `tailwind.css` were incomplete — only status foreground/background colors were overridden, leaving surface, text, and border vars at their dark-mode fallback values.

---

## Decisions Made

### 1. `.vscode/settings.json` — Suppress @tailwind IDE Warnings
- Added `css.validate: false` and `css.customData` pointing to a Tailwind custom data file
- Suppresses VS Code CSS language server "Unknown at rule" warnings for `@tailwind` directives
- **Rationale:** These are false-positive IDE warnings; the build is unaffected. Leaving them creates noise for developers.

### 2. Complete `body.vscode-light` Overrides in `tailwind.css`
All bridge variables now have explicit light-mode declarations:

| Variable | Old (`:root` fallback used) | New (light-safe) |
|---|---|---|
| `--tw-vscode-bg` | `#1e1e1e` | `var(--vscode-editor-background, #ffffff)` |
| `--tw-vscode-bg-alt` | `#252526` | `var(--vscode-sideBar-background, #f3f3f3)` |
| `--tw-vscode-surface` | *(new)* | `var(--vscode-editorWidget-background, #f5f5f5)` |
| `--tw-vscode-fg` | `#d4d4d4` | `var(--vscode-editor-foreground, #1f1f1f)` |
| `--tw-vscode-fg-muted` | `#858585` | `var(--vscode-descriptionForeground, #717171)` |
| `--tw-vscode-border` | `var(--vscode-panel-border, ...)` | `var(--vscode-widget-border, ...)` — more reliable in light themes |
| `--tw-vscode-input-bg` | `#3c3c3c` | `var(--vscode-input-background, #ffffff)` |

- **Rationale:** `--vscode-panel-border` can be transparent in some VS Code light themes; `--vscode-widget-border` is consistently visible. All dark-theme fallbacks were wrong for light mode.

### 3. New `--tw-vscode-surface` Token
- Added as a third surface layer (bg → bg-alt → surface) for card/panel backgrounds
- Maps to `--vscode-editorWidget-background`
- Exposed as `bg-tw-surface` Tailwind utility
- **Rationale:** Components need a distinct card surface that differs from accordion headers. Previously, `--tw-vscode-bg` and `--tw-vscode-bg-alt` were the only options, causing all surfaces to look identical.

### 4. Design System SKILL.md Created
- Created `.squad/skills/design-system/SKILL.md` as canonical token reference for the team
- Documents both legacy and bridge systems, shows alignment between them
- Includes Do/Don't table, component patterns, and WCAG AA compliance table
- **Rationale:** Without a reference, Rusty and future agents will keep guessing at token names and accidentally use hardcoded colors or wrong tokens for different themes.

### 5. `tw-muted` Alias Added to Tailwind Config
- `tw-muted` is an alias for `tw-fg-muted` (both map to `--tw-vscode-fg-muted`)
- Matches the naming used in the design token comment block for Rusty's reference
- **Rationale:** The SKILL.md documents `--tw-vscode-muted` as the semantic name; `tw-muted` as the class. Keeping `tw-fg-muted` as well prevents breaking existing component code.

---

## Files Changed

- `.vscode/settings.json` — **created**
- `.vscode/tailwind-css-data.json` — **created**
- `webview-ui/src/styles/tailwind.css` — light mode complete override, new `--tw-vscode-surface` var, comprehensive doc comment
- `webview-ui/tailwind.config.js` — added `tw-surface`, `tw-muted` color entries
- `.squad/skills/design-system/SKILL.md` — **created**

---

## Non-Decisions (Rejected Approaches)

- **Merging the two CSS systems:** Too high risk / effort. The legacy system is deeply embedded in PBI Studio. Bridge stays in Tailwind, legacy stays in styles.css — just aligned to same VS Code tokens.
- **Renaming `--tw-vscode-fg-muted` → `--tw-vscode-muted`:** Would require touching all component files. Added alias instead.
- **Using `color-mix()` for soft backgrounds:** Not reliable across all VS Code webview engines; hardcoded rgba is more predictable.
