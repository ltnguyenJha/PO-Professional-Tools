import type { ReactNode } from 'react';
import { useDavidCollapse } from './useDavidCollapse';

export interface DavidCollapseProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  headerActions?: ReactNode;
  trailing?: ReactNode;
  id?: string;
}

/**
 * Accessible collapsible section powered by david-ai Collapse.
 * Uses VS Code theme classes and proper button + aria-expanded semantics.
 */
export function DavidCollapse({
  title,
  subtitle,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className = '',
  headerActions,
  trailing,
  id
}: DavidCollapseProps): JSX.Element {
  const { buttonRef, panelRef } = useDavidCollapse({ defaultOpen, open, onOpenChange });

  return (
    <article className={`card david-collapse ${className}`.trim()} id={id}>
      <div className="david-collapse-header">
        <button
          ref={buttonRef}
          type="button"
          className="david-collapse-trigger"
          aria-expanded={defaultOpen}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 style={{ margin: 0 }}>{title}</h3>
            ) : (
              title
            )}
            {subtitle ? <p className="settings-section-subtitle">{subtitle}</p> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {trailing}
            <span className="section-chevron" aria-hidden="true">
              ▾
            </span>
          </div>
        </button>
        {headerActions ? (
          <div className="david-collapse-actions">{headerActions}</div>
        ) : null}
      </div>
      <div ref={panelRef} className="david-collapse-panel">
        {children}
      </div>
    </article>
  );
}
