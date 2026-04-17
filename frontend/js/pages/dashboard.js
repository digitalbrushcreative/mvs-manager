/* ==========================================
   DASHBOARD PAGE — all-trips overview + quick actions
   ========================================== */

const DashboardPage = (function() {
  function render(root) {
    const trips = Store.getTrips();
    const activeTrip = Store.activeTrip();

    root.appendChild(html`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h1 style="font-family: var(--display); font-weight: 700; font-size: 22px; color: var(--navy-deep); letter-spacing: -0.01em;">Dashboard</h1>
          <p style="color: var(--grey-500); font-size: 13px; margin-top: 4px;">Overview of all trips and operational alerts.</p>
        </div>
        <button class="btn btn-primary" id="dashNewTrip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New trip
        </button>
      </div>
    `);

    root.querySelector('#dashNewTrip').addEventListener('click', () => TripForm.open());

    // Overall KPIs across all trips
    const totalPupils = Store.getPupils().length;
    const totalCollected = Store.getPayments().reduce((s, p) => s + Number(p.amount), 0);
    const totalBookings = Store.getBookings().length;
    const activeTrips = trips.filter(t => ['open', 'in-progress'].includes(t.status)).length;

    root.appendChild(KPI.grid([
      { label: 'Active trips', value: activeTrips, unit: `/ ${trips.length}`, sub: `<strong>${trips.filter(t => t.status === 'draft').length}</strong> in draft` },
      { label: 'Total pupils', value: totalPupils, accent: 'navy', sub: 'across all trips' },
      { label: 'Total collected', value: Fmt.moneyPlain(totalCollected, 'USD'), accent: 'success', sub: 'all-time revenue' },
      { label: 'Bookings', value: totalBookings, accent: 'gold', sub: 'flights, hotels, activities' },
      { label: 'Flagged pupils', value: Store.getPupils().filter(p => p.flagged).length, accent: 'crimson', sub: 'across all trips' },
    ]));

    root.appendChild(renderInsights(trips, activeTrip));

    // Main grid
    const grid = html`
      <div class="dash-grid">
        <div>
          <div class="card">
            <div class="card-head">
              <div class="card-title">All trips</div>
              <button class="btn btn-light btn-sm" id="dashNewTrip2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                New
              </button>
            </div>
            <div id="tripsList" style="padding: 16px;"></div>
          </div>
        </div>
        <div>
          <div class="side-card">
            <div class="side-head"><div class="side-title">Alerts & tasks</div></div>
            <div class="side-body" id="alertsList"></div>
          </div>
          <div class="side-card">
            <div class="side-head"><div class="side-title">Quick actions</div></div>
            <div class="side-body" id="quickActions"></div>
          </div>
        </div>
      </div>
    `;
    root.appendChild(grid);

    grid.querySelector('#dashNewTrip2').addEventListener('click', () => TripForm.open());

    // Trips list
    const tripsList = grid.querySelector('#tripsList');
    if (!trips.length) {
      tripsList.appendChild(html`<div class="empty-state"><h3>No trips yet</h3><p>Create your first trip to get started.</p></div>`);
    } else {
      const tl = html`<div class="trip-card-list"></div>`;
      trips.forEach(t => {
        const s = Store.tripStats(t.id);
        const stripeClass = t.status === 'open' ? 'crimson' : t.status === 'draft' ? 'grey' : t.status === 'closed' ? '' : 'gold';
        const row = html`
          <div class="trip-list-row" data-trip-id="${t.id}">
            <div class="stripe ${stripeClass}"></div>
            <div>
              <div class="trip-list-title">${escapeHtml(t.name)}</div>
              <div class="trip-list-sub">${escapeHtml(t.code)} · ${escapeHtml(t.destination)}</div>
            </div>
            <div class="trip-list-col">
              <div class="label">Dates</div>
              <div class="value">${Fmt.date(t.startDate, {style: 'mono'})}</div>
            </div>
            <div class="trip-list-col">
              <div class="label">Pupils</div>
              <div class="value">${s.enrolled}/${t.seatsTotal}</div>
            </div>
            <div class="trip-list-col">
              <div class="label">Collected</div>
              <div class="value">${Fmt.moneyPlain(s.collected, t.currency)}</div>
            </div>
            <div class="trip-list-col">
              <div class="label">Status</div>
              <div class="value"><span class="grade-pill" style="background: ${t.status === 'open' ? 'var(--crimson)' : t.status === 'draft' ? 'var(--grey-400)' : 'var(--navy-deep)'};">${escapeHtml(t.status)}</span></div>
            </div>
          </div>
        `;
        row.addEventListener('click', () => {
          Store.setActiveTrip(t.id);
          Toast.info(`Switched to ${t.code}`);
          Router.go('roster');
        });
        tl.appendChild(row);
      });
      tripsList.appendChild(tl);
    }

    // Alerts
    const alertsList = grid.querySelector('#alertsList');
    const alerts = buildAlerts();
    if (!alerts.length) {
      alertsList.appendChild(html`<div style="text-align: center; color: var(--grey-500); font-size: 12px; padding: 12px 0;">All clear ✓</div>`);
    } else {
      alerts.forEach(a => alertsList.appendChild(a));
    }

    // Quick actions
    const qa = grid.querySelector('#quickActions');
    [
      { label: 'Add pupil', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>', fn: () => PupilForm.open() },
      { label: 'Log payment', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', fn: () => PaymentForm.open() },
      { label: 'New booking', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>', fn: () => BookingForm.open() },
      { label: 'Send message', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', fn: () => Router.go('communications') }
    ].forEach(a => {
      const btn = html`
        <button style="width: 100%; padding: 10px 12px; display: flex; align-items: center; gap: 10px; background: var(--off-white); border: 1px solid var(--grey-100); border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--grey-900); cursor: pointer; margin-bottom: 6px; text-align: left; transition: all var(--t-fast);">
          <span style="color: var(--navy-deep); display: grid; place-items: center; width: 18px; height: 18px;">${a.icon}</span>
          ${a.label}
        </button>
      `;
      btn.addEventListener('click', a.fn);
      btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--navy-deep)'; btn.style.background = 'var(--white)'; });
      btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--grey-100)'; btn.style.background = 'var(--off-white)'; });
      qa.appendChild(btn);
    });
  }

  function renderInsights(trips, activeTrip) {
    const wrapper = html`<div class="insights-section"></div>`;
    wrapper.appendChild(html`
      <div class="insights-head">
        <h2 class="insights-title">Trip performance</h2>
        <div class="insights-sub">Live across ${trips.length} trip${trips.length === 1 ? '' : 's'} · showing ${activeTrip ? activeTrip.code : 'no active trip'} below</div>
      </div>
    `);

    if (!trips.length) {
      wrapper.appendChild(html`<div class="empty-state"><h3>Nothing to show</h3><p>Create a trip to see performance insights.</p></div>`);
      return wrapper;
    }

    const grid = html`<div class="insights-grid"></div>`;

    // --- Collection progress (active trip) ---
    if (activeTrip) {
      const stats = Store.tripStats(activeTrip.id);
      const cur = activeTrip.currency === 'KES' ? 'KSh' : activeTrip.currency === 'GBP' ? '£' : activeTrip.currency === 'EUR' ? '€' : '$';
      const card1 = chartCard(
        `Collection progress — ${activeTrip.code}`,
        `${cur}${Math.round(stats.collected).toLocaleString()} of ${cur}${Math.round(stats.totalExpected).toLocaleString()} expected`,
        Charts.progressRing({
          pct: stats.percentCollected,
          label: `${cur}${Math.round(stats.outstanding).toLocaleString()} outstanding`,
          sub: `${stats.byStatus.paid} paid · ${stats.byStatus.deposit} on deposit · ${stats.byStatus.pending} pending · ${stats.byStatus.overdue} overdue`,
          color: stats.percentCollected >= 0.8 ? 'var(--success)' : stats.percentCollected >= 0.4 ? 'var(--warning)' : 'var(--crimson)'
        })
      );
      grid.appendChild(card1);

      // --- Payment status donut ---
      const card2 = chartCard(
        'Payment status',
        `${stats.enrolled} pupils enrolled`,
        Charts.donut({
          segments: [
            { label: 'Paid',    value: stats.byStatus.paid,    color: 'var(--success)' },
            { label: 'Deposit', value: stats.byStatus.deposit, color: 'var(--info)' },
            { label: 'Pending', value: stats.byStatus.pending, color: 'var(--warning)' },
            { label: 'Overdue', value: stats.byStatus.overdue, color: 'var(--crimson)' }
          ],
          centerLabel: 'pupils',
          centerValue: stats.enrolled
        })
      );
      grid.appendChild(card2);

      // --- Document compliance donut ---
      const docs = Store.getDocuments(activeTrip.id);
      const byDocStatus = {
        verified: docs.filter(d => d.status === 'verified').length,
        submitted: docs.filter(d => d.status === 'submitted').length,
        missing: docs.filter(d => d.status === 'missing').length,
        expired: docs.filter(d => d.status === 'expired' || d.status === 'expiring').length
      };
      const card3 = chartCard(
        'Document compliance',
        `${Math.round(stats.docCompliance * 100)}% verified of ${docs.length} required`,
        Charts.donut({
          segments: [
            { label: 'Verified',  value: byDocStatus.verified,  color: 'var(--success)' },
            { label: 'Submitted', value: byDocStatus.submitted, color: 'var(--info)' },
            { label: 'Missing',   value: byDocStatus.missing,   color: 'var(--crimson)' },
            { label: 'Expiring',  value: byDocStatus.expired,   color: 'var(--warning)' }
          ],
          centerLabel: 'docs',
          centerValue: docs.length
        })
      );
      grid.appendChild(card3);
    }

    // --- Seat utilisation — compact tile grid ---
    const seatBody = html`<div class="mini-tile-grid"></div>`;
    trips.forEach(t => {
      const s = Store.tripStats(t.id) || {};
      const used = s.seatsUsed || 0;
      const total = t.seatsTotal || 0;
      const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
      const over = s.overCapacity;
      const pupilPct = total ? (s.enrolled || 0) / total * 100 : 0;
      const chapPct = total ? (t.chaperones || 0) / total * 100 : 0;
      const parPct = total ? (t.parentsJoining || 0) / total * 100 : 0;
      const stripeColour = over ? 'var(--crimson)' : pct >= 90 ? 'var(--warning)' : 'var(--navy)';
      const tile = html`
        <div class="mini-tile">
          <div class="mini-tile-head">
            <div class="mini-tile-dot" style="background:${stripeColour};"></div>
            <span class="mini-tile-name">${escapeHtml(t.code)} · ${escapeHtml(t.name)}</span>
            <span class="mini-tile-count">${used}/${total}</span>
          </div>
          <div class="mini-tile-bar stacked">
            <div style="width:${pupilPct}%; background:var(--navy);"></div>
            <div style="width:${chapPct}%; background:var(--gold);"></div>
            <div style="width:${parPct}%; background:var(--info);"></div>
          </div>
          <div class="mini-tile-sub">${s.enrolled || 0} pupils · ${t.chaperones || 0} chap · ${t.parentsJoining || 0} parents${over ? ' · <strong style="color:var(--crimson);">over</strong>' : pct >= 90 ? ' · almost full' : ''}</div>
        </div>
      `;
      seatBody.appendChild(tile);
    });
    const cardCap = chartCard('Seat utilisation', `${trips.length} trips · pupils + chaperones + parents vs total`, seatBody, 'wide');
    cardCap.appendChild(html`
      <div class="chart-legend chart-legend-horizontal" style="margin-top:4px;">
        <div class="legend-row"><span class="legend-dot" style="background:var(--navy);"></span><span class="legend-label">Pupils</span></div>
        <div class="legend-row"><span class="legend-dot" style="background:var(--gold);"></span><span class="legend-label">Chaperones</span></div>
        <div class="legend-row"><span class="legend-dot" style="background:var(--info);"></span><span class="legend-label">Parents</span></div>
      </div>
    `);
    grid.appendChild(cardCap);

    // --- Booking status (active trip) ---
    if (activeTrip) {
      const bookings = Store.getBookings(activeTrip.id);
      const byBk = {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        pending:   bookings.filter(b => b.status === 'pending').length,
        quoted:    bookings.filter(b => b.status === 'quoted').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
      };
      const paidBk = bookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
      const totalBk = bookings.reduce((s, b) => s + Number(b.totalCost || 0), 0);
      const cardBk = chartCard(
        'Booking progress',
        `${bookings.length} bookings · ${Math.round((paidBk / Math.max(totalBk, 1)) * 100)}% committed`,
        Charts.stackedBar({
          segments: [
            { label: 'Confirmed', value: byBk.confirmed, color: 'var(--success)' },
            { label: 'Pending',   value: byBk.pending,   color: 'var(--warning)' },
            { label: 'Quoted',    value: byBk.quoted,    color: 'var(--info)' },
            { label: 'Cancelled', value: byBk.cancelled, color: 'var(--grey-300)' }
          ]
        })
      );
      grid.appendChild(cardBk);

      // --- Interest funnel (active trip) ---
      const interests = Store.getInterests(activeTrip.id);
      const byInt = {
        new:       interests.filter(i => i.status === 'new').length,
        contacted: interests.filter(i => i.status === 'contacted').length,
        awaiting:  interests.filter(i => i.status === 'awaiting-details').length,
        submitted: interests.filter(i => i.status === 'submitted').length,
        converted: interests.filter(i => i.status === 'converted').length
      };
      const cardInt = chartCard(
        'Pre-trip interest funnel',
        `${interests.length} expressions of interest`,
        Charts.funnel([
          { label: 'New',               value: byInt.new,       color: 'var(--grey-400)' },
          { label: 'Contacted',         value: byInt.contacted, color: 'var(--info)' },
          { label: 'Awaiting details',  value: byInt.awaiting,  color: 'var(--warning)' },
          { label: 'Details submitted', value: byInt.submitted, color: 'var(--info)' },
          { label: 'Seat confirmed',    value: byInt.converted, color: 'var(--success)' }
        ])
      );
      grid.appendChild(cardInt);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  function chartCard(title, subtitle, chartNode, mod = '') {
    const card = html`
      <div class="insight-card ${mod}">
        <div class="insight-head">
          <div class="insight-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="insight-sub">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <div class="insight-body"></div>
      </div>
    `;
    card.querySelector('.insight-body').appendChild(chartNode);
    return card;
  }

  function buildAlerts() {
    const alerts = [];
    const pupils = Store.getPupils();
    const overdue = pupils.filter(p => p.paymentStatus === 'overdue');
    const flagged = pupils.filter(p => p.flagged);
    const missingDocs = Store.getDocuments().filter(d => d.status === 'missing');
    const pendingBookings = Store.getBookings().filter(b => b.status === 'pending' || b.status === 'quoted');

    if (overdue.length) {
      alerts.push(html`
        <div class="alert-item">
          <div class="alert-icon danger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div>
            <div class="alert-ttl">${overdue.length} overdue payment${overdue.length > 1 ? 's' : ''}</div>
            <div class="alert-desc">Pupils with payments past due.</div>
            <span class="alert-cta" onclick="Router.go('payments')">Review →</span>
          </div>
        </div>
      `);
    }
    if (flagged.length) {
      alerts.push(html`
        <div class="alert-item">
          <div class="alert-icon warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <div>
            <div class="alert-ttl">${flagged.length} flagged pupil${flagged.length > 1 ? 's' : ''}</div>
            <div class="alert-desc">Pupils needing follow-up.</div>
            <span class="alert-cta" onclick="Router.go('roster')">Open roster →</span>
          </div>
        </div>
      `);
    }
    if (missingDocs.length) {
      alerts.push(html`
        <div class="alert-item">
          <div class="alert-icon warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div>
            <div class="alert-ttl">${missingDocs.length} missing document${missingDocs.length > 1 ? 's' : ''}</div>
            <div class="alert-desc">Passports, consents, medical forms outstanding.</div>
            <span class="alert-cta" onclick="Router.go('documents')">Review →</span>
          </div>
        </div>
      `);
    }
    if (pendingBookings.length) {
      alerts.push(html`
        <div class="alert-item">
          <div class="alert-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div>
            <div class="alert-ttl">${pendingBookings.length} booking${pendingBookings.length > 1 ? 's' : ''} awaiting confirmation</div>
            <div class="alert-desc">Follow up with suppliers.</div>
            <span class="alert-cta" onclick="Router.go('bookings')">Review →</span>
          </div>
        </div>
      `);
    }
    return alerts;
  }

  return { render };
})();
