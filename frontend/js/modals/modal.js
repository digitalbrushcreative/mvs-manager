/* ==========================================
   MODAL — base framework
   ==========================================
   Usage:
     const modal = Modal.open({
       title: 'Add pupil',
       subtitle: 'MVS-MYS-26',
       body: htmlNode,
       size: 'lg',
       footer: [
         { label: 'Cancel', type: 'light', onClick: () => modal.close() },
         { label: 'Save', type: 'primary', onClick: () => {...} }
       ]
     });
*/

const Modal = (function() {
  const stack = [];

  function open({ title, subtitle, body, size = '', footer = [], onClose = null, customHead = null }) {
    const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

    const backdrop = html`<div class="modal-backdrop"></div>`;
    const modalEl = html`
      <div class="modal ${sizeClass}">
        ${customHead || `
          <div class="modal-head">
            <div>
              <div class="ttl">${escapeHtml(title || '')}</div>
              ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}
            </div>
            <button class="modal-close" data-close>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `}
        <div class="modal-body"></div>
        ${footer.length ? '<div class="modal-foot"></div>' : ''}
      </div>
    `;

    const bodyEl = modalEl.querySelector('.modal-body');
    if (body instanceof HTMLElement) bodyEl.appendChild(body);
    else if (typeof body === 'string') bodyEl.innerHTML = body;

    const footEl = modalEl.querySelector('.modal-foot');
    if (footEl && footer.length) {
      footer.forEach((f, i) => {
        if (f.spacer) { footEl.appendChild(html`<div class="spacer"></div>`); return; }
        const btn = html`<button class="btn btn-${f.type || 'light'} ${f.size ? `btn-${f.size}` : ''}" ${f.id ? `id="${f.id}"` : ''}>${escapeHtml(f.label)}</button>`;
        btn.addEventListener('click', () => f.onClick?.(instance));
        if (f.attr) Object.entries(f.attr).forEach(([k, v]) => btn.setAttribute(k, v));
        footEl.appendChild(btn);
      });
    }

    backdrop.appendChild(modalEl);
    $('#modalRoot').appendChild(backdrop);

    const instance = {
      el: modalEl,
      body: bodyEl,
      close() {
        const i = stack.indexOf(instance);
        if (i !== -1) stack.splice(i, 1);
        backdrop.style.opacity = '0';
        modalEl.style.transform = 'scale(0.95)';
        modalEl.style.opacity = '0';
        setTimeout(() => {
          backdrop.remove();
          onClose?.();
        }, 180);
      },
      setTitle(newTitle, newSub) {
        const ttlEl = modalEl.querySelector('.ttl');
        if (ttlEl) ttlEl.textContent = newTitle;
        const subEl = modalEl.querySelector('.sub');
        if (subEl && newSub !== undefined) subEl.textContent = newSub || '';
      },
      setFooterButtonDisabled(id, disabled) {
        const btn = modalEl.querySelector(`#${id}`);
        if (btn) btn.disabled = disabled;
      },
      replaceBody(newBody) {
        clearNode(bodyEl);
        if (newBody instanceof HTMLElement) bodyEl.appendChild(newBody);
        else bodyEl.innerHTML = newBody;
      }
    };

    // Close handlers
    modalEl.querySelector('[data-close]')?.addEventListener('click', () => instance.close());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) instance.close(); });
    const escHandler = (e) => { if (e.key === 'Escape' && stack[stack.length - 1] === instance) { instance.close(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

    stack.push(instance);
    return instance;
  }

  return { open };
})();
