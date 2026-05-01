# Feature Creation & Epics — UX Specification

**Author:** Tess (UX Designer)  
**Date:** 2026-04-30  
**Status:** Draft v1.0  
**Collaborators:** Saul (UI Designer), Rusty (Frontend Dev), Linus (Backend Dev)

---

## Table of Contents

1. [Overview & Design Principles](#1-overview--design-principles)
2. [Feature Creation Wizard — Step-by-Step](#2-feature-creation-wizard--step-by-step)
3. [Generated User Story Review UX](#3-generated-user-story-review-ux)
4. [Epic View UX](#4-epic-view-ux)
5. [Dashboard Changes](#5-dashboard-changes)
6. [Navigation Order](#6-navigation-order)
7. [Accessibility Notes](#7-accessibility-notes)
8. [Component Tokens & Reuse](#8-component-tokens--reuse)

---

## 1. Overview & Design Principles

### Mental Model

The user's workflow has three levels of abstraction:

```
Epic  ──────────── "We're building Guest Payment this quarter"
  └── Feature ──── "Guest checkout with card on file"
        └── Story ─ "As a guest, I want to pay without creating an account"
```

**Feature Creation** is the CAPTURE + AI BREAKDOWN tool. It is intentionally lean:
- Capture high-level intent quickly (what, why, who, rough flow)
- Let AI do the breakdown into User Stories
- Review titles + effort only — no deep editing here
- Push to ADO in one action
- **For deep editing:** redirect to PBI Studio — this is sacred

**The user should never feel like they need to write a full spec in the wizard.**

### Design North Star

> "Capture your idea in 5 minutes, AI does the rest."

---

## 2. Feature Creation Wizard — Step-by-Step

### Wizard Architecture

The Feature Creation wizard is a **dedicated top-level view** (replaces the current `bulk` view) with its own sidebar nav entry. It is **not** embedded inside PBI Studio.

**Total steps: 4**  
Progress rail shows numbered circles (consistent with existing wizard pattern).

```
┌─────────────────────────────────────────────────────────────────┐
│  ✦ Feature Creation                                             │
│  ───────────────────────────────────────────────────────────    │
│   ①──────②──────③──────④                                       │
│  Feature  Repos   AI     Review                                 │
│  Details  & Ctx  Breakdown & Push                               │
└─────────────────────────────────────────────────────────────────┘
```

Progress rail: same CSS as existing `UserStoryWizard` (`.wizard-progress`, `.wizard-step-dot`). Active step = filled accent circle. Completed step = checkmark circle. Future step = outlined circle.

---

### Step 1 — Feature Details

**Purpose:** Capture the "what" and "why" of the feature at a high level.

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1 of 4 — Feature Details                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Feature Title *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Guest Checkout — Card on File                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Keep it short: a verb phrase that names the outcome.           │
│                                                                 │
│  Why are we building this? *                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Guests abandon at payment step because they don't want  │   │
│  │ to create an account. Enabling card-on-file reduces      │   │
│  │ checkout friction and increases conversion.              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  The business case in 2–3 sentences.                            │
│                                                                 │
│  Who benefits? *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Guest shoppers who want a fast checkout experience      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Primary user / persona affected.                               │
│                                                                 │
│  High-level user flow (optional)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. User adds items to cart                              │   │
│  │ 2. Selects Guest Checkout                               │   │
│  │ 3. Enters card details once                             │   │
│  │ 4. Confirms payment without creating account            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Numbered steps or free prose — AI uses this for story ideas.   │
│                                                                 │
│  Business rules / constraints (optional)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PCI compliance required. No card data stored server-    │   │
│  │ side. Must work on mobile web.                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Compliance, out-of-scope items, technical constraints.         │
│                                                                 │
│  Assign to Epic (optional)                          ▼           │
│  ┌─────────────────────────────────────────────────┐           │
│  │  ── No Epic (standalone feature) ──             │           │
│  │  Q2 2026 — Guest Experience Initiative          │           │
│  │  Q3 2026 — Payment Modernization                │           │
│  └─────────────────────────────────────────────────┘           │
│  Links this Feature under an existing Epic in ADO.              │
│                                                                 │
│                              [ Cancel ]  [ Next: Repos & AI → ] │
└─────────────────────────────────────────────────────────────────┘
```

**Fields:**

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| Feature Title | `<input>` | Yes | Min 3 chars, max 120 | Auto-trimmed |
| Why are we building this? | `<textarea>` rows=3 | Yes | Min 20 chars | Business case |
| Who benefits? | `<input>` | Yes | Min 3 chars | Persona/user group |
| High-level user flow | `<textarea>` rows=4 | No | Max 1000 chars | Free text or numbered |
| Business rules / constraints | `<textarea>` rows=3 | No | Max 800 chars | — |
| Assign to Epic | `<select>` | No | — | Populated from ADO/local Epics |

**CTA:** `Next: Repos & AI →` (disabled until required fields valid)  
**Secondary CTA:** `Cancel` (shows confirm dialog if any field has content)

**Validation behavior:**
- Required fields show inline error below the field on blur (not on initial load)
- Error text: red, `font-size: 0.75rem`, icon `⚠` prefix
- "Next" button stays disabled until all required fields pass

**Edge cases:**
- If ADO is not configured, Epic dropdown shows: `── ADO not connected ──` (disabled option) with tooltip: "Configure ADO in Settings to assign to an Epic"
- If no Epics exist in ADO, shows: `── No Epics found in ADO ──` + ghost link `+ Create a new Epic`

---

### Step 2 — Repos & AI Context

**Purpose:** Select repos to give the AI meaningful context for story generation.  
**Key UX rule:** Multi-repo selection must be fast and easy. The user has many repos.

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 4 — Repos & AI Context                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Select repos for AI context                                    │
│  AI will scan these repos to generate stories that match your   │
│  actual codebase structure.                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍  Search repos...                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑  payment-gateway          C:/repos/payment-gateway    │   │
│  │ ☑  frontend-checkout        C:/repos/frontend-checkout  │   │
│  │ ☐  auth-service             C:/repos/auth-service       │   │
│  │ ☐  reporting-api            C:/repos/reporting-api      │   │
│  │ ☐  notifications-worker     C:/repos/notif-worker       │   │
│  │ ☐  admin-portal             C:/repos/admin-portal       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  2 selected · [Select all] [Clear all]                          │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│  AI generation options                                          │
│                                                                 │
│  Suggested story count   [  5  ▲▼]  (2–15)                     │
│  ✨ Tip: Start with 5–7 stories. You can add more in review.    │
│                                                                 │
│  Assign iteration (optional)                        ▼           │
│  ┌─────────────────────────────────────────────────┐           │
│  │  ── No iteration ──                             │           │
│  │  Project\Sprint 1                               │           │
│  │  Project\Sprint 2                               │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│          [ ← Back ]   [ Cancel ]   [ ✨ Generate Stories → ]   │
└─────────────────────────────────────────────────────────────────┘
```

**Repo list behavior:**
- List is populated from `linkTargets` (same source as PBI Studio / BulkBreakdown)
- Each row shows: checkbox + repo name (bold) + local path (muted, truncated at 40 chars with ellipsis)
- Search filters by repo name AND path (case-insensitive, live as you type)
- No repos selected = 0 repos shown = no context (AI will still work but with less accuracy)
- Tooltip on row: shows full path on hover

**Selection controls:**
- `Select all` / `Clear all` are ghost buttons, right-aligned
- Count badge updates live: `N selected`

**AI options:**
- Story count: `<input type="number">` with up/down stepper, min=2, max=15
- Iteration: same dropdown logic as existing BulkBreakdownView

**CTA:** `✨ Generate Stories →`  
- Disabled if: aiBusy is true  
- Does NOT require repos to be selected (repos = context, not requirement)  
- Shows confirm if no repos selected: "No repos selected — AI will generate stories without codebase context. Continue?" [Generate anyway] [Go back]

**Edge cases:**
- No projects imported: show inline banner "No repos imported yet. [Import a project →] in Projects view. You can still generate stories without codebase context."
- Search yields no results: "No repos match '{query}'" with [Clear search] link

---

### Step 3 — AI Breakdown (Generating State)

**Purpose:** Visual feedback while AI generates User Stories. This step is entirely AI-driven.

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 4 — AI Breakdown                                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │   ✨  Generating…   │                      │
│                    │                     │                      │
│                    │  Analyzing repos    │                      │
│                    │  and crafting       │                      │
│                    │  User Stories for:  │                      │
│                    │                     │                      │
│                    │  "Guest Checkout —  │                      │
│                    │   Card on File"     │                      │
│                    │                     │                      │
│                    │  ████████░░░░  60%  │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│  This usually takes 10–20 seconds.                              │
│                                                                 │
│                          [ Cancel generation ]                  │
└─────────────────────────────────────────────────────────────────┘
```

**States during generation:**

| Phase | Progress | Message |
|---|---|---|
| Starting | 0–10% | "Preparing context…" |
| Scanning repos | 10–40% | "Scanning selected repos…" |
| Generating | 40–85% | "Crafting User Stories…" |
| Finishing | 85–100% | "Almost there…" |

**Progress bar:** Reuse existing `<LoadingBar>` component. Animate smoothly. If backend provides no granular progress, animate from 0% → 80% over 15s, then hold until complete.

**"Cancel generation" CTA:**
- Ghost/danger button
- Sends `CANCEL_AI_GENERATION` message to extension
- On cancel: returns user to Step 2 with all field values preserved and no confirmation needed

**On success:** Automatically transitions to Step 4 (Review) with a subtle fade-in. **Do not require user to click "Next"** — the transition is automatic and immediate.

**On error:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 4 — AI Breakdown                                     │
│                                                                 │
│          ⚠  Generation failed                                   │
│          Copilot couldn't connect or timed out.                 │
│          Error: {error message}                                  │
│                                                                 │
│                   [ ← Try again ]  [ Edit details ]            │
└─────────────────────────────────────────────────────────────────┘
```
- "Try again" = retriggers generation with same inputs
- "Edit details" = returns to Step 1

---

### Step 4 — Review & Push

**Purpose:** Quick review of generated stories before pushing to ADO. Inline editing of title and effort ONLY. Deep editing redirected to PBI Studio.

> This step is covered in full detail in Section 3 below.

**CTAs at bottom:**
```
[ ← Back to Repos ]  [ Save as Drafts ]  [ 🚀 Push to ADO ]
```

- "Save as Drafts" — saves Feature + Stories to local draft storage, navigates to PBI Studio
- "Push to ADO" — pushes Feature (parent) + all checked User Stories as ADO work items
- "Back to Repos" — returns to Step 2; generated stories are preserved (user doesn't lose work)

---

## 3. Generated User Story Review UX

This is the content of **Step 4** in the wizard.

### Layout

Stories are displayed as a **vertical list of compact cards** — not a table. Cards allow inline editing without a modal, and they visually map to "work items."

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 4 of 4 — Review & Push                                    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ✅ 6 User Stories generated for                                │
│     "Guest Checkout — Card on File"                             │
│                                                                 │
│  Review titles and effort. For detailed editing, open in PBI    │
│  Studio. Uncheck stories you don't want to push.               │
│                                                                 │
│  ┌─ Story card (checked, normal state) ───────────────────────┐ │
│  │  ☑  ⠿  [1] As a guest, I want to enter card details…      │ │
│  │         ┌─────────────────────────────────────┐            │ │
│  │         │ As a guest, I want to enter card   │            │ │
│  │         │ details at checkout so that I can   │            │ │
│  │         │ pay without creating an account.    │            │ │
│  │         └─────────────────────────────────────┘            │ │
│  │         Effort: [ 3 ▲▼ ]  pts                               │ │
│  │         [✏ Edit in PBI Studio]                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Story card (unchecked, excluded) ────────────────────────┐  │
│  │  ☐  ⠿  [2] As a guest, I want to see a payment confirm…   │  │
│  │         (excluded from push)                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Story card (being edited) ────────────────────────────────┐  │
│  │  ☑  ⠿  [3] ┌─────────────────────────────────────────┐   │  │
│  │            │ As a guest, I want a one-click repay  █  │   │  │
│  │            └─────────────────────────────────────────┘   │  │
│  │            Effort: [ 5 ▲▼ ]  pts                           │  │
│  │            [✏ Edit in PBI Studio]                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [+ Add story]    6 of 6 selected                               │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│  Feature parent                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦  Guest Checkout — Card on File                      │   │
│  │  Will be created as ADO Feature type                    │   │
│  │  Iteration: Project\Sprint 2  [change]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ ← Back to Repos ]  [ Save as Drafts ]  [ 🚀 Push to ADO ]   │
└─────────────────────────────────────────────────────────────────┘
```

### Story Card States

**Checked (included in push):**
- Full opacity
- Checkbox = checked
- Title is an inline `<textarea>` (auto-resize, 1–3 rows)
- Effort is a `<input type="number">` spinner (1–13, Fibonacci-friendly)
- Drag handle `⠿` visible for reordering

**Unchecked (excluded from push):**
- Opacity: 60%
- Card background: slightly muted
- Title shows as plain text (no textarea — not editable in excluded state)
- Tooltip: "Unchecked stories won't be pushed to ADO"

**Being edited (title focused):**
- Thin `--accent` border on the textarea
- Character counter visible: `{n}/200`

### Inline Editable Fields

| Field | Control | Behavior |
|---|---|---|
| Title | `<textarea>` auto-resize | Single-line by default, expands up to 3 rows; max 200 chars |
| Effort | `<input type="number">` | Spinner, values: 1, 2, 3, 5, 8, 13 (Fibonacci). Default = 3 |

**What is NOT editable inline:** description, acceptance criteria, test cases, technical details, INVEST score. These require PBI Studio.

### "Edit in PBI Studio" CTA

- Ghost button, small, below effort field on each card
- Label: `✏ Edit in PBI Studio`
- Behavior: If story is a saved draft → navigates to PBI Studio and opens that draft. If story has not been saved yet → saves as draft first, then navigates.
- **When user is mid-push (ADO push in progress):** button is disabled
- Tooltip: "Open this story in PBI Studio for full editing (acceptance criteria, test cases, INVEST scoring)"

### Add / Remove / Reorder Stories

**Add story:**
- `[+ Add story]` ghost button below the list
- Clicking adds a new empty card at the bottom:
  ```
  ┌─ New story ────────────────────────────────────────────────┐
  │  ☑  ⠿  ┌───────────────────────────────────────────────┐  │
  │         │ As a [who], I want [what] so that [why]   █   │  │
  │         └───────────────────────────────────────────────┘  │
  │         Effort: [ 3 ▲▼ ]  pts                               │
  │         [✏ Edit in PBI Studio]                              │
  └────────────────────────────────────────────────────────────┘
  ```
- Placeholder text is the standard "As a [who]…" story template
- New card auto-focuses the title textarea

**Remove story:**
- Each checked card has a `✕` icon in the top-right corner (visible on card hover / focus-within)
- Clicking `✕` shows inline confirmation: `[Remove?] [Yes, remove] [Keep]` — inline, not a modal
- Unchecking the checkbox is a soft "exclude from push" — card stays visible but greyed
- Hard removing (✕) deletes it from the list entirely

**Reorder:**
- Drag handle `⠿` (left side of card) enables drag-and-drop reordering
- Visual: on drag, card lifts with shadow; drop target shows accent border
- Keyboard alternative: up/down arrow buttons visible on card hover (next to drag handle)
- Story numbers `[1]`, `[2]`… update live as order changes

### Selection Count

`N of M selected` shown below the list. Updates live.  
When 0 selected: warning banner appears inline:
```
⚠ No stories selected — Push to ADO will only create the Feature parent.
```

### Push to ADO Loading State

When push is in progress, the entire review list enters a read-only, busy state:
- All inputs disabled
- Overlay `LoadingBar` at top of step
- Each successfully pushed story shows a `✓ Pushed #1234` chip
- Failed stories show `⚠ Failed` chip with tooltip showing error
- On complete: show success banner:
  ```
  ✅ Feature and 6 User Stories pushed to ADO
  [View in ADO ↗]  [Done — back to Dashboard]
  ```

---

## 4. Epic View UX

### Sidebar Entry

New view: **Epics** added to sidebar. See Section 6 for nav order.

### Layout

The Epics view is a **collapsible tree** — the same expand/collapse pattern already used for sections in PBI Studio (`.section-header` with rotating chevron).

```
┌─────────────────────────────────────────────────────────────────┐
│  Epics                                              [+ New Epic]│
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ▼  Q2 2026 — Guest Experience Initiative          [⬆ Push All] │
│  │  Status: 🔵 In Progress  ·  3 Features  ·  12 Stories        │
│  │                                                              │
│  │  ▼  Guest Checkout — Card on File              [⬆ Push]      │
│  │  │  Status: 🟡 Draft  ·  6 Stories                           │
│  │  │  ├  ☑  As a guest, I want to enter card details…  [Draft] │
│  │  │  ├  ☑  As a guest, I want to confirm payment…     [Draft] │
│  │  │  ├  ☑  As a guest, I want a receipt emailed…    [Pushed ✓]│
│  │  │  └  [+ Add story]                                         │
│  │  │                                                           │
│  │  ▶  Guest Profile — Saved Addresses            [⬆ Push]      │
│  │     Status: 🟢 Ready  ·  4 Stories                           │
│  │                                                              │
│  │  ▶  Payment History View                        [⬆ Push]     │
│  │     Status: 🔵 In Progress  ·  2 Stories                     │
│  │                                                              │
│  ▶  Q3 2026 — Payment Modernization               [⬆ Push All]  │
│     Status: ⚪ Draft  ·  1 Feature  ·  3 Stories                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ⚪ No Epic  (standalone Features)                              │
│  ▶  Legacy Checkout Migration                     [⬆ Push]      │
│     Status: 🟡 Draft  ·  5 Stories                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tree Levels

**Level 1 — Epic row:**
- `▼/▶` toggle (chevron, CSS transform rotate)
- Epic title (bold)
- `[⬆ Push All]` button — pushes Epic work item + all children that haven't been pushed
- Status badge (see Status Indicators below)
- Summary line: `N Features · M Stories`

**Level 2 — Feature row (indented 16px):**
- `▼/▶` toggle
- Feature title
- `[⬆ Push]` button — pushes Feature + its User Stories
- Status badge
- Summary line: `N Stories`

**Level 3 — User Story row (indented 32px):**
- No toggle (leaf node)
- `☑/☐` checkbox — include/exclude from next push
- Story title (truncated at 60 chars with full title in tooltip)
- Status chip: `[Draft]` | `[Pushed ✓ #1234]`
- Clicking a story title → navigates to PBI Studio, opens that draft

**"+ Add story" under a Feature:**
- Ghost link below the last story of an expanded Feature
- Clicking → opens PBI Studio with a new empty draft pre-linked to this Feature

### Status Indicators

| Status | Color | Dot | When |
|---|---|---|---|
| Draft | Yellow `🟡` | `--color-warning` | Has unpushed items |
| Ready | Green `🟢` | `--color-success` | All items pushed to ADO |
| In Progress | Blue `🔵` | `--accent` | Mix of pushed and unpushed |
| Empty | Grey `⚪` | `--color-neutral-400` | No children yet |

Status rolls up: Feature status = derived from its stories' statuses. Epic status = derived from its features' statuses.

### Create New Epic

**`[+ New Epic]`** button (top-right of the view):

Clicking shows an **inline form** at the top of the list (not a modal):

```
┌─────────────────────────────────────────────────────────────────┐
│  New Epic                                           [✕ Cancel]  │
│  ─────────────────────────────────────────────────────────────  │
│  Title *                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Q3 2026 — Payment Modernization                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Description (optional)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              [ Cancel ]  [ Create Epic ]        │
└─────────────────────────────────────────────────────────────────┘
```

- Inline form slides in above the list (CSS transition, no page jump)
- Requires: Title (min 3 chars)
- Optional: Description
- On create: Epic added to top of list, expanded by default
- "Create Epic" does NOT push to ADO — it creates a local draft Epic. ADO push happens separately via `[⬆ Push All]`

### ADO Push for Epic

`[⬆ Push All]` on an Epic:
1. Creates ADO **Epic** work item
2. Creates all child **Feature** work items (linked to Epic)
3. Creates all child **User Story** work items (linked to Features)
4. Only creates items not already pushed (idempotent)
5. Shows inline LoadingBar on the row being pushed
6. On complete: status badges update live; `[View in ADO ↗]` link appears

If some items fail: error chips on failed rows; Epic-level `⚠ N failed` badge. Successful items are not re-pushed on retry.

### Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Epics                                              [+ New Epic]│
│                                                                 │
│          📋  No Epics yet                                       │
│                                                                 │
│          Group your Features into Epics to track               │
│          larger initiatives.                                    │
│                                                                 │
│          [+ Create your first Epic]                             │
│          or assign an Epic when creating a Feature.             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboard Changes

### Philosophy

The Dashboard should answer one question: **"Where does my work stand right now?"**

The KPI grid (Projects / Drafts / Pushed / ADO) is developer-metrics, not Product Owner-metrics. A PO cares about: *What Epics am I working on? What Features are in progress? What's ready to push?*

### Recommended Changes

**REMOVE:**
- ❌ KPI grid (`section.kpi-grid` — all 4 cards) — Projects count, Drafts count, Pushed count, ADO Ready status are low-signal for a PO
- ❌ "Get Started" card — once you've used the tool once, this is noise. Replace with a first-run pattern (only show when 0 projects AND 0 drafts)
- ❌ "Recent Drafts" card — subsumed by the new hierarchy section

**KEEP / MODIFY:**
- ✅ ADO connection status — but move it to the top of the page as a subtle banner (not a KPI card)

**ADD:**
- ✅ Epic → Feature → Story hierarchy section (primary content)
- ✅ Quick Actions section (compact, replaces "Get Started")

### New Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                                      │
│                                                                 │
│  ⚠ ADO not connected — [Configure in Settings →]               │  ← Conditional banner (dismissible)
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Work Hierarchy                   [Expand all] [Collapse all]   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ▼  Q2 2026 — Guest Experience Initiative     🔵 In Progress   │
│  │  ▶  Guest Checkout — Card on File          🟡 Draft         │
│  │  ▶  Guest Profile — Saved Addresses        🟢 Ready         │
│                                                                 │
│  ▶  Q3 2026 — Payment Modernization           ⚪ Draft         │
│                                                                 │
│  ▶  ⚪ Standalone Features (3)                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Quick Actions                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  ✦ Create Feature    │  │  ✎ Open PBI Studio   │            │
│  │  Break down a new    │  │  Edit or refine       │            │
│  │  feature with AI     │  │  existing stories     │            │
│  └──────────────────────┘  └──────────────────────┘            │
│  ┌──────────────────────┐                                       │
│  │  📁 Import Project   │                                       │
│  │  Add a repo to scan  │                                       │
│  └──────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Work Hierarchy Section Details

- **Same tree rendering** as the Epics view (shared component: `<WorkHierarchyTree>`)
- Default state: top-level Epics expanded, Features collapsed (one level visible by default)
- "Expand all" / "Collapse all" toggle buttons (top-right of section)
- Clicking an Epic title → navigates to Epics view
- Clicking a Feature title → navigates to Epics view (with that Feature's Epic expanded)
- Clicking a Story title → navigates to PBI Studio
- **No push buttons on dashboard** — dashboard is read-only. Navigate to Epics view to push.

### First-Run State (0 projects AND 0 drafts)

Replace the hierarchy section with:

```
┌─────────────────────────────────────────────────────────────────┐
│  Work Hierarchy                                                 │
│                                                                 │
│      👋  Welcome to PO Pro Tools                                │
│                                                                 │
│      1. [Import a project →]  to scan a local repo              │
│      2. [Create a Feature →]  to capture and break down         │
│         your first feature with AI                              │
│      3. Configure ADO in [Settings →] and push!                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Show this only when: `projects.length === 0 && pbiDrafts.length === 0`

### Quick Actions Section

Compact, 2–3 card row. Each card:
- Icon + title + 1-line description
- Clicking navigates to that view
- Cards: Feature Creation, PBI Studio, Import Project (Settings removed — only shown in first-run)

---

## 6. Navigation Order

**Current nav:**
```
▣  Dashboard
❏  Projects
✎  PBI Studio
≡  Feature Creation
⬆  RDIs
⚙  Settings
```

**Recommended nav (with Epics):**

```
▣  Dashboard        — Overview, hierarchy at a glance
◈  Epics            — Manage Epic → Feature → Story hierarchy
✦  Feature Creation — Create + AI-break a new Feature
✎  PBI Studio       — Deep-edit individual User Stories
❏  Projects         — Import & scan repos
⬆  RDIs             — Release Deployment Items
⚙  Settings         — ADO configuration
```

**Rationale:**
1. **Dashboard first** — always home base
2. **Epics second** — the user's primary work hierarchy view
3. **Feature Creation third** — primary creation action (most frequent new work)
4. **PBI Studio fourth** — editing existing work (secondary action)
5. **Projects fifth** — less frequent (set up once, revisit occasionally)
6. **RDIs sixth** — specialized, less frequent
7. **Settings last** — configure once

**ViewId changes needed:**
- Add: `'epics'` to `ViewId` union type in `Sidebar.tsx`
- Rename: `'bulk'` → `'features'` (the view is no longer just "bulk" — it's Feature Creation)
- Update `App.tsx` / `DashboardView.tsx` navigation references accordingly

**Icon suggestions (Unicode, consistent with current icon style):**
- Epics: `◈` (layered/hierarchy feel)
- Feature Creation: `✦` (sparkle/creation)

---

## 7. Accessibility Notes

### Keyboard Navigation

**Wizard (Feature Creation):**
- All steps navigable with `Tab` / `Shift+Tab`
- `Enter` on "Generate Stories" / "Next" triggers primary CTA (not just Space)
- `Escape` on Cancel shows confirm dialog; `Escape` on confirm dialog dismisses it
- Step progress rail is `aria-label="Step N of 4: {StepName}"` on the active dot; completed steps `aria-label="{StepName}: complete"`
- On step transition: focus moves to the new step's first focusable element (use `useEffect` + `ref.current.focus()`)

**Repo selection (Step 2):**
- Search input: `role="searchbox"` with `aria-label="Search repos"`
- List: `role="list"` with each row as `role="listitem"`
- Each checkbox row: standard `<label>` wrapping `<input type="checkbox">` — no ARIA hacks needed
- `[Select all]` button: `aria-label="Select all repos"` with `aria-pressed` state

**AI Generation (Step 3):**
- Loading state: `aria-live="polite"` region announces "Generating User Stories for '{title}'…"
- On success: announces "User Stories generated. Reviewing now."
- On error: `aria-live="assertive"` — "Generation failed. {error message}. Press Tab to try again."

**Review step (Step 4):**
- Story list: `role="list"`, each card `role="listitem"` with `aria-label="Story N: {title truncated}"`
- Drag handles: `aria-label="Drag to reorder story N"` + keyboard arrow button fallback
- Checkbox on each card: `aria-label="Include story N in push: {title}"`
- Effort input: `aria-label="Story N effort in story points"`
- "Edit in PBI Studio": `aria-label="Edit story N in PBI Studio"` (avoids ambiguous "Edit" label)

**Epics view tree:**
- Tree container: `role="tree"` with `aria-label="Work hierarchy"`
- Epic rows: `role="treeitem"` with `aria-expanded="true/false"` and `aria-level="1"`
- Feature rows: `role="treeitem"` with `aria-level="2"`
- Story rows: `role="treeitem"` with `aria-level="3"` and `aria-selected` matching checkbox state
- Keyboard: `ArrowDown/Up` navigate between tree items; `ArrowRight/Left` expand/collapse; `Enter` triggers primary action (navigate to PBI Studio for stories)

### Color and Contrast

- Status dots/badges: never use color alone — always pair with text label (`🟡 Draft`, not just a dot)
- Disabled states: minimum 3:1 contrast ratio maintained (VS Code theme compliant)
- Focus rings: `outline: 2px solid var(--vscode-focusBorder)` — do not suppress
- Error text: red + icon (`⚠`) — not color alone

### Screen Reader Announcements

Use a visually-hidden `<div aria-live="polite" aria-atomic="true">` (same pattern as existing `FeatureWizard` `announcementRef`) for:
- Step transitions in the wizard
- Repo selection count changes ("2 repos selected")
- Story add/remove actions ("Story added", "Story removed — 5 stories remaining")
- Push completion ("Feature and 6 User Stories pushed to ADO")

### Focus Management

- When wizard transitions to Step 4 (auto after AI generation): focus moves to the `<h2>` or first story card
- When "Edit in PBI Studio" is clicked: VS Code handles the navigation; no special focus management needed
- When a story card is removed: focus moves to the "Add story" button (or the next card if one exists)
- Modal/inline confirm dialogs: focus trapped inside confirm; Escape dismisses

### ARIA Roles Summary

| Component | role | Notes |
|---|---|---|
| Wizard container | `main` | One `main` per page |
| Progress rail | `progressbar` (on active step) | `aria-valuenow`, `aria-valuemax` |
| Step announcer | `status` | `aria-live="polite"` |
| Repo search | `searchbox` | — |
| Repo list | `list` + `listitem` | — |
| Story review list | `list` + `listitem` | — |
| Epic tree | `tree` + `treeitem` | Per WAI-ARIA tree pattern |
| Loading state | `status` + `aria-live="polite"` | — |
| Error state | `alert` + `aria-live="assertive"` | — |

---

## 8. Component Tokens & Reuse

### Reuse Existing Patterns

| New Element | Reuse From |
|---|---|
| Wizard progress rail | `UserStoryWizard` `.wizard-progress` / `.wizard-step-dot` |
| Card shell | `.card` (normalized tokens from issue #36 fix) |
| Loading bar during generation | `<LoadingBar>` component |
| Collapsible rows (Epics tree) | `.section-header` + chevron pattern from PBI Studio |
| Status chips | `.chip.success` / `.chip.info` / `.chip.warning` |
| Inline error text | `.hint` with error color override |
| Ghost buttons | `.btn.btn-ghost` / `.btn.btn-ghost.btn-sm` |
| Primary CTA | `.btn.btn-primary` |
| Search input | Extend `<SearchableDropdown>` pattern or new standalone `<SearchInput>` |
| Drag-reorder | New: `react-beautiful-dnd` or native HTML5 drag-and-drop |

### New CSS Tokens Needed

```css
/* Story card — review step */
.story-card { ... }                   /* extends .card */
.story-card--excluded { opacity: 0.6; } /* unchecked state */
.story-card__drag-handle { ... }
.story-card__remove-btn { ... }       /* visible on :hover / :focus-within */

/* Epic tree */
.epic-tree { ... }
.epic-tree__row { ... }               /* all levels */
.epic-tree__row--level-1 { ... }      /* Epic */
.epic-tree__row--level-2 { padding-left: var(--space-4); }  /* Feature */
.epic-tree__row--level-3 { padding-left: var(--space-6); }  /* Story */

/* Status dot */
.status-dot { ... }
.status-dot--draft { color: var(--color-warning); }
.status-dot--ready { color: var(--color-success); }
.status-dot--in-progress { color: var(--accent); }
.status-dot--empty { color: var(--color-neutral-400); }
```

### Message Types Needed (for Linus)

```typescript
// New WebviewRequest types needed for Feature Creation
'FEATURE_WIZARD_GENERATE_STORIES'   // Step 3: trigger AI generation
'FEATURE_WIZARD_SAVE_DRAFTS'        // Step 4: save as local drafts
'FEATURE_WIZARD_PUSH_TO_ADO'        // Step 4: push Feature + Stories

// New WebviewRequest types for Epics
'EPIC_CREATE'                       // Create new Epic locally
'EPIC_PUSH_ALL'                     // Push Epic + all children to ADO
'EPIC_LIST_LOAD'                    // Load Epics tree from state

// New ExtensionEvent types
'FEATURE_STORIES_GENERATED'         // Stories ready (auto-advance to Step 4)
'FEATURE_STORIES_GENERATION_ERROR'  // AI failed
'EPIC_PUSH_PROGRESS'                // Per-item push progress
```

---

*End of spec. Questions or iteration requests → ping Tess in the squad channel.*
