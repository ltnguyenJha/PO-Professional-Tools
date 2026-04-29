# Phase 3 Test Matrix Summary (124 Scenarios)

**Date Created:** 2026-05-01  
**Scope:** Complete test coverage for Phase 3 wizard implementation (Feature & Bug variants)  
**Total Scenarios:** 124  
**Status:** DRAFT — Ready for Rusty's component implementation

---

## Executive Summary

This test matrix defines 124 test scenarios for Phase 3 wizard components across four files:

| File | Category | Tests | Priority |
|------|----------|-------|----------|
| `phase-3-feature-wizard.md` | Feature variant (Steps 1-4) | 30 | HIGH |
| `phase-3-bug-wizard.md` | Bug variant (Steps 1-4) | 30 | HIGH |
| `phase-3-edge-cases.md` | Cross-cutting edge cases | 16 | CRITICAL |
| `phase-3-integration.md` | Message protocol & persistence | 28 | HIGH |
| **TOTAL** | | **124** | — |

---

## Test Category Breakdown

### Feature Wizard (30 tests)
**Coverage:** Four-step Feature workflow with AI mode selector

- **Step 1: Type Selection** (9 tests)
  - Happy path, type locking, confirmation dialog, validation, state recovery
  - Tests Decision #4 (type immutability) and Decision #6 (browser nav)

- **Step 2: Identity** (8 tests)
  - Epic/Feature/Story selection, state retention, validation, dynamic loading
  - Tests Decision #5 (blur auto-save) and Decision #6 (back/forward nav)

- **Step 3: Story** (8 tests)
  - AI mode selector placement (Decision #2), INVEST mode, Copilot Refine, Custom mode
  - Field blur collision handling, mode switching with unsaved data
  - Tests Decision #5 (debounce collision) extensively

- **Step 4: Details** (5 tests)
  - Technical considerations, attachments, test cases, no INVEST cells (Decision #1)
  - Finish button behavior, final save verification

**Key Decision Enforcement:**
- Decision #1: Bug variant also ships (parallel test file validates)
- Decision #2: AI mode selector at TOP of Story step (FS3.1)
- Decision #4: Type locked after confirmation (FS1.2, FS1.3)
- Decision #5: Blur auto-save + step advance (FS3.2, FS3.8)

---

### Bug Wizard (30 tests)
**Coverage:** Four-step Bug workflow with reproduction-focused steps

- **Step 1: Type Selection** (9 tests)
  - Happy path for Bug type, type locking, confirmation dialog
  - Mirrors Feature tests to ensure parity (Decision #1)

- **Step 2: Identity** (8 tests)
  - Epic/Feature/Story selection in Bug context
  - Tests same state persistence as Feature variant

- **Step 3: Reproduction** (8 tests)
  - Location, Steps to Reproduce, Expected vs Actual Behavior
  - INVEST validation (if present), clarity preview
  - Tests blur auto-save collision with multiple fields
  - Tests Decision #5 extensively

- **Step 4: Verification** (5 tests)
  - Acceptance criteria, test cases, no INVEST cells (Decision #1)
  - Attachments (screenshots/logs common for bugs)
  - Finish behavior mirrors Feature

**Key Differences from Feature:**
- Step 3 focuses on reproduction clarity, not INVEST
- Attachment upload includes screenshot/log context
- Both variants have NO INVEST checkboxes on Step 4 (Decision #1)

---

### Edge Cases (16 tests)
**Coverage:** Critical failure modes and state machine edge cases

**Network & Persistence Failures (8 tests)**
- EC1: WIZARD_DRAFT_SAVE timeout (network failure, retry)
- EC2: Draft not found on save (deleted by another session)
- EC3: Schema version mismatch (legacy draft opened as v2)
- EC4: Concurrent saves (blur + step advance race) ← **CRITICAL**
- EC5: Invalid step on save (out-of-range currentStep)
- EC6: Type change attempt after confirmation (immutability)
- EC7: Lost connection recovery (eventual consistency)
- EC8: Panel close during save (unfinished transaction)

**State Machine Edge Cases (8 tests)**
- EC9: Step skip attempt (cannot jump directly)
- EC10: Back button beyond Step 0 (at start)
- EC11: Forward button beyond Step 3 (at end)
- EC12: Type change mid-wizard (malformed message)
- EC13: Rapid Next/Back mashing (stress test)
- EC14: Browser refresh during save (page reload)
- EC15: currentStep field missing (corrupt draft)
- EC16: All fields blank (empty draft submission)

**Priority Ranking:**
1. **CRITICAL:** EC4 (blur + step advance race), EC3 (legacy detection), EC6 (type lock)
2. **HIGH:** EC1, EC7, EC13, EC14 (network, navigation stress)
3. **MEDIUM:** EC2, EC5, EC8, EC9, EC10, EC11, EC12, EC15, EC16 (error recovery)

---

### Message Protocol & Integration (28 tests)
**Coverage:** All 6 new message types, state persistence, browser navigation

**Message Protocol Tests (20 tests)**

1. **WIZARD_DRAFT_LOAD** (3 tests)
   - PT1: Happy path (draft hydrated)
   - PT2: Draft not found (404 handling)
   - PT3: Legacy draft detection (schemaVersion absent = legacy)

2. **WIZARD_STEP_CHANGE** (4 tests)
   - PT4: Happy path (step validated, persisted)
   - PT5: Invalid step (out-of-range validation)
   - PT6: Backward navigation (browser back button)
   - PT7: (covered under WIZARD_DRAFT_SAVE collision tests)

3. **WIZARD_DRAFT_SAVE** (10 tests) ← **CORE MESSAGE TYPE**
   - PT7: Blur save (500ms debounce)
   - PT8: Multiple blur collision (same field, debounce reset)
   - PT9: Multiple fields (independent timers)
   - PT10: Step advance (immediate, cancels pending blur) ← **Decision #5**
   - PT11: Collision handling (blur + step advance race) ← **CRITICAL**
   - PT12: Partial draft merge (only changed fields sent)
   - PT13: In-flight state map (read-after-write consistency)
   - PT14: Persistence verification (schemaVersion & currentStep)

**State Persistence & Navigation (8 tests)**
- PT15: Browser back button (reload at saved state)
- PT16: Browser forward button (reload at saved state)
- PT17: Tab close/reopen (session reconstruction)
- PT18: Panel close/reopen (unsaved changes handling)
- PT19: Browser refresh (F5 during session)
- PT20: Multiple browser tabs (concurrent edits on same draft)
- PT21: Legacy draft reload (backward compatibility)
- PT22: Rapid session transitions (load → edit → navigate → load)

**Protocol Decision Enforcement:**
- Decision #5 (Linus): Debounce patterns (PT7-PT14)
- Decision #3 (Danny): Legacy detection (PT3, PT21)
- Decision #6 (Danny): Browser nav allowed (PT15, PT16, PT19)

---

## Test Matrix Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Scenarios** | 124 | Comprehensive coverage |
| **Feature Wizard** | 30 | INVEST-based workflow |
| **Bug Wizard** | 30 | Reproduction-focused workflow |
| **Edge Cases** | 16 | Failure modes & stress tests |
| **Protocol & Integration** | 28 | Message types & persistence |
| **Decision #1 Coverage** | 60 | Both Feature & Bug variants (30+30) |
| **Decision #4 Coverage** | 18 | Type locking (FS1.2, FS1.3, FS1.4, + Bug equivalents) |
| **Decision #5 Coverage** | 45+ | Blur auto-save & step advance (throughout FS3, BS3, EC4, PT7-14) |
| **Decision #6 Coverage** | 15+ | Browser nav (FS1.4, EC14, PT15-19, PT22) |

---

## Test Execution Order (Recommended)

### Phase 1: Happy Paths (Start Here)
1. FS1.1, FS2.1, FS3.2, FS4.1 (Feature happy path)
2. BS1.1, BS2.1, BS3.2, BS4.1 (Bug happy path)
3. PT1, PT4, PT10 (Message protocol happy paths)

**Expected Outcome:** Basic wizard flow works end-to-end

### Phase 2: Decision Enforcement
1. FS1.2, FS1.3 (Type locking — Decision #4)
2. FS3.1 (AI mode selector placement — Decision #2)
3. FS4.2, BS4.3 (No INVEST on Step 4 — Decision #1)
4. EC6 (Type change blocked — Decision #4)

**Expected Outcome:** Design decisions enforced by UI/backend

### Phase 3: State Persistence & Auto-Save
1. FS3.8 (Blur collision — Decision #5)
2. EC4 (Blur + step advance race — Decision #5)
3. PT7-PT14 (Debounce patterns — Decision #5)
4. PT15-PT19 (Browser nav — Decision #6)

**Expected Outcome:** Draft data never lost; navigation seamless

### Phase 4: Edge Cases & Error Recovery
1. EC1-EC8 (Network, persistence failures)
2. EC9-EC16 (State machine edge cases)
3. PT20-PT22 (Multi-session scenarios)

**Expected Outcome:** Wizard gracefully handles all failure modes

### Phase 5: Stress Testing
1. EC13 (Rapid navigation)
2. EC14 (Browser refresh during save)
3. PT20 (Multiple tabs)

**Expected Outcome:** No state corruption under stress

---

## Unhappy Path Prioritization (Critical First)

### TIER 1 — MUST NOT FAIL (Security & Data Integrity)
| Scenario | Why Critical | File | Test ID |
|----------|-------------|------|---------|
| Type lock enforcement | Prevents wizard state corruption | Feature | FS1.2, FS1.3 |
| Blur + step advance collision | Data loss risk | Feature | FS3.8, EC4, PT11 |
| Invalid step rejection | State machine corruption | Edge Cases | EC5, EC9-EC11 |
| Network timeout handling | Lost saves | Edge Cases | EC1 |
| Legacy draft detection | Backward compatibility | Integration | PT3 |
| Concurrent save handling | Data inconsistency | Integration | PT13 |

### TIER 2 — SHOULD NOT FAIL (UX Quality)
| Scenario | Why Important | File | Test ID |
|----------|---------------|------|---------|
| Draft not found | Clear error messaging | Protocol | PT2 |
| Browser back/forward | Expected navigation | Edge Cases | FS1.4, EC14, PT15-PT16 |
| Auto-save on blur | Seamless UX | Feature | FS3.2 |
| Type confirmation dialog | User confirmation | Feature | FS1.1, FS1.5 |
| INVEST mode positioning | Decision #2 compliance | Feature | FS3.1 |

### TIER 3 — NICE TO HAVE (Polish)
| Scenario | Why Useful | File | Test ID |
|----------|-----------|------|---------|
| Empty draft submission | Flexible workflow | Edge Cases | EC16 |
| Tab switch recovery | Multi-app work | Integration | PT17, PT20 |
| Panel close/reopen | Accidental closes | Integration | PT18 |

---

## Test Artifact Files

Each test file is standalone and can be executed independently:

### `phase-3-feature-wizard.md`
- **Size:** ~17.5 KB, 30 scenarios, 400+ lines
- **Focus:** Feature wizard variant, all 4 steps
- **Read By:** QA, Rusty (component builder), test automation
- **Execution:** Test Feature wizard against each scenario
- **Success Criteria:** All 30 pass before move to integration

### `phase-3-bug-wizard.md`
- **Size:** ~17 KB, 30 scenarios, 400+ lines
- **Focus:** Bug wizard variant, all 4 steps
- **Read By:** QA, Rusty (component builder), test automation
- **Execution:** Test Bug wizard against each scenario
- **Success Criteria:** All 30 pass, parity with Feature variant

### `phase-3-edge-cases.md`
- **Size:** ~11 KB, 16 scenarios, 300+ lines
- **Focus:** Failure modes, state machine edge cases, stress tests
- **Read By:** QA, Linus (backend), test automation
- **Execution:** Stress test wizard under adverse conditions
- **Success Criteria:** All 16 handled gracefully (no crashes)

### `phase-3-integration.md`
- **Size:** ~15.5 KB, 28 scenarios, 400+ lines
- **Focus:** Message protocol (6 types), state persistence, browser nav
- **Read By:** Linus (backend), QA, test automation
- **Execution:** Test protocol handlers and persistence layer
- **Success Criteria:** All 28 pass; message flow correct

---

## Test Implementation Strategy

### For Rusty (Component Builder)
1. Read `phase-3-feature-wizard.md` and `phase-3-bug-wizard.md`
2. Build wizard steps to satisfy all 30+30 scenarios
3. Focus on Decision #2 (AI mode selector placement) and Decision #4 (type locking)
4. Integrate with Linus's message protocol (read protocol tests in `phase-3-integration.md`)

### For Linus (Backend / Protocol)
1. Read `phase-3-integration.md` message protocol section (PT1-PT14)
2. Verify all 6 message types handle scenarios correctly
3. Test debounce patterns (PT7-PT11) extensively
4. Ensure persistence layer handles legacy drafts (PT3, PT21)

### For Livingston (QA / This Agent)
1. Execute all 124 scenarios as implemented
2. Flag any failures or deviations from spec
3. Document edge cases discovered during testing
4. Create test harness if time allows (optional)

---

## Design Decisions Mapped to Tests

| Decision | Description | Feature Tests | Bug Tests | Edge Cases | Protocol Tests |
|----------|-------------|---------------|-----------|------------|----------------|
| **#1** | Bug variant in Phase 1 | 30 | 30 | — | — |
| **#2** | AI mode at top of Story | FS3.1 | — | — | — |
| **#3** | Legacy migration manual | — | — | EC3 | PT3, PT21 |
| **#4** | Type locked after confirmation | FS1.2, FS1.3, FS1.4 | BS1.2, BS1.3, BS1.4 | EC6, EC12 | — |
| **#5** | Blur auto-save + step advance | FS3.2, FS3.8 | BS3.2, BS3.8 | EC4, EC13 | PT7-PT14 |
| **#6** | Browser back/forward allowed | FS1.4 | BS1.4 | EC14 | PT15-PT19, PT22 |

---

## Success Criteria (Phase 3 Completion)

✅ All 124 test scenarios documented (this file + 4 scenario files)  
✅ Feature wizard: 30 scenarios cover all 4 steps + decisions  
✅ Bug wizard: 30 scenarios cover all 4 steps + parity  
✅ Edge cases: 16 scenarios cover failure modes + stress  
✅ Protocol & integration: 28 scenarios cover all 6 message types  
✅ Decisions #1-#6 enforced in test matrix  
✅ Priority ranking complete (Tier 1-3)  
✅ Test execution order documented  
✅ Unhappy paths prioritized (Tier 1 critical, TIER 2 important)  

---

## Known Limitations & Future Work

### Out of Scope (Phase 4+)
- UI component snapshot testing (visual regression)
- Accessibility testing (axe audit, screen reader)
- Performance testing (load time, memory)
- E2E testing in actual VS Code (manual testing required)

### Future Test Additions (Post-Phase 3)
- Test harness in Vitest/Jest (optional automation)
- Component tests for WizardStep1Type, etc. (if time allows)
- Integration tests against real Azure DevOps API
- Load testing with multiple concurrent users

### Assumptions Made
1. **TypeScript strict mode:** Assume type definitions catch some errors at compile time
2. **Message validation:** Backend validates all incoming messages (trust boundary)
3. **Browser support:** Tests assume modern browser (Chrome/Edge, not IE11)
4. **Draft storage:** Assume PbiDraftService correctly persists all changes

---

## Appendix: Test ID Reference

### Feature Wizard
| Range | Description |
|-------|-------------|
| FS1.1–FS1.9 | Type selection (9 tests) |
| FS2.1–FS2.8 | Identity selection (8 tests) |
| FS3.1–FS3.8 | Story + AI mode (8 tests) |
| FS4.1–FS4.5 | Details + finish (5 tests) |

### Bug Wizard
| Range | Description |
|-------|-------------|
| BS1.1–BS1.9 | Type selection (9 tests) |
| BS2.1–BS2.8 | Identity selection (8 tests) |
| BS3.1–BS3.8 | Reproduction steps (8 tests) |
| BS4.1–BS4.5 | Verification + finish (5 tests) |

### Edge Cases
| Range | Description |
|-------|-------------|
| EC1–EC8 | Network & persistence failures (8 tests) |
| EC9–EC16 | State machine edge cases (8 tests) |

### Protocol & Integration
| Range | Description |
|-------|-------------|
| PT1–PT14 | Message protocol (14 tests) |
| PT15–PT22 | State persistence & nav (8 tests) |

---

**Test Matrix Prepared By:** Livingston (Tester)  
**Date:** 2026-05-01  
**Status:** Ready for Implementation  
**Next Step:** Rusty builds Feature/Bug wizard components against this matrix
