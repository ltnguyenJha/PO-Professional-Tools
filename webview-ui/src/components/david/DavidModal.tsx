import type { ReactNode } from 'react';
import { useId } from 'react';
import { useDavidModal } from './useDavidModal';
import type { ModalConfig } from 'david-ai';

export interface DavidModalProps {
  open: boolean;
  onClose: () => void;
  titleId?: string;
  children: ReactNode;
  className?: string;
  config?: ModalConfig;
}

/**
 * Accessible modal shell powered by david-ai programmatic Modal + focus trap.
 */
export function DavidModal({
  open,
  onClose,
  titleId,
  children,
  className = '',
  config
}: DavidModalProps): JSX.Element | null {
  const autoId = useId();
  const labelledBy = titleId ?? autoId;
  const { modalRef, handleBackdropClick } = useDavidModal({
    open,
    onClose,
    ...config
  });

  if (!open) {
    return null;
  }

  return (
    <div
      ref={modalRef as React.RefObject<HTMLDivElement>}
      className={`overlay david-modal ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={handleBackdropClick}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export { useDavidModal };
