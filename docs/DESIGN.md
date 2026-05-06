# PO-Professional-Tools — UI/UX Design Refresh

**Author:** Tess (UX Designer)  
**Status:** Living Document  
**Last Updated:** 2026-05-01  
**Purpose:** Guide the UI/UX refresh to make the extension feel warm, delightful, and energizing while maintaining accessibility and VS Code consistency.

---

## Section 1: Problem Statement

### The Current State: "Sad and Unhappy"

The extension currently works functionally, but the user experience feels **cold, clinical, and lacking delight**. Users describe the interface as "sad" — it gets the job done but doesn't inspire or energize. Specifically:

**Pain Points:**

1. **Dark, Cold Color Palette**
   - Heavy reliance on neutral grays and clinical blues
   - No warmth or vibrancy in the accent colors
   - AI-powered features (the "magic" of the extension) don't visually stand out as special

2. **Limited Micro-Interactions**
   - Buttons and cards are static — no hover elevation, no subtle animations
   - State changes are abrupt (instant transitions)
   - No feedback that makes interactions feel responsive and alive

3. **Barebones Empty States**
   - Blank areas with no guidance or encouragement
   - PBI Studio starts with empty form fields — uninviting
   - Missing opportunities to motivate and guide users

4. **AI Operations Feel Mechanical**
   - AI generation shows generic spinners with no personality
   - Success states are silent (no celebration or positive reinforcement)
   - Loading states don't convey "AI magic" — they feel like any other loading operation

5. **No Celebratory Moments**
   - Completing tasks (creating PBIs, pushing to ADO) has no visual reward
   - Missing opportunities to build positive emotional connection
   - Users don't feel accomplished after using the tool

**The Goal:**

Transform the extension from **functional but cold** → **functional AND delightful**. Users should feel energized when they open the dashboard, excited to generate PBIs with AI, and satisfied when they complete tasks. The UI should convey warmth, intelligence, and approachability.

---

## Section 2: AI-UX Pattern Opportunities

Applying the 5 AI-UX design patterns to specific features in PO-Professional-Tools:

### 1. Predictive UX → Smart Defaults & Suggestions

**Opportunity:** PBI title/type suggestions as user types

**Current State:** User must manually fill all fields from scratch.

**Enhanced Experience:**
- **Smart Title Suggestions:** As user types description in PBI Studio, show 2-3 suggested titles as clickable pills below the input
  - Visual: Light gray pills with violet accent on hover, small sparkle icon ✨
  - Behavior: Click to apply, or ignore and keep typing
  - Implementation: Debounced `onChange` → quick LM API call → render suggestions

- **Work Item Type Prediction:** When description has keywords like "bug", "fix", "error" → auto-select "Bug" type with hint: "Predicted: Bug (High confidence)"
  - Visual: Subtle badge next to dropdown showing prediction
  - Behavior: User can override with one click

- **Smart Defaults from Workspace:** Pre-fill project context from `package.json`, README
  - Example: If README mentions "authentication", suggest "Authentication" as area/tag

**Design Principle:** Predictions are **non-intrusive helpers**, not mandatory steps. Always ignorable.

---

### 2. Generative Assistance → AI PBI Generation Flows

**Opportunity:** Make AI generation feel like "magic moments" with better visual feedback

**Current State:** AI generation is functional but feels clinical (spinner → result).

**Enhanced Experience:**

**A. The Hero "Create" Area (Dashboard + PBI Studio)**
- **Current:** Generic "Create PBI" button
- **Redesign:** Large, inviting call-to-action with gradient background
  - Copy: "What will you build today? ✨" (warm, energizing)
  - Button: "Generate with AI" with violet gradient (`#7c3aed → #6d28d9`) + shimmer animation on hover
  - Hover effect: Button lifts slightly (`translateY(-2px)`) with subtle shadow increase
  - Feels like unlocking superpowers, not just clicking a button

**B. AI Loading States (Creation Mode)**
- **Current:** Basic spinner with "Loading..."
- **Redesign:** Animated gradient shimmer (purple-to-teal wave moving across a placeholder card)
  - Copy: "✨ AI is analyzing your code… This may take a few seconds."
  - Visual: Skeleton screen with animated gradient overlay (not just spinner)
  - Personality: Encouraging, patient, warm

**C. AI Success State (Creation Complete)**
- **Current:** Result appears instantly with no fanfare
- **Redesign:** Brief success animation before settling
  1. Green flash (0.3s) across the entire PBI card
  2. Checkmark animation (scales in with slight bounce)
  3. Badge: "✨ AI-generated" with violet accent
  4. Optional: Subtle confetti particles (1 second, then disappear)
  - Audio (optional, user setting): Soft "ding" on success

**D. Co-Creation Mode ("Refine with AI")**
- **Current:** Text area with "Refine" button → result replaces fields
- **Redesign:** Chat-like conversational interface
  - User prompt appears as a bubble (right-aligned, teal background)
  - AI response as bubble (left-aligned, violet background)
  - Show before/after comparison: split view or highlighted diffs (green = added, yellow = changed)
  - History: User can scroll up to see previous refinement prompts
  - Feels collaborative, not transactional

**Design Principle:** AI creation is a **delightful experience**, not just a function. Visuals, copy, and animations convey intelligence and care.

---

### 3. Adaptive Personalization → Remember User Preferences

**Opportunity:** Remember recently used work item types, last project selection, preferred view modes

**Current State:** Every session starts from scratch; no memory of user patterns.

**Enhanced Experience:**

**A. Remember Last-Used ADO Project**
- On dashboard load, pre-select the project user worked with last session
- Show subtle hint: "Welcome back! Resuming work on [Project Name] 👋"
- If user switches projects often, show "Recent Projects" dropdown with top 3

**B. Preferred Work Item Type**
- Track user's most-created type (e.g., if 70% of PBIs are "User Story", default to that)
- Show hint: "Defaulting to User Story (your go-to type)"
- User can override with one click

**C. View Mode Persistence**
- If user always uses "compact" view for drafts list, remember that preference
- Same for sort order (alphabetical vs. recent)

**D. Recently Modified PBIs at Top**
- In drafts list, surface "Recently Edited" section with last 3 touched items
- Makes it easy to resume work

**Design Principle:** Personalization is **subtle and helpful**, never intrusive. User always has control to override.

---

### 4. Conversational Interfaces → "Refine with AI" as Co-Creator

**Opportunity:** Position the "Refine with AI" section as a helpful co-creator, not just a text box

**Current State:** Text area labeled "Refine with AI" with generic "Submit" button.

**Enhanced Experience:**

**A. Redesign as Conversational Panel**
- **Visual:** Chat-like interface (speech bubbles, not form field)
- **Copy Changes:**
  - Placeholder: "Tell me how to improve this PBI… (e.g., 'Make it more technical', 'Add accessibility criteria')"
  - Button: "Send to AI ✨" (not "Submit")
  - Header: "Collaborate with AI" (not just "Refine")

**B. Show AI Personality**
- When user sends prompt, AI "types" response with typing indicator (three pulsing dots)
- Response feels conversational: "I've made it more technical by adding implementation details. Take a look!"
- Encourages multi-turn dialogue

**C. Quick Refinement Chips**
- After initial generation, show suggested refinement actions as pill buttons:
  - "Make more technical" | "Add acceptance criteria" | "Shorten description" | "Add accessibility notes"
- User can click pill or type custom prompt
- Reduces friction for common refinements

**Design Principle:** Conversational AI is a **secondary interaction mode**, not the only way. User can refine conversationally OR edit form fields directly.

---

### 5. Background Automation → Non-Intrusive Progress, Celebrate Completion

**Opportunity:** AI refinement running in background with non-intrusive progress indicators; celebrate completion

**Current State:** AI operations block UI or provide minimal feedback.

**Enhanced Experience:**

**A. Background Code Scanning (Future Enhancement)**
- When user opens large workspace, extension scans in background for PBI opportunities
- Status bar item: "🔍 Scanning workspace… 45%" (non-intrusive, right side of status bar)
- On completion, toast notification: "✅ Found 12 potential backlog items. View suggestions?"
- User clicks → opens curated list in dashboard

**B. AI Refinement with Real-Time Updates**
- User clicks "Refine with AI" → modal or panel shows progress: "AI is thinking…"
- Fields update in real-time as AI generates (streamed response)
- Cancel button always visible (red, left side): "Cancel"
- On completion, success animation (green checkmark pulse) + encouraging copy: "Looks great! Ready to push?"

**C. Bulk ADO Push with Progress Tracking**
- User pushes 20 PBIs to ADO → background task processes them
- Progress bar in collapsible panel at bottom: "Pushing to ADO… 8/20 complete"
- User can minimize panel and continue working
- On completion, celebratory toast: "🎉 20 PBIs pushed successfully! Great job!"

**D. Celebration on Task Completion**
- After long-running AI task succeeds:
  1. Brief green flash across the UI (0.5s)
  2. Confetti animation (subtle, 1-2 seconds, then disappear)
  3. Positive copy: "Nailed it! 🎉" or "You're on fire! 🔥"
- Builds positive emotional association with using the tool

**Design Principle:** Long-running tasks are **non-blocking**, progress is **visible**, and success is **celebrated**.

---

## Section 3: Visual & Interaction Direction

### Specific Improvements to Implement

#### 1. Micro-Interactions: Bring UI to Life

**Buttons:**
- **Hover state:** Subtle lift (`translateY(-1px)`) + shadow increase (`box-shadow: 0 4px 8px rgba(0,0,0,0.15)`)
- **Active state:** Slight press down (`translateY(0)`) + shadow decrease
- **Transition:** All state changes smooth (150ms ease-out)

**Cards (PBI drafts, KPI cards):**
- **Hover state:** Gentle elevation increase (shadow from 2px → 6px blur) + scale(1.01)
- **Transition:** 200ms ease-out

**Accent State Changes:**
- When toggling views or tabs, use color transition (teal → violet for AI features)
- Animated underline sliding from old tab to new tab (not instant)

**Implementation Hint:**
```css
.button {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.card {
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.card:hover {
  transform: scale(1.01);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}
```

---

#### 2. Empty States: Encourage and Guide

**Current:** Blank areas with no content.

**Redesign:**

**A. PBI Studio Empty State (No Draft Selected)**
- Icon: Large, friendly sparkle icon (✨) with violet gradient
- Heading: "Ready to build something great?"
- Body: "Generate a new PBI from your code or start from scratch."
- CTA Button: "Generate with AI ✨" (prominent, gradient background)
- Visual: Centered, ample whitespace, inviting

**B. Drafts List Empty State (No PBIs Yet)**
- Icon: Clipboard with sparkles
- Heading: "Your backlog is empty — for now!"
- Body: "Create your first PBI to get started. AI can help you draft stories in seconds."
- CTA Button: "Create First PBI"

**C. Projects View Empty State (No ADO Projects)**
- Icon: Folder icon
- Heading: "Connect to Azure DevOps to get started"
- Body: "Import your ADO projects to sync PBIs and track your backlog."
- CTA Button: "Configure ADO Settings"

**Design Principle:** Empty states are **positive and actionable**, not sad or confusing.

---

#### 3. AI Operation States: Make AI Feel Magical

**Loading State (AI Thinking):**
- Replace plain spinner with **animated gradient shimmer**
- Gradient moves left-to-right across skeleton card (purple → teal → purple loop)
- Copy: "✨ AI is thinking… This may take a few seconds."
- Implementation: CSS `@keyframes` with `background: linear-gradient()` + `background-position` animation

**Thinking State (Refinement in Progress):**
- Subtle **pulsing glow** around AI section border
- Color: Violet accent with 50% opacity, pulse in/out (1.5s loop)
- Copy: "Collaborating with AI… ✨"

**Success State (Generation Complete):**
- **Brief green flash** across PBI card (0.3s duration)
- **Checkmark animation:** Scale in from center with slight bounce (elastic easing)
- **Badge:** "✨ AI-generated" with violet background, white text
- Optional: **Confetti particles** (5-10 small dots) animate from center outward, then fade (1s total)

**Error State (AI Failed):**
- **Clear but not harsh red feedback**
- Icon: Exclamation triangle (not scary skull)
- Copy: "AI refinement didn't work this time. Try rephrasing or edit manually."
- CTA Buttons: "Retry" (primary) | "Edit Manually" (secondary)
- Color: Soft red (`--vscode-editorError-foreground`) with white text

**Implementation Hint:**
```css
.ai-loading {
  background: linear-gradient(90deg, #7c3aed, #14b8a6, #7c3aed);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
@keyframes shimmer {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
```

---

#### 4. Color Warmth: Introduce AI-Specific Accent

**Current:** Teal accent (`--accent`, `#14b8a6`) used for all interactive elements.

**Enhancement:** Add **warm violet/indigo accent** (`#7c3aed` / `#6d28d9`) exclusively for AI-powered features.

**Color Usage:**
- **Teal (`#14b8a6`):** Regular actions (manual create, save, edit, settings)
- **Violet (`#7c3aed`):** AI actions (generate, refine, predict, suggest)
- **Green (`#10b981`):** Success states (pushed to ADO, refinement complete)
- **Red (`--vscode-editorError-foreground`):** Error states

**Visual Coding:** Users quickly learn that **violet = AI magic** ✨

**Example:**
- "Create Manually" button: teal background
- "Generate with AI" button: violet gradient background
- "Refine with AI" section: violet accent border

**Implementation:**
```css
:root {
  --accent: #14b8a6; /* Existing teal */
  --accent-ai: #7c3aed; /* New AI violet */
  --accent-ai-dark: #6d28d9;
  --success: #10b981;
}
```

---

#### 5. Typography Rhythm: Increase Weight Variation

**Current:** Uniform font-weight, limited hierarchy.

**Enhancement:**

- **Section headings:** `font-weight: 700` (bold), `font-size: 1.25rem`
- **Card titles:** `font-weight: 600` (semi-bold), `font-size: 1rem`
- **Body text:** `font-weight: 400` (regular), `font-size: 0.875rem`
- **Muted text (metadata):** `font-weight: 400`, `color: var(--vscode-descriptionForeground)` (slightly more contrast than current)

**Line Height:**
- Headings: `line-height: 1.3` (tighter)
- Body: `line-height: 1.6` (comfortable reading)

**Implementation:**
```css
.section-heading {
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.3;
}
.card-title {
  font-weight: 600;
  font-size: 1rem;
}
.body-text {
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

---

#### 6. KPI Cards: Add Gradient Accent Bars

**Current:** Flat cards with numbers and labels.

**Enhancement:**
- Add **gradient accent bar** at top of each KPI card (3px height)
- Gradient colors:
  - **Total PBIs:** Teal gradient (`#14b8a6 → #0d9488`)
  - **AI-Generated:** Violet gradient (`#7c3aed → #6d28d9`)
  - **Pushed to ADO:** Green gradient (`#10b981 → #059669`)
- Use **color to celebrate:** If count > 0, show vibrant color; if 0, show muted gray

**Implementation:**
```css
.kpi-card {
  border-top: 3px solid transparent;
  background-image: linear-gradient(white, white), linear-gradient(90deg, #14b8a6, #0d9488);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
```

---

#### 7. Progress Bars: Animated Gradient Fill

**Current:** Flat color progress bars (if any).

**Enhancement:**
- Use **animated gradient fill** (not flat color)
- Gradient: Teal → violet for AI tasks, teal → green for ADO push
- Animation: Shimmer effect moving across the fill (gives sense of active processing)

**Implementation:**
```css
.progress-bar-fill {
  background: linear-gradient(90deg, #14b8a6, #7c3aed);
  background-size: 200% 100%;
  animation: progress-shimmer 2s linear infinite;
}
@keyframes progress-shimmer {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
```

---

#### 8. The "Create" Hero Area: Inviting & Energizing

**Current:** Standard button or form field.

**Redesign:**

**Visual:**
- Large, prominent section at top of PBI Studio or Dashboard
- **Gradient background:** Subtle gradient from violet to teal (10% opacity overlay on VS Code background)
- **Heading:** "What will you build today?" (font-weight: 700, large)
- **Subheading:** "Generate PBIs from your code in seconds with AI magic ✨"
- **CTA Button:** "Generate with AI" — large, violet gradient background, white text, shimmer animation on hover

**Layout:**
- Centered content, ample padding (40px vertical, 24px horizontal)
- Button prominently positioned (primary action)
- Optional: Illustration or icon (sparkle, code file, lightbulb) on the left

**Implementation:**
```css
.hero-create {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(20, 184, 166, 0.1));
  padding: 40px 24px;
  text-align: center;
  border-radius: 8px;
}
.hero-create h2 {
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 8px;
}
.hero-create .cta-button {
  background: linear-gradient(90deg, #7c3aed, #6d28d9);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 6px;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.hero-create .cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
}
```

---

## Section 4: Interaction Principles from the Article

### Predictive UX Principle
- **Show suggestions non-intrusively** (small chips below inputs, not blocking modal or overlay)
- User can ignore and keep working (suggestions don't steal focus)
- Keyboard accessible (Tab to cycle, Enter to apply)

### Generative UX Principle
- **Show intermediate state with warmth and personality**
  - Not: "Loading…" with cold spinner
  - Yes: "✨ AI is thinking… Analyzing your code patterns."
- Use animated gradients, not static colors
- Celebrate success with brief animation (green flash, checkmark)

### Co-Creation Principle
- **After initial AI draft, offer "refine" options as pill buttons** (not just raw text area)
- Example: After generating PBI → show pills: "Make more technical" | "Add acceptance criteria" | "Shorten"
- User can click pill (fast) or type custom prompt (flexible)
- Show refinement history (chat bubbles) so user can track changes

### Background Automation Principle
- **Progress in status bar or collapsible indicator** (not modal blocking)
- User can continue working while AI processes
- On completion, show non-intrusive toast with clear action: "✅ 12 PBIs generated. View now?"

### Transparency Principle
- **Always indicate when AI is involved**
  - Badge: "✨ AI-generated" on suggestions
  - Label: "Collaborate with AI ✨" on refinement section
  - Copy: "This was created by AI. You can edit or regenerate."
- Users should never wonder, "Did AI do this or did I?"

---

## Section 5: What NOT to Change

### Design System Foundations (Keep These)

1. **VS Code CSS Variable System**
   - Never hardcode colors (no `#fff`, `#000`, `#123456` in CSS)
   - Always use `--vscode-*` variables for foreground, background, borders
   - Exception: Accent colors defined in our `:root` (`--accent`, `--accent-ai`)

2. **Accessibility Requirements (WCAG 2.1 AA)**
   - Minimum contrast ratios: 4.5:1 for normal text, 3:1 for large text
   - Keyboard navigation for all interactive elements (no mouse-only features)
   - Screen reader support: ARIA labels, live regions for dynamic content
   - Focus indicators visible on all focusable elements

3. **Core Layout and Navigation Structure**
   - Sidebar navigation (Dashboard, PBI Studio, Projects, Settings) stays the same
   - React component hierarchy in `webview-ui/src/views/` remains intact
   - Don't rearchitect the app structure — this is a visual/interaction polish pass

4. **Message Contract Between Extension and Webview**
   - `src/shared/messages.ts` and `webview-ui/src/types.ts` must stay in sync
   - Don't change message types or payloads without coordinating with backend
   - New UI features that need new messages: document in design spec first

5. **The Teal Accent Color**
   - Teal (`#14b8a6`) is the brand color — don't replace it
   - We're adding violet for AI features, not replacing teal
   - Teal is used for non-AI actions, violet for AI actions (clear visual coding)

---

## Implementation Guidance for Rusty & Saul

### Phase 1: Foundational Improvements (Week 1)
1. Add violet accent color to CSS variables
2. Implement micro-interactions (button hover, card hover)
3. Redesign empty states for all views
4. Increase typography weight variation

**Success Criteria:** UI feels more alive; empty states are encouraging; text hierarchy is clear.

---

### Phase 2: AI Visual Identity (Week 2)
1. Apply violet accent to all AI-powered buttons and sections
2. Redesign AI loading states (gradient shimmer, not spinner)
3. Add success animations (green flash, checkmark)
4. Implement "Generate with AI" hero area in PBI Studio

**Success Criteria:** AI features feel distinct and "magical"; users can visually identify AI vs. manual actions.

---

### Phase 3: Conversational & Background Features (Week 3)
1. Redesign "Refine with AI" as chat-like interface
2. Add quick refinement pill buttons
3. Implement non-blocking progress indicators for long tasks
4. Add celebratory toast notifications on task completion

**Success Criteria:** AI refinement feels collaborative; long tasks don't block UI; users feel rewarded on completion.

---

### Phase 4: Adaptive Personalization (Week 4+)
1. Remember last-used ADO project
2. Track preferred work item type
3. Surface recently modified PBIs first
4. Persist view mode preferences

**Success Criteria:** Extension remembers user patterns; reduces repetitive input; feels personalized.

---

## Measuring Success

### Qualitative Metrics
- User feedback: "The extension feels more polished and delightful"
- Reduced confusion: Fewer questions about what AI features do
- Increased engagement: Users try AI features more often

### Quantitative Metrics (if analytics available)
- **AI feature usage:** % increase in "Generate with AI" clicks
- **Refinement loops:** Average number of refinement iterations per PBI (target: 2-3)
- **Task completion:** % of PBIs generated → edited → pushed to ADO (funnel analysis)
- **Empty state engagement:** % of users who click empty state CTAs

---

## Next Steps

1. **Review with team:** Present this design doc in design review meeting
2. **Prioritize features:** Danny (Lead) decides which phases to implement first
3. **Create design comps:** Tess creates mockups for key flows (hero area, AI loading, empty states)
4. **Coordinate with Rusty:** Pair on implementation, iterate based on feasibility
5. **User testing:** Once Phase 1-2 shipped, collect feedback from real users
6. **Iterate:** Refine based on usage patterns and feedback

---

**Questions or Feedback?** Tag @Tess in `.squad/discussions/` or Slack.

**Living Document:** This will evolve as we learn from implementation and user testing.
