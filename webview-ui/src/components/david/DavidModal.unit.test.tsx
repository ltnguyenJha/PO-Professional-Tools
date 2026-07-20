import { render, screen } from '@testing-library/react';
import { DavidModal } from './DavidModal';

vi.mock('david-ai', () => ({
  Modal: vi.fn().mockImplementation(function ModalMock(this: IDropdownModalMock, el: HTMLElement) {
    this.show = vi.fn(() => {
      el.classList.remove('opacity-0', 'pointer-events-none');
      el.classList.add('opacity-100');
      el.setAttribute('aria-hidden', 'false');
    });
    this.hide = vi.fn(() => {
      el.classList.add('opacity-0', 'pointer-events-none');
      el.classList.remove('opacity-100');
      el.setAttribute('aria-hidden', 'true');
    });
  }),
}));

interface IDropdownModalMock {
  show: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
}

describe('DavidModal', () => {
  it('renders open dialog with role=dialog and aria-hidden not true', () => {
    render(
      <DavidModal open={true} onClose={() => undefined}>
        <h3 id="modal-title">Confirm action</h3>
      </DavidModal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('aria-hidden')).not.toBe('true');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('does not render when closed', () => {
    render(
      <DavidModal open={false} onClose={() => undefined}>
        <h3>Hidden</h3>
      </DavidModal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
