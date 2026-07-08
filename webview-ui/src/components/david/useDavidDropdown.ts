import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { Dropdown } from 'david-ai';
import type { DropdownConfig, IDropdown } from 'david-ai';

const DEFAULT_OFFSET: [number, number] = [0, 5];

export interface UseDavidDropdownOptions extends DropdownConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface UseDavidDropdownResult {
  buttonRef: RefObject<HTMLButtonElement>;
  menuRef: RefObject<HTMLDivElement>;
  toggle: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

/**
 * Wires david-ai programmatic Dropdown (Popper positioning) to React open state.
 * Outside-click and keyboard nav are owned by DavidDropdown — not david-ai.
 */
export function useDavidDropdown({
  open,
  onOpenChange,
  placement = 'bottom-start',
  offset = DEFAULT_OFFSET,
}: UseDavidDropdownOptions): UseDavidDropdownResult {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<IDropdown | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) {
      return;
    }

    const dropdown = new Dropdown(button, menu, {
      placement,
      offset,
      closeOnOutsideClick: false,
    });
    instanceRef.current = dropdown;

    return () => {
      dropdown.destroy();
      instanceRef.current = null;
    };
  }, [placement, offset]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) {
      return;
    }
    if (open) {
      instance.open();
    } else {
      instance.close();
    }
  }, [open]);

  const toggle = useCallback((): void => {
    onOpenChange(!open);
  }, [open, onOpenChange]);

  const openMenu = useCallback((): void => {
    onOpenChange(true);
  }, [onOpenChange]);

  const closeMenu = useCallback((): void => {
    onOpenChange(false);
  }, [onOpenChange]);

  return { buttonRef, menuRef, toggle, openMenu, closeMenu };
}
