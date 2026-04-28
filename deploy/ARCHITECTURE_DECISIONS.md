# PO Professional Tools — Architecture Decisions

## Overview

This document records major architectural decisions made during the development of PO Professional Tools.

## Decision Records (ADR)

### ADR-001: VS Code Extension Architecture

**Status:** ✅ Accepted

**Context:**
The tool needed to integrate seamlessly with VS Code to provide productivity enhancements without requiring developers to leave their editor environment.

**Decision:**
Build as a VS Code Extension using:
- TypeScript for type safety
- React for the webview UI
- esbuild for bundling
- Native VS Code APIs for editor integration

**Rationale:**
- Native integration with VS Code
- Large ecosystem of plugins and community support
- Strong typing with TypeScript
- Modern UI framework (React)
- Proven build tooling

**Consequences:**
- Bound to VS Code ecosystem
- Requires knowledge of VS Code Extension API
- Webview runs in isolated context with CSP restrictions

---

### ADR-002: Monorepo vs. Separate Packages

**Status:** ✅ Accepted

**Context:**
The extension consists of both extension code and webview UI code. Decision needed on how to organize the codebase.

**Decision:**
Use a monorepo structure with:
- Root-level TypeScript configuration for extension code
- `webview-ui/` as a separate npm package with its own dependencies
- Shared types between extension and webview

**Rationale:**
- Easier to keep extension and UI in sync
- Shared types prevent discrepancies
- Clear separation of concerns
- webview-ui can have independent build/test pipeline

**Consequences:**
- Need to manage two package.json files
- Build pipeline slightly more complex
- Easier to test UI independently

---

### ADR-003: Build Tool Selection (esbuild)

**Status:** ✅ Accepted

**Context:**
Needed a fast, reliable build tool for both extension and webview code.

**Decision:**
Use **esbuild** for bundling both:
- Extension source code (`src/extension.ts`)
- Webview React code (`webview-ui/src/`)

**Rationale:**
- Extremely fast build times (written in Go)
- Simple configuration
- Good support for both ES modules and CommonJS
- Native TypeScript support

**Consequences:**
- Less plugin ecosystem compared to Webpack
- Fewer advanced customization options
- Must manage source maps manually

---

### ADR-004: IPC Communication Protocol

**Status:** ✅ Accepted

**Context:**
Extension and webview need bidirectional communication while maintaining security boundaries.

**Decision:**
Use VS Code's native webview message API:

```typescript
// Extension → Webview
panel.webview.postMessage({ command: 'update', data: {} });

// Webview → Extension
window.addEventListener('message', event => {
  const { command, data } = event.data;
});
```

**Rationale:**
- Native, secure, well-documented
- No external dependencies
- Clear separation of concerns
- Built-in CSP support

**Consequences:**
- Limited to string-serializable data (no circular refs)
- Manual serialization/deserialization
- Must define clear message protocol

---

### ADR-005: Configuration Storage

**Status:** ✅ Accepted

**Context:**
Need to store user configuration and extension state persistently.

**Decision:**
Use VS Code's built-in configuration storage:
- User settings: `vscode.workspace.getConfiguration()`
- Workspace state: `context.workspaceState.update()`
- Global state: `context.globalState.update()`

**Rationale:**
- Native VS Code integration
- Automatic persistence
- Syncs across devices (if configured)
- No external storage required

**Consequences:**
- Limited to data structures VS Code supports
- User must grant permission for workspace settings
- Workspace state isolated per folder

---

## Future Architectural Considerations

### Potential Improvements

1. **Plugin System** — Allow third-party extensions to integrate
2. **Remote Execution** — Support remote workflows via cloud services
3. **Version Management** — Track and manage configuration versions
4. **Telemetry** — Understand user behavior (with consent)

### Technical Debt

- Refactor service layer for better testability
- Add comprehensive logging throughout
- Improve error handling consistency
- Add integration tests

---

**Last Updated:** 2026-04-28
**Architect:** ltnguyenJha
