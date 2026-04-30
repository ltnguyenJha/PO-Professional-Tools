/**
 * adoService.test.ts
 *
 * Comprehensive test cases for ADO data export with Business Rules and User Story Statement.
 *
 * Tests validate:
 * - Issue #32: Business Rules from Step 4 populate correctly in ADO (not showing as "NA")
 * - Issue #29: User Story Statement from Step 4 appears above Test Scenarios in ADO
 *
 * Focus areas:
 * - Happy path: Data is included and positioned correctly
 * - Unhappy paths: Empty/whitespace handling, special characters, length limits
 * - ADO API formatting: HTML escaping, patch operations
 * - Edge cases: XSS prevention, newlines, unicode
 *
 * Test Structure: Given/When/Then (implementation-agnostic)
 * These tests are written to validate requirements, not implementation details.
 */

import { PbiDraft, AdoSettings } from '../shared/messages';

/**
 * ============================================================================
 * ISSUE #32: Business Rules Population
 * ============================================================================
 */

export const businessRulesPopulationTests = [
  {
    id: 'BR-001',
    priority: 'P0',
    title: 'Business Rules field populated → ADO description includes business rules section',
    category: 'Happy Path - Data Population',
    given: 'PbiDraft with businessRulesAndAssumptions = "Only US citizens can apply. Max transaction $10,000."',
    when: 'buildFieldPatches is called with draft and settings',
    then: [
      'Generated patch includes /fields/System.Description',
      'Description HTML includes <h3>Business Rules and Assumptions</h3>',
      'Description includes the exact text "Only US citizens can apply. Max transaction $10,000."',
      'Business Rules section appears AFTER User Story Statement section (if present)',
      'Business Rules section appears BEFORE Test Scenarios section'
    ],
    expectedBehavior: 'Issue #32 resolved: Business Rules populate correctly, not "NA"'
  },

  {
    id: 'BR-002',
    priority: 'P0',
    title: 'Empty Business Rules field → ADO shows "NA" placeholder',
    category: 'Unhappy Path - Empty Field',
    given: 'PbiDraft with businessRulesAndAssumptions = undefined (not set)',
    when: 'buildFieldPatches is called',
    then: [
      'Generated description still includes <h3>Business Rules and Assumptions</h3>',
      'Description includes <p>NA</p> for the business rules value',
      'No crash or exception thrown',
      'Story is still created in ADO'
    ],
    expectedBehavior: 'Graceful handling: missing data shows as "NA"'
  },

  {
    id: 'BR-003',
    priority: 'P0',
    title: 'Whitespace-only Business Rules field → treated as empty → shows "NA"',
    category: 'Unhappy Path - Whitespace',
    given: 'PbiDraft with businessRulesAndAssumptions = "   \t\n  "',
    when: 'buildFieldPatches is called',
    then: [
      'Description shows <p>NA</p> for business rules (whitespace trimmed)',
      'No crash',
      'Story creation succeeds'
    ],
    expectedBehavior: 'Whitespace normalized to "NA"'
  },

  {
    id: 'BR-004',
    priority: 'P0',
    title: 'Business Rules with HTML-like content → properly escaped in ADO API call',
    category: 'Unhappy Path - XSS Prevention',
    given: 'PbiDraft with businessRulesAndAssumptions = "<script>alert(1)</script> is not allowed"',
    when: 'buildFieldPatches is called and patch is sent to ADO',
    then: [
      'Patch value contains &lt;script&gt; (escaped)',
      'Patch value does NOT contain raw <script> tag',
      'ADO API call succeeds without injecting code',
      'Text displays safely in ADO as "<script>alert(1)</script> is not allowed"'
    ],
    expectedBehavior: 'XSS prevention via HTML escaping'
  },

  {
    id: 'BR-005',
    priority: 'P1',
    title: 'Business Rules with newlines and formatting → preserved in ADO',
    category: 'Unhappy Path - Special Formatting',
    given: 'PbiDraft with businessRulesAndAssumptions = "Rule 1: No duplicates\nRule 2: Max retries 3\nRule 3: Timeout 30s"',
    when: 'buildFieldPatches is called',
    then: [
      'Patch includes the full multi-line text (newlines preserved as-is or converted to HTML)',
      'ADO displays the rules with formatting preserved',
      'No truncation or data loss'
    ],
    expectedBehavior: 'Multi-line business rules handled correctly'
  },

  {
    id: 'BR-006',
    priority: 'P1',
    title: 'Business Rules with quotes and apostrophes → properly escaped',
    category: 'Unhappy Path - Special Characters',
    given: 'PbiDraft with businessRulesAndAssumptions = \'Cannot use "draft" or \'in-flight\' status\'',
    when: 'buildFieldPatches is called',
    then: [
      'Double quotes are escaped to &quot;',
      'Single quotes are escaped to &#39; or handled appropriately',
      'ADO API call succeeds',
      'Text displays correctly: Cannot use "draft" or \'in-flight\' status'
    ],
    expectedBehavior: 'Quote escaping prevents JSON parsing errors'
  },

  {
    id: 'BR-007',
    priority: 'P1',
    title: 'Business Rules with emoji and unicode → handled without error',
    category: 'Unhappy Path - Unicode Characters',
    given: 'PbiDraft with businessRulesAndAssumptions = "✓ Compliant with 💳 PCI-DSS v3.2.1"',
    when: 'buildFieldPatches is called',
    then: [
      'Patch is generated without error',
      'ADO API call succeeds',
      'Unicode characters are preserved or safely encoded',
      'Text displays in ADO with emoji/unicode intact'
    ],
    expectedBehavior: 'Unicode characters handled gracefully'
  },

  {
    id: 'BR-008',
    priority: 'P2',
    title: 'Business Rules exceeding 5000 characters → no crash, truncation or validation warning',
    category: 'Unhappy Path - Length Limit',
    given: 'PbiDraft with businessRulesAndAssumptions = very long string (10,000+ chars)',
    when: 'buildFieldPatches is called and patch is sent to ADO',
    then: [
      'No exception thrown',
      'Patch is generated',
      'ADO API call succeeds (or fails with ADO-level error, not local validation crash)',
      'Draft is still created or updated'
    ],
    expectedBehavior: 'Long content does not crash the extension'
  }
];

/**
 * ============================================================================
 * ISSUE #29: User Story Statement Positioning
 * ============================================================================
 */

export const userStoryStatementPositioningTests = [
  {
    id: 'USS-001',
    priority: 'P0',
    title: 'User Story Statement populated → appears above Test Scenarios in ADO description',
    category: 'Happy Path - Data Positioning',
    given: 'PbiDraft with userStoryStatement = "Users need to export their activity logs for compliance audits"',
    when: 'buildFieldPatches is called',
    then: [
      'Generated description includes <h3>User Story Statement</h3>',
      'Description includes the exact text "Users need to export their activity logs for compliance audits"',
      'User Story Statement section appears AFTER main description',
      'User Story Statement section appears BEFORE Business Rules and Assumptions section',
      'Business Rules section appears BEFORE Test Scenarios section',
      'Final section ordering: Description → User Story Statement → Business Rules → Test Scenarios → Technical Considerations → Metadata'
    ],
    expectedBehavior: 'Issue #29 resolved: User Story Statement positioned correctly'
  },

  {
    id: 'USS-002',
    priority: 'P0',
    title: 'Empty User Story Statement → section reserved but empty (no crash)',
    category: 'Unhappy Path - Empty Field',
    given: 'PbiDraft with userStoryStatement = undefined or empty string',
    when: 'buildFieldPatches is called',
    then: [
      'Description does NOT include <h3>User Story Statement</h3> header (section skipped if empty)',
      'No crash or exception',
      'Story creation succeeds',
      'Other sections (Business Rules, Test Scenarios) still present'
    ],
    expectedBehavior: 'Graceful handling: missing statement doesn\'t break layout'
  },

  {
    id: 'USS-003',
    priority: 'P0',
    title: 'Whitespace-only User Story Statement → treated as empty → section not rendered',
    category: 'Unhappy Path - Whitespace',
    given: 'PbiDraft with userStoryStatement = "   \t\n"',
    when: 'buildFieldPatches is called',
    then: [
      'User Story Statement section is NOT included in HTML (whitespace trimmed away)',
      'No <h3>User Story Statement</h3> header',
      'Story creation succeeds'
    ],
    expectedBehavior: 'Whitespace normalized away'
  },

  {
    id: 'USS-004',
    priority: 'P0',
    title: 'User Story Statement with HTML-like content → properly escaped',
    category: 'Unhappy Path - XSS Prevention',
    given: 'PbiDraft with userStoryStatement = "<img src=x onerror=alert(1)> Users need access"',
    when: 'buildFieldPatches is called',
    then: [
      'Patch contains escaped HTML: &lt;img src=x ... &gt;',
      'ADO API call succeeds without injecting',
      'Text displays safely in ADO'
    ],
    expectedBehavior: 'XSS prevention via HTML escaping'
  },

  {
    id: 'USS-005',
    priority: 'P1',
    title: 'User Story Statement with quotes and special chars → properly escaped',
    category: 'Unhappy Path - Special Characters',
    given: 'PbiDraft with userStoryStatement = \'Users say "this is broken" & needs fix\'',
    when: 'buildFieldPatches is called',
    then: [
      'Double quotes escaped: &quot;',
      'Ampersand escaped: &amp;',
      'Apostrophes handled appropriately',
      'Patch succeeds',
      'Text displays: Users say "this is broken" & needs fix'
    ],
    expectedBehavior: 'Quote and ampersand escaping prevents parsing errors'
  },

  {
    id: 'USS-006',
    priority: 'P1',
    title: 'User Story Statement with multi-line content → preserved in ADO',
    category: 'Unhappy Path - Special Formatting',
    given: 'PbiDraft with userStoryStatement = "Line 1: Users need X\nLine 2: With feature Y\nLine 3: To achieve Z"',
    when: 'buildFieldPatches is called',
    then: [
      'Multi-line statement is included in description',
      'Newlines handled appropriately for HTML',
      'ADO displays content with formatting preserved',
      'No truncation'
    ],
    expectedBehavior: 'Multi-line user story statement handled correctly'
  },

  {
    id: 'USS-007',
    priority: 'P1',
    title: 'User Story Statement with unicode and emoji → no crash',
    category: 'Unhappy Path - Unicode Characters',
    given: 'PbiDraft with userStoryStatement = "Users (世界) need to 🚀 deploy faster"',
    when: 'buildFieldPatches is called',
    then: [
      'Patch generated without error',
      'ADO API call succeeds',
      'Unicode characters preserved',
      'ADO displays with emoji intact'
    ],
    expectedBehavior: 'Unicode handled gracefully'
  },

  {
    id: 'USS-008',
    priority: 'P2',
    title: 'User Story Statement very long (5000+ chars) → no crash',
    category: 'Unhappy Path - Length Limit',
    given: 'PbiDraft with userStoryStatement = very long string',
    when: 'buildFieldPatches is called',
    then: [
      'No exception thrown',
      'ADO API call succeeds',
      'Story created or updated'
    ],
    expectedBehavior: 'Long content does not crash extension'
  }
];

/**
 * ============================================================================
 * INTEGRATION TESTS: Both Fields Together
 * ============================================================================
 */

export const integrationTests = [
  {
    id: 'INT-001',
    priority: 'P0',
    title: 'Both User Story Statement and Business Rules populated → correct ordering in ADO',
    category: 'Integration - Happy Path',
    given: `
      PbiDraft with:
      - userStoryStatement = "Users need to see transaction history"
      - businessRulesAndAssumptions = "Only transactions > $100 appear. Retention: 7 years."
      - testScenarios = ["Display 100+ transactions", "Hide < $100", "Verify retention"]
    `,
    when: 'buildFieldPatches is called',
    then: [
      'Description includes all three sections in order: User Story Statement → Business Rules → Test Scenarios',
      'Each section has proper <h3> headers',
      'All content is escaped and safe',
      'Patch succeeds',
      'ADO work item displays correctly with proper section layout'
    ],
    expectedBehavior: 'Issues #32 and #29 both resolved: correct data and positioning'
  },

  {
    id: 'INT-002',
    priority: 'P0',
    title: 'Both fields empty → story created with "NA" for Business Rules, no USS header',
    category: 'Integration - Unhappy Path',
    given: `
      PbiDraft with:
      - userStoryStatement = undefined
      - businessRulesAndAssumptions = undefined
      - testScenarios = ["Test A", "Test B"]
    `,
    when: 'buildFieldPatches is called',
    then: [
      'No User Story Statement section rendered',
      'Business Rules section shows <p>NA</p>',
      'Test Scenarios section present',
      'No crash',
      'Story creation succeeds'
    ],
    expectedBehavior: 'Graceful degradation when data missing'
  },

  {
    id: 'INT-003',
    priority: 'P0',
    title: 'Partial data (only Business Rules) → User Story Statement section absent, others intact',
    category: 'Integration - Mixed Data',
    given: `
      PbiDraft with:
      - userStoryStatement = undefined
      - businessRulesAndAssumptions = "Rule: Process within 24 hours"
      - testScenarios = ["Verify 24h deadline", "Check automation"]
    `,
    when: 'buildFieldPatches is called',
    then: [
      'Description includes main description',
      'User Story Statement section NOT rendered (empty)',
      'Business Rules section includes "Rule: Process within 24 hours"',
      'Test Scenarios section present',
      'Correct ordering maintained for present sections'
    ],
    expectedBehavior: 'Sections rendered only when data present'
  },

  {
    id: 'INT-004',
    priority: 'P0',
    title: 'Partial data (only User Story Statement) → Business Rules shows "NA"',
    category: 'Integration - Mixed Data',
    given: `
      PbiDraft with:
      - userStoryStatement = "Users need dashboard alerts"
      - businessRulesAndAssumptions = undefined
      - testScenarios = ["Alert triggers", "Alert displays"]
    `,
    when: 'buildFieldPatches is called',
    then: [
      'User Story Statement section rendered with "Users need dashboard alerts"',
      'Business Rules section shown with <p>NA</p>',
      'Test Scenarios section present',
      'Ordering correct: USS → BR (with NA) → Test Scenarios'
    ],
    expectedBehavior: 'User Story renders when present; Business Rules defaults to NA'
  }
];

/**
 * ============================================================================
 * MESSAGE/REQUEST HANDLING TESTS
 * ============================================================================
 */

export const messageHandlingTests = [
  {
    id: 'MSG-001',
    priority: 'P0',
    title: 'GENERATE_FROM_INVEST_WIZARD message includes businessRulesAndAssumptions → prompt contains data',
    category: 'Message Handling',
    given: `
      WebviewRequest: {
        type: 'GENERATE_FROM_INVEST_WIZARD',
        payload: {
          draftId: 'xyz',
          wizard: {
            background: 'Current process is manual',
            why: 'Save time',
            how: 'Automate approval',
            persona: 'Finance Manager',
            want: 'auto-approve transactions under $5k',
            benefit: '50% faster processing',
            businessRulesAndAssumptions: 'Must verify budget first. Require 2FA.'
          }
        }
      }
    `,
    when: 'DashboardPanel.handleGenerateFromInvestWizard processes message',
    then: [
      'CopilotService.generateFromInvestWizard receives wizard with businessRulesAndAssumptions',
      'AI prompt includes "BUSINESS RULES & ASSUMPTIONS:" section with the data',
      'AI prompt uses businessRulesAndAssumptions as source of truth for generation',
      'Generated draft includes businessRulesAndAssumptions from AI suggestion'
    ],
    expectedBehavior: 'Business rules data flows from wizard → prompt → AI → draft'
  },

  {
    id: 'MSG-002',
    priority: 'P0',
    title: 'WIZARD_DRAFT_SAVE message with businessRulesAndAssumptions → state persists',
    category: 'Message Handling',
    given: `
      WebviewRequest: {
        type: 'WIZARD_DRAFT_SAVE',
        payload: {
          draftId: 'abc',
          partialDraft: {
            businessRulesAndAssumptions: 'User-entered business rules from Step 4'
          },
          currentStep: 3
        }
      }
    `,
    when: 'DashboardPanel handles WIZARD_DRAFT_SAVE',
    then: [
      'PbiDraftService updates draft with businessRulesAndAssumptions',
      'Draft persisted to storage',
      'Navigation away and back loads businessRulesAndAssumptions correctly',
      'No data loss'
    ],
    expectedBehavior: 'Business rules persist across wizard navigation'
  },

  {
    id: 'MSG-003',
    priority: 'P0',
    title: 'PUSH_PBI_TO_ADO message with populated businessRulesAndAssumptions → ADO patch includes data',
    category: 'Message Handling',
    given: `
      PbiDraft with:
      - id: 'draft1'
      - title: 'User export'
      - businessRulesAndAssumptions: 'Compliance rules here'
      - userStoryStatement: 'Users export data'
    `,
    when: 'DashboardPanel.handlePushPbiToAdo is called',
    then: [
      'AdoService.pushDrafts receives draft with both fields populated',
      'buildFieldPatches called with draft',
      'Patch includes both fields in description',
      'ADO API call succeeds',
      'Work item created with correct description structure'
    ],
    expectedBehavior: 'Push operation includes business rules and user story'
  },

  {
    id: 'MSG-004',
    priority: 'P0',
    title: 'Empty businessRulesAndAssumptions in push → ADO shows "NA", no failure',
    category: 'Message Handling',
    given: `
      PbiDraft with:
      - businessRulesAndAssumptions: ''
      - userStoryStatement: 'Statement here'
    `,
    when: 'DashboardPanel.handlePushPbiToAdo is called',
    then: [
      'ADO patch still generated',
      'Description includes "NA" for Business Rules',
      'ADO API call succeeds',
      'No toast error'
    ],
    expectedBehavior: 'Empty business rules handled gracefully in push'
  }
];

/**
 * ============================================================================
 * COPILOT SERVICE TESTS
 * ============================================================================
 */

export const copilotServiceTests = [
  {
    id: 'AI-001',
    priority: 'P0',
    title: 'generateFromInvestWizard with businessRulesAndAssumptions → AI prompt includes section',
    category: 'AI Prompt Generation',
    given: `
      wizard: {
        background: 'Setup slow',
        why: 'Speed up',
        how: 'Batch processing',
        persona: 'Admin',
        want: 'set up servers in 1 min',
        benefit: '10x faster',
        businessRulesAndAssumptions: 'Max 5 servers per user. Require admin approval.'
      }
    `,
    when: 'CopilotService.generateFromInvestWizard builds AI prompt',
    then: [
      'User prompt includes section: "BUSINESS RULES & ASSUMPTIONS:"',
      'Section includes exact wizard.businessRulesAndAssumptions text',
      'Section only appears if businessRulesAndAssumptions is non-empty',
      'AI receives complete data for story generation'
    ],
    expectedBehavior: 'Business rules inform AI-generated story content'
  },

  {
    id: 'AI-002',
    priority: 'P0',
    title: 'generateFromInvestWizard without businessRulesAndAssumptions → prompt works, section omitted',
    category: 'AI Prompt Generation',
    given: `
      wizard: {
        background: 'Issue X',
        why: 'Value Y',
        how: 'Solution Z',
        persona: 'User',
        want: 'feature',
        benefit: 'gain'
        // businessRulesAndAssumptions: undefined
      }
    `,
    when: 'CopilotService.generateFromInvestWizard builds prompt',
    then: [
      'Prompt still generated successfully',
      'No "BUSINESS RULES & ASSUMPTIONS:" section',
      'AI generates story from other INVEST sections',
      'No error or crash'
    ],
    expectedBehavior: 'Optional business rules do not break AI flow'
  }
];

/**
 * ============================================================================
 * BUILD & TYPESCRIPT VALIDATION TESTS
 * ============================================================================
 */

export const buildValidationTests = [
  {
    id: 'BUILD-001',
    priority: 'P0',
    title: '`npm run build` succeeds after all changes',
    category: 'Build Validation',
    given: 'All changes to adoService.ts, messages.ts, copilotService.ts, and DashboardPanel.ts complete',
    when: '`npm run build` is run from repo root',
    then: [
      'Build succeeds with exit code 0',
      'No webpack/esbuild errors',
      'dist/extension.js generated'
    ],
    expectedBehavior: 'No bundle errors'
  },

  {
    id: 'BUILD-002',
    priority: 'P0',
    title: '`tsc --noEmit` passes in repo root',
    category: 'TypeScript Validation',
    given: 'All source code changes complete',
    when: '`tsc --noEmit` is run from repo root',
    then: [
      'No TypeScript compilation errors',
      'All type references resolve',
      'businessRulesAndAssumptions and userStoryStatement typed correctly'
    ],
    expectedBehavior: 'TypeScript clean'
  },

  {
    id: 'BUILD-003',
    priority: 'P0',
    title: '`tsc --noEmit` passes in webview-ui/',
    category: 'TypeScript Validation',
    given: 'Webview UI code changes complete',
    when: '`tsc --noEmit` is run from webview-ui/',
    then: [
      'No TypeScript errors in webview-ui',
      'Component types reference new fields correctly'
    ],
    expectedBehavior: 'Webview TypeScript clean'
  }
];

/**
 * ============================================================================
 * REGRESSION & COMPATIBILITY TESTS
 * ============================================================================
 */

export const regressionTests = [
  {
    id: 'REG-001',
    priority: 'P0',
    title: 'Existing PBIs without businessRulesAndAssumptions or userStoryStatement still export correctly',
    category: 'Regression - Backward Compatibility',
    given: 'PbiDraft created before this feature (no new fields set)',
    when: 'buildFieldPatches is called',
    then: [
      'Description includes main description section',
      'Acceptance Criteria section present (if data)',
      'Test Scenarios section present (if data)',
      'Business Rules section shows "NA"',
      'No User Story Statement section (empty)',
      'Export succeeds',
      'Existing ADO items unchanged'
    ],
    expectedBehavior: 'Backward compatible: old PBIs still work'
  },

  {
    id: 'REG-002',
    priority: 'P0',
    title: 'Acceptance Criteria and Test Scenarios still appear correctly with new fields',
    category: 'Regression - Feature Interaction',
    given: `
      PbiDraft with all fields populated:
      - description, acceptanceCriteria, testScenarios (existing)
      - userStoryStatement, businessRulesAndAssumptions (new)
    `,
    when: 'buildFieldPatches is called',
    then: [
      'Acceptance Criteria section still rendered',
      'Test Scenarios section still rendered',
      'All sections appear in correct order',
      'No duplication or loss of existing data'
    ],
    expectedBehavior: 'New fields do not break existing sections'
  },

  {
    id: 'REG-003',
    priority: 'P0',
    title: 'Wizard navigation with new Step 4 (Business Rules) does not break Steps 1-3 or Step 5 (User Story)',
    category: 'Regression - Wizard Flow',
    given: 'User Story Wizard with 5 steps (new Step 4: Business Rules)',
    when: 'User navigates through all steps',
    then: [
      'Steps 1-3 (Background, Why, How) work normally',
      'New Step 4 (Business Rules) renders and saves data',
      'Step 5 (User Story & Details) still works',
      'Navigation forward/backward preserves all data',
      'No state corruption'
    ],
    expectedBehavior: 'Wizard flow not broken by new step'
  },

  {
    id: 'REG-004',
    priority: 'P0',
    title: 'Bulk push with new fields succeeds',
    category: 'Regression - Bulk Operations',
    given: 'Multiple PBIs with businessRulesAndAssumptions and userStoryStatement',
    when: 'BULK_PUSH_TO_ADO is executed',
    then: [
      'All drafts pushed without error',
      'Each work item includes correct data',
      'No timeout or performance regression',
      'Bulk result reports success'
    ],
    expectedBehavior: 'Bulk operations handle new fields'
  }
];

/**
 * ============================================================================
 * HTML STRUCTURE & FORMATTING TESTS
 * ============================================================================
 */

export const htmlStructureTests = [
  {
    id: 'HTML-001',
    priority: 'P0',
    title: 'Generated description HTML is valid and well-formed',
    category: 'HTML Validation',
    given: 'PbiDraft with all fields populated',
    when: 'buildFieldPatches generates HTML description',
    then: [
      'Description starts with <p>main description</p>',
      'All <h3> headers are present',
      'All <ul> lists are properly closed',
      'No unclosed tags',
      'All content properly wrapped in HTML elements'
    ],
    expectedBehavior: 'Valid HTML structure for ADO'
  },

  {
    id: 'HTML-002',
    priority: 'P0',
    title: 'Section ordering is consistent: Desc → USS → BR → TS → TC → Metadata',
    category: 'HTML Validation',
    given: 'PbiDraft with multiple sections',
    when: 'buildFieldPatches generates HTML',
    then: [
      'Main description appears first',
      'User Story Statement appears second (if present)',
      'Business Rules and Assumptions appears third',
      'Test Scenarios appears fourth (if present)',
      'Technical Considerations appears fifth (if present)',
      'PO Tools Metadata appears last',
      'No sections out of order'
    ],
    expectedBehavior: 'Consistent, predictable section ordering'
  },

  {
    id: 'HTML-003',
    priority: 'P1',
    title: 'List items properly escaped and formatted',
    category: 'HTML Validation',
    given: 'PbiDraft with special characters in acceptance criteria and test scenarios',
    when: 'buildFieldPatches generates HTML',
    then: [
      'Each list item wrapped in <li></li>',
      'Special characters escaped inside items',
      'List properly formatted for ADO display'
    ],
    expectedBehavior: 'Clean list formatting'
  }
];

/**
 * ============================================================================
 * TESTING EXECUTION NOTES
 * ============================================================================
 *
 * These test cases are designed to be executed manually or with a test framework (Jest/Vitest).
 *
 * QUICK START (Manual Execution):
 *
 * 1. **Validate Build:**
 *    npm run build  (expect: success)
 *    tsc --noEmit   (expect: no errors)
 *    cd webview-ui && tsc --noEmit  (expect: no errors)
 *
 * 2. **Happy Path: Business Rules:**
 *    - Create new PBI, enter Business Rules in Step 4
 *    - Push to ADO
 *    - Verify ADO work item description includes Business Rules section (not "NA")
 *    - Verify placement: after User Story Statement, before Test Scenarios
 *
 * 3. **Happy Path: User Story Statement:**
 *    - Create new PBI, enter User Story Statement in Step 4
 *    - Push to ADO
 *    - Verify ADO work item description includes User Story Statement
 *    - Verify placement: after main description, before Business Rules
 *
 * 4. **Unhappy Path: Empty Fields:**
 *    - Create PBI without Business Rules or User Story Statement
 *    - Push to ADO
 *    - Verify story created successfully
 *    - Verify Business Rules shows as "NA"
 *    - Verify no User Story Statement section
 *
 * 5. **Unhappy Path: Special Characters:**
 *    - Enter: <script>alert(1)</script> in Business Rules
 *    - Push to ADO
 *    - Verify no XSS: ADO displays escaped text, not script execution
 *    - Repeat with quotes: "double" 'single' and ampersand &
 *    - Verify all characters escaped properly
 *
 * 6. **Integration:**
 *    - Create PBI with BOTH fields populated
 *    - Push to ADO
 *    - Verify correct section ordering
 *    - Verify all data present and escaped
 *
 * AUTOMATED EXECUTION (Future):
 *
 * Once Jest/Vitest configured:
 *
 * ```bash
 * npm test -- --testPathPattern="adoService.test.ts"
 * ```
 *
 * Test framework should:
 * - Mock AdoService methods
 * - Mock CopilotService language model calls
 * - Assert patch structure and HTML content
 * - Verify message flow through extension
 * - Snapshot test HTML output
 */

/**
 * ============================================================================
 * ISSUE #2: Team Selection Feature - Backend Tests
 * ============================================================================
 * 
 * Testing Team, Area Path, and Iteration dropdown data fetching from ADO API
 * with caching, error handling, and scope validation.
 */

export const teamSelectionBackendTests = [
  // **fetchTeams() Method Tests**
  {
    id: 'TEAM-001',
    priority: 'P0',
    title: 'fetchTeams() returns array of team names from ADO API',
    category: 'Happy Path - fetchTeams',
    given: 'AdoSettings with valid orgUrl, projectName, and PAT with vso.identity scope',
    when: 'adoService.fetchTeams(settings, pat) is called',
    then: [
      'Azure DevOps Core API getTeams() called with project ID',
      'Returns array of team names: ["Team A", "Team B", "Team C"]',
      'Names are strings with length > 0',
      'Array is sorted alphabetically',
      'No duplicates in returned array'
    ],
    expectedBehavior: 'Teams fetched and formatted correctly'
  },

  {
    id: 'TEAM-002',
    priority: 'P0',
    title: 'fetchTeams() handles empty team list gracefully',
    category: 'Edge Case - fetchTeams',
    given: 'Project with no teams configured',
    when: 'fetchTeams() called',
    then: [
      'Returns empty array []',
      'No errors thrown',
      'Logs informational message about empty teams'
    ],
    expectedBehavior: 'Empty team list handled without errors'
  },

  {
    id: 'TEAM-003',
    priority: 'P0',
    title: 'fetchTeams() throws error when org/project missing',
    category: 'Unhappy Path - fetchTeams',
    given: 'AdoSettings with empty orgUrl or projectName',
    when: 'fetchTeams() called',
    then: [
      'Error thrown with descriptive message',
      'Error mentions missing org or project',
      'No API calls made'
    ],
    expectedBehavior: 'Validation prevents invalid API calls'
  },

  {
    id: 'TEAM-004',
    priority: 'P0',
    title: 'fetchTeams() throws error when PAT lacks vso.identity scope',
    category: 'Unhappy Path - fetchTeams',
    given: 'PAT with only vso.work scope (missing vso.identity)',
    when: 'fetchTeams() called',
    then: [
      'Scope validation detects missing vso.identity',
      'Error thrown: "PAT requires vso.identity scope to fetch teams"',
      'Error message guides user on token regeneration',
      'API call prevented if scope validation fails early'
    ],
    expectedBehavior: 'Scope validation prevents unauthorized API calls'
  },

  {
    id: 'TEAM-005',
    priority: 'P1',
    title: 'fetchTeams() timeout after 5 seconds',
    category: 'Edge Case - fetchTeams',
    given: 'ADO API hangs or takes >5 seconds to respond',
    when: 'fetchTeams() called',
    then: [
      'Promise rejects after 5 seconds',
      'Error: "Timeout fetching teams from Azure DevOps"',
      'Logs timeout event for debugging'
    ],
    expectedBehavior: 'Timeout prevents indefinite hangs'
  },

  {
    id: 'TEAM-006',
    priority: 'P1',
    title: 'fetchTeams() logs API call details',
    category: 'Observability - fetchTeams',
    given: 'Any fetchTeams() invocation',
    when: 'Method executes',
    then: [
      'Logs orgUrl and projectName (redacted PAT)',
      'Logs number of teams returned',
      'Logs API call duration',
      'Logs errors with stack trace if any'
    ],
    expectedBehavior: 'Debugging information available in logs'
  },

  // **fetchAreaPaths() Method Tests**
  {
    id: 'AREA-001',
    priority: 'P0',
    title: 'fetchAreaPaths() returns formatted area paths',
    category: 'Happy Path - fetchAreaPaths',
    given: 'Project with area structure: Project > AreaA > SubArea1',
    when: 'fetchAreaPaths(settings, pat) called without teamId',
    then: [
      'Returns array: ["Project", "Project\\\\AreaA", "Project\\\\AreaA\\\\SubArea1"]',
      'Format matches iterationUtils expectations (double backslash)',
      'Root area included if present',
      'Hierarchy preserved in path format'
    ],
    expectedBehavior: 'Area paths formatted correctly for dropdown and ADO API'
  },

  {
    id: 'AREA-002',
    priority: 'P0',
    title: 'fetchAreaPaths() handles empty area list gracefully',
    category: 'Edge Case - fetchAreaPaths',
    given: 'Project with no custom areas (only default)',
    when: 'fetchAreaPaths() called',
    then: [
      'Returns array with at least root area: ["ProjectName"]',
      'No errors thrown',
      'Logs warning if no custom areas configured'
    ],
    expectedBehavior: 'Default area returned when no custom areas exist'
  },

  {
    id: 'AREA-003',
    priority: 'P1',
    title: 'fetchAreaPaths() filters areas by team when teamId provided',
    category: 'Filtering - fetchAreaPaths',
    given: 'Team "Alpha" has areas: Project\\\\Alpha, Project\\\\Alpha\\\\Sub1',
    when: 'fetchAreaPaths(settings, pat, "alpha-team-id") called',
    then: [
      'Returns only areas associated with Team Alpha',
      'Other team areas excluded from results',
      'Format remains consistent'
    ],
    expectedBehavior: 'Team-specific area filtering works correctly',
    note: 'Implementation may defer filtering if not supported by ADO API directly'
  },

  {
    id: 'AREA-004',
    priority: 'P0',
    title: 'fetchAreaPaths() throws error when scope missing',
    category: 'Unhappy Path - fetchAreaPaths',
    given: 'PAT missing vso.work scope',
    when: 'fetchAreaPaths() called',
    then: [
      'Error thrown: "PAT requires vso.work scope"',
      'API call prevented',
      'User guided to regenerate PAT with correct scopes'
    ],
    expectedBehavior: 'Scope validation enforced'
  },

  {
    id: 'AREA-005',
    priority: 'P1',
    title: 'fetchAreaPaths() works with iterationUtils format expectations',
    category: 'Integration - fetchAreaPaths',
    given: 'Area paths returned by fetchAreaPaths()',
    when: 'Paths passed to iterationUtils or used in ADO push',
    then: [
      'Format matches expected structure',
      'No parsing errors',
      'Area paths resolve correctly in ADO API calls'
    ],
    expectedBehavior: 'Format compatibility verified'
  },

  {
    id: 'AREA-006',
    priority: 'P1',
    title: 'fetchAreaPaths() logs API call details',
    category: 'Observability - fetchAreaPaths',
    given: 'fetchAreaPaths() execution',
    when: 'Method runs',
    then: [
      'Logs project and teamId (if provided)',
      'Logs number of areas returned',
      'Logs API call duration'
    ],
    expectedBehavior: 'Debugging info available'
  },

  // **fetchIterations() Method Tests**
  {
    id: 'ITER-001',
    priority: 'P0',
    title: 'fetchIterations() returns formatted iteration paths',
    category: 'Happy Path - fetchIterations',
    given: 'Project with iterations: Sprint 1, Sprint 2, Sprint 3',
    when: 'fetchIterations(settings, pat) called',
    then: [
      'Returns array: ["Project\\\\Sprint 1", "Project\\\\Sprint 2", "Project\\\\Sprint 3"]',
      'Format matches resolveIterationPathForPush() expectations',
      'Iterations sorted chronologically or alphabetically',
      'No duplicates'
    ],
    expectedBehavior: 'Iterations formatted correctly for dropdown and ADO push'
  },

  {
    id: 'ITER-002',
    priority: 'P0',
    title: 'fetchIterations() handles empty iteration list',
    category: 'Edge Case - fetchIterations',
    given: 'Project with no iterations configured',
    when: 'fetchIterations() called',
    then: [
      'Returns empty array [] or array with root: ["ProjectName"]',
      'No errors thrown',
      'Logs warning about no iterations'
    ],
    expectedBehavior: 'Graceful handling of empty iterations'
  },

  {
    id: 'ITER-003',
    priority: 'P1',
    title: 'fetchIterations() filters by team when teamId provided',
    category: 'Filtering - fetchIterations',
    given: 'Team "Beta" has iterations: Sprint 10, Sprint 11',
    when: 'fetchIterations(settings, pat, "beta-team-id") called',
    then: [
      'Returns only iterations for Team Beta',
      'Other team iterations excluded',
      'Format consistent'
    ],
    expectedBehavior: 'Team-specific iteration filtering works',
    note: 'Filtering may be deferred if API does not support direct team-based filtering'
  },

  {
    id: 'ITER-004',
    priority: 'P0',
    title: 'fetchIterations() throws error when scope missing',
    category: 'Unhappy Path - fetchIterations',
    given: 'PAT missing vso.work scope',
    when: 'fetchIterations() called',
    then: [
      'Error thrown: "PAT requires vso.work scope"',
      'API call prevented'
    ],
    expectedBehavior: 'Scope validation enforced'
  },

  {
    id: 'ITER-005',
    priority: 'P1',
    title: 'fetchIterations() timeout handling (5s max)',
    category: 'Edge Case - fetchIterations',
    given: 'ADO API hangs',
    when: 'fetchIterations() called',
    then: [
      'Timeout after 5 seconds',
      'Error: "Timeout fetching iterations"',
      'Logged for debugging'
    ],
    expectedBehavior: 'Timeout prevents hangs'
  },

  {
    id: 'ITER-006',
    priority: 'P1',
    title: 'fetchIterations() logs API call details',
    category: 'Observability - fetchIterations',
    given: 'fetchIterations() execution',
    when: 'Method runs',
    then: [
      'Logs project and teamId',
      'Logs iteration count',
      'Logs duration'
    ],
    expectedBehavior: 'Debugging info available'
  },

  // **Scope Validation Tests (testConnection update)**
  {
    id: 'SCOPE-001',
    priority: 'P0',
    title: 'testConnection validates vso.work scope present',
    category: 'Scope Validation',
    given: 'PAT with scopes: vso.work, vso.identity',
    when: 'testConnection(settings, pat) called',
    then: [
      'Scope query API called to retrieve PAT scopes',
      'Validates vso.work scope present',
      'Returns success (no error thrown)'
    ],
    expectedBehavior: 'Required scope validated'
  },

  {
    id: 'SCOPE-002',
    priority: 'P0',
    title: 'testConnection validates vso.identity scope present',
    category: 'Scope Validation',
    given: 'PAT with vso.work and vso.identity',
    when: 'testConnection() called',
    then: [
      'Validates vso.identity scope present',
      'Connection succeeds'
    ],
    expectedBehavior: 'Identity scope validated'
  },

  {
    id: 'SCOPE-003',
    priority: 'P0',
    title: 'testConnection returns detailed error when scopes missing',
    category: 'Scope Validation - Error',
    given: 'PAT with only vso.code scope (missing vso.work and vso.identity)',
    when: 'testConnection() called',
    then: [
      'Error message: "PAT missing required scopes: vso.work, vso.identity"',
      'Error includes instructions: "Regenerate PAT with these scopes at [link]"',
      'Clear, actionable guidance provided',
      'Connection fails before attempting other operations'
    ],
    expectedBehavior: 'Missing scopes detected with clear guidance'
  },

  {
    id: 'SCOPE-004',
    priority: 'P1',
    title: 'testConnection gracefully handles PAT scope query failures',
    category: 'Scope Validation - Edge Case',
    given: 'ADO API scope endpoint returns 403 or 500',
    when: 'testConnection() attempts scope validation',
    then: [
      'Logs warning about scope validation failure',
      'Continues with connection test (may fail later with less clear error)',
      'Does not block user completely if scope API is down'
    ],
    expectedBehavior: 'Scope validation failure does not hard-fail connection test',
    note: 'Consider UX: warn user that scope validation was skipped'
  },

  {
    id: 'SCOPE-005',
    priority: 'P0',
    title: 'testConnection error message guides user on token regeneration',
    category: 'Scope Validation - UX',
    given: 'PAT missing required scopes',
    when: 'Error message displayed',
    then: [
      'Message includes: "Go to Azure DevOps > User Settings > Personal Access Tokens"',
      'Message includes: "Create new token with scopes: vso.work, vso.identity"',
      'Optionally includes direct link to PAT generation page'
    ],
    expectedBehavior: 'User can quickly resolve scope issues'
  },

  // **Cache Implementation Tests**
  {
    id: 'CACHE-001',
    priority: 'P0',
    title: 'Teams data cached in globalState with timestamp',
    category: 'Cache - Storage',
    given: 'fetchTeams() called for first time',
    when: 'Data returned from ADO API',
    then: [
      'Data stored in globalState with key: "ado.cache.teams"',
      'Cached object includes: { data: string[], timestamp: number }',
      'Timestamp is current Unix time in milliseconds'
    ],
    expectedBehavior: 'Cache stored correctly'
  },

  {
    id: 'CACHE-002',
    priority: 'P0',
    title: 'Cache returned if <30 min old',
    category: 'Cache - Retrieval',
    given: 'Teams cached 15 minutes ago',
    when: 'fetchTeams() called again',
    then: [
      'Cached data returned immediately',
      'No API call made',
      'User sees instant dropdown population'
    ],
    expectedBehavior: 'Fresh cache used, API call avoided'
  },

  {
    id: 'CACHE-003',
    priority: 'P0',
    title: 'Fresh fetch triggered if cache stale (>30 min)',
    category: 'Cache - Expiration',
    given: 'Teams cached 31 minutes ago',
    when: 'fetchTeams() called',
    then: [
      'Cache detected as stale (timestamp + 30min < now)',
      'New API call made',
      'Cache updated with fresh data',
      'New timestamp recorded'
    ],
    expectedBehavior: 'Stale cache refreshed automatically'
  },

  {
    id: 'CACHE-004',
    priority: 'P0',
    title: 'Cache cleared when settings saved',
    category: 'Cache - Invalidation',
    given: 'User saves ADO settings (org, project, or PAT changed)',
    when: 'SAVE_ADO_SETTINGS handled',
    then: [
      'Cache keys cleared: ado.cache.teams, ado.cache.areas, ado.cache.iterations',
      'Next fetch triggers fresh API call',
      'Ensures data matches new settings'
    ],
    expectedBehavior: 'Cache invalidated on settings change'
  },

  {
    id: 'CACHE-005',
    priority: 'P1',
    title: 'Manual cache clear works (if exposed as method)',
    category: 'Cache - Manual Clear',
    given: 'Cache clear method exists (e.g., clearAdoCache())',
    when: 'Method called',
    then: [
      'All ado.cache.* keys removed from globalState',
      'Next fetch triggers API call',
      'Useful for troubleshooting stale data'
    ],
    expectedBehavior: 'Manual cache clear available for debugging'
  },

  {
    id: 'CACHE-006',
    priority: 'P1',
    title: 'Separate cache keys for teams, areas, iterations',
    category: 'Cache - Key Management',
    given: 'Multiple dropdown types',
    when: 'Data cached',
    then: [
      'Teams: ado.cache.teams',
      'Areas: ado.cache.areas',
      'Iterations: ado.cache.iterations',
      'Each cache managed independently',
      'Clearing one does not affect others unless settings changed'
    ],
    expectedBehavior: 'Cache isolation per data type'
  }
];
