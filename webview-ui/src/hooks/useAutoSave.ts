import { useCallback, useRef } from 'react';
import type { PbiDraft, WebviewRequest } from '../types';

/**
 * Auto-save hook for wizard field updates.
 * 
 * Behavior:
 * - Blur events: debounced 500ms per field
 * - Step advances: immediate save (cancels pending blur timer)
 * - Collision handling: step advance while blur timer pending → immediate save, cancel timer
 * 
 * Returns:
 * - isSaving: true while save is in-flight
 * - error: error message if last save failed
 * - save(key, value): trigger save for a field
 * - saveWithStepChange(partialDraft, newStep): trigger immediate save on step advance
 * 
 * Usage (in component):
 * ```
 * const { save, saveWithStepChange } = useAutoSave(draftId, send);
 * 
 * // On field blur:
 * <input onBlur={(e) => save('title', e.target.value)} />
 * 
 * // On step advance:
 * const handleNext = async () => {
 *   await saveWithStepChange({ description: 'Updated text' }, currentStep + 1);
 *   navigateToNextStep();
 * };
 * ```
 */

interface UseAutoSaveOptions {
  draftId: string;
  currentStep?: number;
  send: (message: WebviewRequest) => void;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  error: string | null;
  save: (key: keyof PbiDraft, value: unknown) => void;
  saveWithStepChange: (partialDraft: Partial<PbiDraft>, newStep: number) => Promise<void>;
}

export function useAutoSave({
  draftId,
  currentStep = 0,
  send
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const pendingChangesRef = useRef<Partial<PbiDraft>>({});
  const debounceTimerRef = useRef<number | undefined>();
  const savingRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  const performSave = useCallback(
    async (changes: Partial<PbiDraft>, step: number) => {
      savingRef.current = true;
      try {
        send({
          type: 'WIZARD_DRAFT_SAVE',
          payload: {
            draftId,
            partialDraft: changes,
            currentStep: step
          }
        });
        errorRef.current = null;
      } catch (err) {
        errorRef.current = err instanceof Error ? err.message : 'Save failed';
      } finally {
        savingRef.current = false;
        pendingChangesRef.current = {};
      }
    },
    [draftId, send]
  );

  /**
   * Save for field blur (debounced 500ms).
   * Accumulates changes, then sends after 500ms with current step.
   */
  const save = useCallback(
    (key: keyof PbiDraft, value: unknown) => {
      pendingChangesRef.current[key] = value as any;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        void performSave(pendingChangesRef.current, currentStep);
        debounceTimerRef.current = undefined;
      }, 500);
    },
    [currentStep, performSave]
  );

  /**
   * Save on step change (immediate, cancels pending blur timer).
   * Last-write-wins: step advance overrides in-flight blur saves.
   */
  const saveWithStepChange = useCallback(
    async (partialDraft: Partial<PbiDraft>, newStep: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = undefined;
      }

      await performSave(partialDraft, newStep);
    },
    [performSave]
  );

  return {
    isSaving: savingRef.current,
    error: errorRef.current,
    save,
    saveWithStepChange
  };
}
