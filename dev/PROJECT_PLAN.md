# Project Plan

This file is the working plan for PO Professional Tools.

Use it to:
- track what is done
- track what is in progress
- decide the next implementation target
- keep the project recoverable after pauses or handoffs

Update this file as features are completed.

## Product Goal

Build a local-first tool for Product Owners that runs through a VS Code extension UI and can:
- import and manage one or more locally cloned repositories
- scan the codebase for routes, endpoints, and SQL objects
- generate concise, professional PBIs with effort, iteration, description, acceptance criteria, and test scenarios
- let the PO edit PBIs inside the app and optionally refine them through GitHub Copilot (round-trip or chat hand-off)
- break a large feature into a set of prefixed child items (optionally linked to a parent Feature in ADO)
- push backlog items and related testing details to Azure DevOps
- provide a polished, themeable (Light / Dark / Auto) UI that is easy to navigate

## Guiding Principles

- Local-first setup must stay simple
- UI must be clean, professional, themeable, and easy for non-developers
- Story output must be concise and stakeholder-ready
- Copilot integration must enhance the PO, never silently overwrite their work
- Project state must be easy to resume after a break
- Azure DevOps integration must be practical before it is perfect

## Current Status

Overall status: UX overhaul in progress

### Completed

- VS Code extension scaffold
- React webview shell
- Local project folder import
- Multi-project persistence in extension state
- Basic code scanning for routes, API endpoints, and SQL objects
- Initial PBI draft generation from scan output
- Azure DevOps settings UI (basic)
- Secure ADO PAT storage in VS Code SecretStorage
- Initial Azure DevOps push for draft backlog items
- Local run instructions in README
- Clean debug launch profile for local testing

### In Progress (UX Overhaul)

- New navigation shell: Sidebar + Topbar + tabbed views (Dashboard / Projects / PBI Studio / Bulk Breakdown / Settings)
- Light / Dark / Auto theming
- Remove-project action on project cards
- Rich ADO settings form: Org URL, Project, Area Path, Iteration Path, PAT (masked), default Work Item Type, Test Connection
- In-app PBI editor with per-item save, delete, and push
- Copilot round-trip refinement via `vscode.lm` Language Model API
- Copilot Chat hand-off via `workbench.action.chat.open`
- Bulk Breakdown view (Manual / AI-assisted / From-scan) with prefixed titles and optional parent Feature linking in ADO
- Pushed state tracked per draft (work item id + status pill)

### Not Started

- Dedicated ADO Test Case work item creation and linking
- ADO comments/discussion sync with richer metadata
- Kanban board workflow
- Iteration planner
- Chat participant (`@po-tools`) in Copilot Chat
- Field mapping support for different ADO process templates
- Better parser coverage for larger mixed-stack repositories
- Packaging and release flow for easier installation by POs

## Phase Plan

### Phase 1: Foundation

Status: Completed

Scope:
- extension shell
- webview shell
- build pipeline
- debug configuration

### Phase 2: Local Project Import And Scanning

Status: Partially completed

Done:
- import local folders
- store imported projects
- detect basic stack types
- scan files for routes/endpoints/SQL objects
- remove imported projects (with draft cascade delete)

Remaining:
- improve parsing accuracy for React router, .NET attributes, minimal APIs, and SQL structures
- add ignore rules and scan performance controls
- surface richer scan summaries in the UI

### Phase 3: PBI Generation

Status: Partially completed

Done:
- generate first draft PBIs locally from scan data
- include effort, iteration, acceptance criteria, and test scenarios
- in-app editing of all draft fields (title, description, effort, iteration, AC list, test list, work item type)

Remaining:
- tie test scenarios directly to discovered routes/endpoints in a more explicit way
- dedicated ADO Test Case work item creation

### Phase 4: PO Review Experience

Status: In progress

Scope:
- AppShell with sidebar navigation and topbar actions
- Light / Dark / Auto theming persisted per user
- Dashboard with KPIs and recent activity
- Projects view with add, scan, generate, push, and remove actions
- PBI Studio: list + editor with per-item save / delete / push
- Bulk Breakdown: prefixed children, Manual / AI-assisted / From-scan sources
- Settings view with rich ADO form + Test Connection

### Phase 5: Azure DevOps Completion

Status: In progress

Done:
- save ADO settings
- push draft backlog items to ADO
- default `System.WorkItemType` honored on push (PBI / User Story / Feature / Epic / Task / Bug)
- per-draft override of work item type
- Test Connection action
- parent Feature/Epic creation with hierarchy links for bulk items

Remaining:
- create separate Test Case work items
- link tests to PBIs
- support comments and metadata updates
- improve retry and error handling
- add process-template-aware field mapping

### Phase 6: Copilot Integration

Status: In progress

Done:
- `CopilotService` using `vscode.lm.selectChatModels({ vendor: 'copilot' })`
- "Refine with AI" round-trip that returns a reviewable suggestion (accept/reject, never silently overwrite)
- "Open in Copilot Chat" hand-off using `workbench.action.chat.open` with a prepared prompt
- "Apply AI Result" paste-back flow for PBI fields
- AI-assisted breakdown of a feature into prefixed child items

Remaining:
- streaming progress into the editor (currently sent as toasts)
- chat participant registration for refinement
- richer grounding context (include scanned routes/endpoints for the current project)

### Phase 7: Packaging And Adoption

Status: Not started

Scope:
- polished first-run experience
- simple PO documentation
- VSIX packaging
- release checklist

## Immediate Next Steps

Work in this order unless priorities change:

1. Complete the UX overhaul acceptance tests (remove, editor, AI round-trip, bulk, ADO push status).
2. Add dedicated ADO Test Case work item creation and link each test back to its parent backlog item.
3. Improve analyzer accuracy for React, .NET, and SQL repositories.
4. Register a Copilot chat participant for refinement.

## Progress Checklist

- [x] Project can build locally
- [x] Project can run as a VS Code extension
- [x] Local repo folders can be imported
- [x] Imported projects are persisted
- [x] Imported projects can be removed from the UI
- [x] Basic code scanning works
- [x] Initial PBI drafts can be generated
- [x] PBI drafts can be edited inside the app
- [x] Azure DevOps settings can be saved
- [x] ADO PAT is stored securely
- [x] ADO settings include default Work Item Type
- [x] ADO connection can be tested from the UI
- [x] Initial ADO push works for backlog items
- [x] Pushed drafts track ADO work item id and status
- [x] Copilot LM round-trip refinement is integrated
- [x] Copilot Chat hand-off is integrated
- [x] Bulk breakdown creates prefixed children with optional parent linking
- [x] Light / Dark / Auto theming
- [ ] Test Case work items are created in ADO
- [ ] Generated tests are explicitly linked to discovered routes/endpoints
- [ ] Copilot chat participant is registered
- [ ] Process template mapping is complete
- [ ] VSIX packaging is complete

## Revisit Notes

When resuming work later, start here:

1. Read this file.
2. Confirm the current app still builds with `npm run build`.
3. Check the next unchecked item in the Progress Checklist.
4. Update this file after each meaningful feature is completed.

## Definition Of Done

The project is considered ready for broader PO usage when:
- a PO can run it locally with simple setup
- a PO can import, scan, and remove multiple local repos
- generated PBIs are concise, professional, and editable inside the app
- Copilot can refine drafts on request without overwriting PO edits
- a PO can break a big feature into many prefixed child items and optionally link them to a parent in ADO
- backlog items and test cases can be created in Azure DevOps reliably with the correct work item type
- the UI is polished, themeable, and easy to navigate for daily use
