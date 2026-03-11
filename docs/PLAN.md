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
- import one or more locally cloned repositories
- scan the codebase for routes, endpoints, and SQL objects
- generate concise, professional PBIs with effort, iteration, description, acceptance criteria, and test scenarios
- allow review and refinement in a professional local UI
- push backlog items and related testing details to Azure DevOps
- later leverage GitHub Copilot more deeply for higher-quality AI generation

## Guiding Principles

- Local-first setup must stay simple
- UI must be clean, professional, and easy for non-developers
- Story output must be concise and stakeholder-ready
- Project state must be easy to resume after a break
- Azure DevOps integration must be practical before it is perfect

## Current Status

Overall status: In progress

### Completed

- VS Code extension scaffold
- React webview shell
- Local project folder import
- Multi-project persistence in extension state
- Basic code scanning for routes, API endpoints, and SQL objects
- Initial PBI draft generation from scan output
- Azure DevOps settings UI
- Secure ADO PAT storage in VS Code SecretStorage
- Initial Azure DevOps push for draft backlog items
- Local run instructions in README
- Clean debug launch profile for local testing

### In Progress

- Improve PBI quality from heuristic draft generation to Copilot-driven generation
- Improve route-to-test traceability in generated output
- Improve dashboard structure for PO-friendly review workflow

### Not Started

- Dedicated ADO Test Case work item creation and linking
- ADO comments/discussion sync with richer metadata
- Editable PBI detail view
- Kanban board workflow
- Iteration planner
- Chat participant integration for Copilot
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

Remaining:
- improve parsing accuracy for React router, .NET attributes, minimal APIs, and SQL structures
- add ignore rules and scan performance controls
- surface richer scan summaries in the UI

### Phase 3: PBI Generation

Status: Partially completed

Done:
- generate first draft PBIs locally from scan data
- include effort, iteration, acceptance criteria, and test scenarios

Remaining:
- replace heuristic generation with Copilot-powered generation
- improve output quality and consistency
- tie test scenarios directly to discovered routes/endpoints in a more explicit way

### Phase 4: PO Review Experience

Status: Not started

Scope:
- richer dashboard layout
- project workspace refinement
- PBI review/edit screen
- board view for draft/ready/pushed states
- clearer project-by-project navigation

### Phase 5: Azure DevOps Completion

Status: Partially completed

Done:
- save ADO settings
- push draft backlog items to ADO

Remaining:
- create separate Test Case work items
- link tests to PBIs
- support comments and metadata updates
- improve retry and error handling
- add process-template-aware field mapping

### Phase 6: Copilot Integration

Status: Not started

Scope:
- use VS Code Language Model API
- generate higher-quality PBIs and tests using Copilot
- later add chat participant workflow for refinement

### Phase 7: Packaging And Adoption

Status: Not started

Scope:
- polished first-run experience
- simple PO documentation
- VSIX packaging
- release checklist

## Immediate Next Steps

Work in this order unless priorities change:

1. Add dedicated ADO Test Case work item creation and link each test back to its parent backlog item.
2. Replace heuristic draft generation with Copilot-based generation using the VS Code LM API.
3. Add a clearer PBI review/edit UI so POs can refine generated stories before pushing to ADO.
4. Improve analyzer accuracy for React, .NET, and SQL repositories.

## Progress Checklist

- [x] Project can build locally
- [x] Project can run as a VS Code extension
- [x] Local repo folders can be imported
- [x] Imported projects are persisted
- [x] Basic code scanning works
- [x] Initial PBI drafts can be generated
- [x] Azure DevOps settings can be saved
- [x] ADO PAT is stored securely
- [x] Initial ADO push works for backlog items
- [ ] Test Case work items are created in ADO
- [ ] Generated tests are explicitly linked to discovered routes/endpoints
- [ ] Copilot LM API is integrated
- [ ] PBI review/edit screen is complete
- [ ] Board workflow is complete
- [ ] Iteration planning is complete
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
- a PO can import multiple local repos
- generated PBIs are concise and professional
- test scenarios clearly map to actual routes/endpoints
- backlog items and test cases can be created in Azure DevOps reliably
- the UI is polished enough for regular daily use