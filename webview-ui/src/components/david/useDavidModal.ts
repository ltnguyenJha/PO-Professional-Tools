import { useEffect, useRef } from 'react';
import { Modal } from 'david-ai';
import type { IModal, ModalConfig } from 'david-ai';
import { useModalA11y } from './useModalA11y';

export interface UseDavidModalOptions extends ModalConfig {
  open: boolean;
  onClose: () => void;
}

export interface UseDavidModalResult {
  modalRef: React.RefObject<HTMLDivElement | null>;
  handleBackdropClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Wires david-ai programmatic Modal (show/hide) with WCAG focus trap + Escape.
 */
export function useDavidModal({
  open,
  onClose,
  closeOnOutsideClick = true,
  ...config
}: UseDavidModalOptions): UseDavidModalResult {
  const modalRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<IModal | null>(null);

  useModalA11y(modalRef, { open, onClose, closeOnEscape: true });

  useEffect(() => {
    if (!open) {
      return;
    }

    const el = modalRef.current;
    if (!el) {
      return;
    }

    const modal = new Modal(el, {
      keyboard: false,
      closeOnOutsideClick: false,
      ...config
    });
    instanceRef.current = modal;
    modal.show();

    return () => {
      modal.hide();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Modal config is stable per mount
  }, [open]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!closeOnOutsideClick) {
      return;
    }
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return { modalRef, handleBackdropClick };
}
