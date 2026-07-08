import { useEffect } from 'react';
import { initTooltips, cleanupTooltips } from 'david-ai';

/**
 * Initializes david-ai declarative tooltips (`data-dui-toggle="tooltip"`) on mount.
 * MutationObserver in david-ai picks up dynamically added triggers; this ensures
 * first paint after React render is covered.
 */
export function useDavidTooltips(active = true): void {
  useEffect(() => {
    if (!active) return;
    initTooltips();
    return () => cleanupTooltips();
  }, [active]);
}
