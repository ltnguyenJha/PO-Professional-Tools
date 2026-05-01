# Decision: EpicCreationWizard UI Overhaul

**Author:** Rusty (Frontend Dev)
**Branch:** feature/epic-creation
**Commit:** a96922b
**Date:** 2026-05-XX

## Summary

Three surgical UI changes applied to `EpicCreationWizard.tsx` to align with product direction and team workflow patterns.

## Decision 1 — Remove "Context & Repos" Step

**Removed:** Step 2 (Context & Repos) — repo selection via `Step2Context` component.

**Rationale:** The Epic workflow doesn't benefit from per-repo scoping at creation time. Epic-level features are product artifacts, not code artifacts. Repos can be attached at the Feature/PBI level. Removing it simplifies the path to AI generation.

**Impact:** `selectedRepoIds` and `repos` state removed from wizard. All generation and save payloads now pass `selectedRepoIds: []`. Backend handles empty array gracefully (confirmed from existing code pattern in FeatureCreationWizard).

## Decision 2 — Purple → Teal for Epic Accent Color

**Before:** `--tw-epic: #7c3aed` (violet-600 dark) / `#6d28d9` (violet-700 light)
**After:** `--tw-epic: #2dd4bf` (teal-400 dark) / `#0f766e` (teal-700 light)

**Rationale:** Matches sidebar navigation active state (`--accent`). Unifies Epic visual identity with the app's primary accent color family. Removes the "one-off purple" that didn't match any other token.

**Contrast:** teal-400 on dark bg passes 4.5:1; teal-700 on white passes 5:1. Both meet WCAG AA for normal text.

## Decision 3 — ADO Metadata Fields in Step 1

**Added fields (all optional):** ADO URL, Area Path, Iteration Path, Target Date, T-Shirt Size, Effort (story points).

**Settings Accordion:** Persists default Area / Iteration / URL to `localStorage` under key `po-tools:epicDefaults`. Pre-populated with iPay_Scrum team defaults. Collapsible to keep primary fields visible.

**Rationale:** Teams need these values set at Epic creation time to match ADO board conventions. Defaults reduce repetitive data entry. Fields are optional so existing workflows aren't broken.

**Type sync:** Added to both `webview-ui/src/types.ts` (`EpicDraft` + `CREATE_EPIC_DRAFT` payload) and `src/shared/messages.ts`. Backend won't persist them until epic service is updated — acceptable for now, fields are passed through silently.

## No Backward-Compat Risk

All new fields are optional (`?`). Existing saved drafts without these fields will still load correctly. Prefill block handles missing fields with `if (epic.fieldName) setState(...)` guards.
