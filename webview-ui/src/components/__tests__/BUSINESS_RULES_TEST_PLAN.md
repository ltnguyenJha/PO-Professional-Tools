# Business Rules and Assumptions - Test Plan

## Overview

This document accompanies the comprehensive test suite in `BusinessRulesAndAssumptions.test.ts` for the Business Rules and Assumptions feature.

## Feature Summary

The Business Rules and Assumptions feature adds an **optional** step to the User Story Wizard that allows Product Owners to capture business constraints, policies, and assumptions. This data is then included in the ADO export.

### Key Requirements

1. **Wizard Step**: New optional step after "How it will work" 
2. **No Validation**: Field is optional - users can skip without entering data
3. **State Management**: Data persists across navigation
4. **ADO Export**: Exports with "NA" placeholder when empty
5. **Position**: Appears immediately after User Story Statement in ADO description

## Test Coverage

### Total Test Cases: 38

#### By Priority
- **P0 (Blocking)**: 20 tests - Core functionality, must pass before release
- **P1 (High)**: 13 tests - Important features, should pass before release  
- **P2 (Nice-to-have)**: 5 tests - Edge cases, can be addressed post-release

#### By Category
1. **Wizard Step Behavior (9 tests)**
   - Step positioning and rendering
   - Navigation with/without data
   - Optional field behavior
   - UI elements (placeholder, title, description)

2. **State Management (7 tests)**
   - State initialization
   - Data flow through wizard
   - Integration with InvestWizardInput type
   - Callbacks (onGenerate, onOpenInChat)

3. **ADO Export (8 tests)**
   - Export with populated data
   - "NA" placeholder for empty values
   - Whitespace handling
   - HTML escaping and XSS protection
   - Correct section ordering

4. **Edge Cases (6 tests)**
   - Very long content (5000+ characters)
   - Newlines and formatting preservation
   - Unicode characters
   - HTML-like content escaping
   - Rapid navigation

5. **Integration (8 tests)**
   - TypeScript compilation
   - Build success
   - End-to-end data flow
   - Non-breaking changes
   - ADO push/update operations

## Implementation Checklist

### Frontend Changes (webview-ui)

- [ ] **UserStoryWizard.tsx**
  - [ ] Add `businessRules` to STEPS array at index 3
  - [ ] Add `businessRules` state variable: `useState('')`
  - [ ] Add step 3 rendering with textarea (after step 2 "how")
  - [ ] Include `businessRules` in wizard object
  - [ ] Pass `businessRules` to onGenerate and onOpenInChat
  - [ ] Update STEPS.length references (4 → 5)

- [ ] **types.ts**
  - [ ] Add `businessRules?: string` to `InvestWizardInput` interface

### Backend Changes (src)

- [ ] **shared/messages.ts**
  - [ ] Add `businessRulesAndAssumptions?: string` to `PbiDraft` interface ✅ (Already done)
  - [ ] Add `businessRules?: string` to `InvestWizardInput` interface

- [ ] **services/adoService.ts**
  - [ ] Business Rules export logic already implemented ✅
  - [ ] Verify line 322-327 handles empty/whitespace correctly
  - [ ] Verify HTML escaping on line 326

- [ ] **services/copilotService.ts**
  - [ ] Include `businessRules` in AI generation context (optional)

- [ ] **panels/DashboardPanel.ts**
  - [ ] Map `wizard.businessRules` to `draft.businessRulesAndAssumptions` when processing wizard results

## Test Execution Strategy

### Phase 1: Manual Testing (P0 + P1)
Since no test framework is currently configured, execute tests manually:

1. **Wizard Step Tests (P0)**
   - Start User Story Wizard
   - Verify 5 steps appear (not 4)
   - Navigate to step 4 "Business Rules"
   - Verify textarea renders with placeholder
   - Skip step without entering data (verify Next works)
   - Enter data and verify persistence when navigating back

2. **ADO Export Tests (P0)**
   - Create PBI with Business Rules data
   - Push to ADO
   - Verify description includes "Business Rules and Assumptions" section
   - Create PBI without Business Rules data
   - Push to ADO
   - Verify description shows "NA" placeholder

3. **Integration Tests (P0)**
   - Run `npm run build` (must succeed)
   - Run `tsc --noEmit` in root (must succeed)
   - Test complete workflow: wizard → generate → draft → ADO push

### Phase 2: Automated Testing (Future)
Once Vitest/Jest is added to the project:
- Convert test cases to executable unit tests
- Add React Testing Library for component tests
- Mock ADO service for export tests
- Add snapshot tests for rendered HTML

## Known Issues / Pre-existing Errors

### webview-ui TypeScript Errors
The following TypeScript errors exist in webview-ui and are **NOT** related to Business Rules feature:
- `FeatureWizard.tsx`: WIZARD_DRAFT_LOAD, WIZARD_STEP_CHANGE, WIZARD_DRAFT_SAVE message types
- `WizardStep3Story.tsx`, `WizardStep4Details.tsx`: NodeJS.Timeout namespace
- `useAutoSave.ts`: Message type and NodeJS.Timeout issues

These are pre-existing and should be fixed separately.

### Root TypeScript
✅ Root TypeScript (`tsc --noEmit`) passes without errors

## Quality Gates

Before marking feature as "Done":

### Must Pass (P0)
- [ ] All 20 P0 test scenarios verified manually
- [ ] `npm run build` succeeds
- [ ] `tsc --noEmit` (root) succeeds
- [ ] No regressions in existing wizard functionality
- [ ] ADO export includes Business Rules section
- [ ] Empty Business Rules shows "NA" in ADO

### Should Pass (P1)
- [ ] All 13 P1 test scenarios verified manually
- [ ] Dark/light mode render correctly
- [ ] Accessibility: keyboard navigation works
- [ ] Long content (5000+ chars) exports without errors

### Nice to Have (P2)
- [ ] Edge cases with unicode and special characters tested
- [ ] Rapid navigation doesn't lose data
- [ ] HTML escaping prevents XSS

## Test Results Log

Use this section to track test execution:

### Date: _________

| Test ID | Category | Status | Notes |
|---------|----------|--------|-------|
| 1.1 | Wizard | ☐ Pass ☐ Fail | |
| 1.2 | Wizard | ☐ Pass ☐ Fail | |
| ... | ... | ... | |

## Recommendations

1. **Add Test Framework**: Install Vitest + React Testing Library
   - Enables automated regression testing
   - Faster iteration on future features
   
2. **Focus P0 First**: Prioritize 20 blocking tests before release

3. **Document Assumptions**: 
   - Business Rules is optional (no validation)
   - Empty = "NA" in ADO export
   - Appears after User Story Statement

4. **Consider Future Enhancements**:
   - AI-generated business rules suggestions
   - Template library for common rules
   - Multi-line formatting preservation in ADO

## Contact

- **Tester**: Livingston (charter: `.squad/agents/livingston/charter.md`)
- **Test File**: `webview-ui/src/components/__tests__/BusinessRulesAndAssumptions.test.ts`
- **Feature Status**: Test cases complete, awaiting implementation
