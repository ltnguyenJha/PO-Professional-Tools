# PO-Professional-Tools — Decisions Log

This file records key product and architecture decisions made during development.

---

## Feature #41 — RDI Creation (2026-04-30)

### Q1 — Work Item Type
**Decision: Custom type "Release Deployment Item" (free-text field)**
- The ADO work item type for RDIs is a custom type named **"Release Deployment Item"** — not a standard ADO type (e.g. Feature, Bug).
- Linus must implement the work item type field as **free-text input**, not a dropdown constrained to the `AdoWorkItemType` enum.
- *Source: `copilot-directive-20260430-1325.md`*

### Q2 — PBI Linking Depth
**Decision: ADO parent-child relations required at launch (not just description-embedded links)**
- Linus must implement a full ADO relation API call to link the RDI work item to parent PBI(s).
- Use `System.LinkTypes.Hierarchy-Reverse` relation type.
- This is **not** deferred to a follow-on release; it is part of the MVP.
- *Source: `copilot-directive-20260430-1400.md`*

### Q3 — Dashboard Placement
**Decision: Separate "RDIs" sidebar tab in the dashboard**
- RDIs will **not** be integrated into PBI Studio.
- Rusty to add a new **"RDIs"** tab alongside existing tabs in the navigation.
- Tab shows a list of saved RDI drafts + a "New RDI" button.
- *Source: `copilot-directive-20260430-1400.md`*

### Q4 — Iteration Pre-populate
**Decision: Auto-fill Iteration from ADO default settings (user can override)**
- Step 1 of the wizard should call the ADO API to fetch the default iteration path for the team.
- Pre-populate the Iteration field; user can override.
- Linus to add `getDefaultIteration()` call in `AdoService`.
- *Source: `copilot-directive-20260430-1400.md`*

### Q5 — Applications List
**Decision: Free-text only**
- No ADO tags/areas lookup.
- Simple free-text input (comma-separated or tag-style chips).
- *Source: `copilot-directive-20260430-1400.md`*

---

## SettingsView Save Button for New Users (2026-05-04)

### Problem

In `SettingsView.tsx`, the `useEffect` responsible for tracking `hasUnsavedChanges` had an early-return guard:

```tsx
if (!adoSettings) {
  setHasUnsavedChanges(false);
  return;
}
```

For a brand-new user who has never saved ADO settings, `adoSettings` is `undefined`. This caused the Save button (gated on `hasUnsavedChanges || saveSuccess`) to **never appear**, making it impossible for new users to save any configuration.

### Decision

When `adoSettings` is `undefined`, treat the form as "unsaved" if the user has entered any meaningful input — specifically `orgUrl`, `projectName`, or `pat`. This is the minimal signal that the user intends to configure the extension.

### Implementation

```tsx
if (!adoSettings) {
  const hasInput =
    form.orgUrl.trim().length > 0 ||
    form.projectName.trim().length > 0 ||
    (form.pat != null && form.pat.trim().length > 0);
  setHasUnsavedChanges(hasInput);
  return;
}
```

Also fixed the `form.pat &&` guard in the existing-user branch (`form.pat != null &&`) to avoid a `boolean | "" | undefined` type error on `setHasUnsavedChanges`.

### Rationale

- Minimal input check (orgUrl, projectName, pat) is sufficient to signal intent without being noisy.
- Consistent with existing behaviour: the Save button only appears when there's something worth saving.
- Backward-compatible: no changes to existing users' saved state.
