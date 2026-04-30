/**
 * RdiList.unit.test.tsx
 *
 * Unit tests for the RdiList component.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { RdiList } from './RdiList';
import type { RdiDraft } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDraft(overrides: Partial<RdiDraft> = {}): RdiDraft {
  return {
    id: 'draft-1',
    title: 'New Release Deployment Item',
    createdAt: '2024-03-01T12:00:00.000Z',
    updatedAt: '2024-03-01T12:00:00.000Z',
    status: 'draft',
    workItemTitle: 'Deploy Feature Y',
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

/** Fire the rdiListLoaded message from the extension. */
function fireRdiListLoaded(drafts: RdiDraft[]) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'rdiListLoaded', drafts } })
    );
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RdiList', () => {
  const onOpen = vi.fn();
  const onNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).__vscodePostMessage &&
      ((globalThis as unknown as Record<string, unknown>).__vscodePostMessage as ReturnType<typeof vi.fn>).mockClear();
  });

  // ── Loading / empty state ───────────────────────────────────────────────────

  it('shows a loading indicator before rdiListLoaded arrives', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state message when no drafts exist', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([]);
    expect(screen.getByText(/No RDIs yet/i)).toBeInTheDocument();
  });

  // ── Draft rows ──────────────────────────────────────────────────────────────

  it('renders a row for each draft', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([makeDraft({ id: 'd1' }), makeDraft({ id: 'd2', workItemTitle: 'Deploy Z' })]);

    expect(screen.getByText('Deploy Feature Y')).toBeInTheDocument();
    expect(screen.getByText('Deploy Z')).toBeInTheDocument();
  });

  it('shows the status badge for each draft', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([
      makeDraft({ id: 'd1', status: 'draft' }),
      makeDraft({ id: 'd2', status: 'pushed', workItemTitle: 'Pushed Item' }),
    ]);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Pushed')).toBeInTheDocument();
  });

  it('falls back to draft.title when workItemTitle is empty', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([makeDraft({ workItemTitle: '', title: 'Fallback Title' })]);
    expect(screen.getByText('Fallback Title')).toBeInTheDocument();
  });

  // ── New RDI button ──────────────────────────────────────────────────────────

  it('"+ New RDI" button calls onNew callback', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([]);
    fireEvent.click(screen.getByRole('button', { name: /\+ New RDI/i }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  // ── Open button ─────────────────────────────────────────────────────────────

  it('"Open" button calls onOpen with the correct draft id', () => {
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([makeDraft({ id: 'abc123' })]);
    fireEvent.click(screen.getByRole('button', { name: /Open RDI: Deploy Feature Y/i }));
    expect(onOpen).toHaveBeenCalledWith('abc123');
  });

  // ── Delete button ───────────────────────────────────────────────────────────

  it('"Delete" button removes the draft row after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([makeDraft({ id: 'd1' })]);

    fireEvent.click(screen.getByRole('button', { name: /Delete RDI: Deploy Feature Y/i }));

    expect(screen.queryByText('Deploy Feature Y')).not.toBeInTheDocument();
  });

  it('"Delete" button does nothing if the user cancels the confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<RdiList onOpen={onOpen} onNew={onNew} />);
    fireRdiListLoaded([makeDraft({ id: 'd1' })]);

    fireEvent.click(screen.getByRole('button', { name: /Delete RDI: Deploy Feature Y/i }));

    expect(screen.getByText('Deploy Feature Y')).toBeInTheDocument();
  });
});
