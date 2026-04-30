/**
 * FeatureWizard.integration.test.ts
 * 
 * Integration tests for Issue #34: 6-Step FeatureWizard with Step 6 Technical Considerations
 * 
 * Test Scope:
 * - All 6 steps navigate correctly in order
 * - Step 6 integration with prior steps
 * - WIZARD_DRAFT_SAVE handler receives technicalConsiderations field
 * - WIZARD_DRAFT_LOAD returns draft with technicalConsiderations
 * - Progress rail shows 6 steps and correct labels
 * - AI generation flow (GENERATE_TECHNICAL_CONSIDERATIONS message)
 * - Data persistence across reload (saved data is restored)
 * - New story starts with empty Step 6 (field clears automatically)
 * 
 * Format: Behavior-driven test cases with Given/When/Then structure
 * Framework: Ready for Vitest/Jest implementation
 */

/**
 * ============================================================================
 * SECTION 1: NAVIGATION & WIZARD FLOW
 * ============================================================================
 */

export const navigationTests = [
  {
    id: 'nav-1.1',
    priority: 'P0',
    title: 'User navigates all 6 steps in order (1→2→3→4→5→6)',
    given: 'FeatureWizard is mounted with a draft',
    when: 'User clicks Next on each step sequentially',
    then: [
      'Step 1 (Type) → Step 2 (Identity): "onNext(1)" called, currentStep becomes 1',
      'Step 2 → Step 3 (Story): "onNext(2)" called, currentStep becomes 2',
      'Step 3 → Step 4 (Business Rules): "onNext(3)" called, currentStep becomes 3',
      'Step 4 → Step 5 (Details): "onNext(4)" called, currentStep becomes 4',
      'Step 5 → Step 6 (Technical Considerations): "onNext(5)" called, currentStep becomes 5',
      'Step 6 renders with title "🔧 Technical Considerations"'
    ],
    messages_expected: [
      'WIZARD_STEP_CHANGE { draftId, targetStep: 1 }',
      'WIZARD_STEP_CHANGE { draftId, targetStep: 2 }',
      'WIZARD_STEP_CHANGE { draftId, targetStep: 3 }',
      'WIZARD_STEP_CHANGE { draftId, targetStep: 4 }',
      'WIZARD_STEP_CHANGE { draftId, targetStep: 5 }'
    ]
  },

  {
    id: 'nav-1.2',
    priority: 'P0',
    title: 'From Step 5 (Details), click Next → arrives at Step 6',
    given: 'FeatureWizard is on Step 5 (Details)',
    when: 'User clicks Next button',
    then: [
      'WIZARD_STEP_CHANGE message sent with targetStep: 5',
      'Backend responds with WIZARD_STEP_CHANGED { currentStep: 5, draft }',
      'Step 6 component renders (WizardStep6TechnicalConsiderations)',
      'Progress rail shows Step 6 as active (highlighted)'
    ]
  },

  {
    id: 'nav-1.3',
    priority: 'P0',
    title: 'From Step 6, click Back → returns to Step 5',
    given: 'FeatureWizard is on Step 6 (Technical Considerations)',
    when: 'User clicks Back button',
    then: [
      'onBack(4) callback triggered',
      'WIZARD_STEP_CHANGE message sent with targetStep: 4',
      'Backend responds with WIZARD_STEP_CHANGED { currentStep: 4, draft }',
      'Step 5 component renders (WizardStep4Details)',
      'Progress rail shows Step 5 as active'
    ]
  },

  {
    id: 'nav-1.4',
    priority: 'P0',
    title: 'From Step 6, click Finish → saves and completes wizard',
    given: 'FeatureWizard is on Step 6 (Technical Considerations)',
    when: 'User clicks Finish button',
    then: [
      'onSave callback triggered with technicalConsiderations field populated',
      'WIZARD_DRAFT_SAVE message sent with partialDraft containing technicalConsiderations',
      'Backend saves draft and emits STATE_UPDATED event',
      'UI may close wizard or show success message (implementation-specific)'
    ]
  },

  {
    id: 'nav-1.5',
    priority: 'P1',
    title: 'Progress rail shows 6 buttons with correct labels and numbering',
    given: 'FeatureWizard is rendered (any step)',
    when: 'User inspects progress rail',
    then: [
      'Progress rail renders 6 buttons (one per step)',
      'Button 1 label: "Type"',
      'Button 2 label: "Identity"',
      'Button 3 label: "Story"',
      'Button 4 label: "Business Rules"',
      'Button 5 label: "Details"',
      'Button 6 label: "Technical Considerations"',
      'Step 6 button is clickable after Step 5 is completed'
    ]
  },

  {
    id: 'nav-1.6',
    priority: 'P1',
    title: 'User clicks Step 6 in progress rail → jumps directly to Step 6',
    given: 'FeatureWizard is on Step 5, progress rail shows 6 steps',
    when: 'User clicks Step 6 (Technical Considerations) button in progress rail',
    then: [
      'WIZARD_STEP_CHANGE message sent with targetStep: 5',
      'Step 6 renders without navigation through Step 6 wizard itself',
      'Progress rail highlights Step 6 as active'
    ]
  },

  {
    id: 'nav-1.7',
    priority: 'P1',
    title: 'User cannot skip backward in progress rail (can only jump to completed steps)',
    given: 'FeatureWizard is on Step 3',
    when: 'User clicks Step 5 or 6 in progress rail',
    then: [
      'Step 5 and 6 buttons are disabled (visually grayed out)',
      'Clicking disabled steps does nothing',
      'User can only proceed forward or go back to prior steps'
    ]
  },

  {
    id: 'nav-1.8',
    priority: 'P0',
    title: 'Screen reader announces step changes',
    given: 'FeatureWizard is mounted with screen reader active',
    when: 'User navigates from Step 5 to Step 6',
    then: [
      'Announcement element receives "Step 6 of 6: Technical Considerations"',
      'aria-live="polite" triggers announcement after step change',
      'sr-only div updates textContent with new step message'
    ]
  }
];

/**
 * ============================================================================
 * SECTION 2: WIZARD DRAFT SAVE & PERSISTENCE
 * ============================================================================
 */

export const persistenceTests = [
  {
    id: 'persist-2.1',
    priority: 'P0',
    title: 'WIZARD_DRAFT_SAVE includes technicalConsiderations field',
    given: 'User is on Step 6 with populated technical considerations',
    when: 'User clicks Finish',
    then: [
      'WIZARD_DRAFT_SAVE message payload includes:',
      '  { draftId: "draft-1", partialDraft: { technicalConsiderations: { ... } }, currentStep: 5 }',
      'technicalConsiderations object contains:',
      '  - technicalDetails: string',
      '  - scopedFiles: string[]',
      '  - architectureNotes: string',
      'Message handler in DashboardPanel receives WIZARD_DRAFT_SAVE'
    ]
  },

  {
    id: 'persist-2.2',
    priority: 'P0',
    title: 'Backend merges technicalConsiderations with existing draft (no field overwrites)',
    given: 'Draft already contains userStoryStatement, businessRulesAndAssumptions from earlier steps',
    when: 'WIZARD_DRAFT_SAVE handler processes technicalConsiderations',
    then: [
      'Draft update preserves all prior fields (userStoryStatement, businessRulesAndAssumptions)',
      'technicalConsiderations field is merged, not replacing entire draft',
      'updatedAt timestamp is refreshed',
      'draftService.upsert() is called with merged draft'
    ]
  },

  {
    id: 'persist-2.3',
    priority: 'P0',
    title: 'STATE_UPDATED event emitted after WIZARD_DRAFT_SAVE',
    given: 'WIZARD_DRAFT_SAVE handler completes successfully',
    when: 'Draft is persisted to globalState',
    then: [
      'DashboardPanel emits STATE_UPDATED event with updated AppStatePayload',
      'Webview receives STATE_UPDATED and re-syncs pbiDrafts array',
      'Draft with technicalConsiderations is now in state'
    ]
  },

  {
    id: 'persist-2.4',
    priority: 'P0',
    title: 'Data persists after Finish (reload draft and verify technicalConsiderations)',
    given: 'User completes Step 6 with technical considerations and clicks Finish',
    when: 'Extension closes and reopens the wizard, user loads the same draft',
    then: [
      'WIZARD_DRAFT_LOAD message is sent',
      'Backend retrieves draft from globalState with technicalConsiderations intact',
      'WIZARD_DRAFT_LOADED response includes: { draft: { ..., technicalConsiderations: {...} }, currentStep: 0 }',
      'Step 6 renders with previously saved technicalConsiderations data visible'
    ]
  },

  {
    id: 'persist-2.5',
    priority: 'P1',
    title: 'User starts new story → Step 6 field clears automatically',
    given: 'User previously completed a story with technicalConsiderations',
    when: 'User creates new PBI draft via CREATE_PBI_DRAFT message',
    then: [
      'New draft is initialized with PbiDraft defaults',
      'PbiDraft initialization sets technicalConsiderations: undefined',
      'When wizard loads and reaches Step 6, empty state is shown',
      'No residual data from previous story leaks into new draft'
    ]
  },

  {
    id: 'persist-2.6',
    priority: 'P0',
    title: 'technicalConsiderations flows to ADO export correctly',
    given: 'Draft with technicalConsiderations is ready to push to ADO',
    when: 'adoService.buildDescription() is called with the draft',
    then: [
      'adoService includes "Technical Considerations" section in work item description',
      'Section includes technicalDetails, scopedFiles (as list), and architectureNotes',
      'Fields are properly escaped for HTML (< → &lt;, & → &amp;)',
      'If technicalConsiderations is undefined, section is omitted gracefully'
    ]
  }
];

/**
 * ============================================================================
 * SECTION 3: GENERATE BUTTON & AI INTEGRATION
 * ============================================================================
 */

export const generateTests = [
  {
    id: 'gen-3.1',
    priority: 'P0',
    title: 'Click Generate button on Step 6 → GENERATE_TECHNICAL_CONSIDERATIONS sent',
    given: 'User is on Step 6 with no technical considerations',
    when: 'User clicks Generate button',
    then: [
      'onGenerate callback is triggered',
      'FeatureWizard sends GENERATE_TECHNICAL_CONSIDERATIONS { draftId } to backend',
      'Message is received by DashboardPanel.handleGenerateTechnicalConsiderations()'
    ]
  },

  {
    id: 'gen-3.2',
    priority: 'P0',
    title: 'AI progress indicator shows loading state while generating',
    given: 'GENERATE_TECHNICAL_CONSIDERATIONS message is being processed',
    when: 'Backend sends AI_PROGRESS event',
    then: [
      'FeatureWizard receives AI_PROGRESS { draftId, message, busy: true }',
      'aiGenerating state is set to true',
      'Step 6 component receives isLoading={true}',
      'Loading spinner appears with message "AI is analyzing your codebase..."',
      'Generate button becomes disabled and shows "Generating..."'
    ]
  },

  {
    id: 'gen-3.3',
    priority: 'P0',
    title: 'AI generation populates Step 6 fields after completion',
    given: 'CopilotService.generateTechnicalConsiderations() completes successfully',
    when: 'Backend receives AI response and builds TechnicalConsiderations object',
    then: [
      'DashboardPanel updates draft with: { technicalConsiderations: { technicalDetails, scopedFiles, architectureNotes } }',
      'draftService.upsert() persists updated draft',
      'STATE_UPDATED event emitted with updated draft',
      'FeatureWizard receives STATE_UPDATED and sets draft with populated technicalConsiderations',
      'Step 6 switches from empty state to view mode, showing generated content'
    ]
  },

  {
    id: 'gen-3.4',
    priority: 'P1',
    title: 'Generate button label changes to Regenerate after first generation',
    given: 'User has generated technical considerations',
    when: 'Step 6 renders with non-empty technicalConsiderations',
    then: [
      'Button text shows "Regenerate" (not "Generate")',
      'Button is still clickable and functional'
    ]
  },

  {
    id: 'gen-3.5',
    priority: 'P1',
    title: 'Multiple generate calls use latest AI response',
    given: 'User clicks Generate twice in same session',
    when: 'Second generation completes',
    then: [
      'First generation result is replaced with second result',
      'No data merging occurs (full replacement)',
      'UI shows latest generated content'
    ]
  },

  {
    id: 'gen-3.6',
    priority: 'P0',
    title: 'AI_PROGRESS event includes draftId so UI knows which draft is generating',
    given: 'Multiple drafts might be open simultaneously',
    when: 'GENERATE_TECHNICAL_CONSIDERATIONS is called for draft-1',
    then: [
      'AI_PROGRESS { draftId: "draft-1", busy: true } is emitted',
      'Only Step 6 for draft-1 shows loading state',
      'Other drafts are unaffected'
    ]
  },

  {
    id: 'gen-3.7',
    priority: 'P1',
    title: 'Generate button has tooltip/help text',
    given: 'User hovers over Generate button on Step 6',
    when: 'Tooltip appears',
    then: [
      'Tooltip text: "Generate technical considerations using AI"',
      'Tooltip remains visible during hover'
    ]
  }
];

/**
 * ============================================================================
 * SECTION 4: ERROR SCENARIOS & EDGE CASES
 * ============================================================================
 */

export const errorTests = [
  {
    id: 'err-4.1',
    priority: 'P1',
    title: 'Generate fails (network error) → UI shows error message',
    given: 'CopilotService.generateTechnicalConsiderations() throws error',
    when: 'Error occurs during AI generation',
    then: [
      'DashboardPanel catches error in catch block',
      'postToast("error", error message) is called',
      'User sees error toast notification',
      'Loading state clears and Step 6 returns to editable state'
    ]
  },

  {
    id: 'err-4.2',
    priority: 'P0',
    title: 'Empty Technical Considerations (user skips Step 6, goes straight to Finish)',
    given: 'User is on Step 6 with no data entered or generated',
    when: 'User clicks Finish',
    then: [
      'onSave is called with empty technicalConsiderations object',
      'WIZARD_DRAFT_SAVE is sent with { technicalConsiderations: { technicalDetails: "", scopedFiles: [], architectureNotes: "" } }',
      'Backend accepts empty/partial technicalConsiderations (Step 6 is optional)',
      'Draft is saved successfully'
    ]
  },

  {
    id: 'err-4.3',
    priority: 'P1',
    title: 'Back button works from Step 6 (don\'t accidentally lose unsaved edits in buffer)',
    given: 'User is on Step 6, has made edits but not clicked away from field',
    when: 'User clicks Back button',
    then: [
      'onBack(4) is triggered',
      'WIZARD_STEP_CHANGE message is sent',
      'User returns to Step 5',
      'Note: Unsaved field edits in buffer are lost (expected — no auto-save on Back)'
    ]
  },

  {
    id: 'err-4.4',
    priority: 'P1',
    title: 'Rapid step transitions (1→2→3→...→6→Finish) without delays',
    given: 'User clicks Next repeatedly without pausing',
    when: 'Step changes fire rapidly',
    then: [
      'Each WIZARD_STEP_CHANGE is queued or handled sequentially',
      'No race conditions occur (backend state is authoritative)',
      'Final step is Step 6 and Finish works correctly'
    ]
  },

  {
    id: 'err-4.5',
    priority: 'P0',
    title: 'Very long Technical Considerations content (test truncation/scrolling)',
    given: 'User enters 5000+ characters in technical details',
    when: 'Content is displayed in view mode',
    then: [
      'Textarea renders full content without truncation',
      'Content is scrollable if exceeds viewport height',
      'No UI layout breaks occur'
    ]
  },

  {
    id: 'err-4.6',
    priority: 'P1',
    title: 'User navigates away from wizard without saving Step 6 data → data lost',
    given: 'User is on Step 6, edits fields, then closes wizard without Finish',
    when: 'Wizard is closed via close button or back navigation',
    then: [
      'Unsaved Step 6 edits are NOT persisted (expected behavior)',
      'If user reopens wizard for same draft, old data is restored (if previously saved)'
    ]
  }
];

/**
 * ============================================================================
 * SECTION 5: TYPESCRIPT & BUILD VALIDATION
 * ============================================================================
 */

export const typescriptTests = [
  {
    id: 'ts-5.1',
    priority: 'P0',
    title: 'No TypeScript errors in WizardStep6TechnicalConsiderations component',
    given: 'WizardStep6TechnicalConsiderations.tsx is compiled',
    when: 'tsc --noEmit is run in webview-ui/',
    then: [
      'No errors for component file',
      'Props interface is properly typed (draft: PbiDraft, onNext, onBack, onSave, onGenerate)',
      'useState hooks use correct types',
      'TechnicalConsiderations interface is correctly imported from types.ts'
    ]
  },

  {
    id: 'ts-5.2',
    priority: 'P0',
    title: 'No TypeScript errors in FeatureWizard after Step 6 integration',
    given: 'FeatureWizard.tsx imports and renders WizardStep6TechnicalConsiderations',
    when: 'tsc --noEmit is run in webview-ui/',
    then: [
      'No errors for FeatureWizard file',
      'Step 6 component is imported correctly',
      'Conditional render of Step 6 (currentStep === 5) is type-safe',
      'All props passed to Step 6 component match interface'
    ]
  },

  {
    id: 'ts-5.3',
    priority: 'P0',
    title: 'No TypeScript errors in root after WIZARD_DRAFT_SAVE handler',
    given: 'src/panels/DashboardPanel.ts implements WIZARD_DRAFT_SAVE handler',
    when: 'tsc --noEmit is run in root',
    then: [
      'No errors for DashboardPanel file',
      'WIZARD_DRAFT_SAVE case handler is type-safe',
      'handleWizardDraftSave() function signature matches message payload',
      'technicalConsiderations field access is type-safe'
    ]
  },

  {
    id: 'ts-5.4',
    priority: 'P0',
    title: 'npm run build passes (no bundle errors)',
    given: 'All TypeScript files compile without errors',
    when: 'npm run build is executed',
    then: [
      'build:extension completes successfully (esbuild.config.js)',
      'build:webview completes successfully (vite build)',
      'No esbuild or vite errors',
      'dist/extension.js and dist/assets/ are generated correctly',
      'Build output shows "built successfully" messages'
    ]
  },

  {
    id: 'ts-5.5',
    priority: 'P0',
    title: 'tsc --noEmit clean in both webview-ui/ and extension root',
    given: 'All changes to add Step 6 are complete',
    when: 'tsc --noEmit is run separately in webview-ui/ and root',
    then: [
      'webview-ui/ tsc: 0 errors',
      'root tsc: 0 errors',
      'No unrelated TypeScript errors introduced'
    ]
  }
];

/**
 * ============================================================================
 * MANUAL SMOKE TEST CHECKLIST
 * ============================================================================
 */

export const manualSmokeTests = [
  {
    id: 'smoke-6.1',
    title: '[ ] Open wizard, navigate all 6 steps, verify each step renders',
    steps: [
      'Open VS Code extension',
      'Click "PO Tools: Open Dashboard"',
      'Create new PBI draft',
      'Click on draft to open FeatureWizard',
      'Click Next through all 6 steps',
      'Verify each step title appears: Type, Identity, Story, Business Rules, Details, Technical Considerations'
    ]
  },

  {
    id: 'smoke-6.2',
    title: '[ ] Click generate on Step 6, verify AI response populates (or error shown)',
    steps: [
      'Reach Step 6 (Technical Considerations)',
      'Click Generate button',
      'Observe AI_PROGRESS event and loading spinner',
      'Wait for AI to complete',
      'Verify technical details, scoped files, and architecture notes appear in view mode',
      'If error: verify error toast is shown'
    ]
  },

  {
    id: 'smoke-6.3',
    title: '[ ] Edit generated content, toggle view/edit, verify changes persist in session',
    steps: [
      'On Step 6 with generated content, click Edit',
      'Modify technical details text',
      'Click Done Editing',
      'Verify modified text still appears in view mode',
      'Click Edit again to verify changes were saved to session state'
    ]
  },

  {
    id: 'smoke-6.4',
    title: '[ ] Click Finish from Step 6, verify wizard completes',
    steps: [
      'On Step 6, click Finish button',
      'Verify WIZARD_DRAFT_SAVE message is sent (DevTools)',
      'Verify success toast appears (if implemented)',
      'Verify wizard closes or shows completion message'
    ]
  },

  {
    id: 'smoke-6.5',
    title: '[ ] Reload extension, verify Technical Considerations content still there',
    steps: [
      'After completing Step 6 with content, close the wizard',
      'Reload VS Code extension (Ctrl+Shift+P → "Developer: Reload Window")',
      'Open dashboard and reload the same draft',
      'Navigate to Step 6',
      'Verify previously entered technical considerations are displayed'
    ]
  },

  {
    id: 'smoke-6.6',
    title: '[ ] Start new story, verify Step 6 starts empty',
    steps: [
      'After testing with one draft that has technical considerations',
      'Create a new PBI draft',
      'Open wizard and navigate to Step 6',
      'Verify empty state is shown ("No technical considerations yet")',
      'Verify Generate button is available'
    ]
  },

  {
    id: 'smoke-6.7',
    title: '[ ] All button clicks responsive, no UI glitches',
    steps: [
      'On Step 6, rapidly click Generate, Edit, Done Editing buttons',
      'Click Back and Next navigation',
      'Verify no frozen UI or console errors',
      'Verify loading states clear properly',
      'Verify modal/panel remains responsive'
    ]
  }
];

/**
 * ============================================================================
 * TEST EXECUTION CHECKLIST FOR VALIDATION
 * ============================================================================
 */

export const validationCheckpoint = {
  build_validation: {
    task: 'npm run build',
    expected: 'PASS (0 errors)',
    files_produced: ['dist/extension.js', 'dist/extension.js.map', 'dist/assets/index-*.css', 'dist/assets/index-*.js']
  },
  typescript_root: {
    task: 'tsc --noEmit (in root)',
    expected: 'PASS (0 errors)'
  },
  typescript_webview: {
    task: 'tsc --noEmit (in webview-ui/)',
    expected: 'PASS (0 errors)'
  },
  test_coverage: {
    categories: [
      'Happy Path Tests (18 tests)',
      'Loading State Tests (4 tests)',
      'Edge Cases (11 tests)',
      'Button Labels (5 tests)',
      'Accessibility (3 tests)',
      'Navigation (8 integration tests)',
      'Data Persistence (6 integration tests)',
      'Generate/AI Flow (7 integration tests)',
      'Error Scenarios (6 integration tests)',
      'TypeScript Validation (5 integration tests)'
    ],
    total: 73,
    manual_smoke_tests: 7
  },
  approval_gate: {
    question: 'Are you confident this is production-ready?',
    criteria: [
      'All 6 wizard steps render correctly',
      'Step 6 integrates seamlessly with prior steps',
      'Generate button triggers AI and populates fields',
      'Data persists across reload',
      'Navigation works correctly (Next, Back, Finish)',
      'TypeScript clean and build passes',
      'No untested error paths',
      'No UI glitches or freeze behavior'
    ]
  }
};
