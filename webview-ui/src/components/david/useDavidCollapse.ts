import { useEffect, useRef, type RefObject } from 'react';
import { Collapse } from 'david-ai';
import type { ICollapse } from 'david-ai';

export interface UseDavidCollapseOptions {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Initializes david-ai Collapse on button + panel refs.
 * Supports controlled `open` prop sync and open-change callbacks.
 */
export function useDavidCollapse(options: UseDavidCollapseOptions = {}): {
  buttonRef: RefObject<HTMLButtonElement>;
  panelRef: RefObject<HTMLDivElement>;
} {
  const { defaultOpen = false, open, onOpenChange } = options;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ICollapse | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;

    const collapse = new Collapse(button, panel);
    instanceRef.current = collapse;

    if (defaultOpen) {
      collapse.expand();
    } else {
      collapse.collapse();
    }

    const observer = new MutationObserver(() => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      onOpenChangeRef.current?.(expanded);
    });
    observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });

    return () => {
      observer.disconnect();
      instanceRef.current = null;
    };
  }, [defaultOpen]);

  useEffect(() => {
    const collapse = instanceRef.current;
    if (!collapse || open === undefined) return;
    if (open) {
      collapse.expand();
    } else {
      collapse.collapse();
    }
  }, [open]);

  return { buttonRef, panelRef };
}
