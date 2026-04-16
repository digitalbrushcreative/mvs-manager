/* ==========================================
   BOOKINGS PAGE — flights, hotels, activities, transfers, insurance
   ========================================== */

const BookingsPage = (function() {
  const state = { typeFilter: 'all', statusFilter: 'all' };

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const bookings = Store.getBookings(trip.id);
    const totalCost = bookings.reduce((s, b) => s + Number(b.totalCost || 0), 0);
    const totalPaid = bookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending' || b.status === 'quoted').length;

    root.appendChild(KPI.grid([
      { label: 'Total bookings', value: bookings.length, sub: `<strong>${confirmed}</strong> confirmed · <strong>${pending}</strong> pending` },
      { label: 'Total cost', value: Fmt.moneyPlain(totalCost, trip.currency), accent: 'navy', sub: 'across all suppliers' },
      { label: 'Paid to suppliers', value: Fmt.moneyPlain(totalPaid, trip.currency), accent: 'success', bar: { value: totalPaid, max: totalCost, color: 'success' }, sub: `<strong>${Fmt.percent(totalPaid, totalCost)}</strong> of total` },
      { label: 'Balance due', value: Fmt.moneyPlain(totalCost - totalPaid, trip.currency), accent: 'crimson', sub: 'outstanding to suppliers' },
    ]));

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Bookings <span class="tag" id="bkResultCount">0</span></div>
          <button class="btn btn-dark" id="addBookingBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New booking
          </button>
        </div>
        <div style="padding: 14px 20px; border-bottom: 1px solid var(--grey-100); display: flex; gap: 18px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Type</span><div id="typeFilter"></div></div>
          <div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Status</span><div id="statusFilter"></div></div>
        </div>
        <div style="padding: 20px;"><div id="bkContent"></div></div>
      </div>
    `;
    root.appendChild(card);

    card.querySelector('#addBookingBtn').addEventListener('click', () => BookingForm.open());

    const byType = {};
    bookings.forEach(b => { byType[b.type] = (byType[b.type] || 0) + 1; });
    card.querySelector('#typeFilter').appendChild(Chips.create({
      options: [
        { value: 'all', label: 'All', count: bookings.length },
        ...['flight', 'hotel', 'activity', 'transfer', 'insurance'].filter(t => byType[t]).map(t => ({ value: t, label: Fmt.capitalize(t), count: byType[t] }))
      ],
      active: state.typeFilter,
      onChange: (v) => { state.typeFilter = v; renderList(); }
    }));
    card.querySelector('#statusFilter').appendChild(Chips.create({
      options: [
        { value: 'all', label: 'All' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'quoted', label: 'Quoted' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      active: state.statusFilter,
      onChange: (v) => { state.statusFilter = v; renderList(); }
    }));

    const content = card.querySelector('#bkContent');

    function renderList() {
      clearNode(content);
      let filtered = bookings;
      if (state.typeFilter !== 'all') filtered = filtered.filter(b => b.type === state.typeFilter);
      if (state.statusFilter !== 'all') filtered = filtered.filter(b => b.status === state.statusFilter);
      filtered = filtered.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      card.querySelector('#bkResultCount').textContent = filtered.length;

      if (!filtered.length) {
        content.appendChild(html`<div class="empty-state"><h3>No bookings found</h3><p>Try changing your filters or create a new booking.</p></div>`);
        return;
      }

      const grid = html`<div class="bookings-grid"></div>`;
      filtered.forEach(b => grid.appendChild(renderCard(b)));
      content.appendChild(grid);
    }

    function renderCard(b) {
      const icons = {
        flight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
        hotel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 22V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M14 14h2"/></svg>',
        activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        transfer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17h4V5H2v12h3"/><polygon points="16 17 22 17 22 12 18 7 16 7 16 17"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
        insurance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
      };
      const pct = b.totalCost ? Math.round((b.paidAmount / b.totalCost) * 100) : 0;
      const card = html`
        <div class="booking-card" data-booking-id="${b.id}">
          <div class="booking-head">
            <div class="booking-type-badge ${b.type}">${icons[b.type] || icons.activity}</div>
            <div style="flex: 1; min-width: 0;">
              <div class="booking-title">${escapeHtml(b.title)}</div>
              <div class="booking-sub">${escapeHtml(b.supplier || '—')}${b.reference ? ` · ${escapeHtml(b.reference)}` : ''}</div>
            </div>
            <div class="booking-status ${b.status}">${b.status}</div>
          </div>
          <div class="booking-body">
            ${b.date ? `<div class="booking-field"><div class="label">Date</div><div class="value">${Fmt.date(b.date)}${b.time ? ` · ${escapeHtml(b.time)}` : ''}</div></div>` : ''}
            <div class="booking-field"><div class="label">Pax</div><div class="value">${b.pax}</div></div>
            ${b.unitPrice ? `<div class="booking-field"><div class="label">Unit price</div><div class="value mono">${Fmt.moneyPlain(b.unitPrice, b.currency)}</div></div>` : ''}
            <div class="booking-field"><div class="label">Total</div><div class="value mono"><strong>${Fmt.moneyPlain(b.totalCost, b.currency)}</strong></div></div>
          </div>
          <div class="booking-foot">
            <div style="flex: 1;">
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--grey-500); font-weight: 700;">Paid ${pct}%</div>
              <div style="height: 4px; background: var(--grey-200); border-radius: 2px; margin-top: 3px; overflow: hidden; max-width: 120px;">
                <div style="height: 100%; width: ${pct}%; background: ${pct >= 100 ? 'var(--success)' : 'var(--warning)'};"></div>
              </div>
            </div>
            <div class="amount">${Fmt.moneyPlain(b.paidAmount, b.currency)} / ${Fmt.moneyPlain(b.totalCost, b.currency)}</div>
          </div>
        </div>
      `;
      card.addEventListener('click', () => BookingForm.open(b.id));
      return card;
    }

    renderList();
  }

  return { render };
})();
