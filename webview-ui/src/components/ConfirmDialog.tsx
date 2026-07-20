import { useId } from 'react';
import { DavidModal } from './david/DavidModal';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel
}: Props): JSX.Element | null {
  const titleId = useId();

  return (
    <DavidModal open={open} onClose={onCancel} titleId={titleId}>
      <h3 id={titleId}>{title}</h3>
      <p className="card-subtitle">{message}</p>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </DavidModal>
  );
}
