/* ==========================================
   REPORTS PAGE — export tiles
   ========================================== */

const ReportsPage = (function() {
  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    root.appendChild(html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Reports &amp; exports</div>
        </div>
        <div style="padding: 20px;">
          <div class="report-grid" id="reportGrid"></div>
        </div>
      </div>
    `);

    const grid = root.querySelector('#reportGrid');
    [
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', title: 'Pupil roster', description: 'Complete list of all enrolled pupils with contact details.', fn: () => exportCSV('roster') },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', title: 'Payment log', description: 'All payment transactions with methods and references.', fn: () => exportCSV('payments') },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', title: 'Document status', description: 'Compliance matrix showing document status per pupil.', fn: () => exportCSV('documents') },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5"/></svg>', title: 'Booking summary', description: 'All bookings with suppliers, references, and payment status.', fn: () => exportCSV('bookings') },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', title: 'Itinerary', description: 'Day-by-day activity schedule for the trip.', fn: () => exportCSV('activities') },
      { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>', title: 'Balance sheet', description: 'Outstanding balances by pupil for chasing payments.', fn: () => exportCSV('balances') }
    ].forEach(r => {
      const tile = html`
        <div class="report-tile">
          <div class="icon">${r.icon}</div>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.description)}</p>
        </div>
      `;
      tile.addEventListener('click', r.fn);
      grid.appendChild(tile);
    });
  }

  function downloadCSV(name, rows) {
    if (!rows.length) { Toast.warning('Nothing to export'); return; }
    const keys = Object.keys(rows[0]);
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,\n"]/.test(s) ? `"${s}"` : s;
    };
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => escape(r[k])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success(`${name} exported`);
  }

  function exportCSV(type) {
    const trip = Store.activeTrip();
    if (!trip) return;
    if (type === 'roster') {
      const rows = Store.getPupils(trip.id).map(p => ({
        admissionNo: p.admissionNo, firstName: p.firstName, lastName: p.lastName, grade: p.grade, gender: p.gender,
        guardian: p.guardianName, phone: p.guardianPhone, email: p.guardianEmail,
        paymentStatus: p.paymentStatus, flagged: p.flagged, note: p.note
      }));
      downloadCSV('roster', rows);
    } else if (type === 'payments') {
      const rows = Store.getPayments(trip.id).map(p => {
        const pup = Store.getPupil(p.pupilId);
        return { date: p.paidAt?.slice(0,10), pupil: pup ? `${pup.firstName} ${pup.lastName}` : '', admissionNo: pup?.admissionNo || '', amount: p.amount, currency: p.currency, method: p.method, reference: p.reference, notes: p.notes };
      });
      downloadCSV('payments', rows);
    } else if (type === 'documents') {
      const types = Store.getDocumentTypes();
      const rows = Store.getPupils(trip.id).map(p => {
        const row = { admissionNo: p.admissionNo, name: `${p.firstName} ${p.lastName}`, grade: p.grade };
        types.forEach(t => {
          const d = Store.getPupilDocuments(p.id).find(x => x.typeId === t.id);
          row[t.abbr] = d?.status || 'missing';
        });
        return row;
      });
      downloadCSV('documents', rows);
    } else if (type === 'bookings') {
      const rows = Store.getBookings(trip.id).map(b => ({ type: b.type, status: b.status, title: b.title, supplier: b.supplier, reference: b.reference, date: b.date?.slice(0,10), pax: b.pax, totalCost: b.totalCost, paidAmount: b.paidAmount, currency: b.currency }));
      downloadCSV('bookings', rows);
    } else if (type === 'activities') {
      const rows = Store.getActivities(trip.id).map(a => ({ day: a.day, time: a.startTime, title: a.title, type: a.type, duration: a.duration, supplier: a.supplier, perPupilCost: a.perPupilCost, currency: a.currency, bookedCount: a.bookedCount }));
      downloadCSV('activities', rows);
    } else if (type === 'balances') {
      const rows = Store.getPupils(trip.id).map(p => {
        const b = Store.getPupilBalance(p.id);
        return { admissionNo: p.admissionNo, name: `${p.firstName} ${p.lastName}`, grade: p.grade, total: b.total, paid: b.paid, balance: b.balance, paymentStatus: p.paymentStatus };
      });
      downloadCSV('balances', rows);
    }
  }

  return { render };
})();
