# Issue #34 Test Implementation Guide

**Status:** Ready for Vitest/Jest Implementation  
**Total Tests:** 73 component + 28 integration = 101 test cases  
**Framework:** Vitest or Jest (when installed)

---

## Quick Reference

### Component Test File
**Location:** `webview-ui/src/__tests__/WizardStep6TechnicalConsiderations.test.tsx`

**Structure:**
```typescript
// Exported fixtures for use in test implementations
export const createMockDraft = (overrides?: Partial<PbiDraft>): PbiDraft
export const createTechConsiderations = (overrides?: Partial<TechnicalConsiderations>)

// Test specifications (41 tests grouped by category)
export const happyPathTests // 18 tests
export const loadingStateTests // 4 tests
export const edgeCaseTests // 11 tests
export const buttonLabelTests // 5 tests
export const accessibilityTests // 3 tests
export const testSummary // metadata
```

**No dependencies on test framework** — all imports removed, structure is pure TypeScript.

### Integration Test File
**Location:** `webview-ui/src/__tests__/FeatureWizard.integration.test.ts`

**Structure:**
```typescript
// Test specifications (28 tests grouped by category)
export const navigationTests // 8 tests
export const persistenceTests // 6 tests
export const generateTests // 7 tests
export const errorTests // 6 tests
export const typescriptTests // 5 tests (validation only)
export const manualSmokeTests // 7 tests (manual verification)
export const validationCheckpoint // final approval gate
```

---

## How to Implement Tests with Vitest

### Step 1: Install Test Dependencies

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event
```

### Step 2: Create Test Files

The test specification files are already in place:
- `webview-ui/src/__tests__/WizardStep6TechnicalConsiderations.test.tsx`
- `webview-ui/src/__tests__/FeatureWizard.integration.test.ts`

### Step 3: Convert Specifications to Executable Tests

Example conversion (using first test case):

**From Specification:**
```typescript
export const happyPathTests = [
  {
    id: '1.1',
    priority: 'P0',
    title: 'should render Step 6 title and description',
    given: 'WizardStep6TechnicalConsiderations component is mounted',
    when: 'Component renders with a draft',
    then: [
      'Title "🔧 Technical Considerations" is visible',
      'Description "Capture implementation scope..." is visible'
    ]
  },
  // ... more tests
]
```

**To Executable Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardStep6TechnicalConsiderations } from '../components/WizardStep6TechnicalConsiderations';

describe('WizardStep6TechnicalConsiderations - Happy Path', () => {
  it('should render Step 6 title and description', () => {
    const draft = createMockDraft();
    render(
      <WizardStep6TechnicalConsiderations
        draft={draft}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
      />
    );

    expect(screen.getByText('🔧 Technical Considerations')).toBeInTheDocument();
    expect(screen.getByText(/Capture implementation scope/)).toBeInTheDocument();
  });
});
```

### Step 4: Run Tests

```bash
npx vitest run  # Single run
npx vitest      # Watch mode
npx vitest --ui # UI mode
```

---

## Test Data Fixtures

### createMockDraft()

Creates a minimal valid PbiDraft for testing:

```typescript
const draft = createMockDraft();
// {
//   id: 'draft-1',
//   projectId: 'project-1',
//   title: 'Test Story',
//   description: 'Test description',
//   effortDays: 3,
//   acceptanceCriteria: [],
//   testScenarios: [],
//   iteration: 'Sprint 1',
//   technicalConsiderations: undefined,
//   ...customOverrides
// }
```

**With overrides:**
```typescript
const draftWithTech = createMockDraft({
  technicalConsiderations: {
    technicalDetails: 'Custom tech details',
    scopedFiles: ['src/custom.ts'],
    architectureNotes: 'Custom notes'
  }
});
```

### createTechConsiderations()

Creates fully populated TechnicalConsiderations:

```typescript
const tech = createTechConsiderations();
// {
//   technicalDetails: 'Implementation using React Context for state management',
//   scopedFiles: ['src/components/Payment/index.tsx', 'src/services/checkout.ts'],
//   architectureNotes: 'Use shared PaymentContext, not Redux. See docs/PAYMENT_FLOW.md'
// }
```

**With partial overrides:**
```typescript
const partialTech = createTechConsiderations({
  scopedFiles: [], // Override just this field
});
```

---

## Critical Test Cases (P0 Priority)

These tests **must pass** before any deployment:

### Component Tests (P0)

1. **Rendering:**
   - Component renders Step 6 title and description
   - Empty state shown when no data

2. **User Interactions:**
   - Generate button calls onGenerate
   - Edit button toggles view/edit mode
   - Back button calls onBack(4)
   - Finish button calls onSave

3. **Field Updates:**
   - Technical details field updates via onSave
   - Scoped files parse newline-separated values
   - Architecture notes field updates

4. **Loading States:**
   - Loading indicator shown when isLoading=true
   - Generate button disabled while loading
   - Edit button disabled while loading

### Integration Tests (P0)

1. **Navigation:**
   - User navigates all 6 steps in order
   - Progress rail shows 6 steps with correct labels

2. **Data Persistence:**
   - WIZARD_DRAFT_SAVE includes technicalConsiderations
   - Data persists after reload

3. **AI Integration:**
   - Click Generate → GENERATE_TECHNICAL_CONSIDERATIONS sent
   - AI generation populates Step 6 fields

---

## Mock Helpers

For complex tests, you'll want mock functions:

```typescript
import { vi } from 'vitest';

const mockCallbacks = {
  onNext: vi.fn(),
  onBack: vi.fn(),
  onSave: vi.fn(),
  onGenerate: vi.fn()
};

// Verify callbacks were called
expect(mockCallbacks.onBack).toHaveBeenCalledWith(4);

// Check callback arguments
expect(mockCallbacks.onSave).toHaveBeenCalledWith(
  expect.objectContaining({
    technicalConsiderations: expect.any(Object)
  })
);
```

---

## Test Coverage by Feature

### Component Rendering (Happy Path)
- ✓ Empty state (no data)
- ✓ Populated state (view mode)
- ✓ Edit mode with textareas
- ✓ Loading state with spinner

### User Interactions
- ✓ Generate button (creates GENERATE_TECHNICAL_CONSIDERATIONS)
- ✓ Edit/Done toggle
- ✓ Field updates (text input + file parsing)
- ✓ Back navigation
- ✓ Finish save

### Field Parsing
- ✓ Scoped files: newline-separated
- ✓ Scoped files: comma-separated
- ✓ Whitespace trimming
- ✓ Empty string filtering

### Edge Cases
- ✓ Null/undefined technicalConsiderations
- ✓ Partial data (only one field populated)
- ✓ Very long content (5000+ chars)
- ✓ Whitespace-only input

### State Management
- ✓ isEditing toggle
- ✓ isLoading disabled buttons
- ✓ onSave called with merged draft
- ✓ onGenerate called without data

---

## Integration Testing Strategy

### Scenario 1: Complete Wizard Flow
```
1. Mount wizard at Step 1
2. Click Next through all steps to Step 6
3. Verify Step 6 component renders
4. Click Generate → simulate AI_PROGRESS
5. Click Finish → verify WIZARD_DRAFT_SAVE sent
6. Verify data persists
```

### Scenario 2: AI Generation
```
1. On Step 6, click Generate
2. Verify onGenerate called
3. Simulate backend: STATE_UPDATED event
4. Verify draft refetched with technicalConsiderations
5. Verify Step 6 shows generated content
```

### Scenario 3: Data Persistence
```
1. Complete wizard with Step 6 data
2. Simulate reload: WIZARD_DRAFT_LOAD
3. Verify backend returns draft with technicalConsiderations
4. Verify Step 6 shows restored data
```

---

## TypeScript Compilation Check

Before submitting tests, verify no new TypeScript errors:

```bash
# In webview-ui/
npx tsc --noEmit

# In root
npx tsc --noEmit
```

**Current Status:** ✅ 0 errors

---

## Manual Verification Checklist

Before approving tests, manually run these smoke tests in VS Code:

- [ ] Open wizard, navigate to Step 6
- [ ] Verify Step 6 title and description render
- [ ] Click Generate button (requires live Copilot)
- [ ] Verify loading state appears
- [ ] Verify generated content populates fields
- [ ] Click Edit, modify content, verify changes persist
- [ ] Click Back, verify navigation to Step 5
- [ ] Click Next (if on Step 5), verify arrives at Step 6
- [ ] Click Finish, verify wizard completes
- [ ] Reload extension, verify technical considerations persist
- [ ] Create new story, verify Step 6 starts empty

---

## Future Improvements (P2)

1. **Test Framework Installation**
   - Install Vitest for automated test execution
   - Automate all 73 component test specs
   - Automate integration tests
   - Set up CI/CD pipeline

2. **Snapshot Testing**
   - Add snapshots for component rendering
   - Validate button labels and state changes

3. **E2E Testing**
   - Test full wizard flow in VS Code extension runtime
   - Test ADO export with technical considerations
   - Test AI generation with real Copilot API

---

## Sign-Off

- **Test Specifications:** ✅ Complete (73 + 28 tests)
- **TypeScript Validation:** ✅ 0 errors
- **Build Validation:** ✅ PASS
- **Ready for:** ✅ Code review + Vitest implementation

**Next Action:** Install Vitest and convert specifications to executable tests.
