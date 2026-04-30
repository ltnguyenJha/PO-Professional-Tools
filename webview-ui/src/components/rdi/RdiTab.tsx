import { useState } from 'react';
import { vscodeApi } from '../../utils/useVsCodeApi';
import { RdiList } from './RdiList';
import { RdiWizard } from './RdiWizard';
import type { RdiDraft } from '../../types';

type TabView = 'list' | 'wizard';

export function RdiTab() {
  const [view, setView] = useState<TabView>('list');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();

  const handleNew = () => {
    // Send createRdiDraft; listen for response in RdiWizard
    // Use a temp id — the real id will come from the extension
    const tempId = `rdi-${Date.now()}`;
    vscodeApi?.postMessage({ type: 'createRdiDraft', payload: { tempId } } as never);

    // Listen once for the created draft id
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'rdiDraftCreated') {
        const created = msg.draft as RdiDraft;
        setActiveDraftId(created.id);
        setView('wizard');
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
  };

  const handleOpen = (draftId: string) => {
    setActiveDraftId(draftId);
    setView('wizard');
  };

  const handleClose = () => {
    setActiveDraftId(undefined);
    setView('list');
  };

  if (view === 'wizard' && activeDraftId) {
    return <RdiWizard draftId={activeDraftId} onClose={handleClose} />;
  }

  return <RdiList onOpen={handleOpen} onNew={handleNew} />;
}
