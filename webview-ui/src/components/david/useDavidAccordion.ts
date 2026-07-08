import { useEffect, useRef, type RefObject } from 'react';
import { Accordion } from 'david-ai';
import type { AccordionConfig, IAccordion } from 'david-ai';

/**
 * Initializes david-ai Accordion on a container ref. Cleans up on unmount.
 */
export function useDavidAccordion(config: AccordionConfig = {}): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<IAccordion | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const accordion = new Accordion(container, config);
    instanceRef.current = accordion;

    return () => {
      accordion.cleanup();
      instanceRef.current = null;
    };
  }, [config.exclusive, config.allOpen]);

  return containerRef;
}
