/* Clubs list — grid of all clubs */

const ClubsListPage = (function () {
  function render(root) {
    const clubs = Store.getClubs();
    const members = Store.getClubMembers();

    root.appendChild(html`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h1 style="font-family:var(--display); font-weight:700; font-size:22px; color:var(--navy-deep); letter-spacing:-0.01em;">Clubs</h1>
          <p style="color:var(--grey-500); font-size:13px; margin-top:4px;">${clubs.length} club${clubs.length === 1 ? '' : 's'} across the school</p>
        </div>
        <button class="btn btn-primary" id="listNewClub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New club
        </button>
      </div>
    `);
    root.querySelector('#listNewClub').addEventListener('click', () => ClubForm.open());

    if (!clubs.length) {
      root.appendChild(html`<div class="card"><div class="empty-state"><h3>No clubs yet</h3><p>Create your first club to start tracking memberships and linked trips.</p></div></div>`);
      return;
    }

    const grid = html`<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;"></div>`;
    clubs.forEach(c => {
      const mem = members.filter(m => m.clubId === c.id);
      const linkedTrips = Store.getTripsForClub(c.id);
      const captains = mem.filter(m => m.role === 'captain').length;
      const card = html`
        <article class="club-card" data-club-id="${c.id}">
          <div class="club-card-banner" style="background:${c.colour};">
            <div class="club-emoji">${c.emoji}</div>
            <span class="club-status status-${c.status}">${escapeHtml(c.status)}</span>
          </div>
          <div class="club-card-body">
            <h3 class="club-card-title">${escapeHtml(c.name)}</h3>
            <div class="club-card-lead">${escapeHtml(c.leadStaff || 'No lead assigned')}</div>
            ${c.description ? `<p class="club-card-desc">${escapeHtml(c.description)}</p>` : ''}
            <div class="club-card-meta">
              <div><span class="label">Meets</span><span class="value">${escapeHtml(c.meetingDay)} · ${escapeHtml(c.meetingTime)}</span></div>
              <div><span class="label">Venue</span><span class="value">${escapeHtml(c.venue || '—')}</span></div>
            </div>
            <div class="club-card-counts">
              <div class="count"><strong>${mem.length}</strong> <span>member${mem.length === 1 ? '' : 's'}</span></div>
              ${captains ? `<div class="count"><strong>${captains}</strong> <span>captain${captains === 1 ? '' : 's'}</span></div>` : ''}
              <div class="count"><strong>${linkedTrips.length}</strong> <span>trip${linkedTrips.length === 1 ? '' : 's'}</span></div>
            </div>
          </div>
        </article>
      `;
      card.addEventListener('click', () => ClubsRouter.go('detail', c.id));
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  return { render };
})();
