/**
 * david-ai package.json "exports" omits "types" — shim for TypeScript resolution.
 * @see node_modules/david-ai/dist/index.d.ts
 */
declare module 'david-ai' {
  export class Collapse {
    constructor(
      button: HTMLElement | string,
      collapseElement: HTMLElement | string,
      config?: CollapseConfig
    );
    toggle(): void;
    expand(): void;
    collapse(): void;
  }

  export class Tabs {
    constructor(tabGroup: HTMLElement, options?: TabsConfig);
    activateTab(tabId: string): void;
    cleanup(): void;
  }

  export class Accordion {
    constructor(container: HTMLElement, options?: AccordionConfig);
    toggle(element: HTMLElement | string): void;
    show(element: HTMLElement | string): void;
    hide(element: HTMLElement | string): void;
    showAll(): void;
    hideAll(): void;
    cleanup(): void;
  }

  export interface CollapseConfig {
    iconSelector?: string;
  }

  export interface ICollapse {
    toggle(): void;
    expand(): void;
    collapse(): void;
  }

  export interface TabsConfig {
    orientation?: 'horizontal' | 'vertical';
    defaultTabId?: string;
  }

  export interface ITabs {
    activateTab(tabId: string): void;
    cleanup(): void;
  }

  export interface AccordionConfig {
    exclusive?: boolean;
    allOpen?: boolean;
  }

  export interface IAccordion {
    toggle: (element: HTMLElement | string) => void;
    show: (element: HTMLElement | string) => void;
    hide: (element: HTMLElement | string) => void;
    showAll: () => void;
    hideAll: () => void;
    cleanup: () => void;
  }

  export function initTooltips(): void;
  export function cleanupTooltips(): void;

  export class Tooltip {
    constructor(triggerElement: HTMLElement, options?: TooltipConfig);
    showTooltip(): Promise<void>;
    hideTooltip(): void;
    destroy(): void;
  }

  export interface TooltipConfig {
    placement?: string;
    tooltipClass?: string;
    content?: string | HTMLElement;
  }

  export interface ITooltip {
    triggerElement: HTMLElement;
    tooltipElement: HTMLElement | null;
    showTooltip(): Promise<void>;
    hideTooltip(): void;
    destroy(): void;
  }

  export interface ModalConfig {
    keyboard?: boolean;
    closeOnOutsideClick?: boolean;
  }

  export interface IModal {
    show(): void;
    hide(): void;
    toggle(): void;
    isVisible(): boolean;
  }

  export class Modal {
    constructor(modalElement: HTMLElement, config?: ModalConfig);
    show(): void;
    hide(): void;
    toggle(): void;
    isVisible(): boolean;
  }

  export function initModal(): void;
  export function cleanupModals(): void;

  export interface DropdownConfig {
    placement?: string;
    closeOnOutsideClick?: boolean;
    offset?: [number, number];
  }

  export interface IDropdown {
    toggle(): void;
    open(): void;
    close(): void;
    destroy(): void;
    preventOutsideClick(): void;
  }

  export class Dropdown {
    constructor(
      reference: HTMLElement | string,
      menu: HTMLElement | string,
      config?: DropdownConfig
    );
    toggle(): void;
    open(): void;
    close(): void;
    destroy(): void;
    preventOutsideClick(): void;
  }

  export function initDropdowns(): void;
  export function cleanupDropdowns(): void;
}
