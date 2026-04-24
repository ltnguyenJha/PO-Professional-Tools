import { randomUUID } from 'crypto';
import { jsonrepair } from 'jsonrepair';
import * as vscode from 'vscode';
import { AiSuggestion, BulkChildInput, InvestWizardInput, PbiAttachment, PbiDraft } from '../shared/messages';

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
  'Schema: { "title": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
  '',
  'TITLE: Action-oriented, under 120 characters.',
  '',
  'DESCRIPTION: 2–4 short paragraphs. User value first; scope and boundaries clear.',
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
   * Produces a single .mmd attachment from backlog text for Azure DevOps (Push / Update).
   * Returns undefined if the model fails or output is not valid Mermaid.
   */
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
    return suggestion;
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

  private async pickModel(): Promise<vscode.LanguageModelChat> {
    const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
    const preferred =
      models.find((m) => m.family.toLowerCase().includes('gpt-4o')) ??
      models.find((m) => m.family.toLowerCase().includes('gpt-4')) ??
      models[0];
    if (!preferred) {
      throw new Error(
        'No GitHub Copilot chat model is available. Sign in to Copilot and enable Chat, then retry.'
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
}
