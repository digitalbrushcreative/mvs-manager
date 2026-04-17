/* Linked-trips page — trips tagged with a club */

const ClubsTripsPage = (function () {
  function render(root) {
    const clubs = Store.getClubs();
    const trips = Store.getTrips();

    root.appendChild(html`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h1 style="font-family:var(--display); font-weight:700; font-size:22px; color:var(--navy-deep); letter-spacing:-0.01em;">Linked trips</h1>
          <p style="color:var(--grey-500); font-size:13px; margin-top:4px;">Trips associated with one or more clubs. Editing opens Trip Manager.</p>
        </div>
      </div>
    `);

    const withClubs = trips.filter(t => (t.clubIds || []).length > 0);
    const withoutClubs = trips.filter(t => !(t.clubIds || []).length);

    if (!withClubs.length) {
      root.appendChild(html`<div class="card"><div class="empty-state"><h3>No trips linked yet</h3><p>In Trip Manager, use the Clubs field on the trip form to tag a trip with one or more clubs.</p></div></div>`);
    } else {
      const card = html`<div class="card"><div class="card-head"><div class="card-title">Linked <span class="tag">${withClubs.length}</span></div></div><div id="tripsBody" style="padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:14px;"></div></div>`;
      root.appendChild(card);
      const body = card.querySelector('#tripsBody');
      withClubs.forEach(t => body.appendChild(tripCard(t, clubs)));
    }

    if (withoutClubs.length) {
      const card = html`<div class="card" style="margin-top:20px;"><div class="card-head"><div class="card-title">Not linked <span class="tag">${withoutClubs.length}</span></div></div><div id="notLinkedBody" style="padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:14px;"></div></div>`;
      root.appendChild(card);
      const body = card.querySelector('#notLinkedBody');
      withoutClubs.forEach(t => body.appendChild(tripCard(t, clubs)));
    }
  }

  function tripCard(trip, clubs) {
    const linkedClubs = (trip.clubIds || []).map(id => clubs.find(c => c.id === id)).filter(Boolean);
    const pupilCount = Store.getPupils(trip.id).length;
    const card = html`
      <div class="trip-list-row" data-trip-id="${trip.id}" style="grid-template-columns: 6px 1fr; cursor:pointer;">
        <div class="stripe ${trip.status === 'open' ? 'crimson' : trip.status === 'draft' ? 'grey' : ''}"></div>
        <div style="padding:12px 14px;">
          <div style="font-family:var(--display); font-weight:700; font-size:14px; color:var(--navy-darker);">${escapeHtml(trip.name)}</div>
          <div style="font-size:11px; color:var(--grey-500); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">${escapeHtml(trip.code)} · ${escapeHtml(trip.status)}</div>
          <div style="margin-top:10px; display:flex; gap:4px; flex-wrap:wrap;">
            ${linkedClubs.length
              ? linkedClubs.map(c => `<span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:${c.colour}; color:var(--white); border-radius:999px; font-size:11px; font-weight:600;">${c.emoji} ${escapeHtml(c.name)}</span>`).join('')
              : `<span style="font-size:11px; color:var(--grey-400); font-style:italic;">No clubs tagged</span>`}
          </div>
          <div style="margin-top:10px; font-size:12px; color:var(--grey-500);">${pupilCount} pupils · ${Fmt.date(trip.startDate)}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      Store.setActiveTrip(trip.id);
      location.href = 'index.html';
    });
    return card;
  }

  return { render };
})();
