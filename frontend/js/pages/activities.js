/* ==========================================
   ACTIVITIES PAGE — list view of all activities
   ========================================== */

const ActivitiesPage = (function() {
  const state = { typeFilter: 'all' };

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const activities = Store.getActivities(trip.id).sort((a, b) => a.day - b.day);
    const totalCost = activities.reduce((s, a) => s + (a.perPupilCost * a.bookedCount), 0);
    const includedCount = activities.filter(a => a.type === 'included').length;
    const optionalCount = activities.filter(a => a.type === 'optional').length;
    const ticketedCount = activities.filter(a => a.type === 'ticketed').length;

    root.appendChild(KPI.grid([
      { label: 'Total activities', value: activities.length, sub: `across ${new Set(activities.map(a => a.day)).size} days` },
      { label: 'Included', value: includedCount, accent: 'success', sub: 'no extra cost' },
      { label: 'Ticketed', value: ticketedCount, accent: 'navy', sub: 'paid via booking' },
      { label: 'Optional', value: optionalCount, accent: 'warning', sub: 'pupils opt-in' },
      { label: 'Total activity cost', value: Fmt.moneyPlain(totalCost, trip.currency), accent: 'gold', sub: 'sum × booked count' },
    ]));

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">All activities <span class="tag" id="actCount">0</span></div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div id="actTypeFilter"></div>
            <button class="btn btn-dark" id="addActBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add activity
            </button>
          </div>
        </div>
        <div id="actList"></div>
      </div>
    `;
    root.appendChild(card);

    card.querySelector('#addActBtn').addEventListener('click', () => ActivityForm.open());
    card.querySelector('#actTypeFilter').appendChild(Chips.create({
      options: [
        { value: 'all', label: 'All', count: activities.length },
        { value: 'included', label: 'Included', count: includedCount },
        { value: 'ticketed', label: 'Ticketed', count: ticketedCount },
        { value: 'optional', label: 'Optional', count: optionalCount }
      ],
      active: state.typeFilter,
      onChange: (v) => { state.typeFilter = v; renderList(); }
    }));

    const list = card.querySelector('#actList');

    function renderList() {
      clearNode(list);
      let filtered = activities;
      if (state.typeFilter !== 'all') filtered = filtered.filter(a => a.type === state.typeFilter);
      card.querySelector('#actCount').textContent = filtered.length;
      if (!filtered.length) {
        list.appendChild(html`<div class="empty-state"><h3>No activities</h3><p>Add activities to build your itinerary.</p></div>`);
        return;
      }
      filtered.forEach(a => {
        const row = html`
          <div class="activity" data-act-id="${a.id}">
            <div class="act-day"><div class="n">${a.day}</div><div class="l">Day</div></div>
            <div class="act-body">
              <div class="name">${escapeHtml(a.title)}</div>
              <div class="meta">
                <span class="tag ${a.type}">${a.type}</span>
                ${a.startTime ? `<span class="mono">${escapeHtml(a.startTime)}</span>` : ''}
                ${a.duration ? `<span>${escapeHtml(a.duration)}</span>` : ''}
                ${a.supplier ? `<span>· ${escapeHtml(a.supplier)}</span>` : ''}
              </div>
            </div>
            <div class="act-cost">
              ${a.perPupilCost ? `${Fmt.moneyPlain(a.perPupilCost, a.currency)} <span class="pax">${a.bookedCount}/${a.capacity || '∞'} pupils</span>` : `<span style="color: var(--success);">Included</span> <span class="pax">${a.bookedCount} pupils</span>`}
            </div>
            <div class="row-action"><button data-row-action="edit">Edit</button></div>
          </div>
        `;
        row.addEventListener('click', (e) => {
          if (e.target.closest('[data-row-action]')) return;
          ActivityForm.open(a.id);
        });
        row.querySelector('[data-row-action]').addEventListener('click', (e) => { e.stopPropagation(); ActivityForm.open(a.id); });
        list.appendChild(row);
      });
    }

    renderList();
  }

  return { render };
})();

