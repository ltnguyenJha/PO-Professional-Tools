import { useCallback, useEffect, useRef, useState } from 'react';
import { vscodeApi } from '../utils/useVsCodeApi';
import type { RdiDraft } from '../types';

function send(message: { type: string; [key: string]: unknown }): void {
  vscodeApi?.postMessage(message as never);
}

interface UseRdiDraftReturn {
  draft: RdiDraft | null;
  drafts: RdiDraft[];
  isLoading: boolean;
  error: string | null;
  createDraft: () => void;
  saveDraft: (partial: Partial<RdiDraft>) => void;
  deleteDraft: (id: string) => void;
  pushRdi: (id: string) => void;
  loadList: () => void;
  openDraft: (id: string) => void;
  closeDraft: () => void;
  updateField: <K extends keyof RdiDraft>(key: K, value: RdiDraft[K]) => void;
}

export function useRdiDraft(): UseRdiDraftReturn {
  const [draft, setDraft] = useState<RdiDraft | null>(null);
  const [drafts, setDrafts] = useState<RdiDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blurTimerRef = useRef<number | undefined>();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      switch (msg.type) {
        case 'rdiDraftCreated':
          setDraft(msg.draft as RdiDraft);
          setIsLoading(false);
          break;
        case 'rdiDraftLoaded':
          setDraft(msg.draft as RdiDraft);
          setIsLoading(false);
          break;
        case 'rdiDraftSaved':
          setDraft((prev) => (prev ? { ...prev, ...(msg.draft as RdiDraft) } : prev));
          break;
        case 'rdiListLoaded':
          setDrafts(msg.drafts as RdiDraft[]);
          setIsLoading(false);
          break;
        case 'defaultIterationLoaded':
          setDraft((prev) =>
            prev ? { ...prev, iterationPath: msg.iterationPath as string } : prev
          );
          break;
        case 'rdiPushed':
          setDraft((prev) => (prev ? { ...prev, status: 'pushed' } : prev));
          setIsLoading(false);
          break;
        case 'rdiError':
          setError(msg.message as string);
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const createDraft = useCallback(() => {
    setIsLoading(true);
    setError(null);
    send({ type: 'createRdiDraft' });
  }, []);

  const saveDraft = useCallback((partial: Partial<RdiDraft>) => {
    if (!draft) return;
    const merged: RdiDraft = { ...draft, ...partial };
    send({ type: 'saveRdiDraft', draft: merged });
  }, [draft]);

  const deleteDraft = useCallback((id: string) => {
    send({ type: 'deleteRdiDraft', id });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setDraft((prev) => (prev?.id === id ? null : prev));
  }, []);

  const pushRdi = useCallback((id: string) => {
    setIsLoading(true);
    setError(null);
    send({ type: 'pushRdi', id });
  }, []);

  const loadList = useCallback(() => {
    setIsLoading(true);
    send({ type: 'loadRdiList' });
  }, []);

  const openDraft = useCallback((id: string) => {
    setIsLoading(true);
    setError(null);
    send({ type: 'loadRdiDraft', id });
  }, []);

  const closeDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const updateField = useCallback(
    <K extends keyof RdiDraft>(key: K, value: RdiDraft[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = window.setTimeout(() => {
        if (draft) {
          send({ type: 'saveRdiDraft', draft: { ...draft, [key]: value } });
        }
      }, 500);
    },
    [draft]
  );

  return {
    draft,
    drafts,
    isLoading,
    error,
    createDraft,
    saveDraft,
    deleteDraft,
    pushRdi,
    loadList,
    openDraft,
    closeDraft,
    updateField,
  };
}
