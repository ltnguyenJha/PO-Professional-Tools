---
skill: invest-data-flow-fix
category: data-pipeline
author: Linus
last_updated: 2026-04-29
---

# INVEST Wizard Data Flow Fix Pattern

## Problem
INVEST wizard fields (Business Rules, User Story Statement) enter AI prompts but don't persist to drafts → lost on export to ADO.

## Pattern: Three-Layer Capture

### Layer 1: UI Component → Parent Callback
**Location:** `webview-ui/src/components/UserStoryWizard.tsx`

When wizard state changes, invoke callback with all relevant fields:
```typescript
interface Props {
  onSave?: (description: string, userStoryStatement: string, businessRulesAndAssumptions?: string) => void;
}

const saveDescription = (): void => {
  if (complete && onSave) {
    onSave(composedDescription, composedDescription, businessRules.trim() || undefined);
  }
};
```

**Key:** Pass optional fields as trailing arguments with undefined for empty values.

### Layer 2: Container → Draft State
**Location:** `webview-ui/src/views/PbiStudio.tsx`

Receive callback data and merge into working draft:
```typescript
const handleWizardSaveDescription = (
  description: string, 
  userStoryStatement: string, 
  businessRulesAndAssumptions?: string
): void => {
  if (active) {
    setWorking({ ...active, description, userStoryStatement, businessRulesAndAssumptions });
  }
};
```

Add UI fields to allow manual editing:
```typescript
<label className="field">
  User Story Statement (optional)
  <textarea
    value={active.userStoryStatement ?? ''}
    onChange={(e) =>
      setWorking({ ...active, userStoryStatement: e.target.value || undefined })
    }
  />
</label>
```

### Layer 3: AI Integration → Draft Enhancement
**Location:** `src/services/copilotService.ts` + `src/panels/DashboardPanel.ts`

Extend AI suggestion schema to optionally return captured fields:

**System Prompt:**
```typescript
const FULL_STORY_SYSTEM_PROMPT = [
  '...',
  'Schema: { ..., "userStoryStatement"?: string, "businessRulesAndAssumptions"?: string }',
  'USER STORY STATEMENT (optional): If provided in INVEST wizard, reflect back in 1-2 sentences.',
  'BUSINESS RULES & ASSUMPTIONS (optional): If provided, include critical constraints or preconditions.',
  '...'
].join('\n');
```

**Extraction:**
```typescript
private suggestionFromParsed(parsed: Record<string, unknown>): AiSuggestion {
  // ... existing fields ...
  if (typeof parsed.userStoryStatement === 'string' && parsed.userStoryStatement.trim().length > 0) {
    suggestion.userStoryStatement = parsed.userStoryStatement.trim();
  }
  if (typeof parsed.businessRulesAndAssumptions === 'string' && parsed.businessRulesAndAssumptions.trim().length > 0) {
    suggestion.businessRulesAndAssumptions = parsed.businessRulesAndAssumptions.trim();
  }
  return suggestion;
}
```

**Application:**
```typescript
private async handleApplySuggestion(...): Promise<void> {
  const updated: PbiDraft = {
    ...draft,
    // ... existing fields ...
    userStoryStatement: suggestion.userStoryStatement ?? draft.userStoryStatement,
    businessRulesAndAssumptions: suggestion.businessRulesAndAssumptions ?? draft.businessRulesAndAssumptions
  };
  // ...
}
```

## Exports & Validation

### ADO Export
**Location:** `src/services/adoService.ts`

```typescript
const businessRules = draft.businessRulesAndAssumptions?.trim() || '';
const businessRulesValue = businessRules.length > 0 ? businessRules : 'NA';
descriptionParts.push(
  '<h3>Business Rules and Assumptions</h3>',
  `<p>${this.escapeHtml(businessRulesValue)}</p>`
);

if (draft.userStoryStatement) {
  descriptionParts.push(
    '<h3>User Story Statement</h3>',
    `<p>${this.escapeHtml(draft.userStoryStatement)}</p>`
  );
}
```

### Type Extensions
**Required files:**
- `src/shared/messages.ts` — AiSuggestion interface
- `webview-ui/src/types.ts` — AiSuggestion interface (mirror)
- Both include: `userStoryStatement?: string` and `businessRulesAndAssumptions?: string`

## When to Use This Pattern

✅ **Use when:**
- Wizard collects structured data that should flow to AI
- Same data should persist independently of AI generation
- Data needs to be editable in multiple places (wizard, manual field, AI suggestion)
- Data is exported to external systems (ADO, etc.)

❌ **Don't use when:**
- Data is only for UI display (no persistence needed)
- Data is only used in one place (simpler patterns suffice)
- Data doesn't need AI enhancement

## Key Principles

1. **Three-layer capture:** UI → draft → AI → draft export
2. **Optional fields everywhere:** Use `?:` and fallback logic
3. **Callback contracts:** Make them explicit; extend Props interfaces
4. **Extraction defensive:** Always trim, always check types
5. **Export edge cases:** Provide sensible defaults ("NA") for missing data

## Related

- Issue #32: Business Rules export
- Issue #29: User Story Statement capture
- ADO Service: buildFieldPatches()
- CopilotService: generateFromInvestWizard()
