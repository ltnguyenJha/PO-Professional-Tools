# Phase 3 Feature Wizard — Test Scenarios (30 tests)

## Overview
Tests for the four-step Feature wizard variant: Type → Identity → Story → Details. Tests behavior, state persistence, and UI interactions. Tests written from user perspective, not implementation.

**Decision Links:**
- Decision #1: Bug variant also ships in Phase 1 (parallel test matrix)
- Decision #2: AI mode selector at top of Story step (not inline, not tab)
- Decision #4: Type locked after confirmation (cannot change mid-wizard)
- Decision #5: Auto-save on blur (500ms) AND step advance (immediate)

---

## STEP 1: Type Selection (9 scenarios)

### FS1.1 — Type Selection: Happy Path (Feature)
**Precondition:** Draft created, wizard loads at Step 1: Type
**Action:** 
1. Feature radio button is visible and unlocked
2. Click Feature button
3. Click "Next" or "Continue"
**Expected:** 
- Draft.workItemType = "Feature"
- Confirmation dialog shows: "You selected Feature. This cannot be changed later. Continue?"
- User clicks OK
- Step advances to Identity (Step 2)
- Draft.currentStep = 1 persisted
**Unhappy Path:** User clicks Cancel on confirmation → stay on Type step, workItemType NOT saved

---

### FS1.2 — Type Selection: Type Lock Verification
**Precondition:** Feature type confirmed, wizard at Step 2: Identity
**Action:** 
1. Browser back OR click "Back" button to return to Step 1
2. Observe Type step re-renders
3. Attempt to click Bug radio button
**Expected:**
- Type selector is grayed out (disabled/readonly)
- Bug button not clickable
- UI shows visual lock indicator (locked icon, disabled state)
- Tooltip on Type selector: "Type cannot be changed after confirmation"
**Rationale:** Decision #4 enforces immutability

---

### FS1.3 — Type Lock: Progress Indicator State
**Precondition:** Feature type confirmed, any downstream step
**Action:**
1. Observe Step 1 in progress bar/breadcrumb
2. Visual rendering of Step 1
**Expected:**
- Step 1 marked as "completed" (checkmark, grayed out)
- Type selector appears grayed out or visually distinct from uncompleted steps
- No interaction possible on grayed Type selector
**Design Check:** Enforce Decision #4 visually (users understand type is foundational)

---

### FS1.4 — Type Selection: No Draft Corruption on Back
**Precondition:** Feature type confirmed, currently at Step 4: Details
**Action:**
1. Browser back button (5 times) to return to Step 1
2. Verify type field state
3. Navigate forward to Step 4 again
**Expected:**
- Type step reloads from saved state
- Type selector still locked and shows Feature selected
- workItemType = "Feature" persists
- All downstream steps reconstruct from draft data (no data loss)
**Rationale:** Decision #6 — browser nav should reload at last saved state

---

### FS1.5 — Type Selection: Confirmation Dialog Validation
**Precondition:** Feature selected, user clicks Next
**Action:**
1. Confirmation dialog renders
2. User reads dialog text
3. Clicks "Cancel"
**Expected:**
- Dialog closes
- User remains on Step 1: Type
- Draft NOT persisted with type confirmation
- workItemType field still empty or undefined
- Next click brings dialog again (no "confirmation remembered" state)
**Edge Case:** User dismisses dialog without clicking OK/Cancel (ESC key, click outside)

---

### FS1.6 — Type Selection: Disabled State (No Auto-Advance)
**Precondition:** Draft loaded at Step 1, no type selected
**Action:**
1. Observe "Next" button state
2. Attempt to click "Next" without selecting type
**Expected:**
- "Next" button is disabled or shows error toast: "Please select Feature or Bug to continue"
- No dialog appears
- Step does not advance
- Draft not modified
**Rationale:** Prevent wizard state corruption from invalid transitions

---

### FS1.7 — Type Selection: Fresh Draft Auto-Loads at Step 1
**Precondition:** New draft created, panel opens
**Action:**
1. Panel renders wizard
2. Check initial step
**Expected:**
- Wizard loads at Step 1: Type
- currentStep = 0 in draft
- Both Feature and Bug options visible and clickable
- No pre-selection from prior drafts
**Rationale:** Fresh start for each new draft

---

### FS1.8 — Type Selection: Rapid Re-Selection (No Double-Save)
**Precondition:** Feature selected, confirmation pending
**Action:**
1. Click Feature → confirmation shows
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

### FS1.9 — Type Selection: Invalid State Recovery
**Precondition:** Draft corrupted or loaded with undefined workItemType mid-wizard (edge case)
**Action:**
1. User somehow at Step 2 without type confirmation
2. Browser reload OR panel reopens
**Expected:**
- Wizard detects missing workItemType
- Redirects to Step 1 with warning: "Please complete Type step before continuing"
- Clears currentStep if workItemType missing
- User must select type again
**Rationale:** Prevent cascade errors from corrupt state

---

## STEP 2: Identity (8 scenarios)

### FS2.1 — Identity: Epic Selection (Happy Path)
**Precondition:** Feature type confirmed, wizard at Step 2: Identity
**Action:**
1. Identity dropdown/selector renders with project epics
2. Select an Epic
3. Click "Next"
**Expected:**
- Draft field updated (e.g., draft.epicId or draft.parentWorkItemId)
- WIZARD_DRAFT_SAVE message sent on blur or step advance
- Step 3 renders
- currentStep = 2 persisted
**Rationale:** Identity determines parent context for user story

---

### FS2.2 — Identity: Feature Selection (Alternative Path)
**Precondition:** Feature type confirmed, Epic doesn't exist or user chooses Feature instead
**Action:**
1. Identity selector shows Feature option
2. Select Feature instead of Epic
3. Click "Next"
**Expected:**
- Draft updated with Feature parent
- Step advances normally
- currentStep = 2 persisted
**Design:** Multiple hierarchy levels supported

---

### FS2.3 — Identity: User Story Direct Selection
**Precondition:** Feature type confirmed, wizard at Step 2: Identity
**Action:**
1. Identity selector available
2. Select User Story directly (if supported by hierarchy)
3. Click "Next"
**Expected:**
- Draft accepts User Story as parent
- Step advances
- currentStep = 2 persisted
**Rationale:** Some workflows may allow Story as parent

---

### FS2.4 — Identity: Selection State Retention on Back
**Precondition:** Epic selected and confirmed, now at Step 3: Story
**Action:**
1. Click "Back" button
2. Return to Step 2: Identity
**Expected:**
- Previously selected Epic appears pre-selected
- Field value restored from draft (not empty)
- Click "Back" again to Type step → Identity step still shows selected value on re-entry
**Rationale:** Decision #5 — auto-save on blur persists state across navigation

---

### FS2.5 — Identity: Validation (Selection Required)
**Precondition:** Wizard at Step 2: Identity, no selection made
**Action:**
1. Leave selector empty (if possible)
2. Click "Next"
**Expected:**
- Error toast or inline validation: "Please select Epic/Feature/Story"
- Step does not advance
- currentStep NOT incremented
**Edge Case:** Can user skip this step? If required, Next is disabled until selection made

---

### FS2.6 — Identity: Options Load Dynamically
**Precondition:** Wizard at Step 2, panel opens
**Action:**
1. Selector renders with placeholder "Loading..."
2. Wait for options to populate
3. Options become interactive
**Expected:**
- No spinner indefinitely (timeout handling)
- If no epics exist, show message: "No epics in this project. Create one in Azure DevOps first."
- If load fails, show error toast
**Rationale:** Handle async data fetch and failure modes

---

### FS2.7 — Identity: Selection Change (Edit Before Next)
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
**Rationale:** Verify blur auto-save captures changes (Decision #5)

---

### FS2.8 — Identity: Rapid Back/Forward Navigation
**Precondition:** Feature selected, at Step 2: Identity
**Action:**
1. Click "Back" to Step 1
2. Immediately click "Next" (before save completes)
3. Return to Step 2
4. Observe Identity value
**Expected:**
- Identity value preserved from prior selection (last saved state)
- No data loss due to rapid navigation
- WIZARD_DRAFT_SAVE collision handled (last-write-wins per Decision #5)
**Edge Case:** Race condition — back fires before blur save completes

---

## STEP 3: Story (Feature Variant) (8 scenarios)

### FS3.1 — Story Step: AI Mode Selector Position (Decision #2 Verification)
**Precondition:** Wizard at Step 3: Story
**Action:**
1. Observe Story step layout
2. Locate AI mode selector
**Expected:**
- Segmented control at TOP of Story step (not inline, not tab)
- Three options visible: INVEST (default) | Copilot Refine | Custom
- Below selector are input fields (As/Want/That for INVEST)
- User reads mode FIRST, then fields
**Design Enforcement:** Decision #2 — top placement makes mode choice explicit

---

### FS3.2 — Story Step: INVEST Mode (Default, Happy Path)
**Precondition:** AI mode selector at default (INVEST)
**Action:**
1. Click in "As a..." field (persona)
2. Type "user"
3. Field blur (auto-save 500ms)
4. Click in "I want..." field (want)
5. Type "feature X"
6. Field blur
7. Click in "So that..." field (benefit)
8. Type "outcome Y"
9. Click "Next"
**Expected:**
- Three blur saves fire (500ms each after blur event)
- Final step advance triggers immediate save
- Draft fields updated: persona, want, benefit (or equivalent names)
- currentStep = 3 incremented
- Step 4: Details renders
- All three INVEST fields persisted
**Rationale:** Verify blur auto-save + step advance collision (Decision #5)

---

### FS3.3 — Story Step: INVEST Grid Preview
**Precondition:** INVEST mode active, user filled some fields
**Action:**
1. All three INVEST fields populated
2. Preview grid/summary appears below fields
3. Check preview content
**Expected:**
- Preview shows filled INVEST cells
- Format: "As a [persona] I want [want] so that [benefit]"
- Preview updates in real-time as user types (or after blur)
- Preview text is copyable (user can paste into ADO)
**Rationale:** User confirmation before step advance

---

### FS3.4 — Story Step: Copilot Refine Mode
**Precondition:** Wizard at Step 3: Story
**Action:**
1. Click "Copilot Refine" mode selector
2. UI switches to text input (seed idea)
3. Type seed idea: "login flow is confusing"
4. Click "Refine with AI" button
5. Wait for AI response
6. AI populates INVEST fields (generated)
**Expected:**
- Mode switch visible (highlight on Copilot Refine)
- Input field changes from INVEST to single text box
- "Refine with AI" button triggers backend request
- AI response populates all four INVEST fields (persona, want, benefit)
- User can edit generated text or accept it
- Next click saves all fields
**Edge Case:** AI generation timeout (>5s) → show error, allow manual entry

---

### FS3.5 — Story Step: Custom Mode (Free Text)
**Precondition:** Wizard at Step 3: Story
**Action:**
1. Click "Custom" mode selector
2. UI switches to large text area
3. Type free-form story: "Custom narrative..."
4. Click "Next"
**Expected:**
- Mode switch visible (highlight on Custom)
- INVEST fields replaced with single text area
- Text area blur auto-saves (500ms)
- All text persisted to draft (custom field or description field)
- Step advances with custom text preserved
**Rationale:** Support non-INVEST workflows

---

### FS3.6 — Story Step: Mode Switch with Unsaved Data (Edge Case)
**Precondition:** INVEST mode, "As a..." field filled with text
**Action:**
1. Type "As a..." field: "user"
2. Click "Copilot Refine" mode selector (before blur)
3. Confirm mode switch in dialog
4. Check if prior INVEST text is saved or lost
**Expected:**
- Mode switch dialog: "You have unsaved INVEST text. Switch mode and lose it?"
- If OK: prior INVEST text discarded, Custom mode opens with empty input
- Blur auto-save fires for INVEST field before mode switch (if possible)
- If Cancel: stay in INVEST mode, INVEST text intact
**Rationale:** Prevent accidental data loss during mode switching

---

### FS3.7 — Story Step: INVEST Cell Validation (No Manual Checkboxes in Feature Step 4)
**Precondition:** INVEST fields filled, preview shows
**Action:**
1. Verify Story step (Step 3) shows INVEST fields
2. Navigate to Step 4: Details
3. Observe Details step layout
**Expected:**
- Step 3 Story: INVEST grid shows data (read-only preview or editable)
- Step 4 Details: NO INVEST checkboxes appear
- Details step shows Technical Considerations, Attachments, Test Cases
- INVEST validation happens on Step 3, NOT Step 4
**Design Enforcement:** Decision #1 (Bug variant) — Feature Step 4 has no INVEST cells

---

### FS3.8 — Story Step: Field Blur Auto-Save Collision (Critical Edge Case)
**Precondition:** INVEST fields being rapidly edited
**Action:**
1. User types in "As a..." field continuously (simulating rapid typing)
2. Blur event fires (500ms debounce starts)
3. Before debounce completes (within 500ms), user clicks "I want..." field
4. Blur event on new field starts new debounce timer
5. First debounce fires → save attempt
6. Second blur fires → second save attempt
7. Check if saves collide and which value wins
**Expected:**
- Debounce properly cancels old timers
- Each field blur has independent timer
- Multiple blur saves queued sequentially (not parallel)
- Last-write-wins if saves collide
- No double-save for same field
- Draft reflects latest user input
**Rationale:** Decision #5 — verify collision handling in protocol

---

## STEP 4: Details (Feature Variant) (5 scenarios)

### FS4.1 — Details Step: Technical Considerations (Happy Path)
**Precondition:** Wizard at Step 4: Details
**Action:**
1. Details step renders
2. "Technical Details" field visible
3. Type: "Use REST API, cache responses"
4. Field blur (auto-save 500ms)
5. Scroll down, observe grid/sections
**Expected:**
- Technical text persisted to draft.technicalConsiderations.technicalDetails
- Blur auto-save fires
- Text is saved within 500ms of blur event
- Field remains editable (not read-only)
- User can navigate to prior steps without losing technical text
**Rationale:** Verify blur auto-save on final step

---

### FS4.2 — Details Step: No INVEST Checkboxes (Feature Variant)
**Precondition:** Wizard at Step 4: Details
**Action:**
1. Observe full Details step layout
2. Search for INVEST cells/checkboxes
**Expected:**
- INVEST summary or display NOT present on Step 4
- No checkboxes for Independent, Negotiable, Valuable, Estimable, Small, Testable
- Feature variant Step 4 does NOT show INVEST validation grid
- Bug variant Step 4 also does NOT show INVEST cells
**Design Enforcement:** Decision #1 — neither Feature nor Bug Step 4 has INVEST cells

---

### FS4.3 — Details Step: Attachments Upload
**Precondition:** Wizard at Step 4: Details
**Action:**
1. Click "Add Attachment" button
2. Select file from disk (e.g., diagram.png)
3. File uploads
4. Observe attachment in list
5. Click "Next" or "Finish"
**Expected:**
- File encoded to base64 (PbiAttachment.dataBase64)
- Attachment metadata stored: id, fileName, mimeType
- List of attachments shows file names
- Can remove attachment before finish
- Attachment persisted on step advance save
- No file loss on browser back/forward
**Rationale:** Verify attachment persistence in wizard flow

---

### FS4.4 — Details Step: Test Cases Entry
**Precondition:** Wizard at Step 4: Details
**Action:**
1. "Test Cases" text area visible
2. Type test case: "Verify login succeeds with valid credentials"
3. Add more test cases (multiline or list)
4. Field blur
5. Click "Finish"
**Expected:**
- Test cases array updated in draft.testScenarios
- Blur auto-save persists test cases
- Step advance confirms persistence
- Finish button sends WIZARD_DRAFT_SAVE with all Step 4 data
**Rationale:** Verify multi-field data collection and final save

---

### FS4.5 — Details Step: Finish (No More Steps)
**Precondition:** All Steps 1-4 completed, at Step 4: Details
**Action:**
1. Fill all required fields in Details
2. Click "Finish" button (instead of "Next")
3. Observe wizard state after Finish
**Expected:**
- Final step advance save triggers (immediate, not debounced)
- All draft data persisted: currentStep unchanged or marked as complete
- Wizard panel closes or shows confirmation: "Draft saved successfully"
- User can now push draft to Azure DevOps or continue editing
- Back button from confirmation navigates correctly (no corrupted state)
**Rationale:** Verify wizard completion and final state management

---
