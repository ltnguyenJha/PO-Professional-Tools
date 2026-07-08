import type { ReactNode } from 'react';
import { useDavidAccordion } from './useDavidAccordion';
import type { AccordionConfig } from 'david-ai';

export interface DavidAccordionItem {
  id: string;
  title: ReactNode;
  children: ReactNode;
}

export interface DavidAccordionProps {
  items: DavidAccordionItem[];
  exclusive?: AccordionConfig['exclusive'];
  allOpen?: AccordionConfig['allOpen'];
  className?: string;
}

/**
 * Multi-section accordion powered by david-ai Accordion.
 * DOM structure: button + panel pairs as direct children of container.
 */
export function DavidAccordion({
  items,
  exclusive = false,
  allOpen = false,
  className = ''
}: DavidAccordionProps): JSX.Element {
  const containerRef = useDavidAccordion({ exclusive, allOpen });

  return (
    <div ref={containerRef} className={`david-accordion ${className}`.trim()}>
      {items.flatMap((item) => [
        <button
          key={`${item.id}-trigger`}
          type="button"
          id={item.id}
          className="david-accordion-trigger"
          aria-expanded={allOpen ? 'true' : 'false'}
          aria-controls={`${item.id}-panel`}
        >
          {typeof item.title === 'string' ? <span>{item.title}</span> : item.title}
          <span className="section-chevron" aria-hidden="true">
            ▾
          </span>
        </button>,
        <div
          key={`${item.id}-panel`}
          id={`${item.id}-panel`}
          role="region"
          aria-labelledby={item.id}
          className="david-accordion-panel"
        >
          {item.children}
        </div>
      ])}
    </div>
  );
}
