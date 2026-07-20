/**
 * Quick-refinement pill labels and Copilot instructions for PBI Studio
 * "Collaborate with AI" panel. Owner: Tess · Implement: Rusty (PbiStudio.tsx)
 * @see docs/DESIGN.md §14
 */

export interface RefinePromptPill {
  /** Stable id for analytics / keyboard shortcuts (future) */
  id: string;
  /** Visible pill label — keep short for narrow panels */
  label: string;
  /** Instruction sent to REFINE_PBI_WITH_AI when pill is clicked */
  instruction: string;
}

/** Default quick-refinement pills shown below chat history. */
export const REFINE_PROMPT_PILLS: RefinePromptPill[] = [
  {
    id: 'technical',
    label: 'Make more technical',
    instruction:
      'Make the description and acceptance criteria more technical. Add implementation details, data contracts, and integration points relevant to the linked codebase.'
  },
  {
    id: 'acceptance-criteria',
    label: 'Add acceptance criteria',
    instruction:
      'Add 4–7 sharp, testable acceptance criteria in Given/When/Then format. Keep each criterion atomic and verifiable.'
  },
  {
    id: 'shorten',
    label: 'Shorten description',
    instruction:
      'Shorten the description while preserving scope, actors, and success criteria. Remove redundancy and filler.'
  },
  {
    id: 'accessibility',
    label: 'Add accessibility notes',
    instruction:
      'Add accessibility requirements: keyboard navigation, screen reader support, color contrast, and WCAG 2.1 AA considerations where applicable.'
  }
];

/** Placeholder for the refinement input at the bottom of the chat panel. */
export const REFINE_INPUT_PLACEHOLDER =
  'Tell me how to improve this PBI… (e.g., "Add security requirements", "Focus on mobile users")';

/** Primary send action label (includes sparkle for visual parity with AI CTAs). */
export const REFINE_SEND_LABEL = 'Send to AI ✨';

/** Panel header — positions co-creation as collaborative, not transactional. */
export const REFINE_PANEL_TITLE = 'Collaborate with AI';

/** Subtitle under header — reinforces dual path (chat + manual form). */
export const REFINE_PANEL_SUBTITLE =
  'Refine your draft with natural language. You can always edit fields directly in Edit item below.';

/** AI response bubble prefix when refinement completes (shown in chat history). */
export const REFINE_AI_RESPONSE_PREFIX = "I've updated your draft based on your request. Review the suggestion below.";

/** Empty chat state — first visit before any prompts. */
export const REFINE_EMPTY_STATE =
  'Try a quick refinement below, or describe what you want to change.';

/** Link to manual edit escape hatch. */
export const REFINE_MANUAL_EDIT_LABEL = 'Edit fields manually';
