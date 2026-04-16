/* ==========================================
   COMMUNICATIONS PAGE — message log + compose
   ========================================== */

const CommunicationsPage = (function() {
  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const comms = Store.getCommunications(trip.id).sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt));

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Messages <span class="tag">${comms.length} sent</span></div>
          <button class="btn btn-dark" id="composeBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            Compose
          </button>
        </div>
        <div id="commsList"></div>
      </div>
    `;
    root.appendChild(card);

    card.querySelector('#composeBtn').addEventListener('click', () => openCompose());

    const list = card.querySelector('#commsList');
    if (!comms.length) {
      list.appendChild(html`<div class="empty-state"><h3>No messages yet</h3><p>Compose your first message to parents.</p></div>`);
    } else {
      comms.forEach(c => {
        const letters = { email: 'E', sms: 'S', whatsapp: 'W', letter: 'L' };
        const item = html`
          <div class="comm-item" data-msg-id="${c.id}">
            <div class="comm-avatar ${c.type}">${letters[c.type] || 'M'}</div>
            <div style="min-width: 0;">
              <div class="comm-title">${escapeHtml(c.subject || '(no subject)')}</div>
              <div class="comm-sub" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.body || '')}</div>
            </div>
            <div class="comm-meta">
              <div>${Fmt.relativeDate(c.sentAt)}</div>
              <div style="margin-top: 2px;">${c.recipientCount} recipient${c.recipientCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        `;
        item.addEventListener('click', () => {
          Modal.open({
            title: c.subject || '(no subject)',
            subtitle: `${Fmt.date(c.sentAt)} · ${c.type} · ${c.recipientCount} recipients`,
            body: html`<p style="white-space: pre-wrap; line-height: 1.6; color: var(--grey-900);">${escapeHtml(c.body)}</p>`,
            footer: [{ label: 'Close', type: 'primary', onClick: (m) => m.close() }]
          });
        });
        list.appendChild(item);
      });
    }
  }

  function openCompose() {
    const trip = Store.activeTrip();
    const pupils = Store.getPupils(trip.id);

    const body = html`
      <form id="composeFormEl" novalidate>
        <div class="form-grid">
          <div class="form-field col-span-2">
            <label class="form-label">Channel</label>
            <div class="radio-group">
              <label class="radio-opt active"><input type="radio" name="type" value="email" checked>Email</label>
              <label class="radio-opt"><input type="radio" name="type" value="sms">SMS</label>
              <label class="radio-opt"><input type="radio" name="type" value="whatsapp">WhatsApp</label>
              <label class="radio-opt"><input type="radio" name="type" value="letter">Letter</label>
            </div>
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Recipients</label>
            <select class="form-select" name="recipients">
              <option value="all">All pupils (${pupils.length})</option>
              <option value="paid">Paid in full (${pupils.filter(p=>p.paymentStatus==='paid').length})</option>
              <option value="pending">Pending payment (${pupils.filter(p=>p.paymentStatus==='pending').length})</option>
              <option value="flagged">Flagged (${pupils.filter(p=>p.flagged).length})</option>
            </select>
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Subject</label>
            <input class="form-input" name="subject" placeholder="e.g. Payment reminder">
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Message</label>
            <textarea class="form-textarea" name="body" rows="8" placeholder="Write your message…"></textarea>
          </div>
        </div>
      </form>
    `;

    body.querySelectorAll('.radio-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        opt.parentElement.querySelectorAll('.radio-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        opt.querySelector('input').checked = true;
      });
    });

    const modal = Modal.open({
      title: 'Compose message', subtitle: trip.code,
      body, size: 'lg',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Send', type: 'primary', onClick: () => {
          const form = body.querySelector('#composeFormEl');
          const fd = new FormData(form);
          const subject = fd.get('subject')?.toString().trim();
          const bodyText = fd.get('body')?.toString().trim();
          if (!bodyText) { Toast.error('Please write a message'); return; }

          const recipFilter = fd.get('recipients');
          let recipients = pupils;
          if (recipFilter === 'paid') recipients = pupils.filter(p => p.paymentStatus === 'paid');
          else if (recipFilter === 'pending') recipients = pupils.filter(p => p.paymentStatus === 'pending');
          else if (recipFilter === 'flagged') recipients = pupils.filter(p => p.flagged);

          Store.createCommunication({
            type: fd.get('type'),
            subject,
            body: bodyText,
            recipientIds: recipients.map(r => r.id),
            recipientCount: recipients.length
          });
          Toast.success(`Message sent to ${recipients.length} recipients`);
          modal.close();
        }}
      ]
    });
  }

  return { render };
})();

