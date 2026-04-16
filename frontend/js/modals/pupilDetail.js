/* ==========================================
   PUPIL DETAIL — full profile modal with tabs
   ========================================== */

const PupilDetail = {
  open(pupilId) {
    const pupil = Store.getPupil(pupilId);
    if (!pupil) { Toast.error('Pupil not found'); return; }

    const trip = Store.getTrip(pupil.tripId);
    const balance = Store.getPupilBalance(pupilId);
    const payments = Store.getPupilPayments(pupilId).sort((a,b) => new Date(b.paidAt) - new Date(a.paidAt));
    const documents = Store.getPupilDocuments(pupilId);
    const types = Store.getDocumentTypes();

    let activeTab = 'profile';

    const customHead = `
      <div class="pupil-detail-head">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
          <div class="pupil-hero">
            <div class="avatar ${pupil.gender.toLowerCase()}">${Fmt.initials(pupil.firstName + ' ' + pupil.lastName)}</div>
            <div>
              <h2>${escapeHtml(pupil.firstName)} ${escapeHtml(pupil.lastName)}</h2>
              <div class="meta">Grade ${pupil.grade} · #${escapeHtml(pupil.admissionNo)} · ${escapeHtml(trip.code)}</div>
            </div>
          </div>
          <button class="modal-close" data-close>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="pupil-tabs">
          <div class="pupil-tab active" data-tab="profile">Profile</div>
          <div class="pupil-tab" data-tab="payments">Payments (${payments.length})</div>
          <div class="pupil-tab" data-tab="documents">Documents (${documents.filter(d=>d.status==='verified').length}/${documents.length})</div>
          <div class="pupil-tab" data-tab="notes">Notes</div>
        </div>
      </div>
    `;

    const body = html`<div class="pupil-tab-content"></div>`;

    function renderTab() {
      clearNode(body);
      if (activeTab === 'profile') renderProfile();
      else if (activeTab === 'payments') renderPayments();
      else if (activeTab === 'documents') renderDocuments();
      else if (activeTab === 'notes') renderNotes();
    }

    function renderProfile() {
      body.appendChild(html`
        <div class="inline-stats">
          <div class="inline-stat"><div class="n">${Fmt.moneyPlain(balance.total, trip.currency)}</div><div class="l">Trip cost</div></div>
          <div class="inline-stat"><div class="n" style="color: var(--success);">${Fmt.moneyPlain(balance.paid, trip.currency)}</div><div class="l">Paid</div></div>
          <div class="inline-stat"><div class="n" style="color: ${balance.balance > 0 ? 'var(--crimson)' : 'var(--success)'};">${Fmt.moneyPlain(balance.balance, trip.currency)}</div><div class="l">Balance</div></div>
          <div class="inline-stat"><div class="n">${documents.filter(d=>d.status==='verified').length}/${documents.length}</div><div class="l">Docs verified</div></div>
        </div>
        <div class="detail-pairs">
          <div class="detail-pair"><div class="label">Grade</div><div class="value">Grade ${pupil.grade}</div></div>
          <div class="detail-pair"><div class="label">Gender</div><div class="value">${pupil.gender === 'M' ? 'Male' : 'Female'}</div></div>
          <div class="detail-pair"><div class="label">Admission No</div><div class="value mono">${escapeHtml(pupil.admissionNo)}</div></div>
          <div class="detail-pair"><div class="label">Date of birth</div><div class="value">${Fmt.date(pupil.dob)}</div></div>
          <div class="detail-pair"><div class="label">Guardian</div><div class="value">${escapeHtml(pupil.guardianName)} <span style="color: var(--grey-400);">(${escapeHtml(pupil.guardianRelationship)})</span></div></div>
          <div class="detail-pair"><div class="label">Phone</div><div class="value mono">${escapeHtml(pupil.guardianPhone)}</div></div>
          <div class="detail-pair col-span-2"><div class="label">Email</div><div class="value">${escapeHtml(pupil.guardianEmail) || '—'}</div></div>
          <div class="detail-pair col-span-2"><div class="label">Medical notes</div><div class="value">${escapeHtml(pupil.medicalNotes) || '<span style="color: var(--grey-400);">None recorded</span>'}</div></div>
          <div class="detail-pair col-span-2"><div class="label">Dietary notes</div><div class="value">${escapeHtml(pupil.dietaryNotes) || '<span style="color: var(--grey-400);">None recorded</span>'}</div></div>
        </div>
      `);
    }

    function renderPayments() {
      if (!payments.length) {
        body.appendChild(html`<div class="modal-empty">No payments recorded yet. Use "Log payment" to add one.</div>`);
        return;
      }
      const list = html`<div></div>`;
      payments.forEach(p => {
        list.appendChild(html`
          <div style="padding: 14px; border: 1px solid var(--grey-100); border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 14px;">
            <div style="width: 36px; height: 36px; background: var(--success-soft); color: var(--success); border-radius: 6px; display: grid; place-items: center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 13px;">${Fmt.moneyPlain(p.amount, p.currency)}</div>
              <div style="font-size: 11px; color: var(--grey-500); font-family: var(--mono); margin-top: 2px;">${Fmt.date(p.paidAt)} · ${escapeHtml(p.method)}${p.reference ? ` · ${escapeHtml(p.reference)}` : ''}</div>
            </div>
          </div>
        `);
      });
      body.appendChild(list);
    }

    function renderDocuments() {
      const docList = html`<div style="display: grid; gap: 8px;"></div>`;
      types.forEach(type => {
        const doc = documents.find(d => d.typeId === type.id);
        const status = doc?.status || 'missing';
        const statusLabels = { verified: 'Verified', submitted: 'Submitted', missing: 'Missing', expired: 'Expired', expiring: 'Expiring soon' };
        docList.appendChild(html`
          <div style="padding: 12px 14px; border: 1px solid var(--grey-100); border-radius: 6px; display: flex; align-items: center; gap: 12px; cursor: pointer;" data-doc-type="${type.id}">
            <div style="font-weight: 600; font-size: 13px;">${escapeHtml(type.name)}</div>
            <div style="margin-left: auto;"><span class="doc-status-pill ${status}">${statusLabels[status]}</span></div>
            ${doc?.filename ? `<div class="mono" style="font-size: 11px; color: var(--grey-500);">${escapeHtml(doc.filename)}</div>` : ''}
          </div>
        `);
      });
      docList.querySelectorAll('[data-doc-type]').forEach(el => {
        el.addEventListener('click', () => {
          const typeId = el.dataset.docType;
          const doc = documents.find(d => d.typeId === typeId);
          if (doc) DocumentForm.open(doc.id);
          else DocumentForm.open(null, { pupilId, typeId });
          modal.close();
        });
      });
      body.appendChild(docList);
    }

    function renderNotes() {
      body.appendChild(html`
        <div style="display: grid; gap: 14px;">
          <div>
            <label class="form-label">Coordinator note</label>
            <textarea id="noteText" class="form-textarea" rows="3">${escapeHtml(pupil.note)}</textarea>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${pupil.flagged ? 'var(--crimson-soft)' : 'var(--grey-50)'}; border-radius: 6px;">
            <input type="checkbox" id="flagToggle" ${pupil.flagged ? 'checked' : ''} style="width: 16px; height: 16px;">
            <label for="flagToggle" style="font-size: 13px; font-weight: 600; color: ${pupil.flagged ? 'var(--crimson)' : 'var(--grey-700)'};">Flagged for follow-up</label>
          </div>
          <button class="btn btn-dark" id="saveNoteBtn" style="align-self: start;">Save changes</button>
        </div>
      `);
      body.querySelector('#saveNoteBtn').addEventListener('click', () => {
        Store.updatePupil(pupilId, {
          note: body.querySelector('#noteText').value.trim(),
          flagged: body.querySelector('#flagToggle').checked
        });
        Toast.success('Notes saved');
        modal.close();
      });
    }

    const modal = Modal.open({
      customHead, body, size: 'lg',
      footer: [
        { label: 'Edit details', type: 'light', onClick: () => { modal.close(); PupilForm.open(pupilId); } },
        { label: 'Log payment', type: 'dark', onClick: () => { modal.close(); PaymentForm.open(pupilId); } },
        { spacer: true },
        { label: 'Close', type: 'primary', onClick: (m) => m.close() }
      ]
    });

    // Tab switching
    modal.el.querySelectorAll('.pupil-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.el.querySelectorAll('.pupil-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderTab();
      });
    });

    renderTab();
  }
};
