# Visual Specification — AI Features & Delight Enhancements

**Author:** Saul (UI Designer)  
**Date:** 2026-05-01  
**Implementation by:** Rusty (Frontend Engineer)  
**Target files:** `webview-ui/src/styles.css` + component-level styles

---

## Context

The app currently "looks too sad and unhappy." This spec introduces:
1. **AI visual accent** (violet) to distinguish AI features from user actions (teal)
2. **AI state patterns** (loading, thinking, success) for generative features
3. **Micro-interactions** (hover lift, button press feedback) for all interactive surfaces
4. **Empty state patterns** with character and warmth
5. **Enhanced progress indicators** (animated gradient fills)

**Design principle:** Balance delight with restraint. Don't overuse animation or gradients. Every animation serves a purpose.

---

## Section 1: New CSS Tokens to Add

Add the following tokens to `webview-ui/src/styles.css` in the appropriate theme blocks:

### Dark Theme (`[data-theme="dark"]`)

Add after the existing `--info-soft: rgba(96, 165, 250, 0.14);` line (around line 134):

```css
/* AI-feature accent (violet) */
--ai: #7c3aed;
--ai-strong: #8b5cf6;
--ai-soft: rgba(124, 58, 237, 0.12);
--ai-glow: rgba(124, 58, 237, 0.25);
--ai-ink: #c4b5fd;
```

### Light Theme (`[data-theme="light"]`)

Add after the existing `--info-soft: #dbeafe;` line (around line 82):

```css
/* AI-feature accent (violet) */
--ai: #6d28d9;
--ai-strong: #7c3aed;
--ai-soft: rgba(109, 40, 217, 0.10);
--ai-glow: rgba(109, 40, 217, 0.15);
--ai-ink: #6d28d9;
```

**Usage rule:** ONLY for AI-powered features (generation, refinement, suggestions). Regular user actions always use `--accent` (teal).

---

## Section 2: New CSS Animations/Classes

Add these animation definitions and utility classes to `webview-ui/src/styles.css` after the theme token definitions (around line 163):

```css
/* ================================================================
   AI State Visual Patterns
   ================================================================ */

/* AI Loading State — Animated shimmer for active AI generation */
@keyframes ai-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.ai-shimmer {
  background: linear-gradient(
    90deg,
    var(--ai-soft) 0%,
    var(--ai-glow) 50%,
    var(--ai-soft) 100%
  );
  background-size: 200% 100%;
  animation: ai-shimmer 1.5s ease-in-out infinite;
}

/* AI Thinking State — Pulsing glow for active AI sections */
@keyframes ai-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 16px var(--ai-glow); }
}

.ai-thinking {
  animation: ai-pulse 2s ease-in-out infinite;
}

/* AI Success State — Brief celebratory flash on completion */
@keyframes ai-success-flash {
  0% { 
    border-color: transparent;
    background: transparent;
  }
  20% { 
    border-color: var(--success);
    background: var(--success-soft);
  }
  100% { 
    border-color: transparent;
    background: transparent;
  }
}

.ai-success-flash {
  animation: ai-success-flash 600ms ease-out;
}

/* AI Tag Badge — Mark AI-generated content */
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--ai-soft);
  color: var(--ai);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ai-badge::before {
  content: '✦';
  font-size: 10px;
}

/* Hover Lift — Standard micro-interaction for interactive surfaces */
.hover-lift {
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.hover-lift:active {
  transform: translateY(0);
}

/* Empty State Pattern — Standard structure for empty views */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  gap: 12px;
  min-height: 320px;
}

.empty-state-icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.8;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.empty-state-subtitle {
  font-size: 14px;
  color: var(--ink-muted);
  margin: 0;
  max-width: 360px;
  line-height: 1.5;
}

/* Reduced motion fallbacks */
@media (prefers-reduced-motion: reduce) {
  .ai-shimmer,
  .ai-thinking,
  .ai-success-flash {
    animation: none;
  }
  
  .hover-lift {
    transition: none;
  }
}
```

---

## Section 3: Button Enhancements

**Current state:** Buttons only change background color on hover. No tactile feedback.

**Enhancement:** Add lift on hover + press feedback to ALL button classes.

### Primary Button (`.btn`, `.btn-primary`)

Find the existing `.btn:hover` rule and update it:

**Before:**
```css
.btn:hover {
  background: var(--accent-strong);
}
```

**After:**
```css
.btn:hover {
  background: var(--accent-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
}
```

### Secondary Button (`.btn-secondary`)

Find the existing `.btn-secondary:hover` rule and update it:

**Before:**
```css
.btn-secondary:hover {
  background: var(--panel-muted);
}
```

**After:**
```css
.btn-secondary:hover {
  background: var(--panel-muted);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:active {
  transform: translateY(0);
}
```

### Danger Button (`.btn-danger`)

Find the existing `.btn-danger:hover` rule and update it:

**Before:**
```css
.btn-danger:hover {
  background: var(--danger-strong);  /* or similar */
}
```

**After:**
```css
.btn-danger:hover {
  background: var(--danger-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-danger:active {
  transform: translateY(0);
}
```

**Important:** Add `transition: transform 120ms ease-out, box-shadow 120ms ease-out;` to the base `.btn` class if not already present.

---

## Section 4: Progress Bar Enhancement

**Current state:** Loading bars use a flat color fill. No sense of motion or personality.

**Enhancement:** Replace with animated gradient shimmer.

Find the `.loading-bar-fill` class (or equivalent progress fill class) and update:

**Before:**
```css
.loading-bar-fill {
  background: var(--accent);
  height: 100%;
  transition: width 200ms ease-out;
}
```

**After:**
```css
@keyframes progress-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-bar-fill {
  background: linear-gradient(
    90deg, 
    var(--accent) 25%, 
    var(--accent-strong) 50%, 
    var(--accent) 75%
  );
  background-size: 200% 100%;
  height: 100%;
  transition: width 200ms ease-out;
  animation: progress-shimmer 1.5s linear infinite;
}

/* Reduced motion fallback */
@media (prefers-reduced-motion: reduce) {
  .loading-bar-fill {
    background: var(--accent);
    animation: none;
  }
}
```

**Visual result:** Progress bars now have a moving highlight that suggests active work.

---

## Section 5: KPI Card Enhancement

**Current state:** KPI cards (`.kpi`) are plain panels with no accent.

**Enhancement:** Add a 3px top accent bar when the KPI has a meaningful value (> 0).

Find the `.kpi` class definition and add:

```css
.kpi {
  /* existing styles */
  border-top: 3px solid transparent;
  transition: border-color 200ms ease-out;
}

.kpi[data-value]:not([data-value="0"]) {
  border-top-color: var(--accent);
}
```

**Implementation note:** Add a `data-value` attribute to KPI elements in the React component:

```tsx
<div className="kpi" data-value={count > 0 ? count : 0}>
  {/* KPI content */}
</div>
```

**Visual result:** Active KPIs get a subtle teal accent bar. Zero-value KPIs remain neutral.

---

## Section 6: Empty States

Replace all blank/default empty views with the `.empty-state` pattern.

**HTML structure:**
```html
<div class="empty-state">
  <div class="empty-state-icon">📝</div>
  <h3 class="empty-state-title">No stories yet — let's build something</h3>
  <p class="empty-state-subtitle">Create your first PBI to get started with AI-powered backlog refinement.</p>
  <button class="btn">Create Story</button>
</div>
```

### Specific Empty State Copy

| View | Icon | Title | Subtitle | CTA |
|------|------|-------|----------|-----|
| **PBI Studio** (no PBIs) | 📝 | No stories yet — let's build something | Create your first PBI to get started with AI-powered backlog refinement. | "Create Story" button |
| **Dashboard** (no epics) | 🚀 | Ready to plan? Start with an epic | Epics help you organize large features into manageable work items. | "New Epic" button |
| **Dashboard** (no features) | 🎯 | No features yet — break down your first epic | Features are the building blocks of your product roadmap. | "Create Feature" button |
| **Projects** (no projects) | 📁 | No projects imported | Connect to Azure DevOps to sync work items, or create standalone stories. | "Import Project" + "New Story" buttons |
| **Bulk Breakdown** (idle) | ⚡ | Drop your epics here to break them down | Drag epics from the sidebar to generate features and stories with AI. | (no button — drag-drop is the action) |

**Design notes:**
- Icons: Use single emoji, 48px size
- Title: Friendly, action-oriented language (not "No data found")
- Subtitle: Brief explanation of what the feature does + benefit
- CTA: One primary action button (except bulk breakdown, which is drag-drop)

---

## Section 7: AI Section Visual Treatment

**Context:** Collapsible sections with AI features (e.g., "Refine with AI", "Generate Full Story") need visual distinction.

**Implementation:**

### Static Style (Section Collapsed or Idle)

Add these styles to AI-powered collapsible sections:

```css
.ai-section {
  background: linear-gradient(135deg, var(--ai-soft) 0%, transparent 60%);
  border-left: 3px solid var(--ai);
  border-radius: var(--radius);
  padding: var(--space-md);
}

.ai-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--ai);
  cursor: pointer;
}

.ai-section-header::before {
  content: '✦';
  font-size: 14px;
}
```

### Active State (AI Running)

When AI is actively processing, add the `.ai-thinking` class to the `.ai-section` element:

```tsx
<div className={`ai-section ${isGenerating ? 'ai-thinking' : ''}`}>
  {/* section content */}
</div>
```

The `.ai-thinking` class (defined in Section 2) adds a pulsing glow animation.

### Success State (AI Completed)

On successful completion, trigger a one-time `.ai-success-flash` animation:

```tsx
// In React component
useEffect(() => {
  if (justCompleted) {
    sectionRef.current?.classList.add('ai-success-flash');
    setTimeout(() => {
      sectionRef.current?.classList.remove('ai-success-flash');
    }, 600);
  }
}, [justCompleted]);
```

**Visual flow:**
1. Section idle: Gradient background + violet left border
2. User clicks → API call starts: Add `.ai-thinking` pulsing glow
3. API completes: Remove `.ai-thinking`, trigger `.ai-success-flash` briefly
4. Result displayed: Show `.ai-badge` on generated content

---

## Section 8: Component-Level Implementation Notes

### React Component Updates Needed

1. **PbiStudio.tsx** (empty state)
   - Replace conditional "No PBIs" text with `.empty-state` pattern
   - Icon: 📝, title: "No stories yet — let's build something"

2. **DashboardView.tsx** (empty state)
   - Replace "No epics/features" with `.empty-state` pattern
   - Icon: 🚀 (epics), 🎯 (features)

3. **ProjectsView.tsx** (empty state)
   - Replace "No projects" with `.empty-state` pattern
   - Icon: 📁, include both "Import" and "New Story" buttons

4. **BulkBreakdownView.tsx** (empty state)
   - Replace blank canvas with `.empty-state` pattern
   - Icon: ⚡, no button (drag-drop action)

5. **UserStoryWizard.tsx** (AI sections)
   - Wrap "Refine with AI" and "Generate Full Story" in `.ai-section` div
   - Add `.ai-thinking` class when `isRefining` / `isGenerating` is true
   - Add `.ai-badge` to refined/generated content fields

6. **All buttons**
   - Verify all buttons have base `.btn` class for hover lift
   - Ensure `:hover` and `:active` pseudo-states are present

7. **Progress indicators**
   - Update loading bar components to use `.loading-bar-fill` with gradient

8. **KPI cards** (if present)
   - Add `data-value={count}` attribute to `.kpi` elements

---

## Section 9: Dark/Light Theme Verification Checklist

Before marking this done, verify in BOTH themes:

| Check | Dark Theme | Light Theme |
|-------|------------|-------------|
| `--ai` contrast on `--panel` background | ✅ WCAG AA | ✅ WCAG AA |
| `--ai` contrast on `--bg` background | ✅ WCAG AA | ✅ WCAG AA |
| `.ai-soft` background visibility | ✅ Subtle, not overpowering | ✅ Subtle, not overpowering |
| `.ai-glow` box-shadow visibility | ✅ Visible but not harsh | ✅ Visible but not harsh |
| `.ai-badge` readability | ✅ Clear | ✅ Clear |
| Button hover lift shadow | ✅ Visible | ✅ Visible |
| Empty state text contrast | ✅ WCAG AA | ✅ WCAG AA |
| Progress bar gradient animation | ✅ Smooth | ✅ Smooth |

**Testing instructions:**
1. Toggle VS Code theme: `Ctrl+K Ctrl+T` → Select light theme
2. Open PO Tools dashboard
3. Check each section above
4. Toggle back to dark theme
5. Verify again

---

## Section 10: Accessibility Considerations

### Motion Sensitivity
All animations MUST respect `prefers-reduced-motion: reduce`:
- `.ai-shimmer` → static background
- `.ai-thinking` → no animation
- `.ai-success-flash` → instant state change, no animation
- `.hover-lift` → no transition
- `.progress-shimmer` → flat color, no animation

**Verification:** Enable reduced motion in OS settings, verify no animations play.

### Focus Indicators
All interactive elements need visible focus rings:
- Buttons: Use `--focus-ring` variable (already defined)
- Cards with hover lift: Add `:focus-visible` ring
- Empty state CTAs: Default button focus is sufficient

### Screen Reader Announcements
- AI-generated content: Add `aria-label="AI generated"` to `.ai-badge` spans
- Loading states: Add `aria-live="polite"` to sections with `.ai-thinking`
- Empty states: Ensure title + subtitle are semantic `<h3>` + `<p>` for proper hierarchy

---

## Section 11: Implementation Order

Recommended sequence to minimize merge conflicts:

1. **Add tokens** (Section 1) — edit `styles.css` theme blocks
2. **Add animations/classes** (Section 2) — append to `styles.css`
3. **Update buttons** (Section 3) — modify existing button rules
4. **Update progress bars** (Section 4) — modify loading bar component
5. **Update KPI cards** (Section 5) — add data attribute + border rule
6. **Implement empty states** (Section 6) — update React components
7. **Implement AI sections** (Section 7) — wrap AI features in `.ai-section`
8. **Verify themes** (Section 9) — test in light + dark mode
9. **Verify accessibility** (Section 10) — test reduced motion + screen reader

**Estimated effort:** 4-6 hours for full implementation + testing.

---

## Section 12: Visual Regression Testing

After implementation, visually compare before/after:

### Checkpoints
- [ ] All buttons lift on hover + press on active
- [ ] Empty states show emoji + friendly copy + CTA
- [ ] AI sections have violet left border + gradient background
- [ ] AI sections pulse when active (`.ai-thinking`)
- [ ] AI sections flash green briefly on success
- [ ] Progress bars shimmer with gradient
- [ ] KPI cards have teal top border when value > 0
- [ ] `.ai-badge` appears on AI-generated content
- [ ] No animations when `prefers-reduced-motion` is enabled

**Sign-off required from:** Saul (visual fidelity), Tess (UX flow), Livingston (accessibility)

---

## Appendix: Token Reference Quick Sheet

| Token | Dark | Light | Purpose |
|-------|------|-------|---------|
| `--accent` | `#2dd4bf` teal | `#0f766e` teal | User actions, primary CTA |
| `--ai` | `#7c3aed` violet | `#6d28d9` violet | AI features only |
| `--success` | `#34d399` green | `#047857` green | Success states |
| `--danger` | `#fb7185` red | `#be123c` red | Error/delete actions |
| `--warning` | `#fbbf24` yellow | `#b45309` amber | Warning states |
| `--info` | `#60a5fa` blue | `#1d4ed8` blue | Info callouts |

**Color semantics:**
- Teal (`--accent`) = "You do this" (user-initiated actions)
- Violet (`--ai`) = "AI does this" (system-generated content)
- Green (`--success`) = "Completed successfully"
- Red (`--danger`) = "Destructive action" or "Error"

---

**End of Specification**

Questions? Ambiguities? Flag Saul before implementation.
