# Development Guide

This guide covers local setup, build, and debug for developers working on PO Professional Tools.

---

## Prerequisites

- **Node.js 20+** — Download from nodejs.org.
- **VS Code 1.96+** — For debugging and running the extension.
- **GitHub Copilot + Copilot Chat extensions** — Installed and signed in.
- **Git** — To clone the repository.

---

## Install Dependencies

```powershell
# Install root dependencies
npm install

# Install webview dependencies (React, Vite, etc.)
npm install --prefix webview-ui
```

---

## Build Commands

```powershell
# Full build (extension + webview)
npm run build

# Watch extension files (rebuild on change)
npm run watch

# Watch webview files (Vite dev server)
npm run watch:webview

# Lint TypeScript
npm lint

# Package as VSIX for distribution
npm run package
```

---

## Debug Configuration

### Option 1: F5 Launch (Recommended)

1. Open this folder in VS Code.
2. Go to **Run and Debug** (or press `Ctrl+Shift+D`).
3. Select **"Run Extension (Clean)"** from the dropdown.
4. Press `F5` to start the Extension Development Host.
5. In the new VS Code window, open Command Palette (`Ctrl+Shift+P`) and run:
   - **PO Tools: Open Dashboard** — Main UI.
   - **PO Tools: Open PBI Studio** — Story editor.
   - **PO Tools: Open Bulk Breakdown** — Feature breakdown tool.

### Option 2: Attach to Running Process

If the extension is already running:
1. Select **"Attach"** from the Debug dropdown.
2. Press `F5`.

---

## File Structure

```
src/
├── extension.ts          # Entry point; registers commands and panels
├── panels/               # Panel classes (DashboardPanel, PbiStudioPanel, etc.)
├── services/             # Business logic (CopilotService, AdoService, ScannerService)
└── shared/               # Shared types and utilities

webview-ui/
├── src/
│   ├── App.tsx           # Root React component
│   ├── main.tsx          # React entry point (mounted in extension's HTML)
│   ├── components/       # Reusable UI components (Buttons, Cards, Form fields)
│   ├── views/            # Page-level views (Dashboard, PbiStudio, BulkBreakdown, Settings)
│   ├── styles.css        # Global styles and VS Code CSS variables
│   ├── types.ts          # Webview-side message types (must sync with src/shared/messages.ts)
│   └── utils/            # Helper functions
└── package.json          # Vite build config and dependencies
```

---

## Message Passing (Webview ↔ Extension)

The webview and extension communicate via `postMessage`:

- **Webview types:** `webview-ui/src/types.ts`
- **Extension types:** `src/shared/messages.ts`

**Important:** These must stay in sync. When adding a new message type:

1. Add it to both `types.ts` and `messages.ts`.
2. Update the extension handler in the appropriate `*Panel.ts` file.
3. Update the webview side in the corresponding view or component.

---

## Common Development Tasks

### Adding a New Panel / View

1. Create a new panel class in `src/panels/` (e.g., `MyCustomPanel.ts`).
2. Create a corresponding React view in `webview-ui/src/views/` (e.g., `MyCustomView.tsx`).
3. Register the panel in `src/extension.ts` (add command + listener).
4. Add corresponding message types in both `types.ts` and `messages.ts`.
5. Build and test with `npm run build` then `F5`.

### Adding a New Component

1. Create the component file in `webview-ui/src/components/` (e.g., `MyButton.tsx`).
2. Import and use it in your view.
3. Follow existing component patterns (props interface, default styling using VS Code CSS variables).
4. Build and test.

### Working with Copilot API

- Use `vscode.lm.selectChatModels({ vendor: 'copilot' })` to get the Copilot model.
- See `src/services/CopilotService.ts` for examples.
- Always test with Copilot signed in and Copilot Chat extension enabled.

### Testing ADO Integration

- Ensure your PAT has **Work Items: Read & Write** permission.
- Test in Settings → "Test Connection" to validate credentials before writing code.
- See `src/services/AdoService.ts` for API patterns.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm install && npm install --prefix webview-ui`, then `npm run build`. |
| Extension doesn't load | Press `F5` again or restart the Extension Development Host. |
| Webview doesn't appear | Check browser console in **Extensions → PO Tools → Inspect webview**. |
| Copilot API errors | Verify Copilot is signed in and `vscode.lm` API version matches your VS Code version. |
| ADO push fails | Run "Test Connection" in Settings to debug credentials and permissions. |
| TypeScript errors | Run `tsc --noEmit` in root and `webview-ui/` to find issues. |

---

## Style & Patterns

- **Components:** Keep to one responsibility. Use props for configuration.
- **Naming:** Use clear, concise names (e.g., `PbiEditorPanel` not `Panel2`).
- **CSS:** Follow existing VS Code CSS variable patterns; avoid inline styles.
- **Message Types:** When adding new messages, update both type files immediately.
- **Error Handling:** Show user-friendly error messages via toasts; log details to extension console.

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design and data flow.
- Check `.squad/agents/rusty/charter.md` for frontend-specific patterns and ownership.
- Review [../docs/PLAN.md](../docs/PLAN.md) for feature roadmap and priorities.
