/**
 * copilotService.test.ts
 *
 * Comprehensive test cases for AI prompt generation with Business Rules and User Story Statement.
 *
 * Tests validate:
 * - AI prompt includes wizard input data correctly
 * - Business Rules and User Story Statement flow through to AI generation
 * - Edge cases: empty fields, special formatting, very long content
 *
 * Focus areas:
 * - Happy path: Full data flows to AI prompt
 * - Unhappy paths: Missing optional fields, special characters in prompt
 * - JSON repair: Parser handles AI output correctly
 * - Error handling: Graceful failures on malformed AI responses
 */

import { InvestWizardInput, PbiDraft, AiSuggestion } from '../shared/messages';

/**
 * ============================================================================
 * AI PROMPT GENERATION TESTS
 * ============================================================================
 */

export const aiPromptGenerationTests = [
  {
    id: 'PROMPT-001',
    priority: 'P0',
    title: 'generateFromInvestWizard includes businessRulesAndAssumptions in user prompt when present',
    category: 'AI Prompt - Happy Path',
    given: `
      PbiDraft and InvestWizardInput:
      - wizard.background: "Manual approval process takes 2 days"
      - wizard.why: "Reduce time to market"
      - wizard.how: "Automate via workflow"
      - wizard.businessRulesAndAssumptions: "Transactions over $100K require CFO approval. US only."
    `,
    when: 'CopilotService.generateFromInvestWizard builds userPrompt',
    then: [
      'User prompt includes section header: "BUSINESS RULES & ASSUMPTIONS:"',
      'Section includes exact text: "Transactions over $100K require CFO approval. US only."',
      'Section appears after HOW and before USER STORY',
      'Prompt passed to language model includes full business rules'
    ],
    expectedBehavior: 'Business rules inform story generation'
  },

  {
    id: 'PROMPT-002',
    priority: 'P0',
    title: 'generateFromInvestWizard omits businessRulesAndAssumptions section when empty/undefined',
    category: 'AI Prompt - Unhappy Path',
    given: `
      InvestWizardInput:
      - businessRulesAndAssumptions: undefined (or empty string or whitespace-only)
    `,
    when: 'CopilotService.generateFromInvestWizard builds userPrompt',
    then: [
      'User prompt does NOT include "BUSINESS RULES & ASSUMPTIONS:" section',
      'Prompt still includes all other INVEST sections (background, why, how, user story)',
      'Prompt remains valid and is sent to language model',
      'AI generates story without business rules input (uses defaults)'
    ],
    expectedBehavior: 'Optional field gracefully omitted from prompt'
  },

  {
    id: 'PROMPT-003',
    priority: 'P0',
    title: 'generateFromInvestWizard with businessRulesAndAssumptions containing special characters → prompt safe',
    category: 'AI Prompt - Special Characters',
    given: `
      wizard.businessRulesAndAssumptions: 'Rules: "PCI-DSS v3.2.1" && ISO 27001. No <script> allowed.'
    `,
    when: 'User prompt is constructed',
    then: [
      'Prompt includes full text without truncation',
      'No JSON encoding issues (no double-escaping)',
      'No prompt injection attacks',
      'Prompt sent to language model as-is (not HTML-escaped yet)',
      'Language model receives literal text for understanding'
    ],
    expectedBehavior: 'Special characters preserved in prompt (JSON-safe)'
  },

  {
    id: 'PROMPT-004',
    priority: 'P1',
    title: 'generateFromInvestWizard with very long businessRulesAndAssumptions → prompt includes full text (no truncation)',
    category: 'AI Prompt - Long Content',
    given: 'wizard.businessRulesAndAssumptions: 5000+ character string of detailed business rules',
    when: 'User prompt built',
    then: [
      'Entire business rules text included in prompt',
      'No truncation at character limit',
      'Language model receives complete context',
      'Response generation may be slower but succeeds'
    ],
    expectedBehavior: 'Long business rules fully communicated to AI'
  },

  {
    id: 'PROMPT-005',
    priority: 'P1',
    title: 'generateFromInvestWizard with multiline businessRulesAndAssumptions → newlines preserved in prompt',
    category: 'AI Prompt - Formatting',
    given: `
      wizard.businessRulesAndAssumptions: 
        "Rule 1: Compliance with GDPR
         Rule 2: Data retention 90 days
         Rule 3: User consent required"
    `,
    when: 'Prompt constructed',
    then: [
      'Newlines preserved in prompt string',
      'AI receives properly formatted, multi-line rules',
      'AI understands structured rules correctly',
      'Generated story respects multi-line structure'
    ],
    expectedBehavior: 'Multiline business rules formatted correctly'
  }
];

/**
 * ============================================================================
 * WIZARD DATA FLOW TESTS
 * ============================================================================
 */

export const wizardDataFlowTests = [
  {
    id: 'FLOW-001',
    priority: 'P0',
    title: 'Wizard data (background, why, how, businessRulesAndAssumptions) flows through generation',
    category: 'Data Flow',
    given: `
      User completes INVEST wizard with all fields:
      - Background: "System slow"
      - Why: "Users frustrated"
      - How: "Add caching"
      - Persona: "Developer"
      - Want: "cache results"
      - Benefit: "10x faster"
      - Business Rules: "TTL 1 hour. Invalidate on update."
    `,
    when: 'GENERATE_FROM_INVEST_WIZARD message sent',
    then: [
      'DashboardPanel.handleGenerateFromInvestWizard receives message',
      'CopilotService.generateFromInvestWizard called with full wizard object',
      'User prompt includes all fields (background, why, how, BR)',
      'Language model generates story',
      'AI suggestion returned',
      'Suggestion applied to draft'
    ],
    expectedBehavior: 'Complete wizard data → AI → story'
  },

  {
    id: 'FLOW-002',
    priority: 'P0',
    title: 'If businessRulesAndAssumptions missing from wizard, generation still succeeds',
    category: 'Data Flow',
    given: `
      User completes wizard with background, why, how, but NO business rules (Step 4 skipped)
    `,
    when: 'GENERATE_FROM_INVEST_WIZARD sent',
    then: [
      'Wizard object received without businessRulesAndAssumptions property',
      'generateFromInvestWizard handles undefined/missing field gracefully',
      'Prompt omits BUSINESS RULES section',
      'Generation succeeds',
      'Story created without business rules'
    ],
    expectedBehavior: 'Optional field does not block generation'
  },

  {
    id: 'FLOW-003',
    priority: 'P0',
    title: 'Generated story includes businessRulesAndAssumptions in draft when included in wizard',
    category: 'Data Flow',
    given: `
      Wizard includes: businessRulesAndAssumptions = "Transaction limits: $5K/day"
    `,
    when: 'AI generates story and suggestion applied',
    then: [
      'AI likely includes business rules context in description/acceptance criteria',
      'Draft.businessRulesAndAssumptions field persists from wizard input (if set)',
      'Final draft ready for push to ADO includes business rules',
      'User can edit business rules in Step 4 before pushing'
    ],
    expectedBehavior: 'Business rules preserved through generation'
  }
];

/**
 * ============================================================================
 * COPILOT CHAT TESTS
 * ============================================================================
 */

export const copilotChatTests = [
  {
    id: 'CHAT-001',
    priority: 'P1',
    title: 'openInvestWizardInChat generates chat prompt with businessRulesAndAssumptions',
    category: 'Copilot Chat',
    given: `
      Wizard with businessRulesAndAssumptions: "PCI-DSS compliance required. 2FA mandatory."
    `,
    when: 'OPEN_INVEST_WIZARD_IN_CHAT message sent',
    then: [
      'DashboardPanel.handleOpenInvestWizardInChat called',
      'CopilotService.openInvestWizardInChat builds chat prompt',
      'Chat prompt includes structured INVEST answers with business rules',
      'Chat prompt opened in GitHub Copilot Chat',
      'User and AI can refine story collaboratively'
    ],
    expectedBehavior: 'Business rules provided to interactive chat session'
  },

  {
    id: 'CHAT-002',
    priority: 'P1',
    title: 'Chat session without businessRulesAndAssumptions still works',
    category: 'Copilot Chat',
    given: 'Wizard missing business rules',
    when: 'OPEN_INVEST_WIZARD_IN_CHAT sent',
    then: [
      'Chat prompt generated',
      'All INVEST sections included except business rules',
      'Chat session works normally',
      'User can provide rules verbally in chat'
    ],
    expectedBehavior: 'Chat flow not broken by missing optional field'
  }
];

/**
 * ============================================================================
 * JSON PARSING & REPAIR TESTS
 * ============================================================================
 */

export const jsonParsingTests = [
  {
    id: 'JSON-001',
    priority: 'P0',
    title: 'Valid JSON response from AI parsed correctly',
    category: 'JSON Parsing',
    given: `
      AI response (valid JSON):
      {
        "title": "Enable Auto-Approval for Low-Value Transactions",
        "description": "...",
        "acceptanceCriteria": ["...", "..."],
        "testScenarios": ["...", "..."]
      }
    `,
    when: 'CopilotService.parseJsonWithRepair called',
    then: [
      'JSON parsed successfully',
      'All fields extracted correctly',
      'AiSuggestion created with parsed data'
    ],
    expectedBehavior: 'Valid JSON handled correctly'
  },

  {
    id: 'JSON-002',
    priority: 'P0',
    title: 'Malformed JSON from AI repaired and parsed',
    category: 'JSON Parsing',
    given: `
      AI response (malformed):
      {
        "title": "Missing quote at end
        "description": "...",
        "acceptanceCriteria": [...]
      }
    `,
    when: 'CopilotService.parseJsonWithRepair called',
    then: [
      'jsonrepair library attempts to repair JSON',
      'Repaired JSON parsed',
      'AiSuggestion created (best effort)',
      'No crash'
    ],
    expectedBehavior: 'JSON repair prevents generation failure'
  },

  {
    id: 'JSON-003',
    priority: 'P1',
    title: 'JSON with escaped quotes in string values parsed correctly',
    category: 'JSON Parsing',
    given: `
      AI response:
      {
        "description": "User needs \\"draft\\" status support"
      }
    `,
    when: 'Parsed',
    then: [
      'Escaped quotes handled correctly',
      'Description text includes literal quote characters',
      'No parsing error'
    ],
    expectedBehavior: 'Quote escaping handled'
  }
];

/**
 * ============================================================================
 * ERROR HANDLING TESTS
 * ============================================================================
 */

export const errorHandlingTests = [
  {
    id: 'ERR-001',
    priority: 'P0',
    title: 'AI returns empty/null response → error thrown with helpful message',
    category: 'Error Handling',
    given: 'Language model returns empty response or only whitespace',
    when: 'CopilotService.generateFromInvestWizard processes response',
    then: [
      'Error thrown: "Model returned empty fields..."',
      'Extension displays user-friendly toast: "Model returned empty fields. Add more detail in the wizard steps and try again."',
      'No silent failure',
      'User knows to re-run with more input'
    ],
    expectedBehavior: 'Clear error feedback'
  },

  {
    id: 'ERR-002',
    priority: 'P0',
    title: 'AI returns invalid JSON that cannot be repaired → error caught',
    category: 'Error Handling',
    given: 'AI response is completely non-JSON (e.g., plain text, HTML, error message)',
    when: 'parseJsonWithRepair attempts to parse',
    then: [
      'Error caught in generateFromInvestWizard catch block',
      'Toast displayed to user: error message',
      'No unhandled exception',
      'Draft not corrupted'
    ],
    expectedBehavior: 'Parse error handled gracefully'
  },

  {
    id: 'ERR-003',
    priority: 'P1',
    title: 'Cancellation token triggered during generation → operation cleanly cancelled',
    category: 'Error Handling',
    given: 'User cancels operation (e.g., closes webview or clicks stop)',
    when: 'CancellationToken fired during model.sendRequest',
    then: [
      'Language model request cancelled',
      'generateFromInvestWizard throws (OperationCancelledError or similar)',
      'Error caught in DashboardPanel',
      'Toast: "Generation cancelled" or similar',
      'Draft unchanged'
    ],
    expectedBehavior: 'Cancellation handled cleanly'
  },

  {
    id: 'ERR-004',
    priority: 'P1',
    title: 'Network/API error during AI call → error reported, suggestion not applied',
    category: 'Error Handling',
    given: 'Language model API unavailable or returns error',
    when: 'model.sendRequest throws',
    then: [
      'Error caught in handleGenerateFromInvestWizard',
      'Toast displays error message',
      'Draft not modified',
      'User can retry'
    ],
    expectedBehavior: 'API errors surfaced to user'
  }
];

/**
 * ============================================================================
 * SUGGESTION APPLICATION TESTS
 * ============================================================================
 */

export const suggestionApplicationTests = [
  {
    id: 'SUGG-001',
    priority: 'P0',
    title: 'AI suggestion applied to draft preserves businessRulesAndAssumptions',
    category: 'Suggestion Application',
    given: `
      Draft with businessRulesAndAssumptions = "Original rules"
      AI suggestion: { title, description, acceptanceCriteria, testScenarios }
      (Note: suggestion does NOT include businessRulesAndAssumptions field)
    `,
    when: 'DashboardPanel.handleApplySuggestion called',
    then: [
      'Suggestion fields (description, AC, TS) applied to draft',
      'Draft.businessRulesAndAssumptions preserved (not overwritten)',
      'Updated draft ready for user review',
      'User sees updated content + original business rules'
    ],
    expectedBehavior: 'Business rules not lost during suggestion application'
  },

  {
    id: 'SUGG-002',
    priority: 'P0',
    title: 'User can edit businessRulesAndAssumptions after AI generation',
    category: 'Suggestion Application',
    given: 'PBI after GENERATE_FROM_INVEST_WIZARD applied',
    when: 'User navigates to Step 4 (Business Rules) and edits field',
    then: [
      'User can modify business rules',
      'Changes saved via WIZARD_DRAFT_SAVE',
      'Updated value persists',
      'Next push to ADO includes user edits'
    ],
    expectedBehavior: 'Business rules editable post-generation'
  }
];

/**
 * ============================================================================
 * INTEGRATION WITH DASHBOARD PANEL
 * ============================================================================
 */

export const dashboardIntegrationTests = [
  {
    id: 'DASH-001',
    priority: 'P0',
    title: 'GENERATE_FROM_INVEST_WIZARD message routed correctly to handler',
    category: 'Dashboard Integration',
    given: `
      WebviewRequest: {
        type: 'GENERATE_FROM_INVEST_WIZARD',
        payload: { draftId: 'xyz', wizard: {...} }
      }
    `,
    when: 'DashboardPanel.onMessage receives request',
    then: [
      'Request routed to handleGenerateFromInvestWizard',
      'Handler processes wizard data correctly',
      'CopilotService called with correct parameters'
    ],
    expectedBehavior: 'Message routing correct'
  },

  {
    id: 'DASH-002',
    priority: 'P0',
    title: 'Progress messages sent during AI generation',
    category: 'Dashboard Integration',
    given: 'User initiates GENERATE_FROM_INVEST_WIZARD',
    when: 'Handler runs',
    then: [
      'AI_PROGRESS message sent with busy: true and description message',
      'Message includes draftId so UI updates correct draft',
      'After completion: AI_PROGRESS sent with busy: false (or final state)',
      'User sees loading indicator'
    ],
    expectedBehavior: 'UI responsive with progress updates'
  },

  {
    id: 'DASH-003',
    priority: 'P0',
    title: 'Success toast displayed after successful generation',
    category: 'Dashboard Integration',
    given: 'GENERATE_FROM_INVEST_WIZARD completes successfully',
    when: 'handleGenerateFromInvestWizard finishes',
    then: [
      'TOAST message sent with level: success',
      'Message: "Full story generated from your INVEST answers and applied. Review the fields above, then Save or Push to ADO."',
      'User sees confirmation'
    ],
    expectedBehavior: 'Success feedback provided'
  },

  {
    id: 'DASH-004',
    priority: 'P0',
    title: 'Error toast displayed on generation failure',
    category: 'Dashboard Integration',
    given: 'GENERATE_FROM_INVEST_WIZARD fails (AI error, network, etc.)',
    when: 'Error thrown in handler',
    then: [
      'TOAST message sent with level: error',
      'Message includes error description',
      'User sees what went wrong',
      'Draft unmodified'
    ],
    expectedBehavior: 'Error feedback clear'
  }
];

/**
 * ============================================================================
 * LINKED PROJECT CONTEXT TESTS
 * ============================================================================
 */

export const linkedProjectContextTests = [
  {
    id: 'CONTEXT-001',
    priority: 'P1',
    title: 'AI generation includes linked project context when available',
    category: 'Project Context',
    given: `
      Project scanned with routes, APIs, database objects
      GENERATE_FROM_INVEST_WIZARD called for draft linked to project
    `,
    when: 'CopilotService.generateFromInvestWizard called',
    then: [
      'DashboardPanel builds linked project context',
      'Context passed to generateFromInvestWizard in options',
      'AI prompt includes PROJECT CONTEXT section',
      'AI generates story grounded in actual codebase',
      'Acceptance criteria reference real APIs/modules'
    ],
    expectedBehavior: 'AI generation technically accurate'
  },

  {
    id: 'CONTEXT-002',
    priority: 'P1',
    title: 'Generation works without linked project context',
    category: 'Project Context',
    given: 'No project linked or project not scanned',
    when: 'GENERATE_FROM_INVEST_WIZARD called',
    then: [
      'linkedProjectContext undefined or empty',
      'AI prompt generated without context section',
      'Generation succeeds',
      'Story created (more generic without project details)'
    ],
    expectedBehavior: 'Context optional, not required'
  }
];

/**
 * ============================================================================
 * TESTING EXECUTION NOTES
 * ============================================================================
 *
 * These test cases can be executed manually or with a test framework.
 *
 * QUICK START (Manual Execution):
 *
 * 1. **AI Prompt Generation (PROMPT-001):**
 *    - Create PBI, enter all INVEST wizard steps including Business Rules
 *    - Click "Generate Full Story"
 *    - Inspect browser console or extension logs for prompt sent to AI
 *    - Verify "BUSINESS RULES & ASSUMPTIONS:" section present
 *
 * 2. **Optional Field Handling (PROMPT-002):**
 *    - Create PBI, skip Business Rules step (leave Step 4 empty)
 *    - Generate story
 *    - Verify no "BUSINESS RULES & ASSUMPTIONS:" section in prompt
 *    - Story still generated successfully
 *
 * 3. **Special Characters (PROMPT-003):**
 *    - Enter: "PCI-DSS compliance" && ISO 27001"
 *    - Generate
 *    - Verify prompt includes special chars without JSON issues
 *    - Story generated
 *
 * 4. **Error Handling (ERR-001):**
 *    - Disconnect from network
 *    - Try to generate
 *    - Verify error toast displayed
 *    - Reconnect, try again
 *
 * 5. **Data Flow (FLOW-001):**
 *    - Fill entire INVEST wizard
 *    - Generate → review suggestion
 *    - Modify Business Rules in Step 4
 *    - Save draft
 *    - Push to ADO
 *    - Verify ADO includes all data correctly
 *
 * AUTOMATED EXECUTION (Future - with Jest/Vitest):
 *
 * Mock language model responses and test:
 * - Prompt construction with/without optional fields
 * - JSON parsing and repair
 * - Error propagation
 * - Message routing
 * - Suggestion application
 */
