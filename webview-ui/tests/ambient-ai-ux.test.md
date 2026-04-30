# Ambient AI UX Test Cases

**Feature:** Hide in-panel AI buttons, add AI-Ready indicator, first-time toast for PBI Studio Wizard (Step 3: Story)  
**Component:** `WizardStep3Story.tsx`  
**Scope:** AI button visibility, AI-Ready indicator display, first-time toast notification, keyboard shortcuts, accessibility compliance  
**Test Date:** [EXECUTION_DATE]  
**Tester:** Livingston (QA)  

---

## Test Categories Overview

| Category | Priority | Count | Focus |
|----------|----------|-------|-------|
| Happy Path | P0 | 8 | Core functionality, toast, indicator |
| Edge Cases | P1 | 5 | State transitions, degradation |
| Accessibility | P0 | 6 | ARIA, keyboard, contrast |
| Visual Regression | P1 | 4 | Layout, animations, responsive |
| Integration | P0 | 3 | DOM removal, TypeScript, backend |
| Error Handling | P2 | 3 | Graceful degradation, console |

**Total Test Cases:** 29

---

## Preconditions (All Tests)

- VS Code extension running in dev mode (`npm run watch`)
- PBI Studio webview open and accessible
- New work item wizard active (Step 3: Story form)
- Browser DevTools console visible (watch for errors)
- localStorage enabled (unless testing privacy mode)
- Screen reader available (NVDA/JAWS on Windows, VoiceOver on Mac)

---

## Pass/Fail Criteria (Global)

✅ **PASS:**
- Feature works per test case steps
- No console errors or warnings related to the feature
- Accessibility requirements met (ARIA, keyboard, contrast)
- TypeScript compilation succeeds

❌ **FAIL:**
- Test step doesn't produce expected result
- Console errors appear
- Accessibility violations detected
- TypeScript errors present

---

# HAPPY PATH TEST CASES (P0)

## HP-001: AI-Ready Indicator Appears When AI-Generated Mode Enabled

**Preconditions:**
- Step 3 (Story) form displayed
- AI Mode toggle shows "Manual" selected
- "AI-Ready" indicator is not visible

**Steps:**
1. Locate the AI Mode selector at the top of the Story form
2. Click the "AI-Generated" button (right button in toggle)
3. Observe the form for 500ms (allow animation)
4. Take screenshot of AI-Ready indicator

**Expected Result:**
- AI Mode changes to "AI-Generated" (button highlighted)
- "AI-Ready" indicator appears below/near AI Mode selector
- Indicator displays ✨ icon and "AI-Ready" text
- Indicator has subtle glow animation (CSS animation applied)
- Indicator does NOT push form content down (uses appropriate spacing)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-002: AI-Ready Indicator Styling and Icon Display

**Preconditions:**
- Step 3 form displayed
- AI Mode already set to "AI-Generated"
- AI-Ready indicator visible

**Steps:**
1. Inspect the AI-Ready indicator element in DevTools
2. Verify styling properties
3. Check if ✨ icon is present in indicator text
4. Verify "AI-Ready" label text is visible

**Expected Result:**
- Indicator has `role="status"` attribute
- Indicator has `aria-live="polite"` attribute
- Indicator contains ✨ emoji or icon element
- Indicator contains "AI-Ready" text node
- Indicator background color is subtle (not bright/jarring)
- Indicator has appropriate padding (8px min)
- Indicator has glow effect applied (CSS: box-shadow or filter)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-003: First-Time Toast Appears on AI Mode Enable

**Preconditions:**
- Step 3 form displayed
- localStorage is enabled (verified in DevTools)
- No prior interactions with this feature
- "ambient-ai-toast-dismissed" key not in localStorage

**Steps:**
1. Open DevTools → Application → Storage → localStorage
2. Verify "ambient-ai-toast-dismissed" key is NOT present
3. Click "AI-Generated" mode button
4. Observe top-right of screen for toast notification
5. Wait 500ms for animation

**Expected Result:**
- Toast appears in top-right corner (or configured position)
- Toast message contains: "AI shortcuts enabled" (or similar phrase)
- Toast includes "Ctrl+Shift+P" shortcut reference (or equivalent)
- Toast contains a "Got it" or "Dismiss" button
- Toast is NOT translucent or invisible (good contrast)
- Toast slides in smoothly within 300ms
- Toast remains visible until user dismisses it (auto-dismiss not enabled)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-004: Toast Message Text is Correct and Readable

**Preconditions:**
- Toast visible on screen (see HP-003)

**Steps:**
1. Read the toast message text carefully
2. Verify all text is visible and not cut off
3. Inspect toast element in DevTools
4. Measure text size (should be ≥14px)
5. Check for typos or truncation

**Expected Result:**
- Message text reads: "AI shortcuts enabled. Press Ctrl+Shift+P for command palette or right-click for context menu." (or functionally equivalent)
- Text is NOT truncated or overflow-hidden
- Text size is readable (≥14px)
- No spelling or grammatical errors
- Message fits within viewport at all standard widths (320px+)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-005: Toast "Got It" Button is Visible and Clickable

**Preconditions:**
- Toast visible on screen

**Steps:**
1. Locate "Got it" button in the toast
2. Verify button text is visible
3. Verify button is not disabled
4. Move mouse over button (should show hover state)
5. Click the button
6. Observe toast disappears

**Expected Result:**
- Button is labeled "Got it" (or "Dismiss" / "OK")
- Button is NOT disabled (no pointer-events: none)
- Button shows hover state (color change or underline)
- Button is clickable (cursor: pointer)
- Clicking button immediately closes the toast
- No toast remains on screen after click

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-006: Toast Dismissal Persists Across Page Reload

**Preconditions:**
- Toast dismissed (see HP-005)
- localStorage enabled

**Steps:**
1. Verify toast is gone
2. Open DevTools → Application → localStorage
3. Verify "ambient-ai-toast-dismissed" key is NOW present (value: true or timestamp)
4. Refresh the page (Ctrl+R or F5)
5. Navigate back to Step 3 Story form
6. Switch to "AI-Generated" mode again
7. Wait 1 second
8. Check if toast reappears

**Expected Result:**
- localStorage key "ambient-ai-toast-dismissed" is set after dismissal
- After page refresh, toast does NOT re-appear when AI mode is re-enabled
- User is not shown the same toast twice
- localStorage value persists across page reloads

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-007: Command Palette Shortcut Works (Ctrl+Shift+P)

**Preconditions:**
- Step 3 form displayed
- AI Mode set to "AI-Generated"
- Toast dismissed or expired
- VS Code command palette is functional

**Steps:**
1. Click in the wizard form to ensure focus is on webview
2. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
3. Observe if VS Code command palette opens
4. Type "AI" to search for AI-related commands
5. Verify AI commands are listed (if any exist in VS Code)

**Expected Result:**
- Command palette opens when Ctrl+Shift+P is pressed
- Command palette is NOT blocked by webview
- User can search and execute VS Code commands
- No console errors related to keyboard event handling

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## HP-008: Right-Click Context Menu Shows Shortcuts

**Preconditions:**
- Step 3 form displayed
- AI Mode set to "AI-Generated"

**Steps:**
1. Right-click on the "persona" input field
2. Observe context menu that appears
3. Look for AI-related shortcuts or options
4. Verify context menu is NOT custom (use browser default or OS menu)

**Expected Result:**
- Right-click produces a context menu
- Context menu is accessible (appears near cursor)
- Context menu includes standard options (Cut, Copy, Paste) or custom menu items
- If custom menu items exist, they include AI action references
- Context menu doesn't block form interaction after dismissal

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# EDGE CASES TEST CASES (P1)

## EC-001: AI Mode Toggled Manual → AI-Generated → Manual

**Preconditions:**
- Step 3 form displayed
- AI Mode set to "Manual"
- No previous AI-Generated mode state

**Steps:**
1. Click "AI-Generated" button (toggle to AI mode)
2. Observe AI-Ready indicator appears
3. Wait for toast to appear
4. Click "Manual" button (toggle back)
5. Observe if indicator disappears
6. Wait 1 second
7. Click "AI-Generated" again
8. Observe if toast appears again

**Expected Result:**
- Step 1-2: Indicator appears when switching to AI-Generated
- Step 3: Toast appears (first time)
- Step 4-5: Indicator disappears when switching back to Manual
- Step 6: Manual mode is stable
- Step 7: Indicator reappears on second switch to AI-Generated
- Step 8: Toast does NOT appear again (already dismissed)
- No console errors during toggles

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EC-002: Multiple Form Renders (Navigation Back/Forth)

**Preconditions:**
- Step 3 form displayed
- AI Mode set to "AI-Generated"
- Toast dismissed

**Steps:**
1. Verify indicator is visible, toast is dismissed
2. Click "Back" button to navigate to Step 2
3. Wait for Step 2 form to load
4. Click "Next" button to return to Step 3
5. Observe AI mode state and indicator state
6. Wait 500ms
7. Verify indicator still visible, toast NOT re-shown

**Expected Result:**
- Step 2 loads successfully
- Step 3 reloads with previous state preserved (AI Mode still = "AI-Generated")
- Indicator is visible after reload
- Toast does NOT re-appear (already dismissed)
- Form fields retain their values (persona, want, benefit)
- No layout shift or jumping on reload

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EC-003: localStorage Unavailable (Privacy Mode)

**Preconditions:**
- Webview running in private/incognito mode (if testable)
- OR manually disable localStorage in DevTools → Application → Disable Storage

**Steps:**
1. Open Step 3 form
2. Try to set AI Mode to "AI-Generated"
3. Observe toast behavior
4. Check browser console for errors
5. Attempt to dismiss toast
6. Reload page
7. Observe toast behavior again

**Expected Result:**
- Toast appears even if localStorage is unavailable
- No console errors (graceful fallback)
- Toast appears every time AI mode is enabled (can't persist dismissal)
- Form functionality is NOT broken (no red errors)
- User can still dismiss toast normally
- No data loss or form state issues

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EC-004: Form Interaction While Toast Visible

**Preconditions:**
- Toast visible on screen (AI Mode just enabled)
- Toast not yet dismissed

**Steps:**
1. With toast visible, try to type in "persona" field
2. Verify input works
3. Try to click on "want" field while toast visible
4. Verify field focuses normally
5. Try to submit form (Next button) with toast visible
6. Verify form submission is NOT blocked

**Expected Result:**
- All form inputs are accessible and functional while toast visible
- Toast is NOT modal (doesn't block form interaction)
- Typing in fields works normally
- Clicking "Next" while toast visible still submits form
- Toast can be dismissed or ignored; form works either way

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EC-005: AI Mode Disabled Then Re-Enabled After Toast Dismissal

**Preconditions:**
- Step 3 form loaded
- AI Mode: Manual
- No prior AI-Generated session

**Steps:**
1. Enable AI-Generated mode
2. Toast appears
3. Dismiss toast (click "Got it")
4. Verify toast gone and localStorage set
5. Toggle back to Manual mode
6. Wait 500ms
7. Toggle back to AI-Generated mode
8. Wait 1 second and observe toast behavior

**Expected Result:**
- Step 3-4: Toast appears and dismisses normally
- Step 5: Indicator disappears, AI mode back to Manual
- Step 7: Indicator reappears on AI-Generated re-enable
- Step 8: Toast does NOT re-appear (dismissal persists)
- No duplicate toasts
- No console errors

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# ACCESSIBILITY TEST CASES (P0)

## A11Y-001: AI-Ready Indicator Has Proper ARIA Attributes

**Preconditions:**
- Step 3 form displayed
- AI Mode: AI-Generated
- Indicator visible

**Steps:**
1. Right-click on AI-Ready indicator element
2. Inspect element in DevTools
3. Verify `role` attribute value
4. Verify `aria-live` attribute value
5. Check for `aria-label` or `aria-labelledby`
6. Use accessibility checker tool (e.g., Axe DevTools extension)

**Expected Result:**
- Indicator has `role="status"` (or `role="alert"` if high priority)
- Indicator has `aria-live="polite"` (or `aria-live="assertive"`)
- Indicator has accessible name: "AI-Ready" (via `aria-label` or text content)
- `aria-label` exactly matches: "AI-Ready"
- No Axe accessibility violations on indicator element
- No redundant ARIA attributes

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## A11Y-002: Indicator Keyboard Navigation (Tab Order)

**Preconditions:**
- Step 3 form displayed
- Indicator visible

**Steps:**
1. Press Tab repeatedly to cycle through form elements
2. Count how many Tab presses before reaching indicator
3. Verify if indicator is focusable (receives focus outline)
4. If focusable, press Tab again to move past it
5. Use Shift+Tab to navigate backward
6. Verify indicator can be reached via Tab

**Expected Result:**
- Indicator is in logical Tab order (after AI Mode toggle, before form fields)
- If indicator is interactive (has button), it is focusable and shows focus outline
- If indicator is non-interactive, it may be removed from Tab order (`tabindex="-1"`)
- Visible focus indicator on indicator when focused (≥3px outline)
- No Tab traps (user can Tab forward and backward freely)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## A11Y-003: Indicator Color Contrast (4.5:1 minimum)

**Preconditions:**
- Step 3 form displayed
- Indicator visible

**Steps:**
1. Use contrast checking tool (e.g., Axe, WAVE, or ColorOracle)
2. Check contrast between:
   - Icon (✨) and background
   - Text ("AI-Ready") and background
3. Measure in different lighting (if possible)
4. Screenshot the contrast report

**Expected Result:**
- Icon to background contrast ratio ≥ 4.5:1 (WCAG AA standard)
- Text to background contrast ratio ≥ 4.5:1
- Indicator meets WCAG 2.1 AA color contrast standard
- Indicator is visible in light and dark themes

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## A11Y-004: Toast Has Proper ARIA Alert Attributes

**Preconditions:**
- Toast visible on screen

**Steps:**
1. Inspect toast element in DevTools
2. Verify `role` attribute
3. Verify `aria-live` attribute
4. Check toast message is in DOM (not hidden)
5. Use screen reader to read toast (if available)
6. Use Axe accessibility checker on toast

**Expected Result:**
- Toast has `role="alert"` (or `role="status"` if non-urgent)
- Toast has `aria-live="assertive"` (for alerts)
- Toast message text is in HTML (not image or canvas)
- Screen reader announces toast message on appearance
- No Axe violations on toast element
- Toast has adequate `aria-label` if message is not clear

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## A11Y-005: Toast Button Keyboard Accessible (Tab + Enter/Space)

**Preconditions:**
- Toast visible

**Steps:**
1. Press Tab multiple times to focus on "Got it" button
2. Verify button shows focus outline (≥3px)
3. Verify button is part of the natural Tab order
4. With button focused, press Enter
5. Verify toast dismisses
6. Repeat: Tab to button, press Space key instead of Enter
7. Verify toast dismisses

**Expected Result:**
- "Got it" button is reachable via Tab (after form fields)
- Button shows visible focus indicator when focused
- Pressing Enter on button dismisses toast
- Pressing Space on button dismisses toast
- Focus indicator is NOT removed (visible at all times)
- Button follows standard keyboard interaction model

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## A11Y-006: Toast and Indicator Don't Block Screen Reader Navigation

**Preconditions:**
- Toast visible
- Indicator visible
- Screen reader enabled (NVDA, JAWS, or Mac VoiceOver)

**Steps:**
1. Start screen reader
2. Navigate through Step 3 form using arrow keys or Tab
3. Verify form fields are announced in correct order
4. Verify indicator announcement includes role and state
5. Verify toast is announced when it appears
6. Navigate to "Got it" button and verify it's announced as button
7. Verify no screen reader hang or lag

**Expected Result:**
- Screen reader announces form in logical order
- Form labels are correctly associated with inputs
- Indicator announced as "AI-Ready" or similar
- Toast announced as alert when it appears
- "Got it" button announced as button with correct label
- No screen reader crashes or hangs
- User can complete form using only screen reader + keyboard

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# VISUAL REGRESSION TEST CASES (P1)

## VR-001: Indicator Doesn't Cause Layout Shift (CLS)

**Preconditions:**
- Step 3 form displayed
- AI Mode: Manual (no indicator yet)
- Browser DevTools open with Lighthouse/Performance tab

**Steps:**
1. Open DevTools → Lighthouse or Performance tab
2. Start recording performance
3. Switch AI Mode to "AI-Generated"
4. Stop recording after 1 second
5. Check Cumulative Layout Shift (CLS) score
6. Inspect layout of form elements before and after

**Expected Result:**
- CLS score ≤ 0.1 (no significant layout shift)
- Form fields don't move down when indicator appears
- Indicator uses reserved space (margin/padding already accounted for)
- All form labels remain aligned
- Spacing is consistent before/after indicator appears
- No visual jank or flashing

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## VR-002: Toast Renders in Correct Position

**Preconditions:**
- Toast visible on screen

**Steps:**
1. Inspect toast element style in DevTools
2. Verify positioning (top-right, bottom-left, etc.)
3. Measure distance from screen edges (should be ≥12px)
4. Verify toast is NOT overlapping critical UI (e.g., "Next" button)
5. Check if toast overlaps any form inputs
6. Test at multiple viewport sizes (320px, 768px, 1024px, 1920px)

**Expected Result:**
- Toast positioned in top-right corner (or configured position)
- Toast has ≥12px margin from screen edges
- Toast does NOT overlap form inputs or buttons
- Toast is fully visible at all viewport widths ≥320px
- Toast position is consistent across different page states
- Toast does NOT cover accessibility info (ARIA labels, tooltips)

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## VR-003: Glow Animation on Indicator is Smooth

**Preconditions:**
- Step 3 form displayed
- Indicator visible and animating

**Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Switch AI Mode to AI-Generated (trigger indicator animation)
4. Record for 2 seconds
5. Stop recording
6. Analyze frame rate in timeline
7. Look for frame drops or stutters
8. Measure animation duration

**Expected Result:**
- Animation runs at 60 FPS (no frame drops)
- Animation duration is <400ms (smooth entrance)
- No layout recalculations during animation (no reflow)
- CSS animation uses `transform` or `opacity` (GPU-accelerated)
- Animation is smooth to human eye (no jank)
- Animation performance doesn't block user input

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## VR-004: Toast Slide-In Animation is Smooth

**Preconditions:**
- Toast about to appear

**Steps:**
1. Open DevTools → Performance tab
2. Record performance
3. Trigger toast appearance (enable AI mode)
4. Record for 1 second
5. Stop recording
6. Analyze timeline for frame drops
7. Measure animation time
8. Check for reflow/repaint events

**Expected Result:**
- Toast slide-in animation completes within 300ms
- Animation runs at 60 FPS (no frame drops)
- Animation uses GPU-accelerated properties (transform, opacity)
- No excessive reflows or repaints
- Animation doesn't lag form responsiveness
- User can interact with form while animation plays

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# INTEGRATION TEST CASES (P0)

## INT-001: Old AI Buttons Are Removed from DOM

**Preconditions:**
- Step 3 form displayed
- AI Mode: AI-Generated
- DevTools Inspector open

**Steps:**
1. Search DevTools DOM for "Generate with AI" button
   - Use Ctrl+F in Inspector to search
   - Search for "Generate with AI" text
2. Verify no element with this text exists
3. Search for "Refine with AI" button
   - Search for "Refine with AI" text
4. Verify no element with this text exists
5. Search for any remaining AI action buttons
   - Look for `onGenerateAI` or `onOpenInChat` event handlers
6. Verify form is still fully functional

**Expected Result:**
- No "Generate with AI" button in DOM
- No "Refine with AI" button in DOM
- No old AI button elements present
- Form can still submit and navigate without errors
- Field values are preserved
- Step counter still advances correctly

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## INT-002: TypeScript Compilation Succeeds

**Preconditions:**
- Repository cloned and dependencies installed
- All source files saved

**Steps:**
1. Open terminal in project root
2. Run: `tsc --noEmit` (webview-ui)
3. Wait for TypeScript to complete
4. Check for type errors
5. Run: `npm run build` (full build)
6. Wait for build to complete
7. Verify no TypeScript errors in build output

**Expected Result:**
- `tsc --noEmit` completes with 0 errors (webview-ui)
- `npm run build` completes successfully
- No type errors related to WizardStep3Story.tsx
- No type errors related to toast/indicator components
- Build artifacts generated (dist/ folder)
- No "error TS" messages in output

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## INT-003: Event Handlers onGenerateAI and onOpenInChat Still Wired

**Preconditions:**
- Step 3 form displayed
- DevTools console open

**Steps:**
1. Inspect WizardStep3Story component in React DevTools (if available)
2. Verify props: onGenerateAI and onOpenInChat are passed
3. Check if buttons exist that call these handlers
   - Old buttons (if any) should trigger handlers
   - OR new keyboard shortcuts should trigger them
4. Trigger AI action (if UI available)
5. Check console for handler execution logs
6. Verify backend receives AI action signal

**Expected Result:**
- Props `onGenerateAI` and `onOpenInChat` are passed to component
- Event handlers are not removed (still referenced in code)
- If buttons exist, clicking them calls the handlers
- If keyboard shortcuts exist, using shortcuts calls the handlers
- No console errors when handlers execute
- Backend can still process AI actions

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# ERROR HANDLING TEST CASES (P2)

## EH-001: Toast Close Button Fails to Function (Resilience)

**Preconditions:**
- Toast visible
- Prepare to simulate button click failure

**Steps:**
1. Inspect toast element in DevTools
2. Find and copy its selector
3. Open DevTools Console
4. Execute: `const toast = document.querySelector('[selector]')`
5. Temporarily remove the onClick handler:
   - `toast.querySelector('button').onclick = null`
6. Try to click "Got it" button
7. Verify form still works
8. Reload page and verify form is accessible

**Expected Result:**
- Toast doesn't automatically disappear if button fails
- User can still interact with form (workaround available)
- If user dismisses toast manually (Escape key or outside click), form works
- No console errors that block form functionality
- Form can still be submitted if toast remains visible
- No infinite loops or hangs

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EH-002: Indicator Fails to Render (Graceful Degradation)

**Preconditions:**
- Step 3 form displayed
- Prepare to test error scenario

**Steps:**
1. In DevTools console, simulate error: `throw new Error('Indicator render failed')`
   (Note: this is for testing purposes only)
2. Observe form behavior
3. Try to use AI Mode toggle
4. Verify form fields are still functional
5. Try to submit form
6. Check for console errors

**Expected Result:**
- If indicator fails to render, it doesn't crash the form
- User can still toggle AI Mode
- User can still fill form fields
- User can still submit form
- Error is logged to console but doesn't propagate
- Form is usable even if indicator is broken

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

## EH-003: No Console Errors or Warnings During Normal Use

**Preconditions:**
- DevTools console open and cleared
- Step 3 form displayed

**Steps:**
1. Clear console (click clear button)
2. Toggle AI Mode to AI-Generated
3. Wait for toast to appear
4. Dismiss toast
5. Fill form fields with test data
6. Click "Next" button
7. Review console for errors/warnings
8. Switch back to Step 3 using Back button
9. Review console again

**Expected Result:**
- No console errors (red X icon)
- No TypeScript/React compilation errors
- No "Uncaught" exceptions
- No warnings related to missing props or deprecated APIs
- Only normal informational logs (if any)
- Form submission completes without console errors

**Actual Result:**
[To be filled during execution]

**Status:**
☐ PASS | ☐ FAIL

**Notes:**

---

# TEST EXECUTION SUMMARY

## Executive Summary

[Summary to be filled after all tests executed]

---

## Defects Found

| ID | Category | Severity | Description | Steps to Reproduce | Expected vs Actual |
|----|----------|----------|-------------|-------------------|-------------------|
| D-001 | [Category] | [P0/P1/P2] | [Brief description] | [Steps] | [Expected] vs [Actual] |

---

## Test Coverage Summary

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Happy Path (P0) | 8 | — | — | — |
| Edge Cases (P1) | 5 | — | — | — |
| Accessibility (P0) | 6 | — | — | — |
| Visual Regression (P1) | 4 | — | — | — |
| Integration (P0) | 3 | — | — | — |
| Error Handling (P2) | 3 | — | — | — |
| **TOTAL** | **29** | **—** | **—** | **—** |

---

## Accessibility Compliance

- [ ] WCAG 2.1 AA Standard Met
- [ ] No Critical Contrast Issues
- [ ] Keyboard Navigation Works
- [ ] Screen Reader Compatible
- [ ] No Focus Traps

---

## Sign-Off

**Tester Name:** Livingston (QA)  
**Date:** [EXECUTION_DATE]  
**Result:** [PASS / CONDITIONAL / FAIL]  
**Notes:**  

---

## Appendix: Test Artifacts

### Screenshots
- [Indicator appearance]
- [Toast display]
- [Form with both visible]
- [Console output]

### Video Recordings (if applicable)
- [Animation smoothness recording]
- [Keyboard navigation walkthrough]

### DevTools Exports
- [Accessibility audit report]
- [Performance timeline]
- [Console logs]

---

**End of Test Document**
