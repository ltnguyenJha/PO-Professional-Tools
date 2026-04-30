/**
 * useRdiDraft.unit.test.ts
 *
 * Unit tests for the useRdiDraft hook.
 * Uses renderHook from @testing-library/react to exercise state transitions.
 */

import { renderHook, act } from '@testing-library/react';
import { useRdiDraft } from './useRdiDraft';
import type { RdiDraft } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDraft(overrides: Partial<RdiDraft> = {}): RdiDraft {
  return {
    id: 'draft-1',
    title: 'New Release Deployment Item',
    createdAt: '2024-03-01T12:00:00.000Z',
    updatedAt: '2024-03-01T12:00:00.000Z',
    status: 'draft',
    workItemTitle: '',
    iterationPath: '',
    areaPath: '',
    assignedTo: '',
    targetReleaseDate: '',
    pbiLinks: [],
    releaseNotes: '',
    deploymentDetails: [],
    applications: '',
    backoutStrategy: '',
    backoutOwner: '',
    estimatedBackoutTime: '',
    manualDbChanges: [],
    hasManualDbChanges: false,
    ...overrides,
  };
}

function sendMessage(data: Record<string, unknown>) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data }));
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useRdiDraft', () => {
  // ── Initial state ───────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('draft is null', () => {
      const { result } = renderHook(() => useRdiDraft());
      expect(result.current.draft).toBeNull();
    });

    it('drafts is an empty array', () => {
      const { result } = renderHook(() => useRdiDraft());
      expect(result.current.drafts).toEqual([]);
    });

    it('isLoading is false', () => {
      const { result } = renderHook(() => useRdiDraft());
      expect(result.current.isLoading).toBe(false);
    });

    it('error is null', () => {
      const { result } = renderHook(() => useRdiDraft());
      expect(result.current.error).toBeNull();
    });
  });

  // ── rdiDraftCreated ─────────────────────────────────────────────────────────

  describe('rdiDraftCreated message', () => {
    it('sets draft and clears isLoading', () => {
      const { result } = renderHook(() => useRdiDraft());

      // Trigger loading state first
      act(() => result.current.createDraft());
      expect(result.current.isLoading).toBe(true);

      const draft = makeDraft({ id: 'new-id', title: 'New Release Deployment Item' });
      sendMessage({ type: 'rdiDraftCreated', draft });

      expect(result.current.draft).toEqual(draft);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── rdiListLoaded ───────────────────────────────────────────────────────────

  describe('rdiListLoaded message', () => {
    it('populates drafts array and clears isLoading', () => {
      const { result } = renderHook(() => useRdiDraft());

      act(() => result.current.loadList());
      expect(result.current.isLoading).toBe(true);

      const drafts = [makeDraft({ id: 'd1' }), makeDraft({ id: 'd2', workItemTitle: 'X' })];
      sendMessage({ type: 'rdiListLoaded', drafts });

      expect(result.current.drafts).toHaveLength(2);
      expect(result.current.drafts[0].id).toBe('d1');
      expect(result.current.isLoading).toBe(false);
    });

    it('replaces previous drafts list', () => {
      const { result } = renderHook(() => useRdiDraft());

      sendMessage({ type: 'rdiListLoaded', drafts: [makeDraft({ id: 'old' })] });
      expect(result.current.drafts).toHaveLength(1);

      sendMessage({ type: 'rdiListLoaded', drafts: [] });
      expect(result.current.drafts).toHaveLength(0);
    });
  });

  // ── rdiError ────────────────────────────────────────────────────────────────

  describe('rdiError message', () => {
    it('sets error string and clears isLoading', () => {
      const { result } = renderHook(() => useRdiDraft());

      act(() => result.current.createDraft());
      sendMessage({ type: 'rdiError', message: 'Something went wrong' });

      expect(result.current.error).toBe('Something went wrong');
      expect(result.current.isLoading).toBe(false);
    });

    it('clears error when createDraft is called again', () => {
      const { result } = renderHook(() => useRdiDraft());

      sendMessage({ type: 'rdiError', message: 'oops' });
      expect(result.current.error).toBe('oops');

      act(() => result.current.createDraft());
      expect(result.current.error).toBeNull();
    });
  });

  // ── rdiDraftLoaded ──────────────────────────────────────────────────────────

  describe('rdiDraftLoaded message', () => {
    it('sets the draft and clears isLoading', () => {
      const { result } = renderHook(() => useRdiDraft());
      const draft = makeDraft({ id: 'loaded-id' });

      sendMessage({ type: 'rdiDraftLoaded', draft });

      expect(result.current.draft).toEqual(draft);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── rdiPushed ───────────────────────────────────────────────────────────────

  describe('rdiPushed message', () => {
    it('marks the draft status as "pushed"', () => {
      const { result } = renderHook(() => useRdiDraft());
      sendMessage({ type: 'rdiDraftCreated', draft: makeDraft({ id: 'd1' }) });

      act(() => result.current.pushRdi('d1'));
      sendMessage({ type: 'rdiPushed', id: 'd1', adoUrl: 'https://ado/edit/99' });

      expect(result.current.draft?.status).toBe('pushed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── deleteDraft ─────────────────────────────────────────────────────────────

  describe('deleteDraft()', () => {
    it('removes the draft from the local drafts list immediately', () => {
      const { result } = renderHook(() => useRdiDraft());

      sendMessage({
        type: 'rdiListLoaded',
        drafts: [makeDraft({ id: 'del-me' }), makeDraft({ id: 'keep-me' })],
      });

      act(() => result.current.deleteDraft('del-me'));

      expect(result.current.drafts.find((d) => d.id === 'del-me')).toBeUndefined();
      expect(result.current.drafts.find((d) => d.id === 'keep-me')).toBeDefined();
    });

    it('clears draft if the currently open draft is deleted', () => {
      const { result } = renderHook(() => useRdiDraft());

      sendMessage({ type: 'rdiDraftLoaded', draft: makeDraft({ id: 'active' }) });
      expect(result.current.draft?.id).toBe('active');

      act(() => result.current.deleteDraft('active'));
      expect(result.current.draft).toBeNull();
    });
  });

  // ── defaultIterationLoaded ──────────────────────────────────────────────────

  describe('defaultIterationLoaded message', () => {
    it('updates iterationPath on the current draft', () => {
      const { result } = renderHook(() => useRdiDraft());

      sendMessage({ type: 'rdiDraftCreated', draft: makeDraft({ id: 'd1', iterationPath: '' }) });
      sendMessage({
        type: 'defaultIterationLoaded',
        iterationPath: 'MyProject\\Sprint 7',
      });

      expect(result.current.draft?.iterationPath).toBe('MyProject\\Sprint 7');
    });
  });
});
