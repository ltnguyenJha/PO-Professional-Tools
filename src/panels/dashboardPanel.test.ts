/**
 * dashboardPanel.test.ts
 *
 * Comprehensive test cases for message handling and data persistence in DashboardPanel.
 *
 * Tests validate:
 * - WIZARD_DRAFT_SAVE persists businessRulesAndAssumptions and userStoryStatement
 * - PUSH_PBI_TO_ADO includes new fields in patch
 * - GENERATE_FROM_INVEST_WIZARD routes data correctly
 * - State management doesn't lose data
 *
 * Focus areas:
 * - Message handling: correct routing and parameter passing
 * - Data persistence: draft updates, state changes
 * - Integration: message → service → ADO flow
 */


/**
 * ============================================================================
 * WIZARD_DRAFT_SAVE MESSAGE TESTS
 * ============================================================================
 */

export const wizardDraftSaveTests = [
  {
    id: 'SAVE-001',
    priority: 'P0',
    title: 'WIZARD_DRAFT_SAVE with businessRulesAndAssumptions → field persisted to draft',
    category: 'Message Handling - Save',
    given: `
      WebviewRequest: {
        type: 'WIZARD_DRAFT_SAVE',
        payload: {
          draftId: 'abc123',
          partialDraft: {
            businessRulesAndAssumptions: 'Only US citizens. Max $10K per transaction.'
          },
          currentStep: 3
        }
      }
    `,
    when: 'DashboardPanel.onMessage routes to WIZARD_DRAFT_SAVE handler',
    then: [
      'DashboardPanel finds draft by draftId',
      'PbiDraftService.updateDraft called with partialDraft',
      'Draft.businessRulesAndAssumptions updated to exact value',
      'Draft persisted (saved to extension storage)',
      'STATE_UPDATED event emitted to webview with updated draft'
    ],
    expectedBehavior: 'Business rules data persisted and state updated'
  },

  {
    id: 'SAVE-002',
    priority: 'P0',
    title: 'WIZARD_DRAFT_SAVE with userStoryStatement → field persisted',
    category: 'Message Handling - Save',
    given: `
      partialDraft: {
        userStoryStatement: 'Users need to view transaction history for reconciliation'
      }
    `,
    when: 'Save handler processes message',
    then: [
      'Draft.userStoryStatement updated',
      'Persisted to storage',
      'STATE_UPDATED emitted'
    ],
    expectedBehavior: 'User story statement data persisted'
  },

  {
    id: 'SAVE-003',
    priority: 'P0',
    title: 'WIZARD_DRAFT_SAVE with both new fields → both persisted',
    category: 'Message Handling - Save',
    given: `
      partialDraft: {
        userStoryStatement: 'Statement text',
        businessRulesAndAssumptions: 'Rules text'
      }
    `,
    when: 'Save handler processes',
    then: [
      'Both fields updated in draft',
      'Both persisted',
      'Draft state consistent'
    ],
    expectedBehavior: 'Multiple fields saved together'
  },

  {
    id: 'SAVE-004',
    priority: 'P0',
    title: 'Navigation away from Step 4 and back → businessRulesAndAssumptions reloaded correctly',
    category: 'Message Handling - State',
    given: `
      User on Step 4 (Business Rules), enters text, navigates to Step 5, then back to Step 4
    `,
    when: 'WIZARD_DRAFT_SAVE sent when leaving Step 4, then WIZARD_DRAFT_LOAD sent when returning',
    then: [
      'SAVE: businessRulesAndAssumptions persisted',
      'LOAD: Draft loaded with exact businessRulesAndAssumptions value',
      'Webview UI populates textarea with saved value',
      'No data loss'
    ],
    expectedBehavior: 'Round-trip data persistence works'
  },

  {
    id: 'SAVE-005',
    priority: 'P1',
    title: 'WIZARD_DRAFT_SAVE with empty string businessRulesAndAssumptions → saved as empty (not "NA")',
    category: 'Message Handling - Empty Data',
    given: 'User clears Business Rules field and saves',
    when: 'WIZARD_DRAFT_SAVE sent with businessRulesAndAssumptions: ""',
    then: [
      'Draft.businessRulesAndAssumptions set to empty string',
      'Persisted as empty (not converted to "NA" at this stage)',
      'Later, when pushed to ADO, adoService converts empty → "NA" for display'
    ],
    expectedBehavior: 'Empty field preserved through wizard layer'
  },

  {
    id: 'SAVE-006',
    priority: 'P1',
    title: 'WIZARD_DRAFT_SAVE preserves other draft fields (description, AC, TS) unchanged',
    category: 'Message Handling - Regression',
    given: `
      Draft has existing: description, acceptanceCriteria, testScenarios
      Save message updates only businessRulesAndAssumptions
    `,
    when: 'Save handler processes',
    then: [
      'businessRulesAndAssumptions updated',
      'description, acceptanceCriteria, testScenarios unchanged',
      'No data loss in other fields'
    ],
    expectedBehavior: 'Partial update does not overwrite other fields'
  }
];

/**
 * ============================================================================
 * PUSH_PBI_TO_ADO MESSAGE TESTS
 * ============================================================================
 */

export const pushPbiToAdoTests = [
  {
    id: 'PUSH-001',
    priority: 'P0',
    title: 'PUSH_PBI_TO_ADO with populated businessRulesAndAssumptions → included in ADO patch',
    category: 'Message Handling - Push',
    given: `
      WebviewRequest: {
        type: 'PUSH_PBI_TO_ADO',
        payload: {
          draftId: 'draft1',
          draft: {
            id: 'draft1',
            title: 'Enable auto-approval',
            description: 'Main description...',
            businessRulesAndAssumptions: 'Transactions under $5K approved automatically.',
            ...other fields
          }
        }
      }
    `,
    when: 'DashboardPanel.handlePushPbiToAdo called',
    then: [
      'Draft loaded (or passed in payload)',
      'ADO_PROGRESS message sent: busy true',
      'AdoService.pushDrafts called with draft array including businessRulesAndAssumptions',
      'AdoService.buildFieldPatches called',
      'Patch includes System.Description with Business Rules section',
      'ADO API call made',
      'Work item created in ADO',
      'ADO_PROGRESS sent: busy false, success message',
      'Work item URL included in response'
    ],
    expectedBehavior: 'Push operation includes business rules in ADO'
  },

  {
    id: 'PUSH-002',
    priority: 'P0',
    title: 'PUSH_PBI_TO_ADO with empty businessRulesAndAssumptions → ADO shows "NA"',
    category: 'Message Handling - Push',
    given: `
      draft: {
        businessRulesAndAssumptions: ''
      }
    `,
    when: 'Push handler processes',
    then: [
      'buildFieldPatches receives draft with empty businessRulesAndAssumptions',
      'Patch generates description with <p>NA</p> for Business Rules',
      'ADO work item created with "NA" displayed',
      'No crash or ADO error'
    ],
    expectedBehavior: 'Empty business rules handled in push'
  },

  {
    id: 'PUSH-003',
    priority: 'P0',
    title: 'PUSH_PBI_TO_ADO with userStoryStatement → included in ADO description',
    category: 'Message Handling - Push',
    given: `
      draft: {
        userStoryStatement: 'Users need to export compliance reports'
      }
    `,
    when: 'Push handler processes',
    then: [
      'buildFieldPatches includes userStoryStatement in description',
      'Description has User Story Statement section before Business Rules',
      'Work item created with correct section ordering'
    ],
    expectedBehavior: 'User story statement included in push'
  },

  {
    id: 'PUSH-004',
    priority: 'P0',
    title: 'PUSH_PBI_TO_ADO with both new fields → correct section ordering in ADO',
    category: 'Message Handling - Push',
    given: `
      draft with:
      - userStoryStatement: 'Statement'
      - businessRulesAndAssumptions: 'Rules'
      - testScenarios: ['Test 1', 'Test 2']
    `,
    when: 'Push processes',
    then: [
      'ADO description has sections in order:',
      '  1. Main description',
      '  2. User Story Statement',
      '  3. Business Rules and Assumptions',
      '  4. Test Scenarios',
      '  5. Technical Considerations (if present)',
      '  6. PO Tools Metadata'
    ],
    expectedBehavior: 'Section ordering correct in ADO'
  },

  {
    id: 'PUSH-005',
    priority: 'P0',
    title: 'Multiple drafts pushed together (bulk) → all include new fields correctly',
    category: 'Message Handling - Bulk Push',
    given: `
      PUSH_PBI_TO_ADO with multiple draftIds, all having businessRulesAndAssumptions and userStoryStatement
    `,
    when: 'Bulk push processes',
    then: [
      'Each draft processed individually',
      'Each patch includes correct field data',
      'All work items created with proper sections',
      'Bulk result reports success for all'
    ],
    expectedBehavior: 'Bulk push handles new fields for all items'
  },

  {
    id: 'PUSH-006',
    priority: 'P0',
    title: 'ADO push fails due to API error → user notified, draft not corrupted',
    category: 'Message Handling - Error',
    given: 'ADO API returns error (network, auth, validation)',
    when: 'Push handler processes',
    then: [
      'Error caught in handlePushPbiToAdo',
      'TOAST sent with level: error, message explaining failure',
      'Draft state unchanged (not marked as pushed)',
      'User can retry'
    ],
    expectedBehavior: 'Push errors handled gracefully'
  }
];

/**
 * ============================================================================
 * UPDATE_PBI_IN_ADO MESSAGE TESTS
 * ============================================================================
 */

export const updatePbiInAdoTests = [
  {
    id: 'UPDATE-001',
    priority: 'P0',
    title: 'UPDATE_PBI_IN_ADO with modified businessRulesAndAssumptions → ADO work item updated',
    category: 'Message Handling - Update',
    given: `
      WebviewRequest: {
        type: 'UPDATE_PBI_IN_ADO',
        payload: {
          draftId: 'draft1',
          draft: {
            ...existing draft...
            businessRulesAndAssumptions: 'Updated rules: Max $20K now (was $10K)'
          }
        }
      }
    `,
    when: 'DashboardPanel.handleUpdatePbiInAdo called',
    then: [
      'Draft loaded',
      'AdoService.updateDraftInAdo called with updated draft',
      'buildFieldPatches called with updated draft',
      'Patch sent to ADO updateWorkItem',
      'ADO work item description updated',
      'User sees success toast',
      'Draft marked as updated'
    ],
    expectedBehavior: 'Updates propagate to ADO'
  },

  {
    id: 'UPDATE-002',
    priority: 'P0',
    title: 'UPDATE_PBI_IN_ADO clearing businessRulesAndAssumptions → ADO shows "NA"',
    category: 'Message Handling - Update',
    given: `
      Existing ADO work item has Business Rules populated
      User updates draft, clearing businessRulesAndAssumptions
    `,
    when: 'Update processes',
    then: [
      'Patch includes empty businessRulesAndAssumptions',
      'ADO description updated to show <p>NA</p>',
      'Work item reflects change'
    ],
    expectedBehavior: 'Clearing rules updates ADO to "NA"'
  },

  {
    id: 'UPDATE-003',
    priority: 'P0',
    title: 'UPDATE_PBI_IN_ADO with modified userStoryStatement → ADO updated',
    category: 'Message Handling - Update',
    given: 'Draft with updated userStoryStatement',
    when: 'Update processes',
    then: [
      'ADO description includes new User Story Statement section',
      'Positioning preserved (after description, before Business Rules)',
      'Work item displays correctly'
    ],
    expectedBehavior: 'User story updates reflected in ADO'
  }
];

/**
 * ============================================================================
 * GENERATE_FROM_INVEST_WIZARD MESSAGE TESTS
 * ============================================================================
 */

export const generateFromInvestWizardMessageTests = [
  {
    id: 'GEN-001',
    priority: 'P0',
    title: 'GENERATE_FROM_INVEST_WIZARD message includes businessRulesAndAssumptions → passed to CopilotService',
    category: 'Message Handling - Generate',
    given: `
      WebviewRequest: {
        type: 'GENERATE_FROM_INVEST_WIZARD',
        payload: {
          draftId: 'xyz',
          wizard: {
            background: '...',
            why: '...',
            how: '...',
            persona: '...',
            want: '...',
            benefit: '...',
            businessRulesAndAssumptions: 'Compliance required. Budget $50K.'
          }
        }
      }
    `,
    when: 'DashboardPanel.handleGenerateFromInvestWizard called',
    then: [
      'Draft loaded by draftId',
      'AI_PROGRESS message sent',
      'CopilotService.generateFromInvestWizard called with wizard object',
      'wizard.businessRulesAndAssumptions passed to AI service',
      'AI prompt includes BUSINESS RULES section',
      'Suggestion generated',
      'Draft updated with AI result',
      'businessRulesAndAssumptions preserved in draft',
      'Success toast sent'
    ],
    expectedBehavior: 'Business rules flow through generate → AI → draft'
  },

  {
    id: 'GEN-002',
    priority: 'P0',
    title: 'GENERATE_FROM_INVEST_WIZARD without businessRulesAndAssumptions → generation succeeds',
    category: 'Message Handling - Generate',
    given: 'Wizard with businessRulesAndAssumptions undefined',
    when: 'Generate handler processes',
    then: [
      'CopilotService.generateFromInvestWizard handles undefined field',
      'AI prompt omits BUSINESS RULES section',
      'Generation succeeds',
      'Story created'
    ],
    expectedBehavior: 'Optional field does not break generation'
  },

  {
    id: 'GEN-003',
    priority: 'P0',
    title: 'GENERATE_FROM_INVEST_WIZARD fails → error toast, draft not corrupted',
    category: 'Message Handling - Generate',
    given: 'AI unavailable or language model error',
    when: 'Error thrown in CopilotService',
    then: [
      'Error caught in handleGenerateFromInvestWizard catch block',
      'Error message extracted',
      'TOAST sent with level: error, message',
      'Draft state unchanged',
      'AI_PROGRESS sent: busy false'
    ],
    expectedBehavior: 'Generation errors handled gracefully'
  },

  {
    id: 'GEN-004',
    priority: 'P1',
    title: 'OPEN_INVEST_WIZARD_IN_CHAT message with businessRulesAndAssumptions → chat prompt includes rules',
    category: 'Message Handling - Chat',
    given: `
      WebviewRequest: {
        type: 'OPEN_INVEST_WIZARD_IN_CHAT',
        payload: {
          draftId: 'xyz',
          wizard: { ...businessRulesAndAssumptions: 'Rules...' }
        }
      }
    `,
    when: 'Handler processes',
    then: [
      'CopilotService.openInvestWizardInChat called',
      'Chat prompt built with wizard data',
      'businessRulesAndAssumptions included in chat prompt',
      'Copilot Chat opened with prompt'
    ],
    expectedBehavior: 'Chat session includes business rules'
  }
];

/**
 * ============================================================================
 * STATE UPDATE TESTS
 * ============================================================================
 */

export const stateUpdateTests = [
  {
    id: 'STATE-001',
    priority: 'P0',
    title: 'After WIZARD_DRAFT_SAVE, STATE_UPDATED event includes updated fields',
    category: 'State Management',
    given: 'User saves Business Rules in wizard',
    when: 'WIZARD_DRAFT_SAVE processed',
    then: [
      'Draft updated in memory',
      'STATE_UPDATED event posted to webview',
      'Event includes updated AppStatePayload with PbiDrafts array',
      'Draft in array includes businessRulesAndAssumptions with new value',
      'Webview receives state and re-renders with new data',
      'Textarea field shows updated value'
    ],
    expectedBehavior: 'UI reflects saved data'
  },

  {
    id: 'STATE-002',
    priority: 'P0',
    title: 'After PUSH_PBI_TO_ADO success, STATE_UPDATED includes adoWorkItemId',
    category: 'State Management',
    given: 'Draft successfully pushed to ADO',
    when: 'Push completes',
    then: [
      'Draft.adoWorkItemId set to returned ID',
      'Draft.adoWorkItemUrl set',
      'Draft.status set to "pushed"',
      'STATE_UPDATED emitted',
      'Webview receives updated state'
    ],
    expectedBehavior: 'Draft marked as pushed in state'
  },

  {
    id: 'STATE-003',
    priority: 'P1',
    title: 'Multiple drafts modified → STATE_UPDATED includes all changes',
    category: 'State Management',
    given: 'User edits business rules in multiple drafts',
    when: 'Each WIZARD_DRAFT_SAVE sent',
    then: [
      'Each draft updated individually',
      'Final STATE_UPDATED includes all drafts with latest data',
      'No conflicts or missing updates'
    ],
    expectedBehavior: 'State consistent across multiple drafts'
  }
];

/**
 * ============================================================================
 * EDGE CASE MESSAGE TESTS
 * ============================================================================
 */

export const edgeCaseMessageTests = [
  {
    id: 'EDGE-001',
    priority: 'P1',
    title: 'WIZARD_DRAFT_SAVE with very long businessRulesAndAssumptions (10KB+) → persisted without truncation',
    category: 'Edge Cases',
    given: 'Business rules field: 10,000+ character string',
    when: 'WIZARD_DRAFT_SAVE sent',
    then: [
      'Draft.businessRulesAndAssumptions set to full string',
      'Persisted to storage (assuming storage supports it)',
      'Later push to ADO includes full text',
      'No truncation'
    ],
    expectedBehavior: 'Long content handled'
  },

  {
    id: 'EDGE-002',
    priority: 'P1',
    title: 'PUSH_PBI_TO_ADO with special characters in both new fields → ADO patch valid',
    category: 'Edge Cases',
    given: `
      businessRulesAndAssumptions: "<script>alert()</script> & \\"quoted\\""
      userStoryStatement: "Users (世界) need 🚀 speed"
    `,
    when: 'Push processes',
    then: [
      'buildFieldPatches escapes HTML and quotes',
      'Unicode preserved',
      'Patch sent to ADO successfully',
      'No injection or parsing errors'
    ],
    expectedBehavior: 'Special characters handled safely'
  },

  {
    id: 'EDGE-003',
    priority: 'P1',
    title: 'Rapid successive WIZARD_DRAFT_SAVE messages → all processed, last one wins',
    category: 'Edge Cases',
    given: 'User types quickly in Business Rules field, generating many SAVE messages',
    when: 'Messages queued and processed',
    then: [
      'Each message processed in order',
      'Final state reflects last SAVE',
      'No data loss or corruption',
      'No race conditions'
    ],
    expectedBehavior: 'Sequential message processing'
  },

  {
    id: 'EDGE-004',
    priority: 'P1',
    title: 'Message with missing draftId → error handled gracefully',
    category: 'Edge Cases',
    given: `
      WIZARD_DRAFT_SAVE payload: {
        draftId: 'nonexistent',
        partialDraft: { businessRulesAndAssumptions: '...' }
      }
    `,
    when: 'Handler tries to find draft',
    then: [
      'findDraft returns null or undefined',
      'Error caught and handled',
      'Toast or error message sent',
      'No unhandled exception',
      'Extension remains stable'
    ],
    expectedBehavior: 'Missing draft handled'
  },

  {
    id: 'EDGE-005',
    priority: 'P1',
    title: 'Malformed payload (missing required fields) → validation error',
    category: 'Edge Cases',
    given: `
      WIZARD_DRAFT_SAVE payload: {
        draftId: 'xyz'
        // missing partialDraft
      }
    `,
    when: 'Handler receives message',
    then: [
      'TypeScript or runtime validation catches missing field',
      'Error message clear',
      'Handler does not crash',
      'Extension stable'
    ],
    expectedBehavior: 'Payload validation works'
  }
];

/**
 * ============================================================================
 * TESTING EXECUTION NOTES
 * ============================================================================
 *
 * These test cases verify the message/state layer of the extension.
 *
 * QUICK START (Manual Execution):
 *
 * 1. **Message Routing (SAVE-001):**
 *    - Create PBI, open wizard to Step 4 (Business Rules)
 *    - Enter text: "Test rule content"
 *    - Navigate away (moves to Step 5)
 *    - Check extension logs or DevTools
 *    - Verify WIZARD_DRAFT_SAVE message sent with businessRulesAndAssumptions
 *
 * 2. **State Persistence (STATE-001):**
 *    - After Step 4 navigation, go back to Step 3
 *    - Return to Step 4
 *    - Verify textarea still shows "Test rule content"
 *    - Business rules persisted and reloaded
 *
 * 3. **Push with Data (PUSH-001):**
 *    - Create PBI with Business Rules and User Story Statement
 *    - Click "Push to ADO"
 *    - Go to ADO work item
 *    - Verify description includes both sections
 *    - Verify section ordering correct
 *
 * 4. **Empty Field Handling (PUSH-002):**
 *    - Create PBI, skip Step 4 (leave Business Rules empty)
 *    - Push to ADO
 *    - Verify Business Rules section shows "NA"
 *    - Verify User Story Statement section not present (if empty)
 *
 * 5. **Error Handling (PUSH-006):**
 *    - Create PBI with invalid ADO settings
 *    - Try to push
 *    - Verify error toast
 *    - Verify draft not corrupted
 *
 * AUTOMATED EXECUTION (Future - with Jest/Vitest):
 *
 * Mock:
 * - DashboardPanel methods
 * - PbiDraftService persistence
 * - AdoService API calls
 *
 * Test:
 * - Message routing
 * - State updates
 * - Error paths
 * - Data consistency
 */

/**
 * ============================================================================
 * ISSUE #2: Team Selection Feature - Message Handler Tests
 * ============================================================================
 * 
 * Testing FETCH_ADO_TEAMS, FETCH_AREA_PATHS, and FETCH_ITERATIONS message handlers
 * with cache management, error handling, and proper response formatting.
 */

export const teamSelectionMessageHandlerTests = [
  // **FETCH_ADO_TEAMS Handler**
  {
    id: 'FETCH-TEAMS-001',
    priority: 'P0',
    title: 'FETCH_ADO_TEAMS receives message type correctly',
    category: 'Message Handling - Fetch Teams',
    given: 'Webview sends: { type: "FETCH_ADO_TEAMS" }',
    when: 'DashboardPanel.handleMessage() routes message',
    then: [
      'Message type recognized and routed to handleFetchTeams()',
      'Handler invoked without errors',
      'No unexpected side effects'
    ],
    expectedBehavior: 'Message routing works correctly'
  },

  {
    id: 'FETCH-TEAMS-002',
    priority: 'P0',
    title: 'FETCH_ADO_TEAMS returns TEAMS_LOADED with string[] payload',
    category: 'Message Handling - Fetch Teams',
    given: 'ADO settings configured, PAT valid, teams exist',
    when: 'handleFetchTeams() executes',
    then: [
      'adoService.fetchTeams() called with settings and PAT',
      'Response posted: { type: "TEAMS_LOADED", payload: ["Team A", "Team B"] }',
      'Payload is array of strings',
      'No error messages sent'
    ],
    expectedBehavior: 'Teams fetched and sent to webview'
  },

  {
    id: 'FETCH-TEAMS-003',
    priority: 'P0',
    title: 'FETCH_ADO_TEAMS returns FETCH_FAILED with error message on failure',
    category: 'Message Handling - Fetch Teams Error',
    given: 'ADO settings invalid or network error',
    when: 'handleFetchTeams() executes and adoService throws error',
    then: [
      'Error caught in handler',
      'Response posted: { type: "FETCH_FAILED", payload: { type: "teams", error: "error message" } }',
      'Error message includes helpful context',
      'No crash or unhandled rejection'
    ],
    expectedBehavior: 'Errors handled gracefully, webview notified'
  },

  {
    id: 'FETCH-TEAMS-004',
    priority: 'P0',
    title: 'FETCH_ADO_TEAMS uses cache when valid',
    category: 'Message Handling - Cache',
    given: 'Teams cached <30 min ago',
    when: 'handleFetchTeams() executes',
    then: [
      'getCachedData("ado.cache.teams") called',
      'Cached data returned if timestamp < 30 min',
      'TEAMS_LOADED posted with cached data',
      'No API call made to adoService'
    ],
    expectedBehavior: 'Cache used for fast response'
  },

  {
    id: 'FETCH-TEAMS-005',
    priority: 'P0',
    title: 'FETCH_ADO_TEAMS fetches fresh when cache stale',
    category: 'Message Handling - Cache Expiration',
    given: 'Teams cached >30 min ago',
    when: 'handleFetchTeams() executes',
    then: [
      'Cache detected as stale',
      'adoService.fetchTeams() called',
      'setCachedData("ado.cache.teams", newData) called',
      'TEAMS_LOADED posted with fresh data'
    ],
    expectedBehavior: 'Stale cache triggers fresh fetch'
  },

  // **FETCH_AREA_PATHS Handler**
  {
    id: 'FETCH-AREAS-001',
    priority: 'P0',
    title: 'FETCH_AREA_PATHS accepts optional teamId parameter',
    category: 'Message Handling - Fetch Areas',
    given: 'Webview sends: { type: "FETCH_AREA_PATHS", payload: { teamId: "team-abc" } }',
    when: 'handleFetchAreaPaths() executes',
    then: [
      'teamId extracted from payload',
      'adoService.fetchAreaPaths(settings, pat, "team-abc") called',
      'Areas filtered by team (if supported by backend)'
    ],
    expectedBehavior: 'TeamId parameter passed correctly'
  },

  {
    id: 'FETCH-AREAS-002',
    priority: 'P0',
    title: 'FETCH_AREA_PATHS returns AREAS_LOADED with formatted paths',
    category: 'Message Handling - Fetch Areas',
    given: 'Areas exist in ADO project',
    when: 'handleFetchAreaPaths() executes',
    then: [
      'adoService.fetchAreaPaths() called',
      'Response: { type: "AREAS_LOADED", payload: ["Project\\\\Area1", "Project\\\\Area2"] }',
      'Format matches SettingsView expectations',
      'Paths properly escaped (double backslash)'
    ],
    expectedBehavior: 'Area paths fetched and formatted'
  },

  {
    id: 'FETCH-AREAS-003',
    priority: 'P0',
    title: 'FETCH_AREA_PATHS handles missing teamId (returns all areas)',
    category: 'Message Handling - Fetch Areas',
    given: 'Webview sends: { type: "FETCH_AREA_PATHS" } (no teamId)',
    when: 'handleFetchAreaPaths() executes',
    then: [
      'teamId undefined or null',
      'adoService.fetchAreaPaths(settings, pat, undefined) called',
      'All project areas returned',
      'No filtering applied'
    ],
    expectedBehavior: 'Missing teamId returns all areas'
  },

  {
    id: 'FETCH-AREAS-004',
    priority: 'P0',
    title: 'FETCH_AREA_PATHS returns error on failure',
    category: 'Message Handling - Fetch Areas Error',
    given: 'ADO API call fails',
    when: 'handleFetchAreaPaths() executes',
    then: [
      'Error caught',
      'Response: { type: "FETCH_FAILED", payload: { type: "areas", error: "message" } }',
      'Webview can display error and fallback to text input'
    ],
    expectedBehavior: 'Error handled and communicated'
  },

  // **FETCH_ITERATIONS Handler**
  {
    id: 'FETCH-ITERS-001',
    priority: 'P0',
    title: 'FETCH_ITERATIONS accepts optional teamId parameter',
    category: 'Message Handling - Fetch Iterations',
    given: 'Webview sends: { type: "FETCH_ITERATIONS", payload: { teamId: "team-xyz" } }',
    when: 'handleFetchIterations() executes',
    then: [
      'teamId extracted from payload',
      'adoService.fetchIterations(settings, pat, "team-xyz") called',
      'Iterations filtered by team'
    ],
    expectedBehavior: 'TeamId parameter used correctly'
  },

  {
    id: 'FETCH-ITERS-002',
    priority: 'P0',
    title: 'FETCH_ITERATIONS returns ITERATIONS_LOADED with properly formatted paths',
    category: 'Message Handling - Fetch Iterations',
    given: 'Iterations exist in ADO project',
    when: 'handleFetchIterations() executes',
    then: [
      'adoService.fetchIterations() called',
      'Response: { type: "ITERATIONS_LOADED", payload: ["Project\\\\Sprint 1", "Project\\\\Sprint 2"] }',
      'Format matches resolveIterationPathForPush() expectations',
      'Paths properly escaped'
    ],
    expectedBehavior: 'Iterations fetched and formatted'
  },

  {
    id: 'FETCH-ITERS-003',
    priority: 'P0',
    title: 'FETCH_ITERATIONS verifies format matches iterationUtils expectations',
    category: 'Message Handling - Format Validation',
    given: 'Iterations returned from handler',
    when: 'Data passed to resolveIterationPathForPush()',
    then: [
      'Format parsing succeeds',
      'No errors thrown by iterationUtils',
      'Iteration paths resolve correctly in ADO push'
    ],
    expectedBehavior: 'Format compatibility verified'
  },

  {
    id: 'FETCH-ITERS-004',
    priority: 'P0',
    title: 'FETCH_ITERATIONS returns error on failure',
    category: 'Message Handling - Fetch Iterations Error',
    given: 'ADO API call fails',
    when: 'handleFetchIterations() executes',
    then: [
      'Error caught',
      'Response: { type: "FETCH_FAILED", payload: { type: "iterations", error: "message" } }',
      'Webview displays error'
    ],
    expectedBehavior: 'Error handled'
  },

  // **Cache Management in Handlers**
  {
    id: 'CACHE-HANDLER-001',
    priority: 'P0',
    title: 'Cache keys follow pattern: ado.cache.[type]',
    category: 'Cache - Key Management',
    given: 'All three handlers',
    when: 'Cache operations performed',
    then: [
      'Teams use key: "ado.cache.teams"',
      'Areas use key: "ado.cache.areas"',
      'Iterations use key: "ado.cache.iterations"',
      'Keys consistent across get/set operations'
    ],
    expectedBehavior: 'Cache keys consistent and predictable'
  },

  {
    id: 'CACHE-HANDLER-002',
    priority: 'P0',
    title: 'Cache cleared on SAVE_ADO_SETTINGS',
    category: 'Cache - Invalidation',
    given: 'User saves ADO settings',
    when: 'SAVE_ADO_SETTINGS handler executes',
    then: [
      'clearCache() called for all dropdown caches',
      'Next fetch triggers fresh API call',
      'Ensures data consistency with new settings'
    ],
    expectedBehavior: 'Cache invalidated on settings change'
  },

  {
    id: 'CACHE-HANDLER-003',
    priority: 'P1',
    title: 'Cache timestamp stored in globalState',
    category: 'Cache - Storage',
    given: 'Data cached by handler',
    when: 'setCachedData() called',
    then: [
      'Object stored: { data: [...], timestamp: Date.now() }',
      'Timestamp used for expiration check',
      'Data retrievable via getCachedData()'
    ],
    expectedBehavior: 'Cache includes timestamp for expiration'
  },

  // **Integration with Settings Persistence**
  {
    id: 'INTEGRATION-001',
    priority: 'P0',
    title: 'SAVE_ADO_SETTINGS includes team/area/iteration values',
    category: 'Integration - Save',
    given: 'User selects team, area, iteration in SettingsView',
    when: 'Save button clicked and SAVE_ADO_SETTINGS message sent',
    then: [
      'Payload includes: { team: "Team A", areaPath: "Project\\\\Area1", iterationPath: "Project\\\\Sprint 1" }',
      'settingsService.saveAdoSettings() called with all fields',
      'Values persisted to extension storage',
      'STATE_UPDATED posted to webview with updated settings'
    ],
    expectedBehavior: 'Team selection persisted with other settings'
  },

  {
    id: 'INTEGRATION-002',
    priority: 'P0',
    title: 'Settings persist across view re-renders',
    category: 'Integration - Persistence',
    given: 'User saves team selection',
    when: 'Dashboard closed and reopened',
    then: [
      'APP_READY message triggers postState()',
      'adoSettings includes saved team/area/iteration',
      'SettingsView pre-populates dropdowns with saved values',
      'User sees their previous selections'
    ],
    expectedBehavior: 'Settings restored on view reload'
  },

  {
    id: 'INTEGRATION-003',
    priority: 'P1',
    title: 'Error handling does not corrupt existing settings',
    category: 'Integration - Error Safety',
    given: 'Fetch fails for teams dropdown',
    when: 'User manually enters team in fallback input and saves',
    then: [
      'Manual entry saved correctly',
      'Other settings (org, project, PAT) remain intact',
      'No data loss due to fetch failure',
      'Next load shows manual entry'
    ],
    expectedBehavior: 'Fallback input works without corrupting settings'
  }
];
