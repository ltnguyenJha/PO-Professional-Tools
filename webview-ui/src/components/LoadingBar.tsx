interface Props {
  /** Shown next to / above the bar for screen readers and sighted users */
  label: string;
  /** Visually hidden label for aria (defaults to label) */
  ariaLabel?: string;
}

export function LoadingBar({ label, ariaLabel }: Props): JSX.Element {
  return (
    <div className="loading-bar-wrap" role="status" aria-live="polite" aria-busy="true">
      <span className="loading-bar-label">{label}</span>
      <div
        className="loading-bar-track"
        aria-label={ariaLabel ?? label}
        title={label}
      >
        <div className="loading-bar-indeterminate progress-fill" />
      </div>
    </div>
  );
}
