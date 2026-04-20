import { jsonrepair } from 'jsonrepair';
import * as vscode from 'vscode';
import { AiSuggestion, BulkChildInput, PbiDraft } from '../shared/messages';

const SYSTEM_PROMPT = [
  'You are a senior Product Owner assistant.',
  'Refine backlog items so they are clear, concise, testable, and stakeholder-ready.',
  'Respond with strict JSON only (no markdown, no prose, no code fences).',
  'When refining a single PBI, respond with:',
  '{ "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }',
  'When breaking a feature into children, respond with:',
  '{ "children": [ { "suffix": string, "description": string, "acceptanceCriteria": string[], "testScenarios": string[] } ] }',
  'Never include keys outside the schema. Never wrap output in markdown.'
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
  public async refineDraft(
    draft: PbiDraft,
    instruction: string | undefined,
    token: vscode.CancellationToken
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();

    const userPrompt = [
      instruction ? `PO instruction: ${instruction}` : 'Refine the backlog item below.',
      'Return JSON with keys: description, acceptanceCriteria, testScenarios (optional title).',
      '',
      `Title: ${draft.title}`,
      `Iteration: ${draft.iteration}`,
      `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      `Effort (days): ${draft.effortDays}`,
      '',
      'Current description:',
      draft.description || '(empty)',
      '',
      'Current acceptance criteria:',
      ...draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`),
      '',
      'Current test scenarios:',
      ...draft.testScenarios.map((item, i) => `${i + 1}. ${item}`)
    ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(SYSTEM_PROMPT),
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
    token: vscode.CancellationToken
  ): Promise<AiSuggestion> {
    const model = await this.pickModel();
    const seed =
      seedText?.trim() ||
      draft.description?.trim() ||
      'Infer a reasonable scope from the working title and any notes below.';

    const userPrompt = [
      'Generate the full backlog item (replace description, criteria, and tests entirely).',
      '',
      'BUSINESS CONTEXT (primary input):',
      seed,
      '',
      `Working title: ${draft.title}`,
      `Iteration: ${draft.iteration}`,
      `Work item type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      '',
      'Optional notes from the draft (merge with context if useful):',
      draft.description && draft.description.trim() !== seed ? draft.description : '(none beyond context above)',
      '',
      'Ignore any previous acceptance criteria unless they add facts; prefer a fresh, tight set per the system rules.'
    ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(FULL_STORY_SYSTEM_PROMPT),
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

  public async suggestBreakdown(
    prefix: string,
    description: string,
    count: number,
    token: vscode.CancellationToken
  ): Promise<BulkChildInput[]> {
    const model = await this.pickModel();
    const userPrompt = [
      `Feature prefix: ${prefix}`,
      `Feature description: ${description}`,
      `Break this feature into about ${count} focused child backlog items.`,
      'Each child is a vertical slice and uses a short, user-facing suffix (no prefix).',
      'Return JSON only: { "children": [ { "suffix", "description", "acceptanceCriteria", "testScenarios" } ] }.'
    ].join('\n');

    const messages = [
      vscode.LanguageModelChatMessage.User(SYSTEM_PROMPT),
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
    options?: { mode?: 'refine' | 'newStory'; seedIdea?: string }
  ): Promise<void> {
    const mode = options?.mode ?? 'refine';
    if (mode === 'newStory') {
      await this.openNewStoryInCopilotChat(draft, options?.seedIdea);
      return;
    }

    const prompt = [
      '@github Refine this Product Backlog Item. Keep language concise and stakeholder-ready.',
      'When done, reply with JSON only in this shape: { "description": string, "acceptanceCriteria": string[], "testScenarios": string[] }.',
      'Optionally include "title": string if you suggest a clearer title.',
      'I will paste the JSON back into the PO Tools "Apply AI Result" box.',
      '',
      `Title: ${draft.title}`,
      `Iteration: ${draft.iteration}`,
      `Work Item Type: ${draft.workItemType ?? 'Product Backlog Item'}`,
      `Effort (days): ${draft.effortDays}`,
      '',
      'Current description:',
      draft.description || '(empty)',
      '',
      'Current acceptance criteria:',
      ...draft.acceptanceCriteria.map((item, i) => `${i + 1}. ${item}`),
      '',
      'Current test scenarios:',
      ...draft.testScenarios.map((item, i) => `${i + 1}. ${item}`)
    ].join('\n');

    await this.openChatWithPrompt(prompt);
  }

  /**
   * Starter prompt for POs building a user story from scratch in VS Code Copilot Chat.
   */
  public async openNewStoryInCopilotChat(draft: PbiDraft, seedIdea?: string): Promise<void> {
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
      `Test scenarios: ${draft.testScenarios.length ? draft.testScenarios.join('; ') : '(none yet)'}`
    ].join('\n');

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
}
