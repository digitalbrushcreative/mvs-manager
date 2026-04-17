/* ==========================================
   ROSTER PAGE — pupils list with filters, bulk actions, CRUD
   ========================================== */

function downloadPupilsCSV(pupils, trip) {
  if (!pupils.length) { Toast.info('Nothing to export'); return; }
  const headers = [
    'Admission No', 'First Name', 'Last Name', 'Grade', 'Gender', 'DOB',
    'Guardian Name', 'Guardian Phone', 'Guardian Email',
    'Payment Status', 'Paid', 'Balance', 'Flagged', 'Dietary Notes', 'Medical Notes', 'Note'
  ];
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = pupils.map(p => {
    const bal = Store.getPupilBalance(p.id);
    return [
      p.admissionNo, p.firstName, p.lastName, p.grade, p.gender, p.dob || '',
      p.guardianName, p.guardianPhone, p.guardianEmail,
      p.paymentStatus, bal.paid, bal.balance, p.flagged ? 'yes' : '',
      p.dietaryNotes || '', p.medicalNotes || '', p.note || ''
    ].map(esc).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip?.code || 'pupils'}-roster-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success(`Exported ${pupils.length} pupils`);
}

const RosterPage = (function() {
  const state = {
    gradeFilter: 'all',
    statusFilter: 'all',
    flaggedOnly: false,
    searchQuery: '',
    selected: [],
  };

  function computeFilteredPupils() {
    const trip = Store.activeTrip();
    if (!trip) return [];
    let pupils = Store.getPupils(trip.id);

    if (state.gradeFilter !== 'all') {
      pupils = pupils.filter(p => String(p.grade) === String(state.gradeFilter));
    }
    if (state.statusFilter !== 'all') {
      pupils = pupils.filter(p => p.paymentStatus === state.statusFilter);
    }
    if (state.flaggedOnly) {
      pupils = pupils.filter(p => p.flagged);
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      pupils = pupils.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.admissionNo.includes(q) ||
        (p.guardianName || '').toLowerCase().includes(q) ||
        (p.guardianPhone || '').includes(q) ||
        (p.note || '').toLowerCase().includes(q)
      );
    }
    return pupils;
  }

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) {
      root.appendChild(Banner.render());
      root.appendChild(html`
        <div class="card">
          <div class="empty-state">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/></svg></div>
            <h3>No trips yet</h3>
            <p>Create your first trip to start adding pupils, bookings, and activities.</p>
          </div>
        </div>
      `);
      return;
    }

    root.appendChild(Banner.render());

    // KPI summary
    const stats = Store.tripStats(trip.id);
    root.appendChild(KPI.grid([
      { label: 'Enrolled pupils', value: stats.enrolled, unit: `/ ${trip.seatsTotal}`, bar: { value: stats.enrolled, max: trip.seatsTotal, color: 'navy' }, sub: `<strong>${stats.seatsLeft}</strong> seats remaining` },
      { label: 'Collected', value: Fmt.moneyPlain(stats.collected, trip.currency), accent: 'success', bar: { value: stats.percentCollected * 100, max: 100, color: 'success' }, sub: `<strong>${Fmt.percent(stats.collected, stats.totalExpected)}</strong> of expected` },
      { label: 'Outstanding', value: Fmt.moneyPlain(stats.outstanding, trip.currency), accent: 'crimson', bar: { value: 100 - (stats.percentCollected * 100), max: 100, color: 'crimson' }, sub: `<strong>${stats.byStatus.pending}</strong> pupils pending` },
      { label: 'Documents', value: `${stats.verifiedDocs}/${stats.totalDocs}`, accent: 'gold', bar: { value: stats.docCompliance * 100, max: 100, color: 'gold' }, sub: `<strong>${Fmt.percent(stats.verifiedDocs, stats.totalDocs)}</strong> verified` },
      { label: 'Flagged', value: stats.flaggedCount, accent: 'warning', sub: 'Need follow-up' },
    ]));

    // Main roster card
    const card = html`
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Pupil roster <span class="tag" id="rosterResultCount">0 pupils</span></div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div class="input-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="rosterSearch" placeholder="Search by name, admission, guardian…" value="${escapeHtml(state.searchQuery)}">
            </div>
            <button class="btn btn-dark" id="addPupilBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add pupil
            </button>
          </div>
        </div>

        <div style="padding: 14px 20px; border-bottom: 1px solid var(--grey-100); display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Grade</span>
            <div id="gradeFilters"></div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Payment</span>
            <div id="statusFilters"></div>
          </div>
          <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--grey-700); cursor: pointer;">
              <input type="checkbox" id="flaggedToggle" ${state.flaggedOnly ? 'checked' : ''}>
              Flagged only
            </label>
          </div>
        </div>

        <div id="bulkBar" class="hidden"></div>
        <div id="tableMount"></div>
        <div id="tableFooter"></div>
      </div>
    `;
    root.appendChild(card);

    // Filter chips
    const byGrade = {};
    Store.getPupils(trip.id).forEach(p => { byGrade[p.grade] = (byGrade[p.grade] || 0) + 1; });
    const gradeOptions = [
      { value: 'all', label: 'All', count: stats.enrolled },
      ...Object.keys(byGrade).sort().map(g => ({ value: g, label: `Grade ${g}`, count: byGrade[g] }))
    ];
    card.querySelector('#gradeFilters').appendChild(Chips.create({
      options: gradeOptions,
      active: state.gradeFilter,
      onChange: (v) => { state.gradeFilter = v; updateTable(); }
    }));

    const statusOptions = [
      { value: 'all', label: 'All', count: stats.enrolled },
      { value: 'paid', label: 'Paid', count: stats.byStatus.paid },
      { value: 'deposit', label: 'Deposit', count: stats.byStatus.deposit },
      { value: 'pending', label: 'Pending', count: stats.byStatus.pending },
      { value: 'overdue', label: 'Overdue', count: stats.byStatus.overdue },
    ];
    card.querySelector('#statusFilters').appendChild(Chips.create({
      options: statusOptions,
      active: state.statusFilter,
      onChange: (v) => { state.statusFilter = v; updateTable(); }
    }));

    // Search input debounced
    const searchInput = card.querySelector('#rosterSearch');
    const debounced = debounce(() => { state.searchQuery = searchInput.value; updateTable(); }, 200);
    searchInput.addEventListener('input', debounced);

    card.querySelector('#flaggedToggle').addEventListener('change', (e) => {
      state.flaggedOnly = e.target.checked;
      updateTable();
    });

    card.querySelector('#addPupilBtn').addEventListener('click', () => PupilForm.open());

    // Table columns
    const columns = [
      {
        key: 'name', label: 'Pupil', sortable: true,
        sortFn: (a, b) => a.lastName.localeCompare(b.lastName),
        render: (p) => `
          <div class="student-cell">
            <div class="stu-avatar ${p.gender.toLowerCase()}">${Fmt.initials(p.firstName + ' ' + p.lastName)}</div>
            <div>
              <div class="stu-name">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)} ${p.confirmedByGuardian ? '<span title="Attendance confirmed by guardian" style="color:var(--success); font-size:12px; margin-left:4px;">✓</span>' : ''}</div>
              <div class="stu-meta">#${escapeHtml(p.admissionNo)}</div>
            </div>
          </div>
        `
      },
      {
        key: 'grade', label: 'Grade', sortable: true, width: '90px',
        render: (p) => `<span class="grade-pill">GR ${p.grade}</span>`
      },
      {
        key: 'guardianName', label: 'Guardian', sortable: true,
        render: (p) => `
          <div style="font-size: 13px;">${escapeHtml(p.guardianName)}</div>
          <div style="font-size: 11px; color: var(--grey-500); font-family: var(--mono); margin-top: 2px;">${escapeHtml(p.guardianPhone)}</div>
        `
      },
      {
        key: 'paymentStatus', label: 'Payment', sortable: true, width: '150px',
        render: (p) => {
          const bal = Store.getPupilBalance(p.id);
          const statusText = { paid: 'Paid in full', deposit: 'Deposit paid', pending: 'Pending', overdue: 'Overdue' };
          return `
            <div class="pay-status ps-${p.paymentStatus}">${statusText[p.paymentStatus] || p.paymentStatus}</div>
            <div class="money" style="margin-top: 3px; font-size: 11px;">${Fmt.moneyPlain(bal.paid, trip.currency)} <span class="total">/ ${Fmt.moneyPlain(bal.total, trip.currency)}</span></div>
          `;
        }
      },
      {
        key: 'docs', label: 'Docs', width: '140px',
        render: (p) => {
          const docs = Store.getPupilDocuments(p.id);
          const types = Store.getDocumentTypes().slice(0, 4);
          return `<div class="doc-pills">${types.map(t => {
            const d = docs.find(dd => dd.typeId === t.id);
            const status = d?.status || 'missing';
            const cls = status === 'verified' ? 'done' : (status === 'submitted' || status === 'expiring') ? 'warning' : 'missing';
            return `<div class="doc-pill ${cls}" title="${escapeHtml(t.name)}: ${status}">${escapeHtml(t.abbr)}</div>`;
          }).join('')}</div>`;
        }
      },
      {
        key: 'note', label: 'Note',
        render: (p) => p.note ? `<div class="note-cell" title="${escapeHtml(p.note)}">${p.flagged ? '<span class="note-flag"></span>' : ''}${escapeHtml(p.note)}</div>` : '<span style="color: var(--grey-300);">—</span>'
      },
      {
        key: 'actions', label: '', width: '100px', align: 'right',
        render: (p) => `
          <div class="row-action">
            <button data-row-action="payment">Pay</button>
            <button data-row-action="edit">Edit</button>
          </div>
        `
      }
    ];

    const filtered = computeFilteredPupils();
    card.querySelector('#rosterResultCount').textContent = `${filtered.length} ${filtered.length === 1 ? 'pupil' : 'pupils'}`;

    const table = Table.create({
      columns,
      rows: filtered,
      selectable: true,
      pageSize: 15,
      emptyState: {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        title: 'No pupils match your filters',
        description: 'Try removing a filter or clearing the search.',
        cta: 'Add pupil',
        onCta: () => PupilForm.open()
      },
      onRowClick: (row) => PupilDetail.open(row.id),
      onSelectionChange: (ids) => {
        state.selected = ids;
        renderBulkBar();
      }
    });

    const mount = card.querySelector('#tableMount');
    const footerMount = card.querySelector('#tableFooter');
    mount.appendChild(table.el);
    footerMount.appendChild(table.footer);

    // Row actions via event delegation
    mount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-row-action]');
      if (!btn) return;
      e.stopPropagation();
      const tr = btn.closest('tr');
      const id = tr?.dataset.rowId;
      if (!id) return;
      const action = btn.dataset.rowAction;
      if (action === 'edit') PupilForm.open(id);
      else if (action === 'payment') PaymentForm.open(id);
    });

    const bulkBar = card.querySelector('#bulkBar');

    function renderBulkBar() {
      if (!state.selected.length) {
        bulkBar.classList.add('hidden');
        return;
      }
      bulkBar.classList.remove('hidden');
      clearNode(bulkBar);
      bulkBar.className = 'bulk-bar';
      bulkBar.appendChild(html`
        <span class="count">${state.selected.length} selected</span>
        <span>Bulk actions</span>
        <div class="actions">
          <button data-bulk="message">Message…</button>
          <button data-bulk="export">Export CSV</button>
          <button data-bulk="status-paid">Mark paid</button>
          <button data-bulk="status-pending">Mark pending</button>
          <button data-bulk="flag">Flag</button>
          <button data-bulk="unflag">Unflag</button>
          <button data-bulk="clear">Clear</button>
          <button class="danger" data-bulk="delete">Delete</button>
        </div>
      `);
      bulkBar.querySelector('[data-bulk="message"]').addEventListener('click', () => {
        CommunicationsPage.openCompose({ preselectIds: state.selected.slice() });
      });
      bulkBar.querySelector('[data-bulk="export"]').addEventListener('click', () => {
        const pupils = Store.getPupils(trip.id).filter(p => state.selected.includes(p.id));
        downloadPupilsCSV(pupils, trip);
      });
      bulkBar.querySelector('[data-bulk="status-paid"]').addEventListener('click', () => {
        Store.bulkUpdatePupils(state.selected, { paymentStatus: 'paid' });
        Toast.success(`${state.selected.length} pupils marked paid`);
        table.clearSelection();
      });
      bulkBar.querySelector('[data-bulk="status-pending"]').addEventListener('click', () => {
        Store.bulkUpdatePupils(state.selected, { paymentStatus: 'pending' });
        Toast.success(`${state.selected.length} pupils marked pending`);
        table.clearSelection();
      });
      bulkBar.querySelector('[data-bulk="flag"]').addEventListener('click', () => {
        Store.bulkUpdatePupils(state.selected, { flagged: true });
        Toast.success(`${state.selected.length} pupils flagged`);
        table.clearSelection();
      });
      bulkBar.querySelector('[data-bulk="unflag"]').addEventListener('click', () => {
        Store.bulkUpdatePupils(state.selected, { flagged: false });
        Toast.success(`Unflagged ${state.selected.length} pupils`);
        table.clearSelection();
      });
      bulkBar.querySelector('[data-bulk="clear"]').addEventListener('click', () => table.clearSelection());
      bulkBar.querySelector('[data-bulk="delete"]').addEventListener('click', () => {
        Confirm.open({
          title: `Delete ${state.selected.length} pupils?`,
          message: 'This will permanently remove these pupils and all their payments and documents. This cannot be undone.',
          confirmLabel: 'Delete',
          onConfirm: () => {
            const count = state.selected.length;
            Store.bulkDeletePupils(state.selected);
            Toast.success(`${count} pupils deleted`);
            table.clearSelection();
          }
        });
      });
    }

    function updateTable() {
      const filtered = computeFilteredPupils();
      card.querySelector('#rosterResultCount').textContent = `${filtered.length} ${filtered.length === 1 ? 'pupil' : 'pupils'}`;
      table.update(filtered);
    }
  }

  return { render };
})();
