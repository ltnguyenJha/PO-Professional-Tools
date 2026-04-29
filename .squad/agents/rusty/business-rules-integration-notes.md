# Business Rules & Assumptions Step - Integration Notes

## Overview
Added a new optional step 4 in the UserStoryWizard flow to capture Business Rules and Assumptions. This step appears after "How it will work" (step 3) and before "User Story" (now step 5).

## Frontend Changes

### 1. UserStoryWizard Component
**File:** `webview-ui/src/components/UserStoryWizard.tsx`

- Added new step to STEPS array at index 3:
  ```typescript
  {
    key: 'businessRules' as const,
    label: 'Business Rules',
    title: 'Business Rules & Assumptions',
    description: 'Define specific criteria, conditions, and preconditions for story completion. (Optional)',
    placeholder: 'e.g. Only users with verified email can access this feature...',
    invest: {
      hint: 'Testable',
      text: 'Clear business rules make acceptance criteria easier to write and help prevent scope creep.',
    },
  }
  ```

- Added state: `const [businessRules, setBusinessRules] = useState('');`
- Step 3 is now Business Rules (optional - no validation required)
- Step 4 is now the User Story template (previously step 3)
- Updated `canNext()` to allow skipping step 3 (always returns true)

### 2. Type Definitions
**Files:** 
- `webview-ui/src/types.ts`
- `src/shared/messages.ts`

Both files already contain:
```typescript
export interface PbiDraft {
  // ... other fields
  businessRulesAndAssumptions?: string;
}
```

✅ Types are already in sync. No changes needed.

## Data Flow

### Current State
The `businessRules` state in UserStoryWizard is local only. It's not currently being saved to the draft.

### What Linus Needs to Do

1. **Update UserStoryWizard props** to include save callback:
   - The component has `onSave?: (description: string, userStoryStatement: string) => void;`
   - This needs to be extended to save businessRules or use a different pattern

2. **Wire up the save logic** when user navigates away from step 3:
   - Capture `businessRules` state value
   - Save to `draft.businessRulesAndAssumptions` field
   - Persist to extension state

3. **Export to ADO**:
   - Include `businessRulesAndAssumptions` field when pushing PBI to Azure DevOps
   - Decide where this content should appear in the ADO work item (likely Description or a custom field)

## UI/UX Details

- **Step Label:** "Business Rules" (in progress indicator)
- **Step Title:** "Business Rules & Assumptions"
- **Optional:** Yes - users can proceed without entering data
- **Input Type:** Textarea (4 rows)
- **Placeholder Text:** Examples of business rules and constraints
- **Help Text:** "This step is optional. Skip if you don't have specific rules or constraints to document."
- **INVEST Hint:** "Testable" - emphasizes that clear rules help with acceptance criteria

## Navigation Flow

1. Background (What is the context?)
2. Why (Why does this matter?)
3. How (How will it work?)
4. **Business Rules & Assumptions** ← NEW STEP (optional)
5. User Story (Write the user story)

## Testing Notes

- ✅ No TypeScript errors in UserStoryWizard
- ✅ Build completes successfully
- ✅ Step can be skipped (no validation blocking)
- ✅ Consistent styling with existing wizard steps
- ⚠️ Data persistence needs backend implementation

## Open Questions for Linus

1. Should `businessRulesAndAssumptions` be included in the INVEST score calculation?
2. Where should this field appear in the ADO work item? (Description? Custom field?)
3. Should we pre-populate this field from existing draft data when wizard loads?
4. Do we want to include this in the AI-generated story context?

---

**Created by:** Rusty (Frontend Dev)
**Date:** 2025-01-24
**Task:** Implement Business Rules & Assumptions Step in PBI Wizard
