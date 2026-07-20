/** Quick refinement chips — DESIGN.md §2.4 / §4 (Co-Creation). */
export const QUICK_REFINEMENT_PILLS = [
  { id: 'technical', label: 'Make more technical', instruction: 'Make the description more technical with implementation details.' },
  { id: 'acceptance', label: 'Add acceptance criteria', instruction: 'Add clear, testable acceptance criteria.' },
  { id: 'shorten', label: 'Shorten description', instruction: 'Shorten the description while keeping the core intent.' },
  { id: 'a11y', label: 'Add accessibility notes', instruction: 'Add accessibility requirements and WCAG-oriented acceptance criteria.' }
] as const;

export type QuickRefinementPill = (typeof QUICK_REFINEMENT_PILLS)[number];
