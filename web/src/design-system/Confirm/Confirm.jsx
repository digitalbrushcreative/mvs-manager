import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';

export function Confirm({ open, onCancel, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="light" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'primary' : 'secondary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? <p style={{ color: 'var(--grey-700)', lineHeight: 1.5, margin: 0 }}>{message}</p> : null}
    </Modal>
  );
}
