/**
 * BusinessRulesAndAssumptions.test.ts
 * 
 * Comprehensive test cases for the Business Rules and Assumptions feature.
 * 
 * This test suite validates:
 * - Wizard step rendering and navigation
 * - Optional field behavior (no validation required)
 * - State management and data persistence
 * - ADO export with/without data
 * - NA placeholder logic for empty values
 * - Edge cases (whitespace, special characters, very long content)
 * - Integration with existing PBI workflow
 * 
 * Format: Given/When/Then structure for implementation-agnostic validation.
 * Priority: P0 (blocking) and P1 (high) scenarios marked accordingly.
 * 
 * Note: These tests are written to support manual execution or automated testing
 * once a test framework (Vitest/Jest) is established.
 */

/**
 * ============================================================================
 * CATEGORY 1: WIZARD STEP BEHAVIOR (FRONTEND)
 * ============================================================================
 */

export const wizardStepTests = [
  {
    id: '1.1',
    priority: 'P0',
    title: 'Business Rules step appears in correct position after "How it will work" step',
    given: 'UserStoryWizard is rendered',
    when: 'STEPS array is inspected',
    then: [
      'Business Rules step is defined in STEPS array',
      'Business Rules step appears after "how" step (index 3)',
      'Business Rules step appears before "story" step (final step moves to index 4)',
      'Step has key="businessRules"',
      'Step has label="Business Rules"',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: '12-59 (STEPS array)',
      expectedPosition: 3,
    },
  },

  {
    id: '1.2',
    priority: 'P0',
    title: 'Business Rules step renders with proper title and description',
    given: 'User navigates to Business Rules step',
    when: 'Step content is displayed',
    then: [
      'Step title displays: "What are the business rules and assumptions?"',
      'Step description explains the purpose (e.g., "Capture any constraints, policies, or assumptions...")',
      'Textarea field is visible with label "Business Rules and Assumptions"',
      'Placeholder text is helpful (e.g., "e.g., Guest payments are limited to $10,000 per transaction...")',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'STEPS array + step rendering (around line 244-280)',
      stepKey: 'businessRules',
    },
  },

  {
    id: '1.3',
    priority: 'P0',
    title: 'User can enter text in Business Rules field',
    given: 'User is on Business Rules step',
    when: 'User types text in the textarea',
    then: [
      'Text appears in the textarea as user types',
      'State is updated (businessRules state variable)',
      'No character limit prevents input (supports long content)',
      'Textarea supports multi-line input',
      'autoFocus is set for better UX',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Step 3 rendering + businessRules state',
      stateVariable: 'businessRules',
      setter: 'setBusinessRules',
    },
  },

  {
    id: '1.4',
    priority: 'P0',
    title: 'User can skip Business Rules step without entering data (no validation)',
    given: 'User is on Business Rules step with empty textarea',
    when: 'User clicks "Next" button',
    then: [
      'Next button is enabled (not disabled)',
      'Navigation proceeds to next step (User Story)',
      'No validation error is shown',
      'Empty value is allowed',
      'businessRules state remains empty string',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'canNext() function (around line 132-143)',
      validation: 'No validation for step 3 (businessRules is optional)',
    },
  },

  {
    id: '1.5',
    priority: 'P0',
    title: 'Navigation works with data entered in Business Rules',
    given: 'User enters text in Business Rules field',
    when: 'User clicks "Next" button',
    then: [
      'Next button is enabled',
      'Navigation proceeds to User Story step',
      'Data is preserved in businessRules state',
      'User can navigate back and see entered text',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'handleNext() + navigation logic',
    },
  },

  {
    id: '1.6',
    priority: 'P0',
    title: 'Data persists when navigating away and back to Business Rules step',
    given: 'User enters "Payment limit: $10,000 max" in Business Rules',
    when: 'User clicks Next, then clicks Back button to return to Business Rules',
    then: [
      'Textarea shows "Payment limit: $10,000 max" (data preserved)',
      'businessRules state is unchanged',
      'No data loss occurs during navigation',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'State persistence across navigation',
      stateCheck: 'businessRules value retained',
    },
  },

  {
    id: '1.7',
    priority: 'P1',
    title: 'Step progress indicator shows Business Rules as step 4 of 5',
    given: 'UserStoryWizard renders with all steps',
    when: 'Step progress rail is displayed',
    then: [
      'Progress rail shows 5 steps total (was 4, now 5)',
      'Business Rules appears as step 4',
      'User Story (final step) is step 5',
      'Step node shows "4" when Business Rules is current step',
      'Connector line appears between "How" and "Business Rules"',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: '210-229 (wizard-steps rendering)',
      expectedStepCount: 5,
    },
  },

  {
    id: '1.8',
    priority: 'P1',
    title: 'Step caption displays "Step 4 of 5" on Business Rules step',
    given: 'User navigates to Business Rules step',
    when: 'Step caption is rendered',
    then: [
      'Caption displays "Step 4 of 5"',
      'Caption updates correctly when navigating between steps',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: '233 (wizard-step-caption)',
      expectedText: 'Step 4 of 5',
    },
  },

  {
    id: '1.9',
    priority: 'P1',
    title: 'INVEST hint is displayed on Business Rules step',
    given: 'User is on Business Rules step',
    when: 'INVEST hint section renders',
    then: [
      'INVEST hint chip is visible at bottom of step',
      'Hint text provides guidance related to Business Rules',
      'Hint does not prevent navigation (informational only)',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'STEPS[3].invest property + hint rendering (line 323-328)',
      hintField: 'invest.hint and invest.text',
    },
  },
];

/**
 * ============================================================================
 * CATEGORY 2: STATE MANAGEMENT
 * ============================================================================
 */

export const stateManagementTests = [
  {
    id: '2.1',
    priority: 'P0',
    title: 'businessRules state is initialized as empty string',
    given: 'UserStoryWizard component mounts',
    when: 'Component initialization completes',
    then: [
      'businessRules state variable exists',
      'businessRules initial value is empty string ""',
      'setBusinessRules setter function is available',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 95-103 (useState declarations)',
      expectedState: 'const [businessRules, setBusinessRules] = useState("");',
    },
  },

  {
    id: '2.2',
    priority: 'P0',
    title: 'businessRules is included in wizard data object',
    given: 'Wizard has data entered in various steps',
    when: 'wizard object is constructed',
    then: [
      'wizard object includes businessRules property',
      'wizard type is Partial<InvestWizardInput> with businessRules field',
      'businessRules value matches state value',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 105 (wizard object construction)',
      expectedShape: '{ background, why, how, businessRules, persona, want, benefit }',
    },
  },

  {
    id: '2.3',
    priority: 'P0',
    title: 'businessRules is passed to onGenerate callback',
    given: 'All required wizard steps are complete',
    when: 'User clicks "Generate full story & apply" button',
    then: [
      'handleGenerate() is called',
      'onGenerate callback receives wizard object with businessRules',
      'businessRules value (even if empty) is included',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 145-150 (handleGenerate)',
      callbackArg: '{ background, why, how, businessRules, persona, want, benefit }',
    },
  },

  {
    id: '2.4',
    priority: 'P0',
    title: 'businessRules is passed to onOpenInChat callback',
    given: 'All required wizard steps are complete',
    when: 'User clicks "Refine in Copilot Chat" button',
    then: [
      'handleOpenChat() is called',
      'onOpenInChat callback receives wizard object with businessRules',
      'businessRules value is included in chat context',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 152-157 (handleOpenChat)',
      callbackArg: '{ background, why, how, businessRules, persona, want, benefit }',
    },
  },

  {
    id: '2.5',
    priority: 'P1',
    title: 'Empty businessRules does not affect wizard completion',
    given: 'All required fields (background, why, how, persona, want, benefit) are filled',
    when: 'businessRules is empty and isComplete() is evaluated',
    then: [
      'isComplete() returns true',
      'Wizard summary and action buttons appear',
      'Empty businessRules does not block completion',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 84-93 (isComplete function)',
      validation: 'businessRules NOT required for completion',
    },
  },

  {
    id: '2.6',
    priority: 'P1',
    title: 'businessRules does not affect INVEST score calculation',
    given: 'businessRules has content',
    when: 'investScore() is called',
    then: [
      'investScore() does not consider businessRules',
      'Score is still calculated from 6 original fields',
      'Score remains /6 (not /7)',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Around line 61-82 (investScore function)',
      expectedBehavior: 'businessRules not included in score',
    },
  },

  {
    id: '2.7',
    priority: 'P1',
    title: 'InvestWizardInput type includes businessRules as optional field',
    given: 'InvestWizardInput interface is defined',
    when: 'Type is inspected',
    then: [
      'InvestWizardInput interface has businessRules?: string property',
      'Field is optional (? modifier)',
      'Type is string',
    ],
    implementation: {
      file: 'webview-ui/src/types.ts AND src/shared/messages.ts',
      lines: 'Around line 95-101 (InvestWizardInput interface)',
      expectedProperty: 'businessRules?: string;',
    },
  },
];

/**
 * ============================================================================
 * CATEGORY 3: ADO EXPORT (BACKEND)
 * ============================================================================
 */

export const adoExportTests = [
  {
    id: '3.1',
    priority: 'P0',
    title: 'Business Rules exports with title "Business Rules and Assumptions" when populated',
    given: 'PbiDraft has businessRulesAndAssumptions = "Payment limit: $10,000 max per transaction"',
    when: 'buildFieldPatches() is called during ADO export',
    then: [
      'descriptionParts includes <h3>Business Rules and Assumptions</h3>',
      'descriptionParts includes <p>Payment limit: $10,000 max per transaction</p>',
      'Content is HTML-escaped properly',
      'Section appears in final description HTML',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '321-327 (Business Rules section)',
      expectedHTML: '<h3>Business Rules and Assumptions</h3><p>Payment limit: $10,000 max per transaction</p>',
    },
  },

  {
    id: '3.2',
    priority: 'P0',
    title: 'Business Rules exports "NA" when field is empty',
    given: 'PbiDraft has businessRulesAndAssumptions = "" (empty string)',
    when: 'buildFieldPatches() is called during ADO export',
    then: [
      'descriptionParts includes <h3>Business Rules and Assumptions</h3>',
      'descriptionParts includes <p>NA</p>',
      'NA is used as placeholder for empty value',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '322-323 (businessRulesValue logic)',
      expectedLogic: 'const businessRulesValue = businessRules.length > 0 ? businessRules : "NA";',
    },
  },

  {
    id: '3.3',
    priority: 'P0',
    title: 'Business Rules exports "NA" when field is undefined',
    given: 'PbiDraft has businessRulesAndAssumptions = undefined',
    when: 'buildFieldPatches() is called during ADO export',
    then: [
      'No runtime error occurs',
      'Fallback to empty string via .trim() || ""',
      'descriptionParts includes <p>NA</p>',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '322 (trim with fallback)',
      expectedLogic: 'const businessRules = draft.businessRulesAndAssumptions?.trim() || "";',
    },
  },

  {
    id: '3.4',
    priority: 'P0',
    title: 'Business Rules appears immediately after User Story Statement in export',
    given: 'PbiDraft has userStoryStatement and businessRulesAndAssumptions',
    when: 'buildFieldPatches() constructs descriptionParts array',
    then: [
      'Order is: description → User Story Statement → Business Rules → Test Scenarios → Technical Considerations',
      'Business Rules section comes right after User Story Statement',
      'descriptionParts array has correct ordering',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '311-351 (descriptionParts construction order)',
      expectedOrder: ['description', 'userStoryStatement', 'businessRules', 'testScenarios', 'technicalConsiderations'],
    },
  },

  {
    id: '3.5',
    priority: 'P0',
    title: 'Whitespace-only Business Rules input is treated as empty (displays "NA")',
    given: 'PbiDraft has businessRulesAndAssumptions = "   \\n\\t   " (whitespace only)',
    when: 'buildFieldPatches() processes the value',
    then: [
      '.trim() removes all whitespace',
      'Result is empty string',
      'businessRulesValue = "NA"',
      'Export shows <p>NA</p>',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '322 (trim logic)',
      expectedBehavior: 'whitespace.trim() === "" → NA',
    },
  },

  {
    id: '3.6',
    priority: 'P1',
    title: 'Business Rules with special characters is HTML-escaped correctly',
    given: 'PbiDraft has businessRulesAndAssumptions = "Limit < $10,000 & guest users only"',
    when: 'buildFieldPatches() escapes HTML',
    then: [
      'escapeHtml() is called on businessRulesValue',
      '< becomes &lt;',
      '& becomes &amp;',
      'No XSS vulnerability exists',
      'Export shows <p>Limit &lt; $10,000 &amp; guest users only</p>',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '326 (escapeHtml call)',
      escaping: 'this.escapeHtml(businessRulesValue)',
    },
  },

  {
    id: '3.7',
    priority: 'P1',
    title: 'Business Rules does not break export when other fields are empty',
    given: 'PbiDraft has only title, description, and businessRulesAndAssumptions (no AC, test scenarios, etc.)',
    when: 'pushDrafts() is called',
    then: [
      'Export succeeds without errors',
      'Description HTML includes Business Rules section',
      'Empty arrays for AC/tests do not interfere',
      'Work item is created in ADO',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '72-111 (pushDrafts method)',
      scenario: 'Minimal PBI with only businessRulesAndAssumptions',
    },
  },

  {
    id: '3.8',
    priority: 'P1',
    title: 'Multiple PBIs with different Business Rules values export correctly in batch',
    given: 'Array of PbiDrafts: [{ businessRules: "Rule A" }, { businessRules: "" }, { businessRules: "Rule B" }]',
    when: 'pushDrafts() processes all drafts',
    then: [
      'First PBI exports with "Rule A" content',
      'Second PBI exports with "NA" placeholder',
      'Third PBI exports with "Rule B" content',
      'No cross-contamination between drafts',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '83-111 (for loop processing drafts)',
      validation: 'Each draft processes independently',
    },
  },
];

/**
 * ============================================================================
 * CATEGORY 4: EDGE CASES
 * ============================================================================
 */

export const edgeCaseTests = [
  {
    id: '4.1',
    priority: 'P1',
    title: 'Very long Business Rules content (5000+ characters) exports correctly',
    given: 'PbiDraft has businessRulesAndAssumptions with 5000 characters',
    when: 'ADO export is triggered',
    then: [
      'No truncation occurs',
      'Full content is included in description HTML',
      'ADO API accepts the work item',
      'No performance issues in rendering',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: 'buildFieldPatches (no length limit on businessRules)',
      expectedBehavior: 'No truncation or errors',
    },
  },

  {
    id: '4.2',
    priority: 'P1',
    title: 'Business Rules with newlines preserves formatting',
    given: 'PbiDraft has businessRulesAndAssumptions = "Rule 1: Max $10k\\nRule 2: Guest only\\nRule 3: US residents"',
    when: 'buildFieldPatches() processes value',
    then: [
      'Newlines are preserved in HTML (or converted to <br>)',
      'Content displays as multi-line in ADO',
      'Formatting is readable',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '326 (escaping + HTML rendering)',
      expectedRendering: 'Newlines preserved or converted to <br>',
    },
  },

  {
    id: '4.3',
    priority: 'P2',
    title: 'Business Rules with unicode characters exports correctly',
    given: 'PbiDraft has businessRulesAndAssumptions = "Règles: €10,000 limite — ✓ vérifié"',
    when: 'ADO export is triggered',
    then: [
      'Unicode characters are preserved',
      'No encoding errors occur',
      'Content displays correctly in ADO',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: 'escapeHtml handles unicode',
      expectedBehavior: 'UTF-8 encoding preserved',
    },
  },

  {
    id: '4.4',
    priority: 'P2',
    title: 'Business Rules with HTML-like content does not render as HTML',
    given: 'PbiDraft has businessRulesAndAssumptions = "<script>alert(1)</script> or <b>bold</b>"',
    when: 'buildFieldPatches() escapes the value',
    then: [
      'HTML tags are escaped',
      'Result: "&lt;script&gt;alert(1)&lt;/script&gt; or &lt;b&gt;bold&lt;/b&gt;"',
      'No script execution or unwanted formatting in ADO',
      'XSS protection is validated',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '326 (escapeHtml)',
      security: 'HTML escaping prevents XSS',
    },
  },

  {
    id: '4.5',
    priority: 'P2',
    title: 'Navigating back from final step to Business Rules preserves data',
    given: 'User completes all steps including Business Rules',
    when: 'User is on final "User Story" step and clicks step node 4 (Business Rules)',
    then: [
      'Navigation jumps directly to Business Rules step',
      'Textarea shows previously entered content',
      'No data loss occurs',
      'User can edit and proceed forward again',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'Step navigation via clicking step nodes (line 216-222)',
      navigation: 'Direct step jumping via setStep(i)',
    },
  },

  {
    id: '4.6',
    priority: 'P2',
    title: 'Rapid navigation through Business Rules step does not lose data',
    given: 'User types text in Business Rules field',
    when: 'User rapidly clicks Next, then Back, then Next again',
    then: [
      'Text entered is preserved through rapid navigation',
      'React state updates handle rapid changes',
      'No race conditions cause data loss',
    ],
    implementation: {
      file: 'webview-ui/src/components/UserStoryWizard.tsx',
      lines: 'handleNext / handleBack + state updates',
      validation: 'State consistency during rapid interaction',
    },
  },
];

/**
 * ============================================================================
 * CATEGORY 5: INTEGRATION
 * ============================================================================
 */

export const integrationTests = [
  {
    id: '5.1',
    priority: 'P0',
    title: 'No TypeScript errors in UserStoryWizard after adding Business Rules',
    given: 'Business Rules step is added to UserStoryWizard',
    when: 'tsc --noEmit is run in webview-ui directory',
    then: [
      'No TypeScript compilation errors',
      'InvestWizardInput type matches component usage',
      'State types are correct',
    ],
    implementation: {
      command: 'cd webview-ui && npx tsc --noEmit',
      expectedResult: 'No errors',
    },
  },

  {
    id: '5.2',
    priority: 'P0',
    title: 'No TypeScript errors in adoService after using businessRulesAndAssumptions',
    given: 'adoService.ts accesses draft.businessRulesAndAssumptions',
    when: 'tsc --noEmit is run in root directory',
    then: [
      'No TypeScript compilation errors',
      'PbiDraft type includes businessRulesAndAssumptions?: string',
      'Optional chaining is used correctly',
    ],
    implementation: {
      command: 'npx tsc --noEmit',
      files: ['src/services/adoService.ts', 'src/shared/messages.ts'],
      expectedResult: 'No errors',
    },
  },

  {
    id: '5.3',
    priority: 'P0',
    title: 'Build succeeds after adding Business Rules feature',
    given: 'Business Rules changes are made across files',
    when: 'npm run build is executed',
    then: [
      'Extension build succeeds (npm run build:extension)',
      'Webview build succeeds (npm run build:webview)',
      'dist/ directory contains bundled files',
      'No build errors or warnings',
    ],
    implementation: {
      command: 'npm run build',
      expectedResult: 'Exit code 0, no errors',
    },
  },

  {
    id: '5.4',
    priority: 'P1',
    title: 'Business Rules data flows correctly from wizard to PbiDraft',
    given: 'User completes wizard including Business Rules',
    when: 'onGenerate callback is triggered',
    then: [
      'InvestWizardInput with businessRules is passed to DashboardPanel',
      'AI suggestion generation includes businessRules in context',
      'PbiDraft is updated with businessRulesAndAssumptions field',
      'Data persists in draft state',
    ],
    implementation: {
      files: [
        'webview-ui/src/components/UserStoryWizard.tsx',
        'webview-ui/src/views/PbiStudio.tsx',
        'src/panels/DashboardPanel.ts',
      ],
      dataFlow: 'wizard → onGenerate → DashboardPanel → draft update',
    },
  },

  {
    id: '5.5',
    priority: 'P1',
    title: 'Business Rules does not interfere with existing wizard behavior',
    given: 'Business Rules step is added',
    when: 'User completes wizard WITHOUT entering Business Rules data',
    then: [
      'All existing functionality works (Generate, Open in Chat)',
      'INVEST scoring is unchanged',
      'No regressions in navigation',
      'Other steps function normally',
    ],
    implementation: {
      files: ['webview-ui/src/components/UserStoryWizard.tsx'],
      validation: 'Non-breaking change to existing wizard',
    },
  },

  {
    id: '5.6',
    priority: 'P1',
    title: 'PBI with Business Rules can be pushed to ADO successfully',
    given: 'PbiDraft has all required fields + businessRulesAndAssumptions',
    when: 'User clicks "Push to ADO" in PbiStudio',
    then: [
      'pushDrafts() is called with draft',
      'Work item is created in Azure DevOps',
      'Description includes Business Rules section',
      'No errors occur during push',
      'Work item ID is returned and saved',
    ],
    implementation: {
      files: ['src/services/adoService.ts', 'src/panels/DashboardPanel.ts'],
      scenario: 'End-to-end ADO push with businessRulesAndAssumptions',
    },
  },

  {
    id: '5.7',
    priority: 'P1',
    title: 'Updating existing ADO work item with Business Rules works correctly',
    given: 'PBI was already pushed to ADO, then businessRulesAndAssumptions is updated',
    when: 'User clicks "Update in ADO"',
    then: [
      'updateDraftInAdo() is called',
      'Work item description is updated with new Business Rules content',
      'Other fields remain unchanged',
      'Update succeeds without errors',
    ],
    implementation: {
      file: 'src/services/adoService.ts',
      lines: '204-222 (updateDraftInAdo)',
      scenario: 'PATCH operation with updated businessRulesAndAssumptions',
    },
  },

  {
    id: '5.8',
    priority: 'P2',
    title: 'AI generation includes Business Rules in context when provided',
    given: 'User enters businessRules in wizard',
    when: 'generateFromInvestWizard() is called',
    then: [
      'businessRules value is included in AI prompt/context',
      'AI-generated ACs and test scenarios consider business rules',
      'Generated content is contextually relevant',
    ],
    implementation: {
      file: 'src/services/copilotService.ts',
      lines: 'generateFromInvestWizard method (around line 779-869)',
      validation: 'businessRules passed to AI context',
    },
  },
];

/**
 * ============================================================================
 * TEST SUMMARY
 * ============================================================================
 * 
 * Total Test Cases: 38
 * 
 * Breakdown by Priority:
 * - P0 (Blocking):     20 tests
 * - P1 (High):         13 tests
 * - P2 (Nice-to-have):  5 tests
 * 
 * Breakdown by Category:
 * - Wizard Step Behavior:        9 tests
 * - State Management:            7 tests
 * - ADO Export:                  8 tests
 * - Edge Cases:                  6 tests
 * - Integration:                 8 tests
 * 
 * Test Approach:
 * - All tests use Given/When/Then format
 * - Implementation guidance provided for each test
 * - Tests cover happy path, error cases, and edge cases
 * - No test framework dependencies (can be automated later)
 * - Focus on user perspective and integration points
 * 
 * Key Test Scenarios Covered:
 * ✅ Optional field behavior (no validation required)
 * ✅ Step positioning and navigation
 * ✅ Data persistence across navigation
 * ✅ ADO export with/without data
 * ✅ NA placeholder for empty values
 * ✅ Whitespace handling
 * ✅ HTML escaping and XSS protection
 * ✅ TypeScript type safety
 * ✅ Build integration
 * ✅ End-to-end workflow (wizard → draft → ADO)
 */
