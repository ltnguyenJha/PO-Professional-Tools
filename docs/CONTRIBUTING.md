# Contributing Guidelines

Thank you for contributing to PO Professional Tools. This guide covers code style, PR process, and testing expectations.

---

## Code Style

### TypeScript & JavaScript

- **Formatting:** Use 2-space indentation.
- **Naming:**
  - `PascalCase` for classes, components, types, interfaces.
  - `camelCase` for functions, variables, properties.
  - `UPPER_SNAKE_CASE` for constants.
- **Imports:** Group by source (external, then local). Keep alphabetically sorted within groups.
- **Comments:** Only comment code that needs clarification. Avoid over-commenting obvious logic.

### React Components

- Keep components focused — one responsibility per component.
- Use descriptive prop names and include `interface Props { ... }` for clarity.
- Prefer functional components with hooks over class components.
- Use `key={id}` when rendering lists of stateful components to prevent state leakage.

### CSS

- Use **VS Code CSS variables** (`--vscode-foreground`, `--accent`, etc.) for theming.
- Avoid inline styles; keep styles in `styles.css` or component-scoped classes.
- Use semantic class names (e.g., `.wizard-step`, `.section-card`).

---

## PR Process

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your changes** following the code style above.

3. **Test locally:**
   - Build: `npm run build`
   - Debug: `F5` in VS Code
   - Lint: `npm run lint`
   - Manual smoke test: Open Dashboard, Projects, PBI Studio, Settings.

4. **Update documentation:**
   - If adding a feature, update `docs/FEATURES_ROADMAP.md` and/or `dev/ARCHITECTURE.md` if system design changes.
   - Update `docs/PLAN.md` Progress Checklist when a feature is complete.

5. **Commit with clear messages:**
   ```bash
   git commit -m "Brief description of change"
   ```
   Include the Co-authored-by trailer if working with others.

6. **Push and open a PR** to `main`:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Address review feedback** promptly. Reviewers may request changes for consistency, correctness, or clarity.

8. **Squash or merge** after approval. Ensure CI passes.

---

## Testing Requirements

### Unit Testing (if applicable)

- New service logic should include unit tests.
- Use `jest` or your project's existing test runner.
- Aim for >80% coverage on critical paths (services, utils).

### Manual Testing

- **All PRs require local smoke test:**
  1. Build with `npm run build`.
  2. Run `F5` to launch Extension Development Host.
  3. Open Dashboard, Projects, PBI Studio, Bulk Breakdown, Settings.
  4. Verify no console errors (check **Extensions → PO Tools → Inspect webview**).
  5. Test at least one full workflow (e.g., add project → scan → generate → push).

- **Type checking:**
  ```powershell
  tsc --noEmit              # extension types
  npm --prefix webview-ui run type-check  # webview types
  ```

- **Linting:**
  ```powershell
  npm run lint
  ```

### Integration Testing (Copilot / ADO)

- If touching Copilot or Azure DevOps integration:
  1. Ensure Copilot is signed in.
  2. Test with valid ADO settings (use "Test Connection" in Settings).
  3. Note: CI may not have ADO access, so coordinate with maintainers for end-to-end testing.

---

## Message Type Changes

**Critical:** When adding or modifying message types:

1. Update **both** `webview-ui/src/types.ts` AND `src/shared/messages.ts` simultaneously.
2. Add corresponding handler in the appropriate panel (`src/panels/*Panel.ts`).
3. Update webview side (view or component) to send/receive the new message.
4. Test bidirectional communication.

---

## Review Expectations

- **Reviewers will check for:**
  - Code style consistency.
  - TypeScript type safety (no `any` unless justified).
  - Proper error handling (no silent failures).
  - Message type sync (webview ↔ extension).
  - Documentation updates.
  - Backward compatibility (if breaking, document in PR).

- **If a PR is rejected:**
  - A different agent or reviewer will revise rather than requesting changes back.
  - Feedback will include clear guidance on what needs to change.

---

## Ownership & Boundaries

- **Frontend/React:** Handled by Rusty (webview-ui/ and component patterns).
- **Backend/Extension:** Handled by Linus (src/ panels and services).
- **Architecture decisions:** Coordinated with Danny.
- **Testing:** Livingston reviews and may implement tests.

Feel free to tag the appropriate agent in PRs for review.

---

## Questions or Suggestions?

- Check existing PRs and issues for related discussions.
- Ask in your team's communication channel.
- Read the team charter files in `.squad/agents/` for agent-specific guidance.

---

**Thanks for contributing!** 🎉
