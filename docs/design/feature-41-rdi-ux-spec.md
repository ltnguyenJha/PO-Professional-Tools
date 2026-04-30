# Feature 41: RDI Creation Wizard — UX Design Specification

**Author:** Tess (UX Designer)  
**Version:** 1.0  
**Date:** 2026-04-30  
**Status:** Draft  

---

## 1. Overview

### Purpose
Enable developers to create Release Deployment Items (RDIs) in Azure DevOps with a structured, guided wizard experience. RDIs ensure smooth and accurate production deployments by capturing all required information in a consistent format.

### Target Users
- **Primary:** Developers preparing release deployments
- **Secondary:** Release managers reviewing RDI completeness

### Design Goals
1. **Reduce cognitive load** — Guide users through complex RDI requirements step-by-step
2. **Ensure completeness** — Required fields enforced; optional fields clearly marked
3. **Maintain consistency** — Match existing PBI Studio wizard patterns (FeatureWizard)
4. **Enable speed** — Auto-save, smart defaults, and PBI linking reduce manual work
5. **Support accessibility** — Full keyboard navigation, screen reader support, WCAG 2.1 AA

---

## 2. User Flow

### High-Level Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RDI CREATION WIZARD                                │
│                                                                              │
│  ┌─────────┐   ┌──────────────┐   ┌────────────┐   ┌─────────────┐          │
│  │ Step 1  │ → │   Step 2     │ → │  Step 3    │ → │   Step 4    │          │
│  │ Release │   │ Deployment   │   │    PBI     │   │   Review    │          │
│  │ Details │   │   Details    │   │   Links    │   │  & Submit   │          │
│  └─────────┘   └──────────────┘   └────────────┘   └─────────────┘          │
│       │               │                 │                 │                  │
│       ↓               ↓                 ↓                 ↓                  │
│   [Auto-save]    [Auto-save]       [Auto-save]      [Create in ADO]         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Flow

1. **Entry Point**
   - User opens PO Professional Tools panel
   - Clicks "Create RDI" button or uses command palette: `PO Tools: Create RDI`
   - Wizard opens in new webview panel

2. **Step 1: Release Details**
   - User enters release name, version, date
   - Describes changes and applications involved
   - Writes internal and external release notes
   - Documents backout strategy
   - Clicks "Next" to proceed

3. **Step 2: Deployment Details**
   - User enters repository URL(s)
   - Enters build URL(s)
   - Documents manual database changes (if any)
   - Specifies deployment window and environment
   - Clicks "Next" to proceed

4. **Step 3: PBI Links**
   - User searches/selects associated PBIs from Azure DevOps
   - Links display with title, state, and type
   - User can add multiple PBIs or remove existing links
   - Clicks "Next" to proceed

5. **Step 4: Review & Submit**
   - User reviews complete RDI summary
   - Validation results shown (errors/warnings)
   - User clicks "Create in Azure DevOps"
   - Success: Toast notification with link to created RDI
   - Failure: Error message with retry option

---

## 3. Wizard Steps Breakdown

### Step 1: Release Details

**Title:** Release Information  
**Purpose:** Capture the core release metadata, changes, and release notes

#### Fields

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Release Name | Text input | ✅ Required | "e.g., Payment Gateway v2.5.0" | Min 5 chars, max 100 |
| Release Version | Text input | ✅ Required | "e.g., 2.5.0" | Semver pattern recommended |
| Target Release Date | Date picker | ✅ Required | — | Must be future date |
| Changes Summary | Textarea | ✅ Required | "Describe key changes in this release..." | Min 20 chars |
| Applications Involved | Multi-select chips | ✅ Required | "Select or type application names" | At least 1 app |
| Internal Release Notes | Textarea | Optional | "Notes for internal teams (not customer-facing)..." | Max 2000 chars |
| External Release Notes | Textarea | Optional | "Customer-facing release notes..." | Max 2000 chars |
| Backout Strategy | Textarea | ✅ Required | "Describe rollback procedure if deployment fails..." | Min 50 chars |

#### UX Notes
- **Progressive disclosure:** Internal/external release notes collapsed by default, expand on click
- **Auto-save:** Trigger save 500ms after field blur (matches FeatureWizard pattern)
- **Character counter:** Show remaining chars for textareas with limits
- **Applications field:** Combo box allowing selection from predefined list OR custom entry

---

### Step 2: Deployment Details

**Title:** Deployment Configuration  
**Purpose:** Capture technical deployment information

#### Fields

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Repository URLs | Multi-line text or repeater | ✅ Required | "https://github.com/org/repo" | Valid URL format |
| Build URLs | Multi-line text or repeater | ✅ Required | "https://dev.azure.com/org/project/_build/..." | Valid URL format |
| Deployment Environment | Select dropdown | ✅ Required | — | Production, Staging, QA |
| Deployment Window | Time range picker | Optional | "Select start/end time" | End > Start |
| Manual DB Changes Required | Toggle (Yes/No) | ✅ Required | — | Boolean |
| DB Change Scripts | Textarea | Conditional | "Paste SQL scripts or describe changes..." | Required if DB Changes = Yes |
| Pre-deployment Steps | Textarea | Optional | "List any steps to run before deployment..." | Max 1000 chars |
| Post-deployment Steps | Textarea | Optional | "List verification/cleanup steps..." | Max 1000 chars |

#### UX Notes
- **Conditional field:** DB Change Scripts only visible when "Manual DB Changes Required" is Yes
- **URL validation:** Real-time feedback with green check or red X
- **Repeater pattern:** Consider "Add another repository" / "Add another build" buttons for multiple URLs
- **Help text:** Brief descriptions below each field explaining expected content

---

### Step 3: PBI Links

**Title:** Associated Work Items  
**Purpose:** Link related PBIs for traceability

#### Fields

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Search PBIs | Search input | — | "Search by ID or title..." | — |
| Linked PBIs | Selection list | ✅ At least 1 | — | Min 1 PBI linked |

#### UX Notes
- **Search experience:** Debounced search (300ms) against Azure DevOps API
- **Result display:** Show PBI ID, title, type (Epic/Feature/Story/Bug), state, assigned to
- **Selection:** Click to add to linked list, click X to remove
- **Empty state:** "No PBIs linked yet. Search above to find and link work items."
- **Loading state:** Spinner during API search with "Searching..." label
- **Error handling:** "Could not search PBIs. Check your Azure DevOps connection." with retry button

#### Linked PBI Card Display
```
┌────────────────────────────────────────────────────────┐
│ 🎫 #12345 — Payment validation enhancement            │
│ User Story • Active • Assigned: John Doe              │
│                                               [✕]     │
└────────────────────────────────────────────────────────┘
```

---

### Step 4: Review & Submit

**Title:** Review and Create  
**Purpose:** Final validation and submission to Azure DevOps

#### Display Sections

| Section | Content |
|---------|---------|
| Release Summary | Name, version, date, changes summary |
| Deployment Info | Repos, builds, environment, DB changes |
| Release Notes | Internal + external (collapsible) |
| Backout Strategy | Full text display |
| Linked PBIs | List of linked work items |
| Validation Status | Errors (blocking) / Warnings (non-blocking) |

#### Actions

| Button | Behavior |
|--------|----------|
| Back | Return to Step 3 |
| Edit Section | Quick-jump to specific step |
| Create in Azure DevOps | Submit → Loading → Success/Error |

#### UX Notes
- **Read-only display:** All fields shown as styled text, not editable
- **Edit affordance:** Pencil icon next to each section, jumps to corresponding step
- **Validation summary:** Red banner for errors, yellow for warnings
- **Submit flow:**
  1. Click "Create in Azure DevOps"
  2. Button shows spinner + "Creating..."
  3. Success: Green toast "RDI #98765 created successfully!" with "Open in ADO" link
  4. Error: Red toast with error message + "Retry" button

---

## 4. Field Inventory

### 4.1 Main Section: Release Template Details

| Field ID | Label | Type | Required |
|----------|-------|------|----------|
| `releaseName` | Release Name | text | ✅ |
| `releaseVersion` | Release Version | text | ✅ |
| `targetReleaseDate` | Target Release Date | date | ✅ |
| `changesSummary` | Changes Summary | textarea | ✅ |
| `applicationsInvolved` | Applications Involved | multi-select | ✅ |

### 4.2 Deployment Details

| Field ID | Label | Type | Required |
|----------|-------|------|----------|
| `repositoryUrls` | Repository URLs | repeater/textarea | ✅ |
| `buildUrls` | Build URLs | repeater/textarea | ✅ |
| `deploymentEnvironment` | Deployment Environment | select | ✅ |
| `deploymentWindow` | Deployment Window | time-range | Optional |
| `manualDbChanges` | Manual DB Changes Required | toggle | ✅ |
| `dbChangeScripts` | DB Change Scripts | textarea | Conditional |
| `preDeploymentSteps` | Pre-deployment Steps | textarea | Optional |
| `postDeploymentSteps` | Post-deployment Steps | textarea | Optional |

### 4.3 PBI Links Section

| Field ID | Label | Type | Required |
|----------|-------|------|----------|
| `linkedPbis` | Linked PBIs | selection-list | ✅ (min 1) |

### 4.4 Release Notes

| Field ID | Label | Type | Required |
|----------|-------|------|----------|
| `internalReleaseNotes` | Internal Release Notes | textarea | Optional |
| `externalReleaseNotes` | External Release Notes | textarea | Optional |

### 4.5 Backout Strategy

| Field ID | Label | Type | Required |
|----------|-------|------|----------|
| `backoutStrategy` | Backout Strategy | textarea | ✅ |

---

## 5. Accessibility Notes

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous element |
| `Enter` | Activate button, submit form, toggle |
| `Space` | Activate button, check checkbox, toggle |
| `Escape` | Close modal/dialog, cancel operation |
| `Arrow keys` | Navigate within radio groups, dropdowns, progress steps |
| `Ctrl+Enter` | Quick submit (advance to next step) |

### ARIA Implementation

```tsx
// Progress indicator
<div 
  className="wizard-progress" 
  role="progressbar" 
  aria-valuenow={currentStep + 1} 
  aria-valuemin={1} 
  aria-valuemax={4}
  aria-label="RDI creation progress"
>

// Step buttons
<button
  role="tab"
  aria-selected={idx === currentStep}
  aria-label={`Step ${idx + 1}: ${stepName}${completed ? ' (completed)' : ''}`}
>

// Form fields
<label htmlFor="releaseName" className="wizard-field-label">
  Release Name <span aria-label="required">*</span>
</label>
<input
  id="releaseName"
  aria-describedby="releaseName-help releaseName-error"
  aria-invalid={hasError}
  aria-required="true"
/>
<span id="releaseName-help">Enter a descriptive name for this release</span>
<span id="releaseName-error" role="alert">{errorMessage}</span>

// Screen reader announcements
<div 
  className="sr-only" 
  role="status" 
  aria-live="polite"
  aria-atomic="true"
>
  Step 2 of 4: Deployment Configuration
</div>
```

### Focus Management

1. **Step transitions:** Auto-focus first field when entering new step
2. **Error focus:** On validation failure, focus first field with error
3. **Modal focus trap:** When dialogs open, trap focus within dialog
4. **Skip links:** Consider "Skip to main content" for screen reader users
5. **Focus visible:** Ensure clear focus ring on all interactive elements (`--focus-ring`)

### Color Contrast

- All text: Minimum 4.5:1 contrast ratio (AA)
- Large text (18px+): Minimum 3:1 contrast ratio
- Error states: Use `--danger` with sufficient contrast
- Success states: Use `--success` with sufficient contrast
- Don't rely on color alone — use icons + text for status

---

## 6. VS Code Design System Alignment

### CSS Variables (from styles.css)

```css
/* Use existing tokens — DO NOT create new ones */

/* Spacing */
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;

/* Colors */
--bg: /* Background */
--panel: /* Card/panel background */
--ink: /* Primary text */
--ink-muted: /* Secondary text */
--accent: /* Primary actions, highlights */
--danger: /* Errors */
--success: /* Success states */
--warning: /* Warnings */
--line: /* Borders */

/* Effects */
--radius: 10px; /* Cards */
--radius-sm: 6px; /* Inputs */
--shadow-md: /* Elevated cards */
--focus-ring: /* Focus state */
--transition: /* Animations */
```

### Existing Component Classes

Reuse from FeatureWizard/styles.css:

| Class | Usage |
|-------|-------|
| `.wizard-container` | Main wrapper |
| `.wizard-progress` | Progress indicator rail |
| `.wizard-progress-step` | Individual step button |
| `.wizard-progress-step.active` | Current step |
| `.wizard-progress-step.completed` | Finished step |
| `.wizard-step` | Step content wrapper |
| `.wizard-step-header` | Title + description area |
| `.wizard-step-title` | Step heading (h2) |
| `.wizard-step-description` | Step explanatory text |
| `.wizard-field` | Form field wrapper |
| `.wizard-field-label` | Field label |
| `.wizard-field-textarea` | Textarea input |
| `.wizard-actions` | Button container |
| `.wizard-btn` | Base button |
| `.wizard-btn-primary` | Primary action |
| `.wizard-btn-secondary` | Secondary action |
| `.wizard-dialog-overlay` | Modal backdrop |
| `.wizard-dialog` | Modal content |

### New Classes Needed

```css
/* URL repeater field */
.rdi-url-repeater { }
.rdi-url-repeater-item { }
.rdi-url-repeater-add { }

/* PBI search and selection */
.rdi-pbi-search { }
.rdi-pbi-results { }
.rdi-pbi-card { }
.rdi-pbi-card-remove { }

/* Review section */
.rdi-review-section { }
.rdi-review-section-edit { }

/* Validation summary */
.rdi-validation-summary { }
.rdi-validation-error { }
.rdi-validation-warning { }

/* Toggle field */
.rdi-toggle-field { }
.rdi-toggle-switch { }
```

---

## 7. Edge Cases

### 7.1 Empty States

| Scenario | Display |
|----------|---------|
| No PBIs found | "No matching work items found. Try a different search term." |
| No PBIs linked | "No PBIs linked yet. Search above to add related work items." |
| No applications selected | Show placeholder chips: "Select or add applications involved" |

### 7.2 Validation Errors

| Field | Error Condition | Error Message |
|-------|-----------------|---------------|
| Release Name | Empty | "Release name is required" |
| Release Name | < 5 chars | "Release name must be at least 5 characters" |
| Release Version | Empty | "Release version is required" |
| Target Date | Past date | "Target release date must be in the future" |
| Changes Summary | < 20 chars | "Please provide more detail about the changes (min 20 characters)" |
| Applications | None selected | "Select at least one application" |
| Repository URLs | Invalid URL | "Please enter a valid URL (e.g., https://github.com/...)" |
| Build URLs | Invalid URL | "Please enter a valid Azure DevOps build URL" |
| DB Scripts | Empty when required | "Database change scripts are required when manual DB changes is enabled" |
| Backout Strategy | < 50 chars | "Backout strategy must be at least 50 characters to ensure rollback safety" |
| Linked PBIs | None | "Link at least one PBI to this release" |

### 7.3 ADO API Failure

**PBI Search Failure:**
```
┌────────────────────────────────────────────┐
│ ⚠️ Could not search Azure DevOps           │
│                                            │
│ Unable to connect to Azure DevOps.         │
│ Check your network connection and          │
│ verify your ADO credentials are valid.     │
│                                            │
│ [Retry Search] [Open Settings]             │
└────────────────────────────────────────────┘
```

**RDI Creation Failure:**
```
┌────────────────────────────────────────────┐
│ ❌ Failed to create RDI                     │
│                                            │
│ Error: 403 Forbidden — You don't have      │
│ permission to create work items in this    │
│ project.                                   │
│                                            │
│ [Retry] [Open Azure DevOps]                │
└────────────────────────────────────────────┘
```

### 7.4 Loading States

| Context | Display |
|---------|---------|
| Wizard loading | Spinner + "Loading wizard..." (full page) |
| PBI search | Inline spinner + "Searching..." |
| RDI creation | Button spinner + "Creating RDI..." + disabled state |
| Draft saving | Subtle "Saving..." indicator (non-blocking) |

### 7.5 Network/Connection Issues

- **Offline detection:** If `navigator.onLine === false`, show banner: "You're offline. RDI will be saved locally and submitted when connection is restored."
- **Timeout handling:** 30-second timeout on API calls, then show retry option
- **Partial save:** Auto-save draft locally; sync to ADO when possible

### 7.6 Long Content

- **Textarea overflow:** Scrollable with max-height; expand on focus
- **Long PBI titles:** Truncate with ellipsis; show full title on hover (tooltip)
- **Many linked PBIs:** Scrollable list with max-height of ~200px

---

## 8. Component Architecture

### Recommended File Structure

```
webview-ui/src/components/
├── RdiWizard.tsx              # Main wizard container (like FeatureWizard)
├── RdiWizardStep1Release.tsx  # Release details step
├── RdiWizardStep2Deploy.tsx   # Deployment details step
├── RdiWizardStep3Pbis.tsx     # PBI linking step
├── RdiWizardStep4Review.tsx   # Review and submit step
└── rdi/
    ├── UrlRepeater.tsx        # Reusable URL list input
    ├── PbiSearch.tsx          # PBI search component
    ├── PbiCard.tsx            # Linked PBI display card
    ├── ValidationSummary.tsx  # Error/warning display
    └── ReviewSection.tsx      # Collapsible review section
```

### Data Model

```typescript
interface RdiDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Step 1: Release Details
  releaseName: string;
  releaseVersion: string;
  targetReleaseDate: string; // ISO date
  changesSummary: string;
  applicationsInvolved: string[];
  internalReleaseNotes: string;
  externalReleaseNotes: string;
  backoutStrategy: string;
  
  // Step 2: Deployment Details
  repositoryUrls: string[];
  buildUrls: string[];
  deploymentEnvironment: 'Production' | 'Staging' | 'QA';
  deploymentWindowStart?: string; // ISO datetime
  deploymentWindowEnd?: string;
  manualDbChanges: boolean;
  dbChangeScripts: string;
  preDeploymentSteps: string;
  postDeploymentSteps: string;
  
  // Step 3: PBI Links
  linkedPbis: LinkedPbi[];
}

interface LinkedPbi {
  id: string;
  title: string;
  workItemType: 'Epic' | 'Feature' | 'User Story' | 'Bug';
  state: string;
  assignedTo?: string;
}
```

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Wizard completion rate | > 85% | Users who start wizard and successfully create RDI |
| Time to create RDI | < 5 min | Average time from wizard open to ADO creation |
| Validation error rate | < 15% | Submissions with validation errors on first attempt |
| Accessibility compliance | 100% | WCAG 2.1 AA automated + manual audit pass |

---

## 10. Open Questions

1. **Application list:** Should applications be predefined (from ADO project settings) or free-form entry?
2. **PBI types:** Should we allow linking Issues/Tasks in addition to Epics/Features/Stories/Bugs?
3. **Templates:** Should users be able to save/load RDI templates for common release patterns?
4. **Approval workflow:** Does RDI creation need an approval step before ADO submission?
5. **History:** Should we show previous RDIs for reference during creation?

---

## Appendix A: Wireframe Reference

*(Low-fidelity wireframes to be created in design tool)*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PO Professional Tools — Create RDI                                 [X]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ●──────●──────○──────○                                                    │
│   1      2      3      4                                                    │
│ Release Deploy  PBI   Review                                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Release Information                                                        │
│  ─────────────────────                                                      │
│  Enter the core details about this release.                                 │
│                                                                             │
│  Release Name *                                                             │
│  ┌────────────────────────────────────────────┐                            │
│  │ e.g., Payment Gateway v2.5.0               │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                             │
│  Release Version *             Target Release Date *                        │
│  ┌──────────────────┐          ┌──────────────────┐                        │
│  │ e.g., 2.5.0      │          │ 📅 Select date   │                        │
│  └──────────────────┘          └──────────────────┘                        │
│                                                                             │
│  Changes Summary *                                                          │
│  ┌────────────────────────────────────────────┐                            │
│  │ Describe key changes in this release...    │                            │
│  │                                            │                            │
│  │                                            │                            │
│  └────────────────────────────────────────────┘                            │
│                                                   ▼ 20/2000 chars          │
│                                                                             │
│  Applications Involved *                                                    │
│  ┌────────────────────────────────────────────┐                            │
│  │ [API Gateway] [Payment Service] [+]        │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                             │
│  ▸ Release Notes (optional)                                                 │
│  ▸ Backout Strategy *                                                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                          [Back]            [Next →]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*End of UX Design Specification*
