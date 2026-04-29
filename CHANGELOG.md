# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-04-29

### Summary
Completes Issue #24: Wizard-based UI redesign for PBI Studio MVP release.

### Features
- **Phase 1: CSS Design Tokens** — 94 semantic design tokens (colors, spacing, typography), zero regressions
- **Phase 2: Message Protocol** — 6 message types (create, update, save, navigate, validate, close), fully wired
- **Phase 3: Wizard Components** — Feature + Bug variants, 4 steps each (Story, Type, Effort, Acceptance), production-ready
- **Phase 4: Auto-save & State Integration** — Blur-triggered (500ms) + step-advance (immediate, last-write-wins), integrated Redux state
- **Phase 5: Polish** — Dark mode, keyboard navigation (Tab/Shift+Tab/Enter), responsive layout (1024px+), WCAG 2.1 AA accessibility
- **Phase 6: E2E Integration Tests** — 15/15 integration tests passing, all workflows validated

### Test Coverage
- **Unit Tests**: 120/124 passing (96.8%)
- **E2E Tests**: 15/15 passing (100%)
- **Build**: Clean (TypeScript: 0 errors)

### Known Blockers (Post-MVP)
1. Network retry logic for failed saves
2. Custom theme builder (UI only, no persistence)
3. Mobile support (<480px breakpoint)

### Design Decisions (Locked)
1. Bug variant ships in Phase 1 (both Feature + Bug production-ready)
2. AI wizard mode selector at TOP of Story step
3. Legacy drafts: read-only + manual migration path
4. Type locks after confirmation (immutable)
5. Auto-save: blur (500ms) + step advance (immediate, last-write-wins)
6. Browser navigation allowed, reload at saved state

### Fixes
- None (greenfield phase)

### Breaking Changes
- None (new feature, no backward compatibility impact)

---

## [0.1.2] - Previous Release

(Previous release notes, if any)
