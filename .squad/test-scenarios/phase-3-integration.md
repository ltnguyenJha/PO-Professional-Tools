# Phase 3 Message Protocol & Integration Tests (28 tests)

## Overview
Tests for the message protocol (6 new message types) and state persistence across browser navigation, session boundaries, and legacy draft handling. Tests verify Decision #5 and Decision #6 implementation.

**Protocol Decisions:**
- Decision #5 (Linus): Debounced blur (500ms) + immediate step advance, last-write-wins
- Decision #3 (Danny): Legacy drafts as read-only, manual migration
- Decision #6 (Danny): Browser back/forward allowed, reload at last saved state

---

## MESSAGE PROTOCOL TESTS (20 scenarios)

### PT1 — WIZARD_DRAFT_LOAD: Happy Path
**Trigger:** Wizard component mounts, panel opens
**Message Flow:**
1. Frontend: WIZARD_DRAFT_LOAD { draftId }
2. Backend: Reads draft from storage
3. Response: WIZARD_DRAFT_LOADED { draft, currentStep, schemaVersion }
**Expected:**
- Draft object fully hydrated with all fields
- currentStep = persisted step value (0-3)
- schemaVersion = 'v2' (for new wizard) OR 'legacy' (for old drafts)
- Response sent immediately (no delay)
**Rationale:** Initial wizard load must be fast and complete

---

### PT2 — WIZARD_DRAFT_LOAD: Draft Not Found
**Precondition:** draftId does not exist
**Message Flow:**
1. Frontend: WIZARD_DRAFT_LOAD { draftId }
2. Backend: Draft lookup fails (404)
3. Response: TOAST error + no response event
**Expected:**
- Toast: "Draft not found. It may have been deleted."
- Wizard panel shows empty or fallback state
- No WIZARD_DRAFT_LOADED response sent
- Wizard allows user to create new draft or cancel
**Rationale:** Handle deleted/missing drafts gracefully

---

### PT3 — WIZARD_DRAFT_LOAD: Legacy Draft Detection (schemaVersion Absent)
**Precondition:** Draft exists with no schemaVersion field (old PBI Studio draft)
**Message Flow:**
1. Frontend: WIZARD_DRAFT_LOAD { draftId }
2. Backend: Detects missing schemaVersion → sets to 'legacy'
3. Response: WIZARD_DRAFT_LOADED { draft, currentStep: undefined, schemaVersion: 'legacy' }
**Expected:**
- Backend correctly identifies legacy (absent = legacy per Decision #3)
- schemaVersion = 'legacy' in response
- currentStep = undefined (legacy drafts don't have step tracking)
- Frontend renders legacy view instead of wizard
- Migration banner shown: "This draft uses old format. [Migrate] or [Classic Edit]"
**Rationale:** Backward compatibility — old drafts don't break

---

### PT4 — WIZARD_STEP_CHANGE: Happy Path
**Trigger:** User clicks Next or Back button
**Message Flow:**
1. Frontend: WIZARD_STEP_CHANGE { draftId, targetStep: 1 }
2. Backend: Validates step (0-3), persists currentStep = 1
3. Response: WIZARD_STEP_CHANGED { draftId, currentStep: 1, draft }
**Expected:**
- Backend responds with full draft object
- currentStep updated in storage
- Response sent promptly
- Frontend advances UI to new step
**Rationale:** Explicit step navigation with validation

---

### PT5 — WIZARD_STEP_CHANGE: Invalid Step (Out of Range)
**Trigger:** Malformed message or client bug
**Message Flow:**
1. Frontend: WIZARD_STEP_CHANGE { draftId, targetStep: 5 }
2. Backend: Validates 0 <= targetStep <= 3, rejects
3. Response: TOAST error + no WIZARD_STEP_CHANGED event
**Expected:**
- Toast: "Invalid step: 5. Valid range is 0-3."
- currentStep NOT changed
- Draft NOT persisted
- Message handler returns early (no state modification)
**Rationale:** Defensive programming at message boundary

---

### PT6 — WIZARD_STEP_CHANGE: Backward Navigation (Back Button)
**Trigger:** User clicks "Back"
**Message Flow:**
1. Frontend: WIZARD_STEP_CHANGE { draftId, targetStep: 1 } (from step 2)
2. Backend: Step 1 <= Step 3, valid
3. Response: WIZARD_STEP_CHANGED { draftId, currentStep: 1, draft }
**Expected:**
- Backend allows backward step (no restriction)
- Draft reconstructed with previous step's data (from storage)
- Full draft returned in response
- Frontend renders previous step with data intact
**Rationale:** Backward navigation must be allowed (Decision #6)

---

### PT7 — WIZARD_DRAFT_SAVE: Blur Save (500ms Debounce)
**Trigger:** Field blur event (e.g., "As a..." field loses focus)
**Message Flow:**
1. Frontend: Field blur → queue WIZARD_DRAFT_SAVE { draftId, partialDraft: {persona: 'user'}, currentStep: 2 }
2. Debounce timer starts (500ms)
3. After 500ms (no new blur): Message sent
4. Backend: Merges partialDraft into existing draft, persists
5. Response: WIZARD_DRAFT_SAVED { draftId, timestamp, currentStep: 2 }
**Expected:**
- Message sent AFTER 500ms delay (not immediately)
- Debounce batches rapid blurs on different fields
- Backend merge: `{ ...draft, ...partialDraft }`
- Immutable fields preserved (id, projectId)
- Response includes timestamp (for sorting multiple saves)
**Rationale:** Debounce reduces I/O on rapid typing (Decision #5)

---

### PT8 — WIZARD_DRAFT_SAVE: Multiple Blur Collision (Same Field)
**Trigger:** User types in field rapidly, blur fires twice before first save completes
**Message Flow:**
1. Frontend: Field "persona" gets focus
2. User types "user" → blur fires → debounce starts (500ms)
3. Before 500ms, user clicks field again, types " admin" → blur fires again → debounce reset (cancels old timer)
4. After new 500ms: WIZARD_DRAFT_SAVE { partialDraft: {persona: 'user admin'}, ... }
5. Backend: Merge and persist
6. Response: WIZARD_DRAFT_SAVED
**Expected:**
- New blur resets debounce timer (cancels old)
- Latest value sent in single save
- Backend merge overwrites persona with latest value
- No double-save for same field
- No lost data
**Rationale:** Debounce timer must reset on repeated blur (standard pattern)

---

### PT9 — WIZARD_DRAFT_SAVE: Multiple Fields (Independent Timers)
**Trigger:** User rapidly editing multiple fields
**Message Flow:**
1. Field A blur → debounce A starts (500ms)
2. Field B blur (before A completes) → debounce B starts (500ms)
3. Field A debounce fires (at 500ms) → WIZARD_DRAFT_SAVE { fieldA: value }
4. Backend: Merge persists fieldA
5. Field B debounce fires (at 500ms from B's blur) → WIZARD_DRAFT_SAVE { fieldB: value }
6. Backend: Merge persists fieldB (on top of fieldA)
**Expected:**
- Each field has independent debounce timer
- Saves queued sequentially (field A saves, then field B)
- Backend merge: latest values for both fields
- No collision or data loss
- Multiple saves allowed if on different fields
**Rationale:** Each field needs independent debounce to handle user's natural editing flow

---

### PT10 — WIZARD_DRAFT_SAVE: Step Advance (Immediate, Cancels Pending Blur)
**Trigger:** User clicks "Next" button (step advance)
**Message Flow:**
1. Frontend: Field blur → debounce A starts (500ms)
2. User clicks "Next" before debounce fires (at 200ms)
3. Frontend: Detect step change (currentStep mismatch)
4. Cancel pending blur debounce (clear timer)
5. Send WIZARD_DRAFT_SAVE immediately { partialDraft: {...}, currentStep: 3 }
6. Backend: Merge and persist currentStep = 3
7. Response: WIZARD_DRAFT_SAVED
**Expected:**
- Step advance does NOT wait for blur debounce (immediate)
- Pending blur timer cancelled (clearTimeout)
- Single save sent with currentStep = 3 and latest field value
- No double-save collision
- currentStep updated and persisted
**Rationale:** Decision #5 — step advance overrides blur (last-write-wins)

---

### PT11 — WIZARD_DRAFT_SAVE: Collision Handling (Blur + Step Advance Race)
**Trigger:** Step advance fire at same time as blur save (extreme edge case)
**Message Flow:**
1. Frontend: Blur save queued (debounce at 450ms mark)
2. User clicks "Next" (at 480ms) → step advance fires
3. Step advance clears blur timer and sends immediate save
4. Blur save ALSO attempted to fire (500ms mark) but timer already cleared
5. Only one message reaches backend: step advance save with currentStep = 3
**Expected:**
- Only ONE save message sent (step advance)
- Backend receives currentStep = 3
- Draft reflects step advance state
- No duplicate WIZARD_DRAFT_SAVED responses
- Frontend correctly handles single response
**Rationale:** Race condition — blur timer must be cleared before step advance send

---

### PT12 — WIZARD_DRAFT_SAVE: Partial Draft Merge
**Trigger:** Blur save with subset of fields
**Message Flow:**
1. Frontend: WIZARD_DRAFT_SAVE { draftId, partialDraft: {persona: 'user'}, currentStep: 2 }
2. Backend: Existing draft { id, projectId, title, description, persona: 'admin', ... }
3. Backend: Merge: { ...draft, ...partialDraft } → { ..., persona: 'user', ... }
4. Re-apply immutable: { id: draft.id, projectId: draft.projectId, ... }
5. Persist and response
**Expected:**
- Backend merge correctly: persona updated, other fields unchanged
- title, description, all other fields remain intact
- id, projectId never change (immutable)
- schemaVersion = 'v2' explicitly set
- updatedAt = new timestamp
**Rationale:** Partial updates reduce message size and complexity

---

### PT13 — WIZARD_DRAFT_SAVE: In-Flight State Map (Read-After-Write)
**Trigger:** Two rapid saves (blur + immediate follow-up blur)
**Message Flow:**
1. Frontend: Blur A → WIZARD_DRAFT_SAVE { fieldA: 'valueA' }
2. Message in-flight (backend processing)
3. Frontend: Blur B → WIZARD_DRAFT_SAVE { fieldB: 'valueB' }
4. Second message sent before first completes
5. Backend: In-flight map updated with merged state
6. First save persisted → in-flight map updated
7. Second save persisted → in-flight map updated
**Expected:**
- Backend maintains in-flight map: `Map<draftId, draft>`
- Reads see latest in-flight state (even if not yet persisted)
- No race condition on read-after-write
- Last save wins on collision
**Rationale:** Decision #5 — ensures consistency during rapid saves

---

### PT14 — WIZARD_DRAFT_SAVE: Persistence Verification (schemaVersion & currentStep)
**Trigger:** Step advance save
**Message Flow:**
1. Frontend: WIZARD_DRAFT_SAVE { draftId, partialDraft: {...}, currentStep: 2 }
2. Backend: Persists draft with schemaVersion = 'v2', currentStep = 2
3. Response: WIZARD_DRAFT_SAVED
4. Frontend: Later calls WIZARD_DRAFT_LOAD { draftId }
5. Backend: Reads persisted draft
6. Response: WIZARD_DRAFT_LOADED { ..., currentStep: 2, schemaVersion: 'v2' }
**Expected:**
- schemaVersion explicitly set to 'v2' on first wizard save
- currentStep persisted correctly (2)
- Reload confirms persistence (all changes saved)
- No data loss or inconsistency between saves
**Rationale:** Verify storage layer commits all changes

---

## STATE PERSISTENCE ACROSS NAVIGATION (8 scenarios)

### PT15 — Browser Back Button (Reload at Last Saved State)
**Precondition:** User at Step 3, wizard working normally
**Action:**
1. User fills "As a..." field: "user"
2. Field blur → auto-save fires (500ms)
3. User clicks browser back button
4. Page navigates (or panel resets)
5. User reopens wizard
**Expected:**
- Wizard loads via WIZARD_DRAFT_LOAD
- currentStep = 2 (last saved, from prior session)
- All fields in Step 2 pre-populated (Identity step)
- User can navigate forward to Step 3 again
- Step 3 "As a..." field shows "user" (persistence verified)
**Rationale:** Decision #6 — back button allowed, reload at saved state

---

### PT16 — Browser Forward Button (Reload at Last Saved State)
**Precondition:** User at Step 2, navigated back, now clicking forward
**Action:**
1. User at Step 2: Identity
2. User fills and advances to Step 3 (blur saves trigger)
3. User clicks back to Step 2
4. User clicks browser forward button
**Expected:**
- Page navigates forward
- Wizard reloads (or resumes)
- currentStep = 3 (forward state persisted)
- Step 3 fields pre-populated (all prior data intact)
- User sees consistent state
**Rationale:** Forward button should work like back button

---

### PT17 — Tab Close / Reopen (Session Reconstruction)
**Precondition:** User editing wizard, loses focus (switches tab)
**Action:**
1. User editing Step 3, blur saves fire (auto-save enabled)
2. User switches to another tab (VSCode, browser, etc.)
3. After 5 minutes, user switches back to extension tab
4. Tab reactivates, wizard resumes
**Expected:**
- Wizard re-mounts (panel detects activation)
- WIZARD_DRAFT_LOAD sent automatically
- currentStep and all draft data reconstructed
- User sees exactly where they left off
- No data loss from tab switch
**Rationale:** User may alt-tab during editing session

---

### PT18 — Panel Close / Reopen During Session (Unsaved Changes)
**Precondition:** User editing, blur save in-flight
**Action:**
1. User typing in Story field
2. Blur auto-save starts (500ms timer)
3. User closes VS Code panel / extension drawer
4. User reopens panel after 10s
**Expected:**
- Panel reopens wizard
- WIZARD_DRAFT_LOAD fetches latest persisted state
- If blur save completed before close: last save reflected
- If blur save still pending: latest fully-saved state shown
- Data integrity maintained (no orphaned saves)
**Rationale:** User may accidentally close and reopen panel

---

### PT19 — Browser Refresh (F5) During Session
**Precondition:** Wizard active, editing in progress
**Action:**
1. User editing Step 3
2. User presses F5 to refresh browser
3. Page reloads
4. Webview reinitializes
**Expected:**
- Webview reconnects to backend
- WIZARD_DRAFT_LOAD sent automatically (on mount)
- currentStep restored from storage
- All draft data reconstructed
- User sees same step they were on
**Rationale:** User may accidentally refresh

---

### PT20 — Multiple Browser Tabs (Same Draft, Concurrent Edits)
**Precondition:** Two browser tabs open, same draft being edited
**Action:**
1. Tab A: Edit Story field "As a...", blur save fires
2. Tab B: Edit Story field "I want...", blur save fires
3. Tab A: Receives broadcast update (if subscribed)
4. Tab B: Receives broadcast update
**Expected:**
- Both tabs' saves reach backend (if implementation supports)
- Last-write-wins applied (whichever save arrives later)
- If one tab refresh: latest state from storage shown
- No data corruption or orphaned state
- Warns users not to edit same draft in multiple tabs
**Rationale:** Real-world scenario — user opens draft in two places

---

### PT21 — Legacy Draft Reload (schemaVersion Absent)
**Precondition:** Old PBI Studio draft, no schemaVersion field
**Action:**
1. User opens old draft with wizard
2. WIZARD_DRAFT_LOAD sent
3. Backend detects schemaVersion absent → 'legacy'
4. Response: { ..., schemaVersion: 'legacy', currentStep: undefined }
5. Frontend renders legacy view (not wizard)
6. User clicks "Migrate" button
7. Migration request sent
**Expected:**
- Legacy draft loads successfully (backward compatible)
- Legacy view shows read-only or classic edit mode
- Migration button available
- On migrate: schemaVersion = 'v2', currentStep = 0 set by backend
- After migrate: wizard opens at Step 1
- All legacy data preserved through migration
**Rationale:** Decision #3 — manual migration path for existing drafts

---

### PT22 — Rapid Session Transitions (Load → Edit → Navigate → Load)
**Precondition:** User rapidly switching between actions
**Action:**
1. Load draft (WIZARD_DRAFT_LOAD)
2. Edit field (blur save queued)
3. Navigate step (WIZARD_STEP_CHANGE)
4. Close panel
5. Reopen panel → Load draft again
**Expected:**
- All messages processed sequentially (not parallel)
- Final state after reopen matches last persisted state
- No lost saves or skipped steps
- No race conditions from rapid transitions
**Rationale:** Real users interact quickly with UI

---

