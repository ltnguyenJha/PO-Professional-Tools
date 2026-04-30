# Feature Creation Wizard — Key Decisions

**Author:** Rusty (Frontend Dev)  
**Date:** 2026-04-30  
**Branch:** `feature/saul-tailwind-dashboard-redesign`  
**Status:** Implemented

---

## 1. Work Item Types Are Non-Editable Labels

**Decision:** Parent type = "Feature" and child type = "Product Backlog Item" are displayed as read-only info badges, not dropdowns. The `WorkItemHierarchyBox` component renders them as styled chips with the caption "(These types are fixed and cannot be changed)".

**Rationale:** ADO parent-child relationships are enforced by the backend. Allowing the user to change these types would create UI affordances that don't map to real behavior and would confuse users when ADO rejects the item.

---

## 2. 5-Step Wizard Architecture (Single File)

**Decision:** Implemented as a single `FeatureCreationWizard.tsx` file with step sub-components (`Step1Details`, `Step2Context`, `Step3Generate`, `Step4Review`, `Step5SavePush`) rather than separate files per step.

**Rationale:** The architecture spec listed separate files, but for a first iteration a single file reduces inter-file coordination overhead and keeps all wizard state in one place. Can be split if the file grows unwieldy.

---

## 3. Auto-Advance from Step 3 → Step 4

**Decision:** When `USER_STORIES_GENERATED` event arrives (detected via `generatedPbiIds` prop change), the wizard automatically advances from Step 3 (AI Generation) to Step 4 (Story Review) without requiring a user click.

**Rationale:** Per UX spec: "On success: Automatically transitions to Step 4 (Review) with a subtle fade-in. Do not require user to click 'Next'."

---

## 4. Local PBI Edits in Wizard State

**Decision:** Title and effort edits in Step 4 are stored in local wizard state (`localEdits: Record<string, LocalPbiEdit>`) keyed by PBI ID. They are NOT dispatched to the extension until the user clicks "Save as Draft" or "Push to ADO".

**Rationale:** Avoids spamming the extension with partial updates while the user is reviewing. The final `CREATE_FEATURE_DRAFT` or `PUSH_FEATURE_TO_ADO` payload includes all the data.

---

## 5. Manual Story Addition

**Decision:** "Add story" in Step 4 creates a local `PbiDraft` object (with a `manual-*` prefix ID) stored only in `manualStories` wizard state. These get submitted with `CREATE_FEATURE_DRAFT`/`PUSH_FEATURE_TO_ADO`.

**Rationale:** Avoids creating orphan drafts in the extension state if the user abandons the wizard.

---

## 6. FeatureDraftCard in Dashboard — Separate from Legacy PbiDraft Features

**Decision:** Added `FeatureDraftCard` component for `FeatureDraft` objects. Legacy PbiDraft objects with `workItemType='Feature'` continue to render via the existing `FeatureGroup` component.

**Rationale:** Non-breaking. Existing PbiDraft-based features (created via BulkBreakdownView) remain visible. New wizard-created FeatureDraft objects appear in a separate section with their child PBIs shown.

---

## 7. "Part of Feature" Badge in PBI Studio

**Decision:** In PBI Studio's sidebar list, when a PBI has `parentFeatureId` set, a small inline badge shows the feature title (truncated at 28 chars). Clicking the badge navigates to PBI Studio (not the feature) since we don't have a feature detail view yet.

**Rationale:** Provides traceability without requiring a full navigation change. The badge is non-interactive for now — can be upgraded to navigate to feature detail when that view exists.

---

## 8. Stable featureDraftId Per Wizard Session

**Decision:** `featureDraftId` is generated once at component mount using `useState(() => generateId())`. This ID is used in `GENERATE_USER_STORIES_FROM_FEATURE` so the backend can link generated PBIs to it via `parentFeatureId`.

**Rationale:** Ensures all PBIs generated in a session are linked to the same (eventual) Feature, even before the Feature is formally saved. React unmounts the wizard on navigation away, so re-opening gives a fresh ID.
