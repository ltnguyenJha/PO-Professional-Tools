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
