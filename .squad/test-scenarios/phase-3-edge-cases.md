# Phase 3 Edge Cases & Cross-Cutting Scenarios (16 tests)

## Overview
Critical edge cases that span both Feature and Bug wizard variants. Emphasis on state machine transitions, collision handling, and error recovery. These tests validate that the wizard remains stable under adverse conditions.

**Priority:** HIGH — these represent real user scenarios and failure modes

---

## UNHAPPY PATH: Network & Persistence Failures (8 scenarios)

### EC1 — WIZARD_DRAFT_SAVE Timeout (Network Failure During Blur Save)
**Precondition:** User editing fields in wizard (e.g., Story step INVEST fields)
**Action:**
1. User types in "As a..." field: "user"
2. Field blur occurs (500ms debounce starts)
3. Network goes down or backend timeout (>5s)
4. WIZARD_DRAFT_SAVE request hangs
5. User waits (no visible error yet)
6. Timeout threshold reached (5-10s)
**Expected:**
- Toast error appears: "Could not save draft. Retrying..."
- "Retry" button shown (or auto-retry after 3s)
- Field value NOT cleared (user sees their input)
- If retry succeeds: toast disappears, save completes
- If retry fails: "Save failed. Your changes are in local storage." (fallback to localStorage)
- User can continue editing (offline mode graceful degradation)
**Rationale:** Network failures happen — wizard must be resilient

---

### EC2 — Draft Not Found on Save (Deleted by Another Session)
**Precondition:** User editing draft, draft deleted by another user/session
**Action:**
1. User at Step 3: Story, editing fields
2. Field blur fires → WIZARD_DRAFT_SAVE sent
3. Backend responds: "Draft not found (404)"
4. Handler detects missing draft
**Expected:**
- Toast error: "Draft was deleted. You can save as new draft or discard changes."
- Two buttons: "Save as New Draft" | "Discard"
- If "Save as New Draft": creates new draft with current edits (new draftId)
- If "Discard": panel closes without saving
- Wizard does NOT crash or leave orphaned state
**Rationale:** Multi-user editing — one user deletes, another still editing

---

### EC3 — Schema Version Mismatch (Legacy Draft Opened as v2)
**Precondition:** User with legacy PBI Studio draft tries to open wizard
**Action:**
1. Old draft exists with no schemaVersion field (legacy)
2. User clicks "Edit" or "Open Wizard"
3. Wizard component loads draft
4. WIZARD_DRAFT_LOAD sent
5. Response includes schemaVersion = 'legacy' (detected from absence)
**Expected:**
- Legacy view renders instead of wizard: "This draft uses the old format"
- Banner shows: "Migrate to New Wizard" button
- User can click button to upgrade
- Upgrade process: backend sets schemaVersion = 'v2', currentStep = 0
- After upgrade: wizard opens at Step 1: Type
- Legacy draft data preserved (no data loss on migration)
**Rationale:** Decision #3 — backward compatibility with existing drafts

---

### EC4 — Concurrent Saves (Blur + Step Advance Race)
**Precondition:** User editing fields and rapidly advancing steps
**Action:**
1. User types in Story field: "As a user"
2. Blur event fires → debounce timer starts (500ms)
3. Before 500ms, user clicks "Next" button
4. Step advance handler fires immediately (Decision #5)
5. Both blur save and step advance save attempt
**Expected:**
- Step advance save cancels pending blur timer (early termination)
- Only ONE save request sent (step advance)
- Step advance save includes latest field value + new currentStep
- Step advances to next step
- No data loss or double-save
- Draft reflects user's latest input
**Rationale:** Decision #5 — step advance overrides pending blur (last-write-wins)

---

### EC5 — Invalid Step on Save (Out-of-Range currentStep)
**Precondition:** Corrupt draft or malformed message
**Action:**
1. Draft receives WIZARD_STEP_CHANGE with targetStep = 5 (invalid, range 0-3)
2. Handler validates step range (Decision 6 from protocol)
3. Backend detects invalid step
**Expected:**
- Toast error: "Invalid step. Valid range is 0-3."
- Step does NOT advance
- Draft NOT modified
- No state corruption
- User remains on current step
**Rationale:** Defensive programming — validate all inputs at trust boundary

---

### EC6 — Type Change Attempt After Confirmation (Type-Locked State)
**Precondition:** Feature type confirmed, wizard at Step 2+
**Action:**
1. User navigates back to Step 1
2. Type selector is grayed out (disabled)
3. User somehow tries to send malformed message: WIZARD_DRAFT_SAVE with workItemType = "Bug"
4. Backend receives conflicting type
**Expected:**
- Backend rejects type change: "Type cannot be changed after confirmation"
- Toast error shown
- Draft.workItemType remains "Feature"
- No partial updates allowed
- Message ignored (no response event sent)
**Rationale:** Decision #4 — type is immutable once confirmed

---

### EC7 — Lost Connection Recovery (Retry & Eventual Consistency)
**Precondition:** Long-lived wizard session, intermittent network
**Action:**
1. User editing Step 3: Story
2. Network drops (lose connection)
3. User continues typing (optimistic UI)
4. Click "Next" to advance step
5. Save request fails (no network)
6. Network recovers after 10s
7. Retry button clicked
**Expected:**
- While offline: UI remains responsive (local-first)
- Retry sends pending save with all queued changes
- If retry succeeds: toast success appears
- If retry fails again: show persistent error with manual retry option
- Eventually consistent: when network recovers, latest state syncs
**Rationale:** Real users experience unreliable networks

---

### EC8 — Panel Close During Save (Unfinished Transaction)
**Precondition:** User closing extension panel while save is in-flight
**Action:**
1. User at Step 3: Story, editing fields
2. Blur auto-save fires (500ms debounce)
3. WIZARD_DRAFT_SAVE message sent
4. User immediately closes extension panel (before response)
5. Save still pending on backend
6. User reopens panel
**Expected:**
- Panel remembers draft context
- On reopen, WIZARD_DRAFT_LOAD fetches latest persisted state
- If save completed on backend: latest state shown
- If save failed/incomplete: last fully-saved state shown
- No data loss or orphaned state
- Wizard resumes from last complete save
**Rationale:** User may close panel during network latency

---

## STATE MACHINE EDGE CASES (8 scenarios)

### EC9 — Step Skip Attempt (Cannot Jump Directly to Step 3)
**Precondition:** Wizard at Step 1: Type
**Action:**
1. User somehow sends WIZARD_STEP_CHANGE with targetStep = 3 (skip steps 1 & 2)
2. Handler detects invalid transition
**Expected:**
- Transition blocked: "Please complete previous steps first"
- Toast error shown
- currentStep remains 0
- User must advance through Step 1 → 2 → 3 sequentially
**Rationale:** Wizard requires sequential completion (state dependency)

---

### EC10 — Back Button Beyond Step 0 (At Start, Cannot Go Back)
**Precondition:** Wizard at Step 1: Type
**Action:**
1. User clicks "Back" button
2. Handler receives WIZARD_STEP_CHANGE with targetStep = -1
**Expected:**
- Back button is disabled when at Step 0
- OR handler rejects negative step: "Cannot go before first step"
- No navigation
- User remains on Step 1
**Rationale:** Prevent state corruption from invalid backward navigation

---

### EC11 — Forward Button Beyond Step 3 (At End, Cannot Go Forward)
**Precondition:** Wizard at Step 4: Details (Feature) / Verification (Bug)
**Action:**
1. User clicks "Next" button (if still visible)
2. Handler receives WIZARD_STEP_CHANGE with targetStep = 4
**Expected:**
- Next button is disabled or hidden when at final step
- OR handler rejects step 4: "No more steps after Details/Verification"
- No advancement
- User remains on Step 4
- "Finish" button appears instead of "Next"
**Rationale:** Wizard ends at Step 3 (index 3 = 4th step), no Step 4 navigation

---

### EC12 — Type Change Mid-Wizard (Malformed Message)
**Precondition:** Feature wizard, currently at Step 3: Story
**Action:**
1. User sends malformed WIZARD_DRAFT_SAVE with workItemType = "Bug"
2. Backend receives message attempting to change type mid-wizard
3. Handler validates immutability
**Expected:**
- Type change rejected: "Type cannot be changed after confirmation"
- workItemType remains "Feature"
- currentStep remains unchanged
- All other fields in message processed normally (or entire message rejected)
- Toast error: "Type is locked and cannot be changed"
**Rationale:** Type is immutable once confirmed (Decision #4)

---

### EC13 — Rapid Next/Back Mashing (Quick Navigation Stress)
**Precondition:** Wizard at Step 2: Identity
**Action:**
1. User clicks "Back" and "Next" repeatedly in quick succession (3x each in <1s)
2. Multiple WIZARD_STEP_CHANGE messages queued
3. Handler processes queue
**Expected:**
- Messages processed sequentially (not parallel)
- No state corruption from race conditions
- Final step matches last valid request
- All pending blur saves cancelled when step changes
- Draft reflects final navigation state (currentStep correct)
- No orphaned saves or doubled messages
**Rationale:** Stress test for state machine robustness

---

### EC14 — Browser Refresh During Save (Page Reload Handling)
**Precondition:** User refreshing browser while WIZARD_DRAFT_SAVE in-flight
**Action:**
1. User at Step 3: Story, typing fields
2. Blur save starts (500ms debounce)
3. User presses F5 or closes tab
4. Page unloads before save completes
5. User reopens extension
**Expected:**
- Backend eventually commits pending save (or times out and rolls back)
- On reopen: WIZARD_DRAFT_LOAD fetches latest persisted state
- Draft shows last completely-saved state (not in-flight state)
- No data corruption or orphaned records
- User can resume editing from last save
**Rationale:** Real browser behavior — accidental refresh happens

---

### EC15 — currentStep Field Missing (Draft Without Navigation State)
**Precondition:** Corrupt draft or legacy migration edge case
**Action:**
1. Draft loaded with schemaVersion = 'v2' but currentStep = undefined
2. Wizard component mounts and tries to load step
3. Handler detects missing currentStep
**Expected:**
- Wizard defaults to Step 0: Type
- If Type already completed (workItemType set), redirect to Step 1
- currentStep field set to 0 on first save
- Warning logged: "currentStep missing, defaulting to 0"
- No crash or blank screen
**Rationale:** Graceful recovery from corrupt/incomplete state

---

### EC16 — All Fields Blank (Empty Draft Submission)
**Precondition:** User advances through wizard without entering data
**Action:**
1. User clicks through all steps without typing anything
2. Each step has optional fields (or validation allows empty)
3. User reaches Finish step
4. Click "Finish" with all fields empty
**Expected:**
- If fields required: Next button disabled, toast: "Please fill required fields"
- If fields optional: Wizard completes, empty draft saved
- Draft shows empty/undefined values for all user-input fields
- User can reopen and edit later
- Empty draft can be pushed to ADO or discarded
**Rationale:** Allow users to save skeleton draft for later completion

---

