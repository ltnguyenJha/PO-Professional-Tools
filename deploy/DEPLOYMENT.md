# Deployment Guide

Instructions for building, packaging, and releasing PO Professional Tools.

---

## Prerequisites

- Development environment set up (see [../dev/DEVELOPMENT_GUIDE.md](../dev/DEVELOPMENT_GUIDE.md)).
- Latest code committed to git.
- Version number ready (follow semantic versioning).

---

## Build the Extension

```powershell
# From repository root

# Install/update dependencies
npm install
npm install --prefix webview-ui

# Full build (extension + webview)
npm run build

# Verify build succeeded
# Check: dist/ folder exists with extension.js
#        webview-ui/dist/ exists with index.html and bundled JS
```

---

## Version Bump

1. Open `package.json` at the root.
2. Update the `"version"` field:
   - Patch: `0.1.0` → `0.1.1` (bug fixes)
   - Minor: `0.1.0` → `0.2.0` (new features)
   - Major: `0.1.0` → `1.0.0` (breaking changes)

3. Commit the change:
   ```powershell
   git add package.json
   git commit -m "Bump version to 0.1.2"
   ```

---

## Package as VSIX

```powershell
# From repository root

npm run package

# Output: po-professional-tools-X.X.X.vsix in the root directory
```

---

## Release Checklist

Before publishing:

- [ ] All tests pass locally (`npm run build` succeeds, no TypeScript errors).
- [ ] `npm run lint` passes.
- [ ] Feature branch merged to `main`.
- [ ] Version bumped in `package.json`.
- [ ] `PLAN.md` updated with completed features (mark checkboxes in Progress Checklist).
- [ ] New features documented in `docs/FEATURES_ROADMAP.md`.
- [ ] `.vsix` file generated and tested:
  1. Delete the extension from a test VS Code instance.
  2. Install from the generated `.vsix` file.
  3. Smoke test: Open Dashboard, Settings, Projects, PBI Studio.
  4. Verify no TypeScript or runtime errors in the console.

---

## Distribution Options

### Option 1: Manual Distribution (Current)

1. Generate `.vsix` file (see above).
2. Upload to a shared location (SharePoint, GitHub Releases, internal file server).
3. Users install via **Extensions → ⋯ menu → Install from VSIX**.
4. Share download link and install instructions with users.

### Option 2: Visual Studio Marketplace (Future)

1. Create a publisher account on https://marketplace.visualstudio.com.
2. Follow Microsoft's publishing guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension.
3. Run:
   ```powershell
   npx @vscode/vsce publish
   ```
4. Users can search and install directly from VS Code Extensions.

---

## Post-Release

1. Tag the release in git:
   ```powershell
   git tag -a v0.1.2 -m "Release version 0.1.2"
   git push origin v0.1.2
   ```

2. Create a GitHub Release (if using GitHub):
   - Title: `v0.1.2 — Bug fixes and UX improvements`
   - Description: Summary of changes from `PLAN.md` and feature list.
   - Attach the `.vsix` file.

3. Notify users of the new version via appropriate channels (email, Slack, internal wiki).

4. Update rollout documentation if there are new setup steps or breaking changes.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Ensure `npm install` and `npm install --prefix webview-ui` completed without errors. Check Node.js version (20+). |
| VSIX generation fails | Ensure all build steps passed. Check that `dist/` and `webview-ui/dist/` exist. |
| VSIX won't install | Verify VS Code version is 1.96+. Try deleting the extension first, then reinstalling. |
| Extension loads but no UI | Check extension is activated (should appear in **Extensions** list). Open Command Palette and run a PO Tools command. |

---

## Related Documentation

- [DEVELOPMENT_GUIDE.md](../dev/DEVELOPMENT_GUIDE.md) — Local development setup.
- [ARCHITECTURE.md](../dev/ARCHITECTURE.md) — System design.
- [../docs/PLAN.md](../docs/PLAN.md) — Feature roadmap and progress.
- [../README.md](../README.md) — Project overview.
