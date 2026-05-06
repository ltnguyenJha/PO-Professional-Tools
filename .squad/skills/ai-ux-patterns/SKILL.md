# AI-UX Design Patterns for PO-Professional-Tools

**Skill ID:** `ai-ux-patterns`  
**Confidence:** `medium` (patterns documented and validated as relevant to our product context)  
**Owner:** Tess (UX Designer)  
**Last Updated:** 2026-05-01

## Purpose

This skill documents AI-UX design patterns for building intuitive, trustworthy, and delightful AI-powered features in the PO-Professional-Tools VS Code extension. These patterns are based on industry best practices and tailored to our specific context: a Product Owner tool that uses AI to generate backlog items from codebase analysis.

## The 5 AI-UX Patterns

### 1. Predictive UX

**Definition:** AI anticipates the user's next action and proactively offers suggestions, auto-completions, or smart defaults to reduce manual input and speed up workflows.

**When to Use:**
- Form inputs where context is available (workspace metadata, git history, user history)
- Repetitive tasks where patterns are predictable
- Search and filtering where AI can guess intent

**Extension-Specific Applications:**

1. **Smart PBI Title Suggestions**
   - As user types in description field, show 2-3 suggested titles in pills below the input
   - Generated from description keywords + work item type context
   - User can click to apply or ignore and keep typing
   - **Implementation hint:** Debounced input handler → call `CopilotService` with short prompt → render suggestions as `<button>` pills

2. **Work Item Type Prediction**
   - When user pastes a description or scans a code file, predict whether it's a User Story, Bug, or Task
   - Auto-select the predicted type in the dropdown (but allow instant override)
   - Show confidence: "Predicted: User Story (85% confidence)" with a small info icon
   - **Implementation hint:** Description keywords → simple classification logic or LM API call

3. **Pre-filled Acceptance Criteria Templates**
   - Based on work item type + title keywords, suggest 2-3 acceptance criteria starters
   - Example: For "Login authentication" → suggest "✓ User can log in with valid credentials" as first criterion
   - User can accept, edit, or delete
   - **Implementation hint:** Template library in `src/services/templateService.ts` + keyword matching

4. **Smart Search Auto-complete**
   - In project list or PBI draft search, predict queries based on recent actions
   - Show recent searches + predicted queries (e.g., "Show items modified today")
   - **Implementation hint:** Track search history in `globalState`, surface top 3 on focus

**Antipatterns to Avoid:**
- ❌ Auto-filling without indication (user thinks they typed it)
- ❌ Predictions that block the UI or require dismissal
- ❌ Over-predicting trivial inputs (like a 2-character name field)
- ❌ No way to disable predictions (user feels controlled)

**Design Principles:**
- Suggestions appear **below or beside** input, never blocking
- Always ignorable (user can keep typing/clicking)
- Visual distinction: lighter background, smaller text, with "suggestion" label
- Keyboard accessible (Tab to cycle through suggestions, Enter to apply)

---

### 2. Generative Assistance

**Definition:** AI generates or co-creates content based on user prompts. Two modes: instant AI creation (fast, complete drafts) and iterative co-creation (collaborative refinement loops).

**When to Use:**
- Content generation (PBIs, descriptions, acceptance criteria)
- Transformations (expand, summarize, rewrite)
- Creative tasks where AI can provide a strong starting point

**Extension-Specific Applications:**

1. **PBI Generation from Code Scan (AI Creation)**
   - User selects file or folder → clicks "Generate PBI" → AI instantly creates full draft
   - Shows loading shimmer (not just spinner) with encouraging text: "Analyzing code… ✨"
   - Result appears with "✨ AI-generated" badge, all fields populated
   - **Strategy:** Fast creation to spark user's thinking, then allow manual or conversational refinement
   - **Implementation hint:** `CodeAnalyzer.analyzeFile()` → LM API with `FULL_STORY_JSON_BRIDGE` → populate draft in `PbiDraftService`

2. **AI Refinement Co-Creation (Iterative)**
   - User has draft PBI → enters prompt in "Refine with AI" text area: "Make it more technical" or "Add security requirements"
   - AI processes → updates draft fields → shows diff highlights (green for added, yellow for changed)
   - User can accept, refine again, or revert
   - **Strategy:** Conversational, multi-turn refinement until user is satisfied
   - **Implementation hint:** Chat-like UI component, history of prompts, side-by-side before/after view

3. **Bulk Breakdown (AI Creation in Batch)**
   - User provides epic description → AI generates 5-8 child story drafts instantly
   - Shows all drafts in a list, each editable and removable
   - User reviews, refines individually, then pushes batch to ADO
   - **Strategy:** Creation at scale; speed matters more than perfection (user will edit)
   - **Implementation hint:** Parallel LM API calls (rate limit aware), aggregated results in `BulkBreakdownView`

4. **Magic Moments: The "Create" Hero Area**
   - Large, inviting call-to-action with gradient background and warm copy: "What will you build today?"
   - Prominent "Generate with AI" button with shimmer animation on hover
   - Feels like unlocking superpowers, not just clicking a button
   - **Design principle:** AI creation should feel delightful, not mechanical
   - **Implementation hint:** CSS gradient animation, micro-interaction on click (scale + glow)

**Antipatterns to Avoid:**
- ❌ Forcing co-creation when instant creation would work (unnecessary friction)
- ❌ Offering only creation with no refinement path (rigid, user feels stuck)
- ❌ No visual feedback during generation (user thinks it's frozen)
- ❌ Generated content without "AI-generated" label (trust issue)

**Design Principles:**
- **Creation:** Fast, complete, with shimmer loading and instant reveal
- **Co-creation:** Chat-like, shows history, highlights changes
- **Best flow:** Creation → Co-creation → Manual edit (progressive refinement)
- **Visual identity:** Use warm violet accent (`#7c3aed`) for all AI features to brand the "magic"

---

### 3. Adaptive Personalization

**Definition:** AI continuously learns from user behavior, preferences, and context to hyper-personalize the experience. Outsmarts static personalization by adapting dynamically.

**When to Use:**
- Repeated actions where patterns emerge (last-used project, preferred types)
- Context-aware defaults (time of day, current workspace)
- Feature discoverability (surface relevant tools based on usage)

**Extension-Specific Applications:**

1. **Remember Last-Used ADO Project**
   - On dashboard load, pre-select the last project user worked with
   - Store in `globalState` as `lastSelectedProjectId`
   - If user switches projects frequently, show "Recent Projects" dropdown with top 3
   - **Implementation hint:** Track project selection in `SettingsService`, apply on `APP_READY`

2. **Preferred Work Item Type**
   - After user creates 3+ PBIs of the same type (e.g., "User Story"), default new PBIs to that type
   - Show subtle hint: "Defaulting to User Story (your most-used type)"
   - Always allow override via dropdown
   - **Implementation hint:** Count work item types in `pbiDrafts`, derive preference, store in `globalState`

3. **Recently Modified PBIs Surfaced First**
   - In draft list, sort by `updatedAt` descending by default
   - Show "Recently edited" section at top with last 3 drafts
   - User can toggle to alphabetical or by status
   - **Implementation hint:** Sort in `PbiDraftService.listDrafts()`, add toggle in UI

4. **Contextual Quick Actions**
   - If user frequently uses "Refine with AI", pin that button prominently in PBI Studio
   - If user never uses bulk breakdown, deprioritize it in nav
   - **Implementation hint:** Track feature usage counts in `globalState`, adjust UI visibility thresholds

**Antipatterns to Avoid:**
- ❌ Personalization without transparency (user doesn't know why UI changed)
- ❌ No manual override (user feels trapped in AI's decisions)
- ❌ Over-personalizing to the point of unpredictability
- ❌ Storing sensitive data for personalization (privacy violation)

**Design Principles:**
- **Subtle:** Personalization should feel helpful, not intrusive
- **Transparent:** Show why something is personalized ("Last used: Project X")
- **Controllable:** Always allow manual override or reset to defaults
- **Local-first:** Store preferences in VS Code `globalState`, never external

---

### 4. Conversational Interfaces

**Definition:** AI agent that automates user flows via natural language dialogue. Best as a SECONDARY interaction option alongside traditional UI, not as the sole interface.

**When to Use:**
- Complex or flexible tasks where form inputs are too rigid
- Power users who want speed (type commands vs. click through UI)
- Exploratory tasks where user is unsure of exact goal

**Extension-Specific Applications:**

1. **"Refine with AI" Text Area in PBI Studio**
   - User has draft PBI, wants to improve it → types natural prompt: "Make it more technical", "Add accessibility criteria", "Shorten description"
   - AI processes → updates relevant fields → user reviews
   - **Positioning:** Secondary to form inputs (user can directly edit fields OR use conversational refine)
   - **Implementation hint:** Free-text `<textarea>` below form, "Send" button triggers `CopilotService.refineStory()`

2. **Bulk Breakdown Conversational Input**
   - Instead of structured epic form, user can type: "Break down authentication system into stories"
   - AI interprets → generates multiple PBI drafts
   - **Use case:** Faster for experienced POs who know what they want
   - **Implementation hint:** Single-line input in Bulk Breakdown view, LM API parses intent

3. **Quick Command Bar (Future Enhancement)**
   - VS Code command palette integration: "PO Tools: Generate story for selected file"
   - User types command → AI executes flow → opens result in PBI Studio
   - **Positioning:** Power user shortcut, not replacing main UI
   - **Implementation hint:** Register commands in `extension.ts`, route to AI services

**Antipatterns to Avoid:**
- ❌ Conversational UI as the ONLY way to interact (excludes users uncomfortable with chat)
- ❌ No fallback to structured UI (user stuck if AI misunderstands)
- ❌ Overusing conversational for simple tasks (radio button beats typing "select option B")
- ❌ Chat without memory (user has to repeat context every message)

**Design Principles:**
- **Secondary, not primary:** Offer conversational as a fast alternative, not the default flow
- **Hybrid approach:** User can mix form inputs + conversational refinement in same session
- **Clear affordances:** Label conversational areas distinctly ("Chat with AI to refine", not ambiguous text box)
- **Memory within session:** Conversational context carries through refinement loops

---

### 5. Background Automation

**Definition:** AI handles long-running tasks in the background, notifying the user only at completion, failure, or when consent is needed. Reduces visual complexity by removing UI for automated processes.

**When to Use:**
- Long-running AI tasks (>5 seconds): code analysis, bulk generation, refinement
- Tasks that don't require step-by-step user interaction
- Async operations where user can continue working meanwhile

**Extension-Specific Applications:**

1. **Background Code Scanning**
   - User opens large repo → extension scans in background for PBI opportunities
   - Shows non-blocking status bar item: "🔍 Scanning workspace… 45% complete"
   - On completion, shows toast: "✅ Found 12 potential backlog items. View suggestions?"
   - User clicks → opens curated list in dashboard
   - **Implementation hint:** Run `CodeAnalyzer` on workspace folder tree in async task, update UI via `ExtensionEvent`

2. **AI Refinement with Streaming Updates**
   - User clicks "Refine with AI" → modal shows progress: "AI is thinking…"
   - Fields update in real-time as AI generates (streamed response)
   - User can cancel anytime (button always visible)
   - On completion, show success animation (green checkmark pulse)
   - **Implementation hint:** Stream LM API response, update draft fields progressively, add cancel token

3. **Bulk ADO Push with Progress Tracking**
   - User pushes 20 PBIs to ADO → background task processes them one-by-one
   - Progress bar shows: "Pushing to ADO… 8/20 complete"
   - User can navigate away, task continues
   - On completion, celebratory toast: "🎉 20 PBIs pushed successfully!"
   - **Implementation hint:** Queue tasks, process in background thread, update UI via events

4. **Celebration Moments (Success State)**
   - After long-running AI task completes successfully, show brief animation: green flash + confetti particles (subtle, 1 second)
   - Positive reinforcement: "Great job! 5 stories created."
   - **Design principle:** AI automation should feel rewarding, not invisible
   - **Implementation hint:** CSS animation triggered on `SUCCESS` event, auto-dismiss after 2s

**Antipatterns to Avoid:**
- ❌ Blocking modal for long-running tasks (user can't do anything else)
- ❌ No progress indication (user thinks app is frozen)
- ❌ Silent failures (task fails, user never knows)
- ❌ No cancellation option (user feels trapped)

**Design Principles:**
- **Non-blocking:** User can continue working while AI processes
- **Clear progress:** Status bar, toast, or collapsible indicator shows task state
- **Easy cancellation:** Always offer a way to stop long-running tasks
- **Celebrate success:** Brief, delightful animation on completion (build positive association with AI features)
- **Handle errors gracefully:** Clear error message + retry option, not crash

---

## Balancing AI UX vs. Non-AI UX

### The Balancing Act

**Golden Rule:** AI enhances user capability; it never removes user control.

**AI-First Features** (core value prop):
- PBI generation from code
- AI refinement and improvement
- Bulk breakdown of epics

**Non-AI Features** (deterministic, user-driven):
- Manual PBI editing (always available as escape hatch)
- Project and settings management
- ADO sync and push (user confirms before sending)
- Drafts list, filtering, sorting

**Hybrid Approach** (best of both worlds):
- Start with AI creation (fast draft)
- Allow conversational refinement (iterative improvement)
- Always offer manual edit as final step (full control)

### Red Flags (Overusing AI)

- ❌ **Unclear enhancements:** AI is used but doesn't visibly improve UX
- ❌ **Suboptimal patterns:** Forcing conversational UI for simple tasks (radio button is clearer)
- ❌ **Ignoring core UX:** AI is flashy but form inputs are confusing
- ❌ **Unrealistic expectations:** Promising AI perfection (it's probabilistic, will make mistakes)

### Trust-Building Checklist

Every AI feature must:
- ✅ **Transparency:** Label AI-generated content, show when AI is processing
- ✅ **Control:** User can undo, regenerate, or bypass AI entirely
- ✅ **Fairness:** No bias in suggestions, no hidden data usage
- ✅ **Privacy:** Code stays local, only prompts sent to LM API, no external storage
- ✅ **Fallback:** If AI fails, user can still accomplish task manually

---

## AI Creation vs. Co-Creation Decision Matrix

| Scenario | Pattern | Why |
|----------|---------|-----|
| Initial PBI from code scan | **AI Creation** | User wants fast draft, will refine manually |
| Improving existing PBI | **AI Co-Creation** | Iterative refinement, user guides AI |
| Bulk epic breakdown | **AI Creation** | Speed matters, user reviews batch afterward |
| Complex PBI with uncertainty | **AI Co-Creation** | User needs AI to explore options together |
| Quick title suggestion | **Predictive UX** | Non-intrusive, instant, ignorable |
| Long-running code analysis | **Background Automation** | User shouldn't wait, notify on completion |

**Best Flow for PBI Generation:**
1. **AI Creation:** Generate initial draft instantly (80% solution)
2. **AI Co-Creation:** User refines via 1-3 conversational prompts (95% solution)
3. **Manual Edit:** User tweaks final details directly in form (100% solution)

This flow balances speed (creation), flexibility (co-creation), and control (manual).

---

## Implementation Hints for Developers

### Visual Identity for AI Features
- Use **warm violet accent** (`#7c3aed` / `#6d28d9`) exclusively for AI-powered buttons and sections
- This visually brands "AI magic" separate from regular teal-accented actions
- Example: "Generate with AI" button has violet gradient background

### Loading States for AI Operations
- **Not just spinners:** Use animated gradient shimmer with encouraging text
- Example: `<div class="ai-loading">✨ AI is thinking… This may take a few seconds.</div>`
- CSS: gradient animation moving left-to-right, subtle pulse

### Success Celebrations
- Brief green flash + checkmark animation (1-2 seconds)
- Positive copy: "Great job!", "Successfully created!", "Looking good!"
- Auto-dismiss, non-intrusive

### Error Handling for AI Features
- Clear, actionable error messages: "AI refinement failed. Try rephrasing your request or edit manually."
- Always offer fallback: "Edit manually" button alongside "Retry"
- Never block user with AI error (they can always proceed manually)

### Accessibility for AI Features
- Screen reader announcements for AI state changes: "AI is generating content", "AI refinement complete"
- Keyboard navigation for all AI controls (Enter to trigger, Escape to cancel)
- ARIA live regions for dynamic content updates

---

## Confidence Level: Medium

**Why Medium:**
- Patterns are documented and validated as relevant to our product context
- We have clear application examples for PO-Professional-Tools
- Not yet "high" because patterns are newly documented (not yet tested in production with real users)

**Path to High Confidence:**
- Ship features using these patterns
- Collect user feedback and analytics (feature usage, success rates)
- Iterate based on real-world validation
- Document case studies of what worked / what didn't

---

## References

- LogRocket article: "How to design AI features that actually improve user experience" (Jan 2026)
- WCAG 2.1 AA accessibility guidelines
- VS Code UX guidelines for extensions
- Azure DevOps REST API best practices

---

**Next Steps:**
1. Apply these patterns in `docs/DESIGN.md` for the UI refresh
2. Review with Rusty (Frontend) for feasibility
3. Prioritize pattern implementation in sprint planning
4. Test with real users and iterate based on feedback
