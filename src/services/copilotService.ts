import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { jsonrepair } from 'jsonrepair';
import * as vscode from 'vscode';
import { AiSuggestion, BugReportInput, BulkChildInput, FeatureDefinition, FeatureDraft, InvestWizardInput, PbiAttachment, PbiDraft, TechnicalConsiderations } from '../shared/messages';
import { GeneratedTestCase } from './testPlanService';

/** Overrides parts of the bundled rulebook that assume file writes or non-JSON output. */
const REFINE_JSON_BRIDGE = [
  '--- PO Professional Tools: output contract (takes precedence over conflicting lines in the rulebook) ---',
  '- Respond with valid JSON ONLY (no markdown, no code fences, no prose before/after).',
  '- Schema: { "description": string, "acceptanceCriteria": string[], "testScenarios": string[], "title"?: string }',
  '- Do NOT create files, write under reports/, or emit separate markdown reports; put substance in the JSON fields.',
  '- Apply the Product Manager rulebook below for PayRailz/fintech tone, testable acceptance criteria, compliance/security defaults, performance baselines, and BDD-style checks.',
  '- Ignore rulebook steps about persisting two .md files; PO Tools applies your JSON to the draft instead.',
  '---',
  ''
].join('\n');

const CHAT_RULEBOOK_MAX_CHARS = 28_000;
const CHAT_LINKED_CONTEXT_MAX_CHARS = 8_000;

const FULL_STORY_JSON_BRIDGE = [
  '--- PO Professional Tools ---',
  '- Output valid JSON only (no markdown fences).',
  '- Schema: { "title": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
  '- Apply PRODUCT_MANAGER_RULEBOOK and LINKED PROJECT CONTEXT when provided: technical, testable, fintech-appropriate.',
  '- Do not create files under reports/.',
  '---'
].join('\n');

const TECHNICAL_CONSIDERATIONS_JSON_BRIDGE = [
  '--- PO Professional Tools ---',
  '- Output valid JSON only (no markdown fences).',
  '- Schema: { "technicalDetails": string, "scopedFiles": string[], "architectureNotes": string }',
  '- Use LINKED PROJECT CONTEXT to ground recommendations in actual codebase structure.',
  '- Do not speculate; reference real modules, routes, APIs, or database objects.',
  '---'
].join('\n');

const REFINE_PO_PRIORITY = [
  '---',
  'PO / STAKEHOLDER INPUT (priority rules):',
  '- The Product Owner description and optional PO notes below are the source of truth for business intent, scope boundaries, personas, and constraints.',
  '- LINKED PROJECT CONTEXT grounds technical accuracy (routes, APIs, modules); merge it with the PO text — do not replace business requirements with generic technical filler.',
  '- Expand thin descriptions into clear prose: add missing user value, risks, and dependencies implied by the PO text or notes.',
  '- If PO notes conflict with older criteria, follow the notes and the description.',
  '---'
].join('\n');

const SYSTEM_PROMPT = [
  'You are a senior Product Owner assistant.',
  'Refine backlog items so they are clear, concise, testable, and stakeholder-ready.',
  'Respond with strict JSON only (no markdown, no prose, no code fences).',
  'When refining a single PBI, respond with:',
  '{ "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
  'When breaking a feature into children, respond with:',
  '{ "children": [ { "suffix": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] } ] }',
  'Never include keys outside the schema. Never wrap output in markdown.',
  REFINE_PO_PRIORITY
].join('\n');

/** Stronger prompt for in-panel full story: fewer, sharper ACs; valid JSON strings. */
const FULL_STORY_SYSTEM_PROMPT = [
  'You are a senior Product Owner and business analyst writing Azure DevOps backlog items.',
  'Output must be valid JSON only (no markdown fences, no commentary before or after).',
  '',
  'Schema: { "title": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[], "userStoryStatement"?: string, "businessRulesAndAssumptions"?: string }',
  '',
  'TITLE: Action-oriented, under 120 characters.',
  '',
  'DESCRIPTION: 2–4 short paragraphs. User value first; scope and boundaries clear.',
  '',
  'USER STORY STATEMENT (optional): If the INVEST wizard provided a structured story, reflect the core user value back in 1-2 sentences.',
  '',
  'BUSINESS RULES & ASSUMPTIONS (optional): If provided in the INVEST input, include critical constraints, preconditions, or domain rules that bound this work.',
  '',
  'ACCEPTANCE CRITERIA (quality bar):',
  '- Exactly 4 to 7 items.',
  '- Each item is ONE verifiable outcome (not a paragraph). Prefer: Given [context], when [action], then [observable result].',
  '- Cover: primary happy path, enrolled vs non-enrolled (or your domain split), error/timeout/unknown state, and regression safety.',
  '- No duplicates. Avoid vague phrases.',
  '- CRITICAL: Inside JSON strings, do NOT use raw double-quote characters. Rephrase UI labels (e.g. say Transact As Payer without embedding extra quotes).',
  '',
  'TEST SCENARIOS: 4 to 8 short labels; each should map to verifying one or more criteria.',
  '- Same rule: no raw " inside JSON string values; paraphrase if needed.',
  '',
  'Never output invalid JSON.'
].join('\n');

const TECHNICAL_CONSIDERATIONS_SYSTEM_PROMPT = [
  'You are a senior backend architect and technical lead reviewing a Product Owner backlog item.',
  'Output must be valid JSON only (no markdown fences, no commentary before or after).',
  '',
  'Schema: { "technicalDetails": string, "scopedFiles": string[], "architectureNotes": string }',
  '',
  'TECHNICAL DETAILS: 2–3 sentences identifying the key technical concerns, module dependencies, or implementation patterns required.',
  'Reference actual codebase elements when LINKED PROJECT CONTEXT is provided.',
  '',
  'SCOPED FILES: Array of 1–5 file paths or module names that this work item will likely touch.',
  'Use real paths from the linked project; be specific (e.g., "src/services/paymentProcessor.ts" not "backend").',
  '',
  'ARCHITECTURE NOTES: 1–2 sentences on data flow, external dependencies (APIs, databases), or design patterns.',
  'Highlight any risks, side effects, or cross-team dependencies.',
  '',
  'RULES:',
  '- Do not add features or scope creep; analyze the PBI as stated.',
  '- Reference LINKED PROJECT CONTEXT when available; never speculate about code structure.',
  '- Keep notes actionable for dev teams (not generic architecture philosophy).',
  '- NEVER use Mermaid, flowchart, diagram syntax, or markdown code fences (```) in any field. Output must be plain text only.',
  '- Never output invalid JSON.'
].join('\n');

const FEATURE_DEFINITION_SYSTEM_PROMPT = [
  'You are a senior Product Owner and business analyst defining features for Azure DevOps backlog items.',
  'Output must be valid JSON only (no markdown fences, no commentary before or after).',
  '',
  'Schema: { "why": string, "userFlow": string, "businessRules": string, "userStoryStatement": string }',
  '',
  'WHY (Why does this matter?): 200–500 characters. Explain the business impact and strategic importance.',
  'Focus on user value, business outcomes, and measurable benefits.',
  '',
  'USER FLOW (Describe the user flow): Step-by-step user journey through the feature.',
  'Be specific about touchpoints, interactions, and user actions. Format as numbered steps or clear narrative.',
  '',
  'BUSINESS RULES (Business rules and assumptions): Critical constraints, conditions, compliance requirements, and assumptions.',
  'Include validation rules, authorization policies, data constraints, and system limits.',
  '',
  'USER STORY STATEMENT: Standard "As a [role], I want [capability], so that [benefit]" format.',
  'Capture the core user story that guides child story generation and acceptance criteria.',
  '',
  'RULES:',
  '- Base content on the draft title, description, and any existing acceptance criteria.',
  '- Use LINKED PROJECT CONTEXT to ground technical realism (actual APIs, flows, constraints).',
  '- Keep language clear and stakeholder-friendly.',
  '- Never output invalid JSON.'
].join('\n');

const FEATURE_DEFINITION_JSON_BRIDGE = [
  '--- PO Professional Tools ---',
  '- Output valid JSON only (no markdown fences).',
  '- Schema: { "why": string, "userFlow": string, "businessRules": string, "userStoryStatement": string }',
  '- Apply PRODUCT_MANAGER_RULEBOOK and LINKED PROJECT CONTEXT when provided.',
  '- Do not create files or emit markdown reports.',
  '---'
].join('\n');

const INTEGRATION_TEST_CASE_SYSTEM_PROMPT = [
  'You are a senior QA engineer specializing in integration testing for fintech and banking applications.',
  'Generate integration test cases for a Product Backlog Item.',
  'Output must be valid JSON only (no markdown fences, no commentary before or after).',
  '',
  'Schema: { "testCases": [ { "title": string, "steps": [ { "action": string, "expectedResult": string } ] } ] }',
  '',
  'RULES:',
  '- Generate 5 to 8 integration test cases.',
  '- Each test case must have 3 to 7 steps.',
  '- Cover: happy path, authentication/authorization, edge cases, error/failure scenarios, boundary conditions.',
  '- Each step action describes what the tester or system does (specific, unambiguous).',
  '- Each expected result describes the verifiable, observable outcome.',
  '- Focus on integration points: API responses, authentication flows, data persistence, external service interactions.',
  '- Be specific to the PBI content; avoid generic placeholder steps.',
  '- Apply fintech/banking domain context (security, compliance, data accuracy) when relevant.',
  '- Never output invalid JSON.'
].join('\n');

const INTEGRATION_TEST_CASE_JSON_BRIDGE = [
  '--- PO Professional Tools ---',
  '- Output valid JSON only (no markdown fences).',
  '- Schema: { "testCases": [ { "title": string, "steps": [ { "action": string, "expectedResult": string } ] } ] }',
  '- Do not create files or emit markdown reports.',
  '---'
].join('\n');

export class CopilotService {
  private rulebookLoaded = false;
  private rulebookText = '';

  public constructor(private readonly context: vscode.ExtensionContext) {}

  /** Bundled PayRailz / fintech Product Manager instructions (`resources/prompts/product-manager-fintech-refinement.md`). */
  private async getProductManagerRulebook(): Promise<string> {
    if (this.rulebookLoaded) {
      return this.rulebookText;
    }
    this.rulebookLoaded = true;
    try {
      const uri = vscode.Uri.joinPath(
        this.context.extensionUri,
        'resources',
        'prompts',
        'product-manager-fintech-refinement.md'
      );
      const data = await vscode.workspace.fs.readFile(uri);
      let text = Buffer.from(data).toString('utf8');
      if (text.startsWith('---')) {
        const endFrontmatter = text.indexOf('\n---', 3);
        if (endFrontmatter !== -1) {
          text = text.slice(endFrontmatter + 4).trimStart();
        }
      }
      this.rulebookText = text;
    } catch {
      this.rulebookText = '';
    }
    return this.rulebookText;
  }

  private clipForChatRulebook(full: string): string {
    if (full.length <= CHAT_RULEBOOK_MAX_CHARS) {
      return full;
    }
    return (
      full.slice(0, CHAT_RULEBOOK_MAX_CHARS) +
      '\n\n[…truncated. Full rulebook ships with PO Tools in resources/prompts/product-manager-fintech-refinement.md.]'
    );
  }

  private clipLinkedForChat(text: string): string {
    if (text.length <= CHAT_LINKED_CONTEXT_MAX_CHARS) {
      return text;
    }
    return (
      text.slice(0, CHAT_LINKED_CONTEXT_MAX_CHARS) +
      '\n\n[…truncated. Full scan is used in-panel.]'
    );
  }

  public async refineDraft(
    draft: PbiDraft,
    instruction: string | undefined,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();
    const rulebook = await this.getProductManagerRulebook();

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT (technical grounding — combine with PO text, do not ignore business intent):\n${options.linkedProjectContext}\n---\n\n`
      : '';
    const poNotes =
      instruction && instruction.trim().length > 0
        ? [
            'ADDITIONAL PO NOTES (prioritized — reflect these in description, criteria, and tests):',
            instruction.trim(),
            ''
          ].join('\n')
        : '';
    const userPrompt =
      linkedPart +
      [
        poNotes,
        'TASK: Refine the backlog item for Azure DevOps. Preserve facts and constraints from the PO description; improve clarity and testability.',
        'Return JSON with keys: description, acceptanceCriteria, testScenarios (optional title).',
        '',
        `Title: ${draft.title}`,
        `Iteration: ${draft.iteration}`,
        `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
        `Effort (days): ${draft.effortDays}`,
        '',
        'PRODUCT OWNER DESCRIPTION (primary business context):',
        draft.description?.trim() ? draft.description.trim() : '(empty — infer carefully from title and linked context, or state assumptions briefly in the description field.)',
        '',
        'Current acceptance criteria:',
        ...draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`),
        '',
        'Current test scenarios:',
        ...draft.testScenarios.map((item, i) => `${i + 1}. ${item}`)
      ].join('\n');

    const systemBlock = [
      SYSTEM_PROMPT,
      '',
      REFINE_JSON_BRIDGE,
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK (follow for refinement quality):\n${rulebook}`
        : '---\n(Product Manager rulebook file not found; use best PO practices.)'
    ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    return this.suggestionFromParsed(parsed);
  }

  /**
   * One-shot story generation via Language Model API — applies in extension (no Copilot Chat copy/paste).
   * Uses a stricter acceptance-criteria rubric than ad-hoc Chat.
   */
  public async generateFullStoryFromSeed(
    draft: PbiDraft,
    seedText: string | undefined,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();
    const rulebook = await this.getProductManagerRulebook();
    const seed =
      seedText?.trim() ||
      draft.description?.trim() ||
      'Infer a reasonable scope from the working title and any notes below.';

    const systemBlock = [
      FULL_STORY_SYSTEM_PROMPT,
      '',
      FULL_STORY_JSON_BRIDGE,
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : '---\n(Product Manager rulebook not found.)'
    ].join('\n');

    const linkedStoryPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT:\n${options.linkedProjectContext}\n---\n\n`
      : '';
    const userPrompt =
      linkedStoryPart +
      [
        'Generate the full backlog item (replace description, criteria, and tests entirely).',
        '',
        'BUSINESS CONTEXT (primary input — expand with concrete actors, constraints, and outcomes):',
        seed,
        '',
        `Working title: ${draft.title}`,
        `Iteration: ${draft.iteration}`,
        `Work item type: ${draft.workItemType ?? 'Product Backlog Item'}`,
        '',
        'Additional description from the draft (merge facts; do not drop stakeholder requirements):',
        draft.description && draft.description.trim() !== seed.trim()
          ? draft.description.trim()
          : '(none beyond seed above)',
        '',
        'If the seed is thin, enrich from the title and linked context while staying faithful to stated scope.',
        'Ignore stale acceptance criteria unless they state irreplaceable facts; prefer a fresh, tight set per the system rules.'
      ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    const suggestion = this.suggestionFromParsed(parsed);
    if (
      !suggestion.description &&
      !suggestion.acceptanceCriteria?.length &&
      !suggestion.testScenarios?.length
    ) {
      throw new Error('Model returned empty fields. Try again or add more context in the seed box.');
    }
    return suggestion;
  }

  /**
   * Generates technical considerations (architecture, file scope, implementation notes) for a PBI.
   * Grounds analysis in linked project context when available.
   */
  public async generateTechnicalConsiderations(
    draft: PbiDraft,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<TechnicalConsiderations> {
    const model = await this.pickModel();

    const systemBlock = [
      TECHNICAL_CONSIDERATIONS_SYSTEM_PROMPT,
      '',
      TECHNICAL_CONSIDERATIONS_JSON_BRIDGE
    ].join('\n');

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT (use to ground technical recommendations):\n${options.linkedProjectContext}\n---\n\n`
      : '';

    const userPrompt =
      linkedPart +
      [
        'Analyze this backlog item for technical considerations:',
        '',
        `Title: ${draft.title}`,
        `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
        `Effort (days): ${draft.effortDays}`,
        '',
        'PRODUCT OWNER DESCRIPTION:',
        draft.description?.trim() ? draft.description.trim() : '(empty)',
        '',
        'Acceptance criteria:',
        ...(draft.acceptanceCriteria.length > 0
          ? draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`)
          : ['(none)']),
        '',
        'Return JSON with keys: technicalDetails, scopedFiles, architectureNotes.'
      ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    return this.technicalConsiderationsFromParsed(parsed);
  }

  /**
   * Generates Gherkin acceptance criteria and test scenarios for a PBI wizard story.
   * Uses only the story content provided — no linked project context — to avoid
   * generating criteria that belong to a different story in the editor context.
   */
  public async generateAcceptanceCriteria(
    draft: PbiDraft,
    token: vscode.CancellationToken
  ): Promise<{ acceptanceCriteria: string[]; testScenarios: string[] }> {
    const model = await this.pickModel();

    const systemPrompt = [
      'You are a senior QA engineer writing Azure DevOps acceptance criteria.',
      'Output must be valid JSON only (no markdown fences, no commentary before or after).',
      '',
      'Schema: { "acceptanceCriteria": string[], "testScenarios": string[] }',
      '',
      'ACCEPTANCE CRITERIA:',
      '- Exactly 4 to 6 items.',
      '- Each item is ONE verifiable outcome using Gherkin format: "Given [context], when [action], then [observable result]."',
      '- Cover: primary happy path, key edge cases, and at least one error/failure state.',
      '- Base ONLY on the story content provided below. Do NOT infer behavior from unrelated context.',
      '- No vague outcomes like "the system works correctly" or "users can use the feature".',
      '- Inside JSON strings, do NOT use raw double-quote characters; rephrase if needed.',
      '',
      'TEST SCENARIOS: 3 to 6 short labels (e.g. "Happy path — user submits valid form").',
      '',
      'CRITICAL: Generate criteria ONLY for the story described below. Ignore all other context.'
    ].join('\n');

    const storyStatement =
      draft.featureUserStoryStatement?.trim() || draft.userStoryStatement?.trim() || '';
    const description = draft.description?.trim() || '';
    const featureWhy = draft.featureWhy?.trim() || '';

    const userPrompt = [
      `Story title: ${draft.title}`,
      '',
      storyStatement ? `User story statement:\n${storyStatement}` : '',
      featureWhy ? `\nWhy does this matter:\n${featureWhy}` : '',
      description ? `\nStory description:\n${description}` : '',
      '',
      'Generate acceptance criteria and test scenarios ONLY for the story above.'
    ]
      .filter(Boolean)
      .join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemPrompt),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    return {
      acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria)
        ? (parsed.acceptanceCriteria as string[])
        : [],
      testScenarios: Array.isArray(parsed.testScenarios)
        ? (parsed.testScenarios as string[])
        : []
    };
  }

  /**
   * Generates feature definition content (why, user flow, business rules, user story statement) for a PBI.
   * Grounds analysis in linked project context when available.
   */
  public async generateFeatureDefinition(
    draft: PbiDraft,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<FeatureDefinition> {
    const model = await this.pickModel();
    const rulebook = await this.getProductManagerRulebook();

    const systemBlock = [
      FEATURE_DEFINITION_SYSTEM_PROMPT,
      '',
      FEATURE_DEFINITION_JSON_BRIDGE,
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : '---\n(Product Manager rulebook not found.)'
    ].join('\n');

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT (use to ground technical realism):\n${options.linkedProjectContext}\n---\n\n`
      : '';

    const userPrompt =
      linkedPart +
      [
        'Generate feature definition content for this backlog item:',
        '',
        `Title: ${draft.title}`,
        `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
        `Effort (days): ${draft.effortDays}`,
        '',
        'PRODUCT OWNER DESCRIPTION:',
        draft.description?.trim() ? draft.description.trim() : '(empty — infer from title and context)',
        '',
        'Acceptance criteria (current):',
        ...(draft.acceptanceCriteria.length > 0
          ? draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`)
          : ['(none)']),
        '',
        'Generate all four feature definition fields based on this context.',
        'Return JSON with keys: why, userFlow, businessRules, userStoryStatement.'
      ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    return this.featureDefinitionFromParsed(parsed);
  }

  public async tryGenerateMermaidAttachment(
    draft: PbiDraft,
    token: vscode.CancellationToken
  ): Promise<PbiAttachment | undefined> {
    const combined = [
      `Title: ${draft.title}`,
      '',
      'Description:',
      draft.description || '(none)',
      '',
      'Acceptance criteria:',
      ...draft.acceptanceCriteria.map((a, i) => `${i + 1}. ${a}`)
    ].join('\n');
    if (combined.trim().length < 40) {
      return undefined;
    }
    try {
      const model = await this.pickModel();
      const systemBlock = [
        'You output valid JSON only (no markdown fences, no commentary before or after).',
        'Schema: { "mermaid": string }',
        'The mermaid string must be one diagram: prefer flowchart TD or LR, or sequenceDiagram.',
        'Maximum 40 lines. Avoid double-quote characters inside node labels; use short labels.',
        'Summarize the backlog as a user journey, system flow, or component view.',
        'Return ONLY JSON.'
      ].join('\n');
      const messages = [
        vscode.LanguageModelChatMessage.User(systemBlock),
        vscode.LanguageModelChatMessage.User(
          `Create one Mermaid diagram for Azure DevOps readers:\n\n${combined.slice(0, 12_000)}`
        )
      ];
      const response = await model.sendRequest(messages, {}, token);
      const text = await this.collect(response);
      let mermaid: string | undefined;
      try {
        const parsed = this.parseJsonWithRepair(text);
        const raw = parsed['mermaid'];
        mermaid = typeof raw === 'string' ? raw.trim() : undefined;
      } catch {
        mermaid = undefined;
      }
      if (!mermaid) {
        const fence = text.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
        mermaid = fence?.[1]?.trim();
      }
      if (!mermaid || !this.looksLikeMermaid(mermaid)) {
        return undefined;
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      return {
        id: randomUUID(),
        fileName: `po-tools-ai-diagram-${stamp}.mmd`,
        mimeType: 'text/plain',
        dataBase64: Buffer.from(mermaid, 'utf8').toString('base64')
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Generates integration test cases for a PBI using the VS Code Language Model API.
   * Returns structured test cases with steps (action + expected result).
   * Used after a successful push/update to populate ADO Test Plans.
   */
  public async generateIntegrationTestCases(
    draft: PbiDraft,
    options?: { linkedProjectContext?: string }
  ): Promise<GeneratedTestCase[]> {
    const token = new vscode.CancellationTokenSource().token;
    const model = await this.pickModel();

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT (ground test steps in actual codebase):\n${options.linkedProjectContext}\n---\n\n`
      : '';

    const acBlock =
      draft.acceptanceCriteria.length > 0
        ? draft.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')
        : '(none provided)';

    const userPrompt =
      linkedPart +
      [
        `PBI Title: ${draft.title}`,
        '',
        'PBI Description:',
        draft.description?.trim() || '(none)',
        '',
        'Acceptance Criteria:',
        acBlock,
        '',
        'Generate 5 to 8 integration test cases that together validate the above PBI.',
        'Return JSON only with schema: { "testCases": [ { "title": string, "steps": [ { "action": string, "expectedResult": string } ] } ] }'
      ].join('\n');

    const systemBlock = [INTEGRATION_TEST_CASE_SYSTEM_PROMPT, '', INTEGRATION_TEST_CASE_JSON_BRIDGE].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);

    const rawCases = Array.isArray(parsed.testCases) ? parsed.testCases : [];
    return rawCases
      .map((tc: unknown): GeneratedTestCase | null => {
        if (!tc || typeof tc !== 'object') {
          return null;
        }
        const record = tc as Record<string, unknown>;
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        if (!title) {
          return null;
        }
        const rawSteps = Array.isArray(record.steps) ? record.steps : [];
        const steps = rawSteps
          .map((s: unknown) => {
            if (!s || typeof s !== 'object') {
              return null;
            }
            const stepRecord = s as Record<string, unknown>;
            const action = typeof stepRecord.action === 'string' ? stepRecord.action.trim() : '';
            const expectedResult = typeof stepRecord.expectedResult === 'string' ? stepRecord.expectedResult.trim() : '';
            if (!action) {
              return null;
            }
            return { action, expectedResult };
          })
          .filter((s): s is { action: string; expectedResult: string } => s !== null);
        return { title, steps };
      })
      .filter((tc): tc is GeneratedTestCase => tc !== null);
  }

  public async suggestBreakdown(
    prefix: string,
    description: string,
    count: number,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<BulkChildInput[]> {
    const model = await this.pickModel();
    const rulebook = await this.getProductManagerRulebook();
    const rbClip =
      rulebook.length > 14_000 ? `${rulebook.slice(0, 14_000)}\n[…]` : rulebook;

    const systemBlock = [
      SYSTEM_PROMPT,
      '',
      'When LINKED PROJECT CONTEXT is provided, name and scope child items using real modules, routes, or APIs from that repository.',
      rbClip.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK (excerpt):\n${rbClip}`
        : ''
    ]
      .filter((s) => s.length > 0)
      .join('\n');

    const linkedBulkPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT:\n${options.linkedProjectContext}\n---\n\n`
      : '';
    const userPrompt =
      linkedBulkPart +
      [
        `Feature prefix: ${prefix}`,
        '',
        'FEATURE DESCRIPTION FROM PO (respect scope, personas, and constraints — do not invent unrelated work):',
        description.trim() || '(none)',
        '',
        `Break this feature into about ${count} focused child backlog items.`,
        'Each child is a vertical slice and uses a short, user-facing suffix (no prefix).',
        'Child descriptions should trace back to specifics in the feature description or linked codebase (routes/APIs/modules).',
        'Return JSON only: { "children": [ { "suffix", "description", "acceptanceCriteria", "testScenarios" } ] }.'
      ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);

    const children = Array.isArray(parsed.children) ? parsed.children : [];
    return children
      .map((child: unknown): BulkChildInput | null => {
        if (!child || typeof child !== 'object') {
          return null;
        }
        const record = child as Record<string, unknown>;
        const suffix = typeof record.suffix === 'string' ? record.suffix.trim() : '';
        if (!suffix) {
          return null;
        }
        return {
          suffix,
          description: typeof record.description === 'string' ? record.description : undefined,
          acceptanceCriteria: this.toStringArray(record.acceptanceCriteria),
          testScenarios: this.toStringArray(record.testScenarios)
        };
      })
      .filter((value: BulkChildInput | null): value is BulkChildInput => value !== null);
  }

  public async openInCopilotChat(
    draft: PbiDraft,
    options?: {
      mode?: 'refine' | 'newStory';
      seedIdea?: string;
      linkedProjectContext?: string;
    }
  ): Promise<void> {
    const mode = options?.mode ?? 'refine';
    const linkedClip = options?.linkedProjectContext
      ? this.clipLinkedForChat(options.linkedProjectContext)
      : '';
    if (mode === 'newStory') {
      await this.openNewStoryInCopilotChat(draft, options?.seedIdea, linkedClip);
      return;
    }

    const rulebook = this.clipForChatRulebook(await this.getProductManagerRulebook());
    const prompt = [
      '@github Refine this Product Backlog Item per the PRODUCT_MANAGER_RULEBOOK below (PayRailz / fintech PO standards).',
      'Prioritize the Product Owner description and business intent; use LINKED PROJECT for technical grounding.',
      'When done, reply with JSON only in this shape: { "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }.',
      'Optionally include "title": string if you suggest a clearer title.',
      'Do not create files or reports/ — output JSON only. I will paste the JSON into PO Tools → Apply AI Result.',
      '',
      REFINE_JSON_BRIDGE,
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : '',
      '',
      `Title: ${draft.title}`,
      `Iteration: ${draft.iteration}`,
      `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      `Effort (days): ${draft.effortDays}`,
      '',
      'PRODUCT OWNER DESCRIPTION (primary):',
      draft.description || '(empty)',
      '',
      'Current acceptance criteria:',
      ...draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`),
      '',
      'Current test scenarios:',
      ...draft.testScenarios.map((item, i) => `${i + 1}. ${item}`),
      linkedClip
        ? `---\nLINKED PROJECT (ground technical details in your JSON):\n${linkedClip}`
        : ''
    ]
      .filter((line) => line.length > 0)
      .join('\n');

    await this.openChatWithPrompt(prompt);
  }

  /**
   * Starter prompt for POs building a user story from scratch in VS Code Copilot Chat.
   */
  public async openNewStoryInCopilotChat(
    draft: PbiDraft,
    seedIdea?: string,
    linkedProjectContext?: string
  ): Promise<void> {
    const linkedClip = linkedProjectContext ? this.clipLinkedForChat(linkedProjectContext) : '';
    const prompt = [
      '@github You are helping a Product Owner draft a backlog item in the PO Professional Tools extension.',
      'Collaborate to produce: a clear user-facing description, testable acceptance criteria (Given/When/Then or concise bullets), and practical test scenarios.',
      'When the PO is satisfied, reply with JSON only (no markdown fences) in this shape:',
      '{ "title"?: string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
      'Include "title" only if you suggest a better title than the working title below.',
      'IMPORTANT: In JSON string values, never use unescaped double quotes — rephrase or use single quotes for labels.',
      'The PO can paste into PO Tools → Apply JSON, or use PO Tools → "Generate full story in-panel" for one-click apply without pasting.',
      '',
      seedIdea && seedIdea.trim().length > 0
        ? `Context / idea from the PO:\n${seedIdea.trim()}`
        : 'The PO is starting from a mostly blank item — ask clarifying questions if needed.',
      '',
      `Working title: ${draft.title}`,
      `Work item type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      `Iteration: ${draft.iteration}`,
      '',
      'Current fields (often empty at start):',
      `Description: ${draft.description || '(empty)'}`,
      `Acceptance criteria: ${draft.acceptanceCriteria.length ? draft.acceptanceCriteria.join('; ') : '(none yet)'}`,
      `Test scenarios: ${draft.testScenarios.length ? draft.testScenarios.join('; ') : '(none yet)'}`,
      linkedClip
        ? `---\nLINKED PROJECT (align story with this codebase):\n${linkedClip}`
        : ''
    ]
      .filter((line) => line.length > 0)
      .join('\n');

    await this.openChatWithPrompt(prompt);
  }

  private suggestionFromParsed(parsed: Record<string, unknown>): AiSuggestion {
    const suggestion: AiSuggestion = {};
    if (typeof parsed.title === 'string' && parsed.title.trim().length > 0) {
      suggestion.title = parsed.title.trim();
    }
    if (typeof parsed.description === 'string') {
      suggestion.description = parsed.description;
    }
    if (Array.isArray(parsed.acceptanceCriteria)) {
      suggestion.acceptanceCriteria = parsed.acceptanceCriteria
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }
    if (Array.isArray(parsed.testScenarios)) {
      suggestion.testScenarios = parsed.testScenarios
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }
    if (typeof parsed.userStoryStatement === 'string' && parsed.userStoryStatement.trim().length > 0) {
      suggestion.userStoryStatement = parsed.userStoryStatement.trim();
    }
    if (typeof parsed.businessRulesAndAssumptions === 'string' && parsed.businessRulesAndAssumptions.trim().length > 0) {
      suggestion.businessRulesAndAssumptions = parsed.businessRulesAndAssumptions.trim();
    }
    return suggestion;
  }

  private technicalConsiderationsFromParsed(parsed: Record<string, unknown>): TechnicalConsiderations {
    const rawTechnicalDetails =
      typeof parsed.technicalDetails === 'string' ? parsed.technicalDetails.trim() : '';
    const rawArchitectureNotes =
      typeof parsed.architectureNotes === 'string' ? parsed.architectureNotes.trim() : '';
    const scopedFiles = this.toStringArray(parsed.scopedFiles) || [];

    // Strip markdown code fences (defensive post-processing)
    const technicalDetails = this.stripCodeFences(rawTechnicalDetails);
    const architectureNotes = this.stripCodeFences(rawArchitectureNotes);

    if (!technicalDetails && !architectureNotes) {
      throw new Error('AI response missing required fields. Try again with more context.');
    }

    return {
      technicalDetails,
      scopedFiles,
      architectureNotes
    };
  }

  private featureDefinitionFromParsed(parsed: Record<string, unknown>): FeatureDefinition {
    const why = typeof parsed.why === 'string' ? parsed.why.trim() : '';
    const userFlow = typeof parsed.userFlow === 'string' ? parsed.userFlow.trim() : '';
    const businessRules = typeof parsed.businessRules === 'string' ? parsed.businessRules.trim() : '';
    const userStoryStatement = typeof parsed.userStoryStatement === 'string' ? parsed.userStoryStatement.trim() : '';

    if (!why && !userFlow && !businessRules && !userStoryStatement) {
      throw new Error('AI response missing all feature definition fields. Try again with more context.');
    }

    return {
      why,
      userFlow,
      businessRules,
      userStoryStatement
    };
  }

  private stripCodeFences(text: string): string {
    // Remove markdown code fences like ```mermaid...``` or ```...```
    return text.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '').trim();
  }

  private async openChatWithPrompt(prompt: string): Promise<void> {
    try {
      await vscode.commands.executeCommand('workbench.action.chat.open', { query: prompt });
    } catch {
      await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
      await vscode.env.clipboard.writeText(prompt);
      void vscode.window.showInformationMessage(
        'Copilot Chat: the prompt was copied to your clipboard. Paste it into chat if needed.'
      );
    }
  }

  private async gatherRepoContext(): Promise<string> {
    const execAsync = promisify(exec);
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return '';
    }

    const lines: string[] = ['=== REPOSITORY CONTEXT ==='];
    try {
      const pkgPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        lines.push(`Project: ${pkg.name} v${pkg.version} — ${pkg.description ?? ''}`);
      }

      const readmePath = path.join(workspaceRoot, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8').slice(0, 800);
        lines.push(`\nREADME:\n${readme}`);
      }

      const { stdout: log } = await execAsync('git log --oneline -15', { cwd: workspaceRoot });
      lines.push(`\nRecent commits:\n${log.trim()}`);

      const { stdout: files } = await execAsync(
        'git ls-files "*.ts" "*.tsx" "*.json" --exclude-standard',
        { cwd: workspaceRoot }
      );
      const fileList = files.trim().split('\n').slice(0, 60).join('\n');
      lines.push(`\nKey files:\n${fileList}`);
    } catch {
      // Git not available or no workspace — return empty context silently
    }
    lines.push('=== END CONTEXT ===');
    return lines.join('\n');
  }

  private async pickModel(): Promise<vscode.LanguageModelChat> {
    // Try copilot gpt-4o first, then any copilot model, then any available model
    let models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
    if (models.length === 0) {
      models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
    }
    if (models.length === 0) {
      models = await vscode.lm.selectChatModels({});
    }
    const preferred =
      models.find((m) => m.family.toLowerCase().includes('gpt-4o')) ??
      models.find((m) => m.family.toLowerCase().includes('gpt-4')) ??
      models[0];
    if (!preferred) {
      const action = await vscode.window.showErrorMessage(
        'No language model is available. Sign in to GitHub Copilot and enable Chat, then retry. If using a custom LM provider, ensure it is configured and active.',
        'Open Copilot Settings'
      );
      if (action === 'Open Copilot Settings') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'github.copilot');
      }
      throw new Error(
        'No language model is available. Sign in to GitHub Copilot and enable Chat, then retry.'
      );
    }
    return preferred;
  }

  private async collect(response: vscode.LanguageModelChatResponse): Promise<string> {
    let text = '';
    for await (const part of response.text) {
      text += part;
    }
    return text;
  }

  private parseJsonWithRepair(text: string): Record<string, unknown> {
    const cleaned = this.stripFences(text).trim();
    try {
      const value = JSON.parse(cleaned);
      if (value && typeof value === 'object') {
        return value as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
    try {
      const repaired = jsonrepair(cleaned);
      const value = JSON.parse(repaired);
      if (value && typeof value === 'object') {
        return value as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const repaired = jsonrepair(match[0]);
        const value = JSON.parse(repaired);
        if (value && typeof value === 'object') {
          return value as Record<string, unknown>;
        }
      } catch {
        // fall through
      }
    }
    throw new Error('AI response was not valid JSON. Try again or use Generate full story in-panel.');
  }

  private looksLikeMermaid(text: string): boolean {
    const head = text
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith('%%'));
    if (!head) {
      return false;
    }
    return /^(flowchart|graph|sequenceDiagram|stateDiagram-v2|stateDiagram|classDiagram|erDiagram|mindmap|timeline)\b/i.test(
      head
    );
  }

  private stripFences(text: string): string {
    return text
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  private toStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return items.length > 0 ? items : undefined;
  }

  /**
   * Generates a full backlog item from the User Story Wizard INVEST answers.
   * Uses the structured Background / Why / How / User Story inputs as primary business context.
   */
  public async generateFromInvestWizard(
    draft: PbiDraft,
    wizard: InvestWizardInput,
    token: vscode.CancellationToken,
    options?: { linkedProjectContext?: string }
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();
    const rulebook = await this.getProductManagerRulebook();

    const systemBlock = [
      FULL_STORY_SYSTEM_PROMPT,
      '',
      FULL_STORY_JSON_BRIDGE,
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : '---\n(Product Manager rulebook not found.)'
    ].join('\n');

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT:\n${options.linkedProjectContext}\n---\n\n`
      : '';

    const userStory = `As a ${wizard.persona}, I want ${wizard.want}, so that ${wizard.benefit}.`;

    const userPrompt =
      linkedPart +
      [
        'Generate the full backlog item from the Product Owner\'s structured INVEST wizard answers below.',
        '',
        '--- INVEST WIZARD ANSWERS (primary business input — use as the source of truth) ---',
        '',
        `BACKGROUND (context / problem):`,
        wizard.background.trim(),
        '',
        `WHY (business value / outcome):`,
        wizard.why.trim(),
        '',
        `HOW (user flow / interaction):`,
        wizard.how.trim(),
        '',
        ...(wizard.businessRulesAndAssumptions?.trim() 
          ? [
              `BUSINESS RULES & ASSUMPTIONS:`,
              wizard.businessRulesAndAssumptions.trim(),
              ''
            ]
          : []),
        `USER STORY:`,
        userStory,
        '',
        '--- END WIZARD ANSWERS ---',
        '',
        `Working title: ${draft.title}`,
        `Work item type: ${draft.workItemType ?? 'Product Backlog Item'}`,
        `Iteration: ${draft.iteration}`,
        '',
        'Generate: title (action-oriented, under 120 chars), description (2-4 paragraphs, user value first),',
        'exactly 4-7 testable acceptance criteria (Given/When/Then preferred), and 4-8 practical test scenarios.',
        'The description must incorporate background, why, and how in natural prose.',
        'Acceptance criteria must be verifiable against the user story benefit.'
      ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemBlock),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const repoCtx = await this.gatherRepoContext();
    if (repoCtx) {
      messages.unshift(
        vscode.LanguageModelChatMessage.User(
          `Use the following repository context to inform your user story generation:\n\n${repoCtx}`
        )
      );
    }

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    const suggestion = this.suggestionFromParsed(parsed);
    if (
      !suggestion.description &&
      !suggestion.acceptanceCriteria?.length &&
      !suggestion.testScenarios?.length
    ) {
      throw new Error(
        'Model returned empty fields. Add more detail in the wizard steps and try again.'
      );
    }
    return suggestion;
  }

  /**
   * Opens Copilot Chat with a structured guided prompt built from INVEST wizard answers.
   * The prompt frames the conversation around How/Why/Background/User Story so the agent
   * can ask follow-up questions and collaborate with the PO.
   */
  public async openInvestWizardInChat(
    draft: PbiDraft,
    wizard: InvestWizardInput,
    linkedProjectContext?: string
  ): Promise<void> {
    const rulebook = this.clipForChatRulebook(await this.getProductManagerRulebook());
    const linkedClip = linkedProjectContext ? this.clipLinkedForChat(linkedProjectContext) : '';

    const userStory = `As a ${wizard.persona}, I want ${wizard.want}, so that ${wizard.benefit}.`;

    const prompt = [
      '@github You are a senior Product Owner assistant collaborating with a PO to refine a backlog item.',
      'The PO has answered four INVEST-guided questions (Background, Why, How, User Story).',
      'Your job is to:',
      '  1. Review the answers for gaps, ambiguity, or scope creep.',
      '  2. Ask at most 2–3 targeted clarifying questions if anything is unclear.',
      '  3. Once the PO answers (or if everything is clear), produce the final backlog item.',
      '',
      'When ready, reply with JSON only (no markdown fences):',
      '{ "title": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
      'IMPORTANT: Never use unescaped double quotes inside JSON string values.',
      '',
      REFINE_JSON_BRIDGE,
      '',
      '=== PO INVEST WIZARD ANSWERS ===',
      '',
      'BACKGROUND (context / problem):',
      wizard.background.trim(),
      '',
      'WHY (business value / expected outcome):',
      wizard.why.trim(),
      '',
      'HOW (user flow / interaction):',
      wizard.how.trim(),
      '',
      ...(wizard.businessRulesAndAssumptions?.trim()
        ? [
            'BUSINESS RULES & ASSUMPTIONS:',
            wizard.businessRulesAndAssumptions.trim(),
            ''
          ]
        : []),
      'USER STORY:',
      userStory,
      '',
      '=== DRAFT CONTEXT ===',
      `Working title: ${draft.title}`,
      `Work item type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      `Iteration: ${draft.iteration}`,
      `Effort: ${draft.effortDays} day(s)`,
      draft.description?.trim()
        ? `\nExisting description (merge or replace as appropriate):\n${draft.description.trim()}`
        : '',
      linkedClip ? `\n---\nLINKED PROJECT (technical grounding):\n${linkedClip}` : '',
      rulebook.trim().length > 0
        ? `\n---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : ''
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    await this.openChatWithPrompt(prompt);
  }

  /**
   * Generates a structured bug PBI from the Bug Report Wizard inputs.
   * Injects repo context for technical grounding.
   */
  public async generateBugReport(
    input: BugReportInput,
    token: vscode.CancellationToken
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();

    const bugSystemPrompt = [
      'You are an expert Product Owner assistant.',
      'Given a bug report and repository context, generate a structured bug PBI with: title, description, acceptance criteria, and INVEST-compliant definition of done.',
      'Output must be valid JSON only (no markdown fences, no commentary before or after).',
      '',
      'Schema: { "title": string, "description": string, "acceptanceCriteria": string[], "investSummary": string }',
      '',
      'TITLE: Concise bug title under 120 characters, starting with a verb (e.g. "Fix", "Resolve").',
      'DESCRIPTION: 2–3 paragraphs. State the observed behaviour, expected behaviour, and business impact.',
      'ACCEPTANCE CRITERIA: 3–6 verifiable outcomes confirming the bug is fixed. Prefer Given/When/Then.',
      'INVEST SUMMARY: 1–2 sentence summary of how this item satisfies the provided INVEST flags.',
      'Never output invalid JSON.'
    ].join('\n');

    const investFlags = [
      `Independent=${input.independent}`,
      `Negotiable=${input.negotiable}`,
      `Valuable=${input.valuable}`,
      `Estimable=${input.estimable}`,
      `Small=${input.small}`,
      `Testable=${input.testable}`
    ].join(', ');

    const bugUserPrompt = [
      'Bug Location: ' + input.whereLocation,
      '',
      'Steps to Reproduce:',
      input.howToReproduce,
      '',
      'Acceptance Criteria (definition of fixed):',
      input.acceptanceCriteria,
      '',
      `INVEST: ${investFlags}`,
      '',
      'Generate a JSON response matching this schema: { "title": string, "description": string, "acceptanceCriteria": string[], "investSummary": string }'
    ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(bugSystemPrompt),
      vscode.LanguageModelChatMessage.User(bugUserPrompt)
    ];

    const repoCtx = await this.gatherRepoContext();
    if (repoCtx) {
      messages.unshift(
        vscode.LanguageModelChatMessage.User(
          `Use the following repository context to inform your bug PBI generation:\n\n${repoCtx}`
        )
      );
    }

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);
    const suggestion = this.suggestionFromParsed(parsed);
    if (typeof parsed.investSummary === 'string' && parsed.investSummary.trim().length > 0) {
      suggestion.investSummary = parsed.investSummary.trim();
    }
    if (
      !suggestion.title &&
      !suggestion.description &&
      !suggestion.acceptanceCriteria?.length
    ) {
      throw new Error('Model returned empty fields. Add more detail and try again.');
    }
    return suggestion;
  }

  /**
   * Opens Copilot Chat with a structured guided prompt built from Bug Report Wizard inputs.
   * Adapts the INVEST wizard chat pattern for bug reporting.
   */
  public async openBugReportInChat(input: BugReportInput): Promise<void> {
    const rulebook = this.clipForChatRulebook(await this.getProductManagerRulebook());

    const investFlags = [
      `Independent=${input.independent}`,
      `Negotiable=${input.negotiable}`,
      `Valuable=${input.valuable}`,
      `Estimable=${input.estimable}`,
      `Small=${input.small}`,
      `Testable=${input.testable}`
    ].join(', ');

    const prompt = [
      '@github You are a senior Product Owner assistant helping to write a well-formed bug report PBI.',
      'The PO has provided details about the bug. Your job is to:',
      '  1. Review the information for gaps or ambiguity.',
      '  2. Ask at most 2–3 targeted clarifying questions if needed.',
      '  3. Produce a finalized bug PBI when ready.',
      '',
      'When ready, reply with JSON only (no markdown fences):',
      '{ "title": string, "description": string, "acceptanceCriteria": string[], "investSummary": string }',
      'IMPORTANT: Never use unescaped double quotes inside JSON string values.',
      '',
      FULL_STORY_JSON_BRIDGE,
      '',
      '=== BUG REPORT INPUTS ===',
      '',
      'Bug Location (component/area/page):',
      input.whereLocation,
      '',
      'Steps to Reproduce:',
      input.howToReproduce,
      '',
      'Acceptance Criteria (definition of fixed):',
      input.acceptanceCriteria,
      '',
      `INVEST Flags: ${investFlags}`,
      '',
      rulebook.trim().length > 0
        ? `---\nPRODUCT_MANAGER_RULEBOOK:\n${rulebook}`
        : ''
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    await this.openChatWithPrompt(prompt);
  }

  /**
   * Generates Product Backlog Items (user stories) from a Feature Draft using AI.
   * Returns an array of PbiDraft-shaped objects (without id/timestamps — caller assigns those).
   */
  public async generateUserStoriesFromFeature(
    feature: FeatureDraft,
    token: vscode.CancellationToken,
    options?: { storyCount?: number; linkedProjectContext?: string }
  ): Promise<Array<{ title: string; description: string; effort: number }>> {
    const model = await this.pickModel();
    const count = options?.storyCount ?? 5;

    const systemPrompt = [
      'You are a product owner assistant. Break a feature into Product Backlog Items (user stories).',
      'Output must be valid JSON only (no markdown fences, no commentary before or after).',
      '',
      `Schema: { "stories": [ { "title": string, "description": string, "effort": number } ] }`,
      '',
      'TITLE: "As a [user], I want [goal], so that [benefit]." format. Under 150 characters.',
      'DESCRIPTION: 2–3 sentences of context, scope, and user value.',
      'EFFORT: Story points 1–8 (Fibonacci: 1, 2, 3, 5, 8).',
      '',
      `Generate ${count} to ${Math.min(count + 2, 7)} stories unless the feature naturally decomposes to fewer.`,
      'Each story must be independently deliverable (INVEST principle).',
      'Never output invalid JSON.'
    ].join('\n');

    const contextParts: string[] = [];
    if (feature.why) { contextParts.push(`Why / Business Value:\n${feature.why}`); }
    if (feature.userFlow) { contextParts.push(`User Flow:\n${feature.userFlow}`); }
    if (feature.businessRules) { contextParts.push(`Business Rules:\n${feature.businessRules}`); }

    const linkedPart = options?.linkedProjectContext
      ? `LINKED PROJECT CONTEXT (ground stories in actual codebase):\n${options.linkedProjectContext}\n---\n\n`
      : '';

    const userPrompt =
      linkedPart +
      [
        `Feature Title: ${feature.title}`,
        '',
        feature.description ? `Feature Description:\n${feature.description}` : '',
        '',
        ...contextParts,
        '',
        `Return JSON: { "stories": [ { "title": string, "description": string, "effort": number } ] }`
      ]
        .filter((l) => l !== undefined)
        .join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(systemPrompt),
      vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token);
    const text = await this.collect(response);
    const parsed = this.parseJsonWithRepair(text);

    const rawStories = Array.isArray(parsed.stories) ? parsed.stories : [];
    return rawStories
      .map((s: unknown): { title: string; description: string; effort: number } | null => {
        if (!s || typeof s !== 'object') { return null; }
        const r = s as Record<string, unknown>;
        const title = typeof r.title === 'string' ? r.title.trim() : '';
        if (!title) { return null; }
        return {
          title,
          description: typeof r.description === 'string' ? r.description.trim() : '',
          effort: typeof r.effort === 'number' ? Math.min(8, Math.max(1, Math.round(r.effort))) : 2
        };
      })
      .filter((s): s is { title: string; description: string; effort: number } => s !== null);
  }
}
