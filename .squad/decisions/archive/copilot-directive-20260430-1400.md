# Decisions: Feature #41 RDI Creation — Q2–Q5

Date: 2026-04-30
Source: User answers in session

## Q2 — PBI Linking Depth
**Decision: ADO parent-child relations required at launch (not just description-embedded links)**
- Linus must implement full ADO relation API call to link RDI work item to parent PBI(s)
- Use `System.LinkTypes.Hierarchy-Reverse` relation type
- This is NOT deferred to follow-on; it's part of the MVP

## Q3 — Dashboard Placement
**Decision: Separate "RDIs" sidebar tab in the dashboard**
- Not integrated into PBI Studio
- Rusty to add a new "RDIs" tab alongside existing tabs in the navigation
- Tab shows list of saved RDI drafts + "New RDI" button

## Q4 — Iteration Pre-populate
**Decision: Yes — auto-fill Iteration from ADO default settings**
- Step 1 of wizard should call ADO API to fetch the default iteration path for the team
- Pre-populate the Iteration field; user can override
- Linus to add `getDefaultIteration()` call in AdoService

## Q5 — Applications List
**Decision: Free-text only**
- No ADO tags/areas lookup
- Simple free-text input (comma-separated or tag-style chips)
