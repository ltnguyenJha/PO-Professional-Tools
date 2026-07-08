import type { ReactNode } from 'react';
import { useDavidTabs } from './useDavidTabs';
import type { TabsConfig } from 'david-ai';

export interface DavidTabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface DavidTabsProps {
  tabs: DavidTabItem[];
  defaultTabId?: string;
  orientation?: TabsConfig['orientation'];
  className?: string;
}

/**
 * Accessible tab group powered by david-ai Tabs.
 * Tab links use role="tab"; panels use role="tabpanel".
 */
export function DavidTabs({
  tabs,
  defaultTabId,
  orientation = 'horizontal',
  className = ''
}: DavidTabsProps): JSX.Element {
  const initialTabId = defaultTabId ?? tabs[0]?.id;
  const groupRef = useDavidTabs({ defaultTabId: initialTabId, orientation });

  return (
    <div ref={groupRef} className={`david-tabs ${className}`.trim()}>
      <div role="tablist" className="david-tab-list" aria-orientation={orientation}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tab.id}
            className="tab-link"
            aria-controls={`${tab.id}-content`}
            aria-selected={tab.id === initialTabId}
            tabIndex={tab.id === initialTabId ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
        <div className="tab-indicator" aria-hidden="true" />
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${tab.id}-content`}
          role="tabpanel"
          aria-labelledby={tab.id}
          className={`tab-content david-tab-content${tab.id === initialTabId ? '' : ' hidden'}`}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
