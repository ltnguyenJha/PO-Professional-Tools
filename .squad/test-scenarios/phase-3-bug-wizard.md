# Phase 3 Bug Wizard — Test Scenarios (30 tests)

## Overview
Tests for the four-step Bug wizard variant: Type → Identity → Reproduction → Verification. Tests behavior, state persistence, and UI interactions. Tests written from user perspective, not implementation.

**Decision Links:**
- Decision #1: Bug variant ships in Phase 1 alongside Feature variant
- Decision #4: Type locked after confirmation (cannot change mid-wizard)
- Decision #5: Auto-save on blur (500ms) AND step advance (immediate)

---

## STEP 1: Type Selection (Bug Path) (9 scenarios)

### BS1.1 — Type Selection: Happy Path (Bug)
**Precondition:** Draft created, wizard loads at Step 1: Type
**Action:** 
1. Bug radio button is visible and unlocked
2. Click Bug button
3. Click "Next" or "Continue"
**Expected:** 
- Draft.workItemType = "Bug"
- Confirmation dialog shows: "You selected Bug. This cannot be changed later. Continue?"
- User clicks OK
- Step advances to Identity (Step 2)
- Draft.currentStep = 1 persisted
- Downstream steps render Bug-specific fields
**Unhappy Path:** User clicks Cancel on confirmation → stay on Type step, workItemType NOT saved

---

### BS1.2 — Type Selection: Type Lock Verification (Bug Locked)
**Precondition:** Bug type confirmed, wizard at Step 2: Identity
**Action:** 
1. Browser back OR click "Back" button to return to Step 1
2. Observe Type step re-renders
3. Attempt to click Feature radio button
**Expected:**
- Type selector is grayed out (disabled/readonly)
- Feature button not clickable
- UI shows visual lock indicator (locked icon, disabled state)
- Tooltip on Type selector: "Type cannot be changed after confirmation"
**Rationale:** Decision #4 enforces immutability for Bug selection

---

### BS1.3 — Type Lock: Progress Indicator State (Bug Variant)
**Precondition:** Bug type confirmed, any downstream step
**Action:**
1. Observe Step 1 in progress bar/breadcrumb
2. Visual rendering of Step 1 in Bug wizard
**Expected:**
- Step 1 marked as "completed" (checkmark, grayed out)
- Type selector appears grayed out or visually distinct from uncompleted steps
- No interaction possible on grayed Type selector
**Design Check:** Enforce Decision #4 visually (Bug type is foundational choice)

---

### BS1.4 — Type Selection: No Draft Corruption on Back (Bug)
**Precondition:** Bug type confirmed, currently at Step 4: Verification
**Action:**
1. Browser back button (5 times) to return to Step 1
2. Verify type field state
3. Navigate forward to Step 4 again
**Expected:**
- Type step reloads from saved state
- Type selector still locked and shows Bug selected
- workItemType = "Bug" persists
- All downstream steps reconstruct from draft data (no data loss)
- Bug-specific fields remain populated
**Rationale:** Decision #6 — browser nav should reload at last saved state

---

### BS1.5 — Type Selection: Confirmation Dialog Validation (Bug)
**Precondition:** Bug selected, user clicks Next
**Action:**
1. Confirmation dialog renders (Bug-specific message)
2. User reads dialog text
3. Clicks "Cancel"
**Expected:**
- Dialog closes
- User remains on Step 1: Type
- Draft NOT persisted with type confirmation
- workItemType field still empty or undefined
- Next click brings dialog again

---

### BS1.6 — Type Selection: Disabled State (No Auto-Advance, Bug)
**Precondition:** Draft loaded at Step 1, no type selected
**Action:**
1. Observe "Next" button state
2. Attempt to click "Next" without selecting type
**Expected:**
- "Next" button is disabled or shows error toast: "Please select Feature or Bug to continue"
- No dialog appears
- Step does not advance
- Draft not modified

---

### BS1.7 — Type Selection: Feature → Bug Switch (Cannot Change)
**Precondition:** Feature wizard partially complete (e.g., at Step 3)
**Action:**
1. Create new draft as Bug instead
2. Verify two separate drafts exist with different types
**Expected:**
- Bug draft is separate from Feature draft
- Bug draft starts fresh at Step 1: Type with Bug pre-selected
- Both drafts can coexist without collision
- Switching between them preserves type state
**Rationale:** Verify wizard handles multiple concurrent drafts correctly

---

### BS1.8 — Type Selection: Rapid Re-Selection (No Double-Save, Bug)
**Precondition:** Bug selected, confirmation pending
**Action:**
1. Click Bug → confirmation shows
2. Click OK
3. Immediately (before blur auto-save fires) click "Next"
**Expected:**
- Dialog closes or already closed
- Step advance triggers immediate save (Decision #5)
- currentStep = 1 saved
- No double-save or collision (last-write-wins)
- Step 2 renders with correct state
**Edge Case:** Test timing: blur debounce (500ms) may still be pending when step advance fires

---

### BS1.9 — Type Selection: Invalid State Recovery (Bug Wizard)
**Precondition:** Draft corrupted or loaded with undefined workItemType mid-wizard (edge case)
**Action:**
1. User somehow at Step 2 without type confirmation
2. Browser reload OR panel reopens
**Expected:**
- Wizard detects missing workItemType
- Redirects to Step 1 with warning: "Please complete Type step before continuing"
- Clears currentStep if workItemType missing
- User must select Bug type again

---

## STEP 2: Identity (Bug Path) (8 scenarios)

### BS2.1 — Identity: Epic Selection (Bug Context, Happy Path)
**Precondition:** Bug type confirmed, wizard at Step 2: Identity
**Action:**
1. Identity dropdown/selector renders with project epics
2. Select an Epic
3. Click "Next"
**Expected:**
- Draft field updated with Epic parent
- WIZARD_DRAFT_SAVE message sent on blur or step advance
- Step 3 renders (Bug-specific: "Reproduction" step)
- currentStep = 2 persisted
**Rationale:** Bug must have Epic context (where the bug exists)

---

### BS2.2 — Identity: Feature Selection (Bug Parent)
**Precondition:** Bug type confirmed, wizard at Step 2: Identity
**Action:**
1. Identity selector shows Feature option
2. Select Feature instead of Epic
3. Click "Next"
**Expected:**
- Draft updated with Feature parent
- Step advances normally to Bug Reproduction step
- currentStep = 2 persisted
**Design:** Bug can be child of Feature (sub-task relationship)

---

### BS2.3 — Identity: User Story Direct Selection (Bug)
**Precondition:** Bug type confirmed, wizard at Step 2: Identity
**Action:**
1. Identity selector available
2. Select User Story directly (if supported)
3. Click "Next"
**Expected:**
- Draft accepts User Story as parent
- Step advances to Bug Reproduction step
- currentStep = 2 persisted

---

### BS2.4 — Identity: Selection State Retention on Back (Bug)
**Precondition:** Epic selected and confirmed, now at Step 3: Reproduction
**Action:**
1. Click "Back" button
2. Return to Step 2: Identity
3. Verify selected Epic
**Expected:**
- Previously selected Epic appears pre-selected
- Field value restored from draft (not empty)
- Click "Back" again to Type step → Identity step still shows selected value on re-entry
**Rationale:** Decision #5 — auto-save on blur persists state across navigation

---

### BS2.5 — Identity: Validation (Selection Required, Bug)
**Precondition:** Wizard at Step 2: Identity, no selection made
**Action:**
1. Leave selector empty (if possible)
2. Click "Next"
**Expected:**
- Error toast or inline validation: "Please select Epic/Feature/Story where bug was found"
- Step does not advance
- currentStep NOT incremented

---

### BS2.6 — Identity: Options Load Dynamically (Bug)
**Precondition:** Wizard at Step 2, panel opens
**Action:**
1. Selector renders with placeholder "Loading..."
2. Wait for options to populate
3. Options become interactive
**Expected:**
- No spinner indefinitely (timeout handling)
- If no epics exist, show message: "No epics in this project. Create one in Azure DevOps first."
- If load fails, show error toast

---

### BS2.7 — Identity: Selection Change (Edit Before Next, Bug)
**Precondition:** Epic selected, but user changes mind before clicking Next
**Action:**
1. Select Epic A
2. Change to Epic B (before clicking Next)
3. Field blur fires (auto-save at 500ms)
4. Check draft state
**Expected:**
- Draft updated with Epic B
- WIZARD_DRAFT_SAVE sent with new selection
- currentStep = 1 (unchanged, still on Identity step)
- Next click uses Epic B value
**Rationale:** Verify blur auto-save captures changes

---

### BS2.8 — Identity: Rapid Back/Forward Navigation (Bug)
**Precondition:** Bug selected, at Step 2: Identity
**Action:**
1. Click "Back" to Step 1
2. Immediately click "Next" (before save completes)
3. Return to Step 2
4. Observe Identity value
**Expected:**
- Identity value preserved from prior selection (last saved state)
- No data loss due to rapid navigation
- WIZARD_DRAFT_SAVE collision handled (last-write-wins)

---

## STEP 3: Reproduction (Bug-Specific) (8 scenarios)

### BS3.1 — Reproduction Step: Location Input (Where Bug Found)
**Precondition:** Bug type confirmed, wizard at Step 3: Reproduction
**Action:**
1. "Where" field visible (location of bug)
2. Type: "Login form, Chrome browser"
3. Field blur (auto-save 500ms)
**Expected:**
- Field blur auto-saves location
- Draft field updated (e.g., draft.bugRootCause or draft.bugLocation)
- WIZARD_DRAFT_SAVE sent at 500ms after blur
- currentStep = 2 (unchanged, still on Reproduction step)
**Rationale:** Verify blur auto-save captures location input

---

### BS3.2 — Reproduction Step: Steps to Reproduce
**Precondition:** Wizard at Step 3: Reproduction, Location filled
**Action:**
1. "How to Reproduce" field visible (steps)
2. Type steps: "1. Navigate to login page\n2. Enter invalid credentials\n3. Observe error"
3. Field blur
4. Check clarity indicator/INVEST validation
**Expected:**
- Steps persisted to draft (e.g., draft.bugReproductionSteps array or draft.bugActualBehavior)
- Blur auto-save fires
- Field shows character count or validation feedback
- Preview shows formatted steps (numbered list or readable format)
- User can verify reproduction steps are clear
**Rationale:** Reproduction steps are core bug data

---

### BS3.3 — Reproduction Step: Expected vs Actual Behavior
**Precondition:** Wizard at Step 3: Reproduction
**Action:**
1. "Expected Behavior" field visible
2. Type: "Login succeeds and redirects to dashboard"
3. Field blur
4. "Actual Behavior" field visible
5. Type: "Error 500 appears, stays on login page"
6. Field blur
**Expected:**
- Both fields auto-save independently (500ms debounce each)
- Draft fields updated: bugExpectedBehavior, bugActualBehavior
- No collision between saves (each field has independent debounce timer)
- Preview shows both behaviors side-by-side
**Rationale:** Expected vs Actual is critical for bug clarity

---

### BS3.4 — Reproduction Step: INVEST-Style Validation (Manual Toggle)
**Precondition:** Wizard at Step 3: Reproduction, all reproduction fields filled
**Action:**
1. Observe layout — does INVEST grid appear?
2. If optional INVEST checkboxes present, user can toggle:
   - Independent: "Bug is not blocked by other bugs"
   - Negotiable: "Acceptance criteria can be negotiated"
   - Valuable: "Fixing this is valuable to users"
   - Estimable: "We can estimate fix complexity"
   - Small: "Fix can be done in 1 sprint"
   - Testable: "We can verify the fix"
3. Toggle a few checkboxes
4. Click "Next"
**Expected:**
- If INVEST present in Step 3: checkboxes toggle and persist
- If INVEST NOT present in Step 3: skip this sub-case (Bug variant may not have INVEST in Step 3)
- All toggled values persisted on step advance
**Design Note:** Bug variant may have simplified INVEST or skip it entirely (Decision #1 to be clarified)

---

### BS3.5 — Reproduction Step: Reproduction Clarity Preview
**Precondition:** All reproduction fields filled
**Action:**
1. Preview section renders below fields
2. Shows formatted reproduction scenario
**Expected:**
- Preview format: "BUG FOUND IN: [location]\nSTEPS: [numbered steps]\nEXPECTED: [expected]\nACTUAL: [actual]"
- Preview updates in real-time or after blur
- Text is copyable (user can paste into ADO)
- Preview reads clearly for non-technical users
**Rationale:** User verification before advancing

---

### BS3.6 — Reproduction Step: Rapid Field Switching (Blur Collision)
**Precondition:** Reproduction fields visible and being edited
**Action:**
1. Type in Location field
2. Click Where field blur (within 100ms)
3. Type in Steps field (before Location blur save completes)
4. Wait for both saves to complete
5. Check draft state
**Expected:**
- Both saves queue without collision
- Each field has independent debounce timer (500ms)
- Last-write-wins if overlap
- Draft reflects latest values for both fields
- No data loss or double-saves
**Rationale:** Verify debounce handles multi-field rapid editing

---

### BS3.7 — Reproduction Step: State Retention on Back/Forward
**Precondition:** Reproduction step filled, at Step 4: Verification
**Action:**
1. Click "Back" to Step 3: Reproduction
2. Verify all reproduction fields are populated
3. Click "Back" to Step 2: Identity
4. Click "Next" twice to return to Step 3
**Expected:**
- All reproduction data reconstructed from draft
- No data loss on back/forward navigation
- Blur auto-saves ensure persistence across panel navigation
**Rationale:** Verify auto-save enables seamless back/forward

---

### BS3.8 — Reproduction Step: Field Blur Auto-Save (Multiple Saves Before Advance)
**Precondition:** User editing all reproduction fields
**Action:**
1. Type Location, blur
2. Type Steps, blur
3. Type Expected, blur
4. Type Actual, blur
5. Click "Next" (before all 4 blur saves complete)
**Expected:**
- Each blur triggers independent 500ms debounce
- Step advance (immediate save) fires after 4 pending blur timers
- Step advance save includes all four fields
- No data loss or collision
- No more than 5 saves total (4 blurs + 1 advance)
- Draft reflects complete Reproduction state
**Rationale:** Critical collision test — Decision #5

---

## STEP 4: Verification (Bug-Specific) (5 scenarios)

### BS4.1 — Verification Step: Verification Grid (Bug Acceptance Criteria)
**Precondition:** Wizard at Step 4: Verification
**Action:**
1. Verification section renders with acceptance criteria
2. User fills in: "Bug is fixed when users can login successfully after [action]"
3. Field blur
4. Observe grid/checklist
**Expected:**
- Acceptance criteria text persisted to draft (draft.acceptanceCriteria)
- Blur auto-save fires
- Grid shows acceptance criteria or verification checklist
- User can verify acceptance before finishing
**Rationale:** Acceptance criteria define what "fixed" means

---

### BS4.2 — Verification Step: Test Cases Entry (Bug)
**Precondition:** Wizard at Step 4: Verification
**Action:**
1. "Verification Test Cases" field visible
2. Type test case: "Verify login succeeds with valid credentials after [fix]"
3. Add more test cases
4. Field blur
5. Click "Finish"
**Expected:**
- Test cases array updated in draft.testScenarios
- Blur auto-save persists test cases
- Finish button sends final WIZARD_DRAFT_SAVE
**Rationale:** Verify fix with test cases

---

### BS4.3 — Verification Step: No INVEST Checkboxes (Bug Step 4)
**Precondition:** Wizard at Step 4: Verification (Bug variant)
**Action:**
1. Observe full Verification step layout
2. Search for INVEST cells/checkboxes
**Expected:**
- INVEST grid/checkboxes NOT present on Step 4
- No Independent, Negotiable, Valuable, Estimable, Small, Testable checkboxes
- Bug variant Step 4 does NOT show INVEST validation grid
**Design Enforcement:** Decision #1 — neither Feature nor Bug Step 4 has INVEST cells

---

### BS4.4 — Verification Step: Attachments Upload (Bug Context)
**Precondition:** Wizard at Step 4: Verification
**Action:**
1. Click "Add Attachment" button
2. Select screenshot of bug or error log
3. File uploads
4. Observe attachment in list
5. Click "Finish"
**Expected:**
- File encoded to base64 (PbiAttachment.dataBase64)
- Attachment metadata stored: id, fileName, mimeType
- Screenshot/log appears in attachments list
- Attachment persisted on step advance save
- No file loss on browser back/forward
**Rationale:** Bug reports often include screenshots/logs

---

### BS4.5 — Verification Step: Finish (Bug Wizard Complete)
**Precondition:** All Steps 1-4 completed, at Step 4: Verification
**Action:**
1. Fill all required fields in Verification
2. Click "Finish" button
3. Observe wizard state after Finish
**Expected:**
- Final step advance save triggers (immediate, not debounced)
- All draft data persisted: Bug type, reproduction steps, verification criteria
- Wizard panel closes or shows confirmation: "Bug report saved successfully"
- User can now push bug to Azure DevOps or continue editing
- Back button navigates correctly without state corruption
**Rationale:** Verify Bug wizard completion and final state

---
