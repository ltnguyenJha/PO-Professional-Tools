# Changelog

All notable changes to **PO Professional Tools** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] — 2026-07-20

Release covering work since **v0.1.3** (wizard UI redesign MVP). Version bumped in package metadata with #73; subsequent merges through #88 ship under this version.

### Added

- **Epic / Feature / User Story hierarchy** with AI breakdown and a Tailwind-based dashboard (#61)
- **RDI Creation Wizard** — guided Release Deployment Item flow with ADO parent-child linking (#41)
- **Auto test plans** — create ADO test plan, suite, and AI integration test cases on PBI push/update (#65)
- **Feature creation** — completion date picker and effort sum (#63, #64)
- **Dashboard** — link stories to features; edit features; expandable epic stories (#69, #70)
- **Jack Henry branding** — banner, brand images, and text branding in the UI (#66)
- **Activity bar** entry and extension icon for PO Professional Tools (#73)
- **AI Feature Definition** generation and related PBI Studio wizard improvements (#40)
- **AI actions** available from Command Palette and context menu (out-of-panel)
- **Settings** — searchable Iteration Path / team selection dropdowns; smarter Save visibility for new and existing users
- **david-ai** accessible UI primitives (tabs, collapse, modal, dropdown) with VS Code theme bridge (#88)

### Changed

- **UI energy refresh** — grouped sidebar nav, dashboard hero and quick actions, KPI cards, responsive icon rail, encouraging empty states (#71, #72, #88)
- **PBI Studio** layout cleanup — clearer wizard flow, panels repositioned/hidden where they competed with the primary path (#42–#45, #48–#53)
- **Accessibility** — WCAG 2.1 AA overhaul and contrast-safe light/dark tokens (#62, #88)
- **AI visual identity** — violet shimmer loading, success animations, focus-trapped confirm dialogs (#88)

### Fixed

- Finish and Save correctly push work items to Azure DevOps (#54, #55)
- User story wizard bugs and ADO story fields (`featureWhy`, acceptance criteria, dedicated user story statement) (#57–#60, #23, #29)
- Settings Save button hidden for brand-new users with no existing ADO settings (#73)
- ADO Test Plan API 401s (resource-area discovery bypass + safer diagnostics) (#65 follow-ups)
- Mermaid attachments: stale diagrams removed/regenerated on Update in ADO; identify auto attachments by name
- Dark-mode readability for drafts, chevrons, and Settings connection tabs (#88)

## [0.1.3] — 2026-04-29

### Changed

- Wizard UI redesign MVP (Issue #24) — released as **v0.1.3**

[0.1.4]: https://github.com/ltnguyenJha/PO-Professional-Tools/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/ltnguyenJha/PO-Professional-Tools/releases/tag/v0.1.3
