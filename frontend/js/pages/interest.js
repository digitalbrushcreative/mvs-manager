/* ==========================================
   INTEREST PAGE — pre-trip interest registrations
   ==========================================
   Parent-submitted interest records for the active trip.
   Admin can view, change status, request documents, copy
   the parent's return link, or convert the interest into
   a full pupil enrolment.
*/

const InterestPage = (function () {
  const STATUS_LABELS = {
    'new': 'New',
    'contacted': 'Contacted',
    'awaiting-details': 'Awaiting details',
    'submitted': 'Details submitted',
    'converted': 'Converted to pupil',
    'declined': 'Declined'
  };
  const STATUS_ORDER = ['new', 'contacted', 'awaiting-details', 'submitted', 'converted', 'declined'];
  const ACTIVE_STATUSES = new Set(['new', 'contacted', 'awaiting-details', 'submitted']);

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const all = Store.getInterests(trip.id).sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    // Summary row
    const active = all.filter(i => ACTIVE_STATUSES.has(i.status)).length;
    const converted = all.filter(i => i.status === 'converted').length;
    const declined = all.filter(i => i.status === 'declined').length;
    const seatsLeft = Math.max(0, (trip.seatsTotal || 0) - Store.getPupils(trip.id).length);

    const kpiRow = html`
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total interest</div><div class="kpi-value">${all.length}</div><div class="kpi-sub">Since this trip opened</div></div>
        <div class="kpi-card"><div class="kpi-label">In progress</div><div class="kpi-value">${active}</div><div class="kpi-sub">new · contacted · awaiting · submitted</div></div>
        <div class="kpi-card"><div class="kpi-label">Converted</div><div class="kpi-value">${converted}</div><div class="kpi-sub">Added to roster</div></div>
        <div class="kpi-card"><div class="kpi-label">Seats remaining</div><div class="kpi-value">${seatsLeft}</div><div class="kpi-sub">of ${trip.seatsTotal || 0}</div></div>
      </div>
    `;
    root.appendChild(kpiRow);

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Interest registrations <span class="tag">${all.length}</span></div>
          <div style="display:flex; gap:8px; align-items:center;">
            <a class="btn btn-light" href="parent/index.html" target="_blank" rel="noopener">Open parent page ↗</a>
          </div>
        </div>
        <div id="interestListRoot"></div>
      </div>
    `;
    root.appendChild(card);

    const listRoot = card.querySelector('#interestListRoot');
    if (!all.length) {
      listRoot.appendChild(html`
        <div class="empty-state">
          <h3>No interest yet</h3>
          <p>Share the <a href="parent/index.html" target="_blank">parent page</a> with prospective families. Submissions will appear here in real time.</p>
        </div>
      `);
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Submitted</th>
          <th>Parent</th>
          <th>Contact</th>
          <th>Pupil</th>
          <th>Grade</th>
          <th>Status</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    all.forEach(i => tbody.appendChild(interestRow(i)));
    listRoot.appendChild(table);
  }

  function interestRow(i) {
    const tr = document.createElement('tr');
    tr.dataset.interestId = i.id;
    const contact = [i.parentEmail, i.parentPhone].filter(Boolean).join(' · ') || '—';
    tr.innerHTML = `
      <td>${Fmt.relativeDate(i.submittedAt)}</td>
      <td><strong>${escapeHtml(i.parentName || '')}</strong></td>
      <td style="font-size:12px; color:var(--grey-500);">${escapeHtml(contact)}</td>
      <td>${escapeHtml(i.pupilName || '')}</td>
      <td>${i.pupilGrade ?? '—'}</td>
      <td><span class="status-pill ${statusClass(i.status)}">${STATUS_LABELS[i.status] || i.status}</span></td>
      <td style="text-align:right;">
        <button class="btn btn-light btn-sm" data-action="open">Open</button>
      </td>
    `;
    tr.querySelector('[data-action=open]').addEventListener('click', (e) => {
      e.stopPropagation();
      openDetail(i.id);
    });
    tr.addEventListener('click', () => openDetail(i.id));
    return tr;
  }

  function statusClass(status) {
    return {
      'new': 'status-pending',
      'contacted': 'status-info',
      'awaiting-details': 'status-warning',
      'submitted': 'status-info',
      'converted': 'status-success',
      'declined': 'status-muted'
    }[status] || '';
  }

  function openDetail(id) {
    const rec = Store.getInterest(id);
    if (!rec) return;
    const parentUrl = `${location.origin}${location.pathname.replace(/index\.html?$/, '')}parent/?t=${rec.token || ''}`;

    const body = document.createElement('div');
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div><div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600;">Parent</div><div style="font-size:15px; font-weight:600;">${escapeHtml(rec.parentName || '')}</div></div>
        <div><div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600;">Pupil</div><div style="font-size:15px; font-weight:600;">${escapeHtml(rec.pupilName || '')} · Grade ${rec.pupilGrade ?? '—'}</div></div>
        <div><div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600;">Phone</div><div>${escapeHtml(rec.parentPhone || '—')}</div></div>
        <div><div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600;">Email</div><div>${escapeHtml(rec.parentEmail || '—')}</div></div>
      </div>

      ${rec.note ? `<div style="margin-bottom:16px;"><div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600; margin-bottom:4px;">Their initial note</div><div style="padding:10px 12px; background:var(--grey-50); border-radius:var(--r-md); font-size:14px;">${escapeHtml(rec.note)}</div></div>` : ''}

      ${rec.medicalNotes || rec.dietaryNotes || rec.additionalNotes || rec.dob ? `
        <div style="margin-bottom:16px; padding:12px; background:var(--grey-50); border-radius:var(--r-md);">
          <div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600; margin-bottom:6px;">Parent-provided details</div>
          ${rec.dob ? `<div style="font-size:13px;">DOB: ${escapeHtml(rec.dob)}</div>` : ''}
          ${rec.medicalNotes ? `<div style="font-size:13px;">Medical: ${escapeHtml(rec.medicalNotes)}</div>` : ''}
          ${rec.dietaryNotes ? `<div style="font-size:13px;">Dietary: ${escapeHtml(rec.dietaryNotes)}</div>` : ''}
          ${rec.additionalNotes ? `<div style="font-size:13px;">Notes: ${escapeHtml(rec.additionalNotes)}</div>` : ''}
        </div>
      ` : ''}

      <div style="margin-bottom:16px;">
        <div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600; margin-bottom:6px;">Status</div>
        <select id="statusSelect" class="form-select" style="width:100%; padding:8px 12px; border:1px solid var(--grey-200); border-radius:var(--r-md);">
          ${STATUS_ORDER.map(s => `<option value="${s}" ${s === rec.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600; margin-bottom:6px;">Documents requested</div>
        <input id="docsRequested" class="form-input" style="width:100%; padding:8px 12px; border:1px solid var(--grey-200); border-radius:var(--r-md);" placeholder="Passport, Consent form, Medical form" value="${escapeHtml((rec.documentsRequested || []).join(', '))}">
        <div style="font-size:12px; color:var(--grey-500); margin-top:4px;">Comma-separated. Parent sees this list and can tick off what they've sent. Setting this moves status → awaiting-details.</div>
        ${rec.documentsSubmitted && rec.documentsSubmitted.length ? `<div style="margin-top:8px; padding:8px; background:var(--success-soft); border-radius:var(--r-md); font-size:13px;">✓ Parent marked as sent: ${escapeHtml(rec.documentsSubmitted.join(', '))}</div>` : ''}
      </div>

      <div>
        <div style="font-size:11px; text-transform:uppercase; color:var(--grey-400); letter-spacing:0.08em; font-weight:600; margin-bottom:6px;">Parent return link</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input readonly value="${escapeHtml(parentUrl)}" style="flex:1; padding:8px 12px; border:1px solid var(--grey-200); border-radius:var(--r-md); font-family:var(--mono); font-size:12px; background:var(--grey-50);">
          <button id="copyLinkBtn" class="btn btn-light btn-sm">Copy</button>
        </div>
      </div>
    `;

    const modal = Modal.open({
      title: 'Interest details',
      subtitle: `Submitted ${Fmt.relativeDate(rec.submittedAt)}`,
      body,
      size: 'md',
      footer: [
        { label: 'Delete', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete this interest?',
            message: `Remove submission from ${rec.parentName}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => { Store.deleteInterest(rec.id); Toast.success('Deleted'); modal.close(); }
          });
        }},
        { spacer: true },
        rec.status !== 'converted' ? { label: 'Convert to pupil', type: 'dark', onClick: () => {
          const pupil = Store.convertInterestToPupil(rec.id);
          if (pupil) { Toast.success(`Added ${pupil.firstName} ${pupil.lastName} to roster`); modal.close(); }
        }} : { spacer: true },
        { label: 'Save', type: 'primary', onClick: () => {
          const status = body.querySelector('#statusSelect').value;
          const docsRaw = body.querySelector('#docsRequested').value.trim();
          const docsRequested = docsRaw ? docsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
          const patch = { status, documentsRequested: docsRequested };
          if (docsRequested.length && status === 'new') patch.status = 'awaiting-details';
          Store.updateInterest(rec.id, patch);
          Toast.success('Updated');
          modal.close();
        }}
      ]
    });

    body.querySelector('#copyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(parentUrl);
      Toast.success('Link copied');
    });
  }

  return { render };
})();
