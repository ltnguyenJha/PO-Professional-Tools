import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export interface ModalA11yOptions {
  open: boolean;
  onClose: () => void;
  /** When false, Escape does not close (default: true) */
  closeOnEscape?: boolean;
}

/**
 * Focus trap, Escape key, and return-focus for modal dialogs.
 */
export function useModalA11y(
  containerRef: React.RefObject<HTMLElement | null>,
  { open, onClose, closeOnEscape = true }: ModalA11yOptions
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusables = getFocusableElements(container);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || focusables.length === 0) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [open, onClose, closeOnEscape, containerRef]);
}
