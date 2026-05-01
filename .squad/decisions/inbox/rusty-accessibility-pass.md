# Decision: WCAG 2.1 AA Component Accessibility Pass

**Author:** Rusty (Frontend Dev)  
**Date:** 2026-04-30  
**Branch:** `feature/ui-wcag-improvements`  
**Status:** Implemented  

## Summary

Applied a comprehensive WCAG 2.1 AA accessibility pass across all five core webview components. Changes are additive and non-breaking — no props, state logic, or messaging was altered.

## Files Changed

| File | Key Changes |
|------|------------|
| `StatusBadge.tsx` | `role="status"`, `aria-label`, `transition-colors` |
| `App.tsx` | `type="button"` on header buttons, focus rings |
| `DashboardView.tsx` | `aria-expanded`, `aria-hidden` on accordions, CSS max-height animation, touch targets, focus rings |
| `FeatureCreationWizard.tsx` | Form label/id connections, `aria-required/invalid/describedby`, `aria-current="step"`, step focus management, `role="dialog"` on cancel overlay, loading/error ARIA live regions |
| `PbiStudio.tsx` | Section header `<div>` → `<button>` for keyboard access, `aria-expanded`, focus rings, `aria-label` on search/filter |

## Decisions Made

### 1. Section headers: `<button>` over `role="button"` on `<div>`

PbiStudio's `.section-header` elements used `<div onClick>`. Changed to `<button type="button" className="section-header w-full text-left">`. The `.section-header` CSS (`display: flex; justify-content: space-between`) applies correctly to `<button>`. This gives native keyboard access, focus management, and AT announcement with no CSS changes.

For the "Edit item" section (which has nested action buttons), the heading became a separate inner `<button>` and the action row got `onClick={(e) => e.stopPropagation()}` on a `<div>` — clean separation.

### 2. Accordion animation: CSS `max-height` + `aria-hidden` (not conditional render)

Replaced `{open && <div>...}` with always-rendered `<div className={`... ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!open}>`. This enables CSS transitions and the `aria-hidden` keeps collapsed content invisible to AT. The `2000px` max-height is deliberately large so the content never clips during animation (a known CSS accordion technique).

### 3. Step focus: `tabIndex={-1}` heading ref

Multi-step wizard advances focus to the new step `<h2>` via `useRef<HTMLHeadingElement> + useEffect([step])`. The heading gets `tabIndex={-1}` (programmatically focusable but not in tab order) and `focus-visible:outline-none` (no visual focus ring on programmatic focus, only on keyboard navigation).

### 4. Cooperative work with Saul

Saul's CSS commit (`4b8060b`) landed first on the same branch. His changes:
- Added global `:focus-visible` ring in `styles.css`
- Added `min-h-touch` / `min-w-touch` tokens (44px) in `tailwind.config.js`
- Added `@tailwindcss/forms` plugin
- Modified DashboardView, StatusBadge, App, FeatureCreationWizard with WCAG-related changes

Rusty's subsequent commit added the remaining semantic HTML / ARIA layer not covered by Saul's CSS-focused pass (form id/htmlFor wiring, ARIA live regions, focus management, dialog role, section-header buttons).

## Patterns to Reuse

- **Form error pattern**: `aria-invalid={!!error}` + `aria-describedby="err-id"` + `<p id="err-id" role="alert">`
- **Loading state pattern**: `role="status" aria-live="polite"` + `<span className="sr-only">` for text equivalent
- **Accordion pattern**: CSS max-height + `aria-expanded` on trigger + `aria-hidden` on content
- **Dialog pattern**: `role="dialog" aria-modal="true" aria-labelledby="title-id"` + `id` on title element
- **Step wizard focus**: `useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `useEffect([step])`
