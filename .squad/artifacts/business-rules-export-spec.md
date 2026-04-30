# Business Rules and Assumptions - ADO Export Specification

**Implemented by:** Linus (Backend Dev)  
**Date:** 2025-01-28  
**For Testing by:** Livingston

## Feature Summary

Added support for exporting the "Business Rules and Assumptions" field from PBI wizard to Azure DevOps work items.

## Implementation Details

### 1. Type Changes

**Extension-side (`src/shared/messages.ts`):**
```typescript
export interface PbiDraft {
  // ... existing fields ...
  businessRulesAndAssumptions?: string;
}
```

**Webview-side (`webview-ui/src/types.ts`):**
```typescript
export interface PbiDraft {
  // ... existing fields ...
  businessRulesAndAssumptions?: string;
}
```

### 2. ADO Export Format

**Location in Description:** Immediately after the User Story Statement section

**Format:**
```html
<h3>Business Rules and Assumptions</h3>
<p>{content or "NA"}</p>
```

**Placement Order in ADO Description:**
1. Description (main PBI description)
2. User Story Statement (if present)
3. **Business Rules and Assumptions** ← NEW (always present)
4. Test Scenarios (if present)
5. Technical Considerations (if present)
6. PO Tools Metadata

### 3. Edge Case Handling

| Input Scenario | Expected Output |
|---|---|
| `undefined` | `"NA"` |
| `null` | `"NA"` |
| Empty string `""` | `"NA"` |
| Whitespace only `"   "` | `"NA"` |
| Valid content | Content as-is (HTML escaped) |

**Implementation Logic:**
```typescript
const businessRules = draft.businessRulesAndAssumptions?.trim() || '';
const businessRulesValue = businessRules.length > 0 ? businessRules : 'NA';
descriptionParts.push(
  '<h3>Business Rules and Assumptions</h3>',
  `<p>${this.escapeHtml(businessRulesValue)}</p>`
);
```

## Test Cases for Livingston

### TC1: Business Rules with Content
**Setup:** Create PBI with Business Rules field populated  
**Action:** Export to ADO  
**Expected:** ADO description shows "Business Rules and Assumptions" heading with the entered content (immediately after User Story Statement if present, otherwise after main description)

### TC2: Business Rules Empty → NA Placeholder
**Setup:** Create PBI with Business Rules field empty/undefined  
**Action:** Export to ADO  
**Expected:** ADO description shows "Business Rules and Assumptions: NA"

### TC3: Business Rules Whitespace Only → NA Placeholder
**Setup:** Create PBI with Business Rules field containing only spaces/tabs  
**Action:** Export to ADO  
**Expected:** ADO description shows "Business Rules and Assumptions: NA"

### TC4: Section Ordering Verification
**Setup:** Create PBI with:
- User Story Statement: "As a user..."
- Business Rules: "Must comply with GDPR"
- Test Scenarios: ["Verify login", "Check permissions"]
- Technical Considerations: "Use JWT auth"

**Action:** Export to ADO  
**Expected:** ADO description sections appear in this order:
1. Description
2. User Story Statement
3. Business Rules and Assumptions
4. Test Scenarios
5. Technical Considerations
6. PO Tools Metadata

### TC5: HTML Escaping
**Setup:** Create PBI with Business Rules containing HTML characters: `<script>alert('test')</script>`  
**Action:** Export to ADO  
**Expected:** Characters are properly escaped; ADO shows literal text, not executed HTML

### TC6: Update Existing Work Item
**Setup:** PBI already pushed to ADO, now add/modify Business Rules  
**Action:** Click "Update in ADO"  
**Expected:** ADO work item description updates with new Business Rules content

### TC7: Existing Exports Not Broken
**Setup:** Existing PBI without businessRulesAndAssumptions field  
**Action:** Update in ADO  
**Expected:** Description still exports correctly with "NA" for Business Rules; no errors

## Files Modified

- `src/shared/messages.ts` - Added `businessRulesAndAssumptions?: string` to PbiDraft interface
- `webview-ui/src/types.ts` - Added `businessRulesAndAssumptions?: string` to PbiDraft interface
- `src/services/adoService.ts` - Updated `buildFieldPatches()` to include Business Rules section in description export

## Verification Completed

- ✅ TypeScript compilation: No errors
- ✅ Linting: No new warnings (2 pre-existing warnings unrelated to this change)
- ✅ Type consistency: Extension and webview types match
- ✅ Edge case handling: Empty/null/whitespace → "NA"
- ✅ Export position: Immediately after User Story Statement
- ✅ HTML escaping: Uses existing `escapeHtml()` method
- ✅ Backward compatibility: Optional field, existing exports work

## Notes

- The field is **always exported** (either with content or "NA"), unlike User Story Statement which is conditionally included
- This matches the requirement: "If the field is empty, display 'NA' as a placeholder"
- No changes needed to message handlers - field flows through existing PUSH_PBI_TO_ADO and UPDATE_PBI_IN_ADO paths
- No database schema changes required - field is part of PbiDraft JSON structure
