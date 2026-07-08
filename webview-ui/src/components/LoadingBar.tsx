interface Props {
  /** Shown next to / above the bar; warm defaults when `variant="ai"` */
  label?: string;
  /** Visually hidden label for aria (defaults to label or AI default) */
  ariaLabel?: string;
  /** `ai` applies violet shimmer fill and warm default copy */
  variant?: 'default' | 'ai';
}

export const AI_LOADING_DEFAULT_LABEL = '✨ AI is thinking…';
export const AI_LOADING_DEFAULT_ARIA = 'AI is processing your request';

export function LoadingBar({
  label,
  ariaLabel,
  variant = 'default'
}: Props): JSX.Element {
  const isAi = variant === 'ai';
  const displayLabel =
    label ?? (isAi ? AI_LOADING_DEFAULT_LABEL : 'Loading…');
  const displayAria =
    ariaLabel ??
    (isAi && !label ? AI_LOADING_DEFAULT_ARIA : displayLabel);

  const fillClass = isAi
    ? 'loading-bar-indeterminate ai-shimmer'
    : 'loading-bar-indeterminate progress-fill';

  return (
    <div
      className={`loading-bar-wrap${isAi ? ' loading-bar-wrap--ai' : ''}`}
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loading-bar-label">{displayLabel}</span>
      <div
        className="loading-bar-track"
        aria-label={displayAria}
        title={displayLabel}
      >
        <div className={fillClass} />
      </div>
    </div>
  );
}

/** Convenience wrapper — warm AI defaults + shimmer bar */
export function AiLoadingBar({
  label,
  ariaLabel
}: Pick<Props, 'label' | 'ariaLabel'>): JSX.Element {
  return <LoadingBar label={label} ariaLabel={ariaLabel} variant="ai" />;
}
