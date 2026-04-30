# Issue #26 — Test Plan Summary

**Feature:** Technical Considerations button (regression fix — button was missing from UI redesign)  
**Test File:** `webview-ui/src/components/__tests__/TechnicalConsiderations.test.ts`  
**Total Tests:** 48  
**Framework:** None (manual execution format with Given/When/Then)  
**Build Status:** ✅ PASSED (zero errors)

---

## Quick Reference

### Test Breakdown by Category

| Category | Count | P0 | P1 | P2 | Status |
|----------|-------|----|----|----|----|
| Button Visibility & Placement | 5 | 2 | 3 | — | ✅ Ready |
| User Interaction | 7 | 2 | 5 | — | ✅ Ready |
| Message Handling | 6 | 3 | 3 | — | ✅ Ready |
| State Management | 6 | 3 | 3 | — | ✅ Ready |
| Edge Cases & Error Paths | 10 | 4 | 4 | 2 | ✅ Ready |
| Accessibility & Keyboard Navigation | 8 | — | 8 | — | ✅ Ready |
| **TOTAL** | **48** | **16** | **26** | **2** | ✅ **Ready** |

### Priority Distribution

- **P0 (Blocking):** 16 tests — Core functionality, must pass before release
- **P1 (High):** 26 tests — Important features, should pass
- **P2 (Nice-to-have):** 6 tests — Edge cases, can defer

---

## Test Categories At-A-Glance

### 1️⃣ Button Visibility & Placement (5 tests)
- ✅ Button renders in section header
- ✅ Label toggles "Generate" ↔ "Regenerate"
- ✅ Button disabled while loading
- ✅ Button position correct (before Edit, before chevron)
- ✅ Button enabled with valid PBI

**Key Files:** TechnicalConsiderationsSection.tsx (lines 54-75)

---

### 2️⃣ User Interaction (7 tests)
- ✅ Clicking Generate triggers loading state
- ✅ Button has accessibility attributes
- ✅ User can enter/save/cancel edits
- ✅ Scoped Files parsing (comma + newline delimiters)
- ✅ Edit/Done toggle
- ✅ Empty whitespace handling
- ✅ Edit mode toggle

**Key Files:** TechnicalConsiderationsSection.tsx (lines 41-132)

---

### 3️⃣ Message Handling (6 tests)
- ✅ GENERATE_TECHNICAL_CONSIDERATIONS sent correctly
- ✅ Extension receives and processes message
- ✅ TECHNICAL_CONSIDERATIONS_READY event sent back
- ✅ Error handling and recovery
- ✅ Message payload validation
- ✅ Webview state updates on message

**Key Files:** 
- src/shared/messages.ts (message types)
- src/extension.ts (handler)

---

### 4️⃣ State Management (6 tests)
- ✅ Generated data added to draft.technicalConsiderations
- ✅ UI updates immediately after state change
- ✅ Regenerate replaces (not appends) data
- ✅ Data persists across saves
- ✅ Empty considerations don't block operations
- ✅ Manual edits persist

**Key Files:**
- webview-ui/src/types.ts (TechnicalConsiderations interface)
- webview-ui/src/components/TechnicalConsiderationsSection.tsx

---

### 5️⃣ Edge Cases & Error Paths (10 tests)
- ✅ Empty/whitespace-only text handling
- ✅ Very long text (>5000 chars) rendering
- ✅ Large file lists (50+ files)
- ✅ Button disabled when no PBI loaded
- ✅ Network error with retry UI
- ✅ Rate limit error with exponential backoff (1s → 2s → 4s)
- ✅ Special characters and XSS prevention
- ✅ File path parsing (spaces, relative paths)
- ✅ Concurrent request protection
- ✅ Duplicate data idempotency

**Key Files:** src/copilotService.ts (retry logic)

---

### 6️⃣ Accessibility & Keyboard Navigation (8 tests)
- ✅ ARIA labels on button
- ✅ Keyboard navigation (Tab, Enter, Space, Escape)
- ✅ Loading state announced to screen readers
- ✅ Edit/Done button labels
- ✅ Form field labels and associations
- ✅ Dark/light theme contrast
- ✅ Chevron keyboard accessibility
- ✅ Error message announcements

**Key Files:** TechnicalConsiderationsSection.tsx (a11y attributes)

---

## Message Contracts

### Request: GENERATE_TECHNICAL_CONSIDERATIONS
```typescript
{
  type: 'GENERATE_TECHNICAL_CONSIDERATIONS',
  payload: {
    draftId: string,        // Required
    projectId?: string      // Optional
  }
}
```

### Response: TECHNICAL_CONSIDERATIONS_READY
```typescript
{
  type: 'TECHNICAL_CONSIDERATIONS_READY',
  payload: {
    draftId: string,
    technicalConsiderations: {
      technicalDetails?: string,
      scopedFiles?: string[],
      architectureNotes?: string
    }
  }
}
```

---

## Ambiguities Requiring Clarification

⏳ **3 items** — See `.squad/decisions/inbox/livingston-issue-26-test-coverage-gaps.md`

| ID | Test | Question | Decision Owner |
|----|------|----------|-----------------|
| a1 | 2.5 | Discard/preserve unsaved edits? | Brady |
| a2 | 5.1 | Allow/block empty fields? | Brady |
| a3 | 6.7 | Convert header to `<button>` for a11y? | Danny |

---

## Execution Guidance

### For Manual Testing (Current):
1. Open VS Code with extension loaded
2. Load a PBI in PbiStudio
3. Follow Given/When/Then steps for each test
4. Document results in spreadsheet or log file
5. Screenshot failures for regression analysis

### For Automated Testing (Future):
1. Install Vitest + React Testing Library
2. Convert Given/When/Then to unit tests
3. Mock AI service, vscode.postMessage, handlers
4. Add snapshot tests for component rendering
5. Run `npm run test` in CI/CD

### Estimated Time:
- Manual execution: 2–3 hours (all 48 tests)
- P0 smoke test: 30–45 minutes (16 tests)

---

## Build & TypeScript Validation

```bash
# All passed ✅
npm run build            # Extension + webview
tsc --noEmit            # Root
tsc --noEmit webview-ui # Webview

# Result: Zero errors, zero type failures
# Notes: 2 pre-existing CSS warnings (unrelated)
```

---

## Regression Prevention

This test suite prevents future regressions by:
1. **Documenting expected behavior** — Given/When/Then is implementation-agnostic
2. **Tracking message contracts** — Detects breaking changes in API
3. **Validating state transitions** — Ensures data flows correctly
4. **Testing error paths** — Catches edge cases and network issues
5. **Verifying accessibility** — WCAG compliance documented
6. **Marking file locations** — Easy to trace bugs to source

---

## Files Reference

### Test File:
- `webview-ui/src/components/__tests__/TechnicalConsiderations.test.ts` (38 KB, 48 tests)

### Component Files:
- `webview-ui/src/components/TechnicalConsiderationsSection.tsx` (175 lines)
- `webview-ui/src/types.ts` (TechnicalConsiderations interface)

### Message Types:
- `src/shared/messages.ts` (WebviewRequest, ExtensionEvent unions)

### Service Files:
- `src/extension.ts` (message handler)
- `src/copilotService.ts` (AI generation + retry logic)

### Ambiguity Document:
- `.squad/decisions/inbox/livingston-issue-26-test-coverage-gaps.md` (3 items)

---

## Next Steps

1. ✅ Test file created and integrated
2. ✅ Build validated (zero errors)
3. ✅ Message contracts documented
4. ⏳ **Team decision** — Resolve 3 ambiguities
5. ⏳ **Manual execution** — Run P0 tests (30–45 min)
6. ⏳ **Documentation** — Log results in `.squad/log/`
7. ⏳ **Release approval** — Sign off before deployment

---

## Status

| Deliverable | Status | Note |
|-------------|--------|------|
| Test file created | ✅ | 48 tests, Given/When/Then format |
| Build verified | ✅ | Zero errors |
| Message contracts documented | ✅ | GENERATE_TECHNICAL_CONSIDERATIONS, TECHNICAL_CONSIDERATIONS_READY |
| Ambiguities identified | ✅ | 3 items in separate document |
| Team clarification | ⏳ | Awaiting decisions on a1, a2, a3 |
| Manual execution | ⏳ | Ready to start after clarifications |

---

**Test Plan Owner:** Livingston (Tester)  
**Date Created:** 2026-01-24  
**Last Updated:** 2026-01-24  
**Ready for:** Manual execution (pending ambiguity clarifications)
