/* ==========================================
   CONFIRM — yes/no dialog
   ========================================== */

const Confirm = {
  open({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', confirmType = 'danger', onConfirm = () => {} }) {
    const body = html`<p style="color: var(--grey-700); font-size: 13.5px; line-height: 1.5;">${escapeHtml(message)}</p>`;
    const modal = Modal.open({
      title, body, size: 'sm',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: confirmLabel, type: confirmType, onClick: (m) => { onConfirm(); m.close(); } }
      ]
    });
    return modal;
  }
};
