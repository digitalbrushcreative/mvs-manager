/* ==========================================
   PAYMENTS PAGE — transactions log + pupil balances
   ========================================== */

const PaymentsPage = (function() {
  const state = { view: 'transactions' }; // transactions | balances

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const stats = Store.tripStats(trip.id);
    root.appendChild(KPI.grid([
      { label: 'Total expected', value: Fmt.moneyPlain(stats.totalExpected, trip.currency), sub: `${stats.enrolled} pupils × ${Fmt.moneyPlain(trip.costPerPupil, trip.currency)}` },
      { label: 'Collected', value: Fmt.moneyPlain(stats.collected, trip.currency), accent: 'success', bar: { value: stats.percentCollected * 100, max: 100, color: 'success' }, sub: `<strong>${Fmt.percent(stats.collected, stats.totalExpected)}</strong> of total` },
      { label: 'Outstanding', value: Fmt.moneyPlain(stats.outstanding, trip.currency), accent: 'crimson', sub: `${stats.byStatus.pending + stats.byStatus.overdue} pupils` },
      { label: 'Paid in full', value: stats.byStatus.paid, unit: `/ ${stats.enrolled}`, accent: 'success', sub: `<strong>${stats.byStatus.deposit}</strong> on deposit` },
    ]));

    const card = html`
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Payment transactions</div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div id="payViewToggle"></div>
            <button class="btn btn-dark" id="logPaymentBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Log payment
            </button>
          </div>
        </div>
        <div id="payContent"></div>
      </div>
    `;
    root.appendChild(card);

    card.querySelector('#logPaymentBtn').addEventListener('click', () => PaymentForm.open());

    card.querySelector('#payViewToggle').appendChild(Chips.create({
      options: [
        { value: 'transactions', label: 'Transactions' },
        { value: 'balances', label: 'Balances' }
      ],
      active: state.view,
      onChange: (v) => { state.view = v; renderContent(); }
    }));

    const content = card.querySelector('#payContent');

    function renderContent() {
      clearNode(content);
      if (state.view === 'transactions') renderTx();
      else renderBalances();
    }

    function renderTx() {
      const txs = Store.getPayments(trip.id).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      if (!txs.length) {
        content.appendChild(html`<div class="empty-state"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/></svg></div><h3>No payments yet</h3><p>Log a payment to get started.</p></div>`);
        return;
      }
      const columns = [
        { key: 'paidAt', label: 'Date', sortable: true, width: '120px', render: (p) => `<span class="mono" style="font-size: 11.5px;">${Fmt.date(p.paidAt, {style:'mono'})}</span>` },
        { key: 'pupil', label: 'Pupil', render: (p) => {
          const pup = Store.getPupil(p.pupilId);
          if (!pup) return '<span class="muted">Deleted pupil</span>';
          return `<div class="student-cell"><div class="stu-avatar ${pup.gender.toLowerCase()}">${Fmt.initials(pup.firstName + ' ' + pup.lastName)}</div><div><div class="stu-name">${escapeHtml(pup.firstName)} ${escapeHtml(pup.lastName)}</div><div class="stu-meta">#${escapeHtml(pup.admissionNo)}</div></div></div>`;
        }},
        { key: 'amount', label: 'Amount', sortable: true, width: '120px', render: (p) => `<span class="mono" style="font-weight: 600; color: var(--success); font-size: 13px;">+${Fmt.moneyPlain(p.amount, p.currency)}</span>` },
        { key: 'method', label: 'Method', width: '130px', render: (p) => `<span class="pay-method-chip">${escapeHtml(p.method)}</span>` },
        { key: 'reference', label: 'Reference', render: (p) => p.reference ? `<span class="tx-ref">${escapeHtml(p.reference)}</span>` : '<span class="muted">—</span>' },
        { key: 'notes', label: 'Notes', render: (p) => p.notes ? `<div class="note-cell">${escapeHtml(p.notes)}</div>` : '<span class="muted">—</span>' },
        { key: 'actions', label: '', width: '70px', align: 'right', render: () => `<div class="row-action"><button data-row-action="delete">Void</button></div>` }
      ];
      const t = Table.create({
        columns, rows: txs, pageSize: 20,
        onRowClick: (tx) => { if (tx.pupilId) PupilDetail.open(tx.pupilId); },
      });
      content.appendChild(t.el);
      content.appendChild(t.footer);
      content.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-row-action="delete"]');
        if (!btn) return;
        e.stopPropagation();
        const tr = btn.closest('tr');
        const id = tr?.dataset.rowId;
        if (!id) return;
        Confirm.open({
          title: 'Void this payment?',
          message: 'The pupil\'s balance will be recalculated. This cannot be undone.',
          confirmLabel: 'Void',
          onConfirm: () => { Store.deletePayment(id); Toast.success('Payment voided'); }
        });
      });
    }

    function renderBalances() {
      const pupils = Store.getPupils(trip.id);
      const rows = pupils.map(p => {
        const b = Store.getPupilBalance(p.id);
        return { ...p, ...b };
      }).sort((a, b) => b.balance - a.balance);

      const columns = [
        { key: 'name', label: 'Pupil', sortable: true, sortFn: (a,b)=>a.lastName.localeCompare(b.lastName), render: (p) => `<div class="student-cell"><div class="stu-avatar ${p.gender.toLowerCase()}">${Fmt.initials(p.firstName + ' ' + p.lastName)}</div><div><div class="stu-name">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</div><div class="stu-meta">Grade ${p.grade} · #${escapeHtml(p.admissionNo)}</div></div></div>` },
        { key: 'total', label: 'Total', sortable: true, width: '120px', render: (p) => `<span class="mono">${Fmt.moneyPlain(p.total, trip.currency)}</span>` },
        { key: 'paid', label: 'Paid', sortable: true, width: '120px', render: (p) => `<span class="mono" style="color: var(--success);">${Fmt.moneyPlain(p.paid, trip.currency)}</span>` },
        { key: 'balance', label: 'Balance', sortable: true, width: '120px', render: (p) => `<span class="mono" style="color: ${p.balance > 0 ? 'var(--crimson)' : 'var(--success)'}; font-weight: 600;">${Fmt.moneyPlain(p.balance, trip.currency)}</span>` },
        { key: 'pct', label: 'Progress', width: '180px', render: (p) => {
          const pct = Math.round((p.paid / p.total) * 100);
          return `<div style="display: flex; align-items: center; gap: 8px;"><div style="flex: 1; height: 6px; background: var(--grey-100); border-radius: 3px; overflow: hidden;"><div style="height: 100%; width: ${pct}%; background: ${pct >= 100 ? 'var(--success)' : pct > 0 ? 'var(--warning)' : 'var(--grey-300)'};"></div></div><span class="mono" style="font-size: 11px; color: var(--grey-500); min-width: 32px; text-align: right;">${pct}%</span></div>`;
        }},
        { key: 'status', label: 'Status', width: '110px', render: (p) => `<span class="pay-status ps-${p.paymentStatus}">${Fmt.capitalize(p.paymentStatus)}</span>` },
        { key: 'actions', label: '', align: 'right', width: '70px', render: () => `<div class="row-action"><button data-row-action="pay">Pay</button></div>` }
      ];
      const t = Table.create({
        columns, rows, pageSize: 20,
        onRowClick: (row) => PupilDetail.open(row.id),
      });
      content.appendChild(t.el);
      content.appendChild(t.footer);
      content.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-row-action="pay"]');
        if (!btn) return;
        e.stopPropagation();
        const id = btn.closest('tr')?.dataset.rowId;
        if (id) PaymentForm.open(id);
      });
    }

    renderContent();
  }

  return { render };
})();
