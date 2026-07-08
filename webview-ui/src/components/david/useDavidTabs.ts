import { useEffect, useRef, type RefObject } from 'react';
import { Tabs } from 'david-ai';
import type { TabsConfig, ITabs } from 'david-ai';

/**
 * Initializes david-ai Tabs on a container ref. Cleans up on unmount.
 */
export function useDavidTabs(config: TabsConfig = {}): RefObject<HTMLDivElement> {
  const groupRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ITabs | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    let tabs: ITabs | null = null;
    try {
      tabs = new Tabs(group, config);
      instanceRef.current = tabs;
    } catch {
      // StrictMode remount — container may already be initialized
      instanceRef.current = null;
    }

    const tabList = group.querySelector<HTMLElement>('[role="tablist"]');
    const syncAriaSelected = (): void => {
      if (!tabList) return;
      tabList.querySelectorAll<HTMLElement>('.tab-link').forEach((link) => {
        const isActive = link.classList.contains('active');
        link.setAttribute('aria-selected', String(isActive));
        link.tabIndex = isActive ? 0 : -1;
      });
    };

    const ariaObserver = tabList
      ? new MutationObserver(syncAriaSelected)
      : null;
    if (tabList && ariaObserver) {
      ariaObserver.observe(tabList, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
      // david-ai activates default tab after a short delay
      syncAriaSelected();
      const ariaSyncTimer = window.setTimeout(syncAriaSelected, 350);
      return () => {
        window.clearTimeout(ariaSyncTimer);
        ariaObserver.disconnect();
        tabs?.cleanup();
        instanceRef.current = null;
      };
    }

    return () => {
      tabs?.cleanup();
      instanceRef.current = null;
    };
  }, [config.defaultTabId, config.orientation]);

  return groupRef;
}
