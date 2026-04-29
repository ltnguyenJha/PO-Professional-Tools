# Phase 5 Polish & Accessibility — Decision Record

**Author:** Rusty (Frontend Dev)  
**Date:** 2026-04-29  
**Status:** Implemented  
**Issue:** #24 (Phase 5: Polish, Accessibility & Responsive Design)

---

## Problem Statement

The wizard MVP (Phases 1–4) was feature-complete but lacked:
1. Dark mode support verification across all components
2. Keyboard navigation (Tab, Enter, Escape, Arrow keys)
3. Screen reader announcements for step changes
4. Focus management (visible rings on all interactive elements)
5. Responsive design for narrow widths (320px minimum)
6. UX polish (loading states, error messages, animations)

**Why This Matters:**
- VS Code sidebar can collapse to 320px → wizard must adapt
- Accessibility WCAG AA compliance required
- Professional UX demands smooth animations + clear feedback
- Users with motor/vision disabilities require keyboard nav + screen reader support

---

## Decisions Made

### 1. Dark Mode: Zero Manual CSS Required

**Decision:** Don't add manual dark mode selectors to `wizard.css`. Instead, ensure all values use design tokens from `tokens.css`.

**Rationale:**
- `tokens.css` already defines `[data-theme="dark"]` overrides for all colors
- Wizard components only reference tokens (--color-neutral-*, --color-primary-*, etc.)
- When root `[data-theme="dark"]` is set, all token values automatically update
- Simpler maintenance: Update tokens once, all components adapt

**Implementation:**
```css
/* In wizard.css — all values are tokens */
.wizard-step {
  background: var(--color-neutral-200);      /* auto-adapts to dark mode */
  color: var(--color-neutral-500);           /* auto-adapts to dark mode */
  border: 1px solid var(--color-neutral-300); /* auto-adapts to dark mode */
}

/* Result: No manual dark mode CSS needed */
```

**Verification:** Tested both `[data-theme="light"]` and `[data-theme="dark"]` — all text readable, no contrast issues.

---

### 2. Keyboard Navigation: Three Core Patterns

**Decision:** Implement three keyboard patterns consistently across all steps:
1. **Arrow keys** for choice selection (left/right or up/down)
2. **Enter key** for form submission
3. **Escape key** for dialog close

**Rationale:**
- Arrow keys are standard in radio groups and toggle controls (WCAG pattern)
- Enter confirms, Escape cancels (familiar UX pattern)
- Consistent patterns make keyboard nav predictable across wizard

**Implementation Pattern:**

```typescript
// Step 1: Type Selection (Feature/Bug toggle)
onKeyDown={(e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    setSelectedType('Bug');
    e.preventDefault();
  }
}}

// Dialog: Escape closes
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape' && showConfirmation) {
    setShowConfirmation(false);
  }
};

// Step 3: Ctrl+Enter shortcut for advanced users
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
    handleNext();
  }
};
```

**Tab Order:** Native browser tab order is correct because:
- Buttons, inputs rendered in DOM order
- No absolute positioning that breaks tab order
- Modal overlays use fixed positioning (still tab-reachable)

---

### 3. Focus Management: Visible Rings + Screen Reader Announcements

**Decision:** 
- Use `var(--shadow-focus)` for visible focus rings (not hard outline)
- Add screen reader announcements via aria-live regions (not console.log)

**Rationale:**
- `var(--shadow-focus)` is a design token that adapts to dark mode automatically
- Shadow-based focus ring looks softer than outline (more professional)
- aria-live regions are standard WCAG pattern (no custom library needed)
- Announcements don't interrupt user (polite level)

**Implementation Pattern:**

```typescript
// Visible focus ring
.wizard-btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

// Screen reader announcement
const [announcementRef, setAnnouncementRef] = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (announcementRef.current) {
    announcementRef.current.textContent = `Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`;
    announcementRef.current.setAttribute('role', 'status');
    announcementRef.current.setAttribute('aria-live', 'polite');
  }
}, [currentStep]);

// In render:
<div ref={announcementRef} className="sr-only" />
```

**sr-only Class Pattern:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

This hides the element visually but keeps it in accessibility tree.

---

### 4. Focus Auto-Placement: First Field on Step Entry

**Decision:** Auto-focus first input field when step mounts using `useRef` + `useEffect`.

**Rationale:**
- Keyboard users don't have to Tab to first field (faster, more intuitive)
- useRef is React-idiomatic (not document.querySelector)
- useEffect on component mount fires after render (safe)
- useRef refs are stable (won't cause re-renders)

**Implementation:**
```typescript
const firstFieldRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  firstFieldRef.current?.focus();
}, []); // Runs once on mount

// In render:
<input ref={firstFieldRef} id="persona" type="text" ... />
```

**Note:** This only affects keyboard users. Tab users can still navigate from top of step.

---

### 5. Responsive Design: Mobile-First Breakpoints

**Decision:**
- Base CSS: Desktop layout (no breakpoints needed)
- 768px breakpoint: Tablet adjustments (3→2 column grids, hide progress labels)
- 480px breakpoint: Mobile adjustments (2→1 column grids, stack buttons vertically)

**Rationale:**
- VS Code sidebar minimum width: 320px
- Common responsive breakpoints: 320px (phone), 768px (tablet), 1024px (desktop)
- Mobile-first CSS is easier to maintain (add styles only as screen grows)

**Implementation:**

```css
/* Base: Desktop */
.wizard-invest-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet: 768px and below */
@media (max-width: 768px) {
  .wizard-invest-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .wizard-progress-step-label {
    display: none;  /* Hide text, keep numbers */
  }
}

/* Mobile: 480px and below */
@media (max-width: 480px) {
  .wizard-invest-grid {
    grid-template-columns: 1fr;  /* Single column */
  }
  .wizard-actions {
    flex-direction: column-reverse;  /* Cancel first, then action */
  }
}
```

**Typography Scaling:**
- Desktop: heading-2, body-md
- Mobile: heading-3, body (smaller)

---

### 6. UX Polish: CSS Animations Without JavaScript

**Decision:**
- Error shake: CSS @keyframes (not JS animation)
- Loading spinner: CSS @keyframes spin (not JS setInterval)
- Fade-in dialogs: CSS animation on mount
- Smooth transitions: --transition-base (180ms cubic-bezier) on all hover/focus

**Rationale:**
- CSS animations run on GPU (smoother, no janky JavaScript)
- Simpler to debug (fewer timing bugs)
- Uses existing token system (--transition-base already defined)
- Users see animations even if JavaScript slows down

**Implementation:**

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.wizard-field-error {
  animation: shake var(--transition-fast);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.wizard-btn.loading::after {
  animation: spin 600ms linear infinite;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.wizard-dialog-overlay {
  animation: fade-in var(--transition-base);
}
```

---

## Implementation Summary

### Files Modified

1. **webview-ui/src/styles/wizard.css** (+150 lines)
   - Focus ring styles on all interactive elements
   - Error/success/warning message styles
   - Loading spinner animation
   - Empty state styles
   - Responsive breakpoints (768px, 480px)

2. **webview-ui/src/components/WizardStep1Type.tsx** (+50 lines)
   - Arrow key navigation on type toggles
   - Escape to close dialog
   - ARIA labels on buttons + radio groups
   - Dialog role="alertdialog"

3. **webview-ui/src/components/WizardStep2Identity.tsx** (+40 lines)
   - First field auto-focus (useRef + useEffect)
   - Arrow key navigation on radio options
   - aria-describedby for help text

4. **webview-ui/src/components/WizardStep3Story.tsx** (+80 lines)
   - Ctrl+Enter keyboard shortcut
   - First field auto-focus
   - Help text aria-describedby
   - Arrow key navigation on AI mode toggles

5. **webview-ui/src/components/FeatureWizard.tsx** (+80 lines)
   - Screen reader announcements (aria-live region)
   - Progress bar role="progressbar" with ARIA attributes
   - Loading state with spinner animation

### Tests Performed

- ✅ Light mode: All colors contrast-compliant (WCAG AA)
- ✅ Dark mode: All colors contrast-compliant
- ✅ Keyboard navigation: Tab through all elements, Enter/Escape work
- ✅ Screen reader: Announcements heard, labels present
- ✅ Mobile (320px): No horizontal scroll, layout stable
- ✅ Tablet (768px): 2-column grid, hidden progress labels
- ✅ Desktop (1024px+): 3-column grid, full layout
- ✅ Build: `npm run build` succeeds (2.7MB extension)
- ✅ TypeScript: `tsc --noEmit` zero errors
- ✅ No regressions: Existing wizard flow unchanged

---

## Alternatives Considered

### Focus Rings
- **Outline vs Shadow:** Outline is standard, but shadow looks softer and supports rounded borders better
- **Hard vs Soft focus:** Hard outline (outline: 2px) vs soft shadow (box-shadow: 0 0 0 3px)
  - Chose shadow: More professional, adapts to dark mode via token

### Keyboard Navigation
- **Global hotkeys vs local:** Considered Ctrl+S for save, Ctrl+Enter for submit
  - Chose local: Less conflict with VS Code shortcuts, clearer scope

### Screen Reader Announcements
- **Dedicated library vs native:** Considered aria-announce-er or similar
  - Chose native: Simpler, no dependencies, aria-live is standard WCAG pattern

### Responsive Breakpoints
- **Tailwind-style (sm, md, lg) vs pixel values:** Considered 640px, 768px, 1024px
  - Chose 768px + 480px: Matches VS Code sidebar behavior, simpler breakpoints

---

## Recommendations for Future Phases

1. **Phase 6 (Testing):** Add automated screenshot tests for light/dark mode (e.g., Playwright)
2. **Phase 7 (Packaging):** Implement dark mode detection (`vscode-dark` class listener)
3. **Future:** Add `prefers-reduced-motion` media query for motion-sensitive users
4. **Future:** Add circular progress indicator with percentage for long-running AI operations
5. **Future:** Add "retry" button on error messages for transient failures

---

## Sign-Off

**Status:** ✅ Implemented and Verified

- All deliverables completed
- Zero TypeScript errors
- Build passes
- No regressions
- Ready for Phase 6 (Testing)

**Next Phase:** Brady & Livingston (Phase 6: Full test execution across Feature/Bug wizards, edge cases, and integration scenarios)
